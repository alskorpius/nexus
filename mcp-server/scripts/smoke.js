/**
 * Smoke test for the Nexus MCP Server.
 *
 * Spawns the server against the test database and drives a full MCP
 * handshake + tools/list + several tools/call over stdio.
 *
 * Run: node scripts/smoke.js
 * Prerequisite: node scripts/make-test-db.js (creates test/nexus-test.db)
 */

import { spawn } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const serverScript = join(__dirname, '..', 'src', 'index.js');
const testDb = join(__dirname, '..', 'test', 'nexus-test.db');

if (!existsSync(testDb)) {
  console.error(`Test DB not found at ${testDb}. Run: node scripts/make-test-db.js`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Spawn server
// ---------------------------------------------------------------------------

const child = spawn(process.execPath, [serverScript, '--db', testDb], {
  stdio: ['pipe', 'pipe', 'pipe'],
});

let buffer = '';
const pending = new Map(); // id -> { resolve, reject }
let nextId = 1;

child.stderr.on('data', (chunk) => {
  process.stderr.write('[server] ' + chunk.toString());
});

child.stdout.on('data', (chunk) => {
  buffer += chunk.toString();
  const lines = buffer.split('\n');
  buffer = lines.pop(); // keep incomplete line
  for (const line of lines) {
    if (!line.trim()) continue;
    let msg;
    try {
      msg = JSON.parse(line);
    } catch {
      process.stderr.write(`[smoke] Non-JSON from server: ${line}\n`);
      continue;
    }
    if (msg.id !== undefined && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(JSON.stringify(msg.error)));
      else resolve(msg.result);
    }
  }
});

child.on('exit', (code) => {
  if (code !== 0 && code !== null) {
    process.stderr.write(`[smoke] Server exited with code ${code}\n`);
  }
});

function send(method, params) {
  return new Promise((resolve, reject) => {
    const id = nextId++;
    pending.set(id, { resolve, reject });
    const msg = JSON.stringify({ jsonrpc: '2.0', id, method, params });
    child.stdin.write(msg + '\n');
  });
}

// ---------------------------------------------------------------------------
// Assertions
// ---------------------------------------------------------------------------

let passed = 0;
let failed = 0;

function assert(label, condition, detail = '') {
  if (condition) {
    console.log(`  PASS  ${label}`);
    passed++;
  } else {
    console.error(`  FAIL  ${label}${detail ? ': ' + detail : ''}`);
    failed++;
  }
}

// ---------------------------------------------------------------------------
// Test sequence
// ---------------------------------------------------------------------------

async function run() {
  console.log('--- Nexus MCP Server Smoke Test ---\n');

  // 1. Initialize
  console.log('[1] initialize');
  const initResult = await send('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'smoke-test', version: '0.0.1' },
  });
  assert('initialize: serverInfo.name === nexus', initResult.serverInfo?.name === 'nexus', JSON.stringify(initResult.serverInfo));
  assert('initialize: has tools capability', !!initResult.capabilities?.tools, JSON.stringify(initResult.capabilities));

  // Send initialized notification (required by MCP protocol)
  child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized', params: {} }) + '\n');

  // 2. tools/list
  console.log('\n[2] tools/list');
  const toolsResult = await send('tools/list', {});
  const toolNames = (toolsResult.tools || []).map((t) => t.name);
  assert('tools/list: list_projects present', toolNames.includes('list_projects'), toolNames.join(', '));
  assert('tools/list: get_project present', toolNames.includes('get_project'), toolNames.join(', '));
  assert('tools/list: get_project_context present', toolNames.includes('get_project_context'), toolNames.join(', '));
  assert('tools/list: search_projects present', toolNames.includes('search_projects'), toolNames.join(', '));

  // 3. list_projects
  console.log('\n[3] tools/call list_projects');
  const listResult = await send('tools/call', { name: 'list_projects', arguments: {} });
  const projects = JSON.parse(listResult.content[0].text);
  assert('list_projects: returns array', Array.isArray(projects), typeof projects);
  assert('list_projects: contains EFAD', projects.some((p) => p.name === 'EFAD'), JSON.stringify(projects.map((p) => p.name)));
  assert('list_projects: contains Nexus', projects.some((p) => p.name === 'Nexus'), JSON.stringify(projects.map((p) => p.name)));

  // 4. get_project by name
  console.log('\n[4] tools/call get_project (by name)');
  const getByName = await send('tools/call', { name: 'get_project', arguments: { idOrName: 'efad' } });
  const projectData = JSON.parse(getByName.content[0].text);
  assert('get_project: name matches', projectData.name === 'EFAD', projectData.name);
  assert('get_project: has api_base_url', !!projectData.api_base_url, projectData.api_base_url);
  assert('get_project: has health_endpoint', !!projectData.health_endpoint, projectData.health_endpoint);

  // 5. get_project by id
  console.log('\n[5] tools/call get_project (by id=1)');
  const getById = await send('tools/call', { name: 'get_project', arguments: { idOrName: '1' } });
  const projectById = JSON.parse(getById.content[0].text);
  assert('get_project by id: found', !!projectById.id, JSON.stringify(projectById));

  // 6. get_project not found
  console.log('\n[6] tools/call get_project (not found)');
  const notFound = await send('tools/call', { name: 'get_project', arguments: { idOrName: 'does-not-exist' } });
  assert('get_project not-found: isError', notFound.isError === true, JSON.stringify(notFound));
  assert('get_project not-found: has message', notFound.content[0].text.includes('not found'), notFound.content[0].text);

  // 7. get_project_context
  console.log('\n[7] tools/call get_project_context');
  const ctxResult = await send('tools/call', { name: 'get_project_context', arguments: { idOrName: 'EFAD' } });
  const md = ctxResult.content[0].text;
  assert('get_project_context: starts with # Project Context', md.startsWith('# Project Context:'), md.slice(0, 60));
  assert('get_project_context: has Endpoints section', md.includes('## Endpoints'), '');
  assert('get_project_context: has Notes section', md.includes('## Project Notes / Memory'), '');
  assert('get_project_context: has api_base_url value', md.includes('localhost:8001'), '');

  // 8. search_projects
  console.log('\n[8] tools/call search_projects (query=ticket)');
  const searchResult = await send('tools/call', { name: 'search_projects', arguments: { query: 'ticket' } });
  const searchText = searchResult.content[0].text;
  const searchHits = searchText.startsWith('[') ? JSON.parse(searchText) : [];
  assert('search_projects: EFAD found for "ticket"', Array.isArray(searchHits) && searchHits.some((p) => p.name === 'EFAD'), searchText.slice(0, 100));

  // 9. search with no results
  console.log('\n[9] tools/call search_projects (query=zzznomatches)');
  const noMatch = await send('tools/call', { name: 'search_projects', arguments: { query: 'zzznomatches' } });
  assert('search_projects no match: message', noMatch.content[0].text.includes('No projects found'), noMatch.content[0].text);

  // 10. resources/list
  console.log('\n[10] resources/list');
  const resourcesResult = await send('resources/list', {});
  const resourceUris = (resourcesResult.resources || []).map((r) => r.uri);
  assert('resources/list: nexus://projects present', resourceUris.includes('nexus://projects'), resourceUris.join(', '));

  // 11. resources/read (list resource)
  console.log('\n[11] resources/read nexus://projects');
  const readList = await send('resources/read', { uri: 'nexus://projects' });
  const listContent = JSON.parse(readList.contents[0].text);
  assert('resources/read projects: is array', Array.isArray(listContent), typeof listContent);

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------
  console.log(`\n--- Results: ${passed} passed, ${failed} failed ---`);

  child.stdin.end();
  child.kill();

  process.exit(failed > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error('[smoke] Unexpected error:', err);
  child.stdin.end();
  child.kill();
  process.exit(1);
});
