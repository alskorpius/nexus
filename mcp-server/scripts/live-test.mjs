// One-off live test: connect to the MCP server against the REAL nexus.db
// and exercise list_projects + get_project_context.
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const serverEntry = path.join(here, '..', 'src', 'index.js');
const dbPath = process.argv[2];
if (!dbPath) {
  console.error('usage: node live-test.mjs <path-to-nexus.db>');
  process.exit(1);
}

const transport = new StdioClientTransport({
  command: process.execPath,
  args: [serverEntry, '--db', dbPath],
});
const client = new Client({ name: 'live-test', version: '0.0.1' });
await client.connect(transport);

const tools = await client.listTools();
console.log('tools:', tools.tools.map(t => t.name).join(', '));

const list = await client.callTool({ name: 'list_projects', arguments: {} });
console.log('\n--- list_projects ---');
console.log(list.content[0].text);

const projects = JSON.parse(list.content[0].text);
if (projects.length > 0) {
  const first = projects[0];
  const ctx = await client.callTool({
    name: 'get_project_context',
    arguments: { idOrName: String(first.id) },
  });
  console.log(`\n--- get_project_context(${first.id}: ${first.name}) ---`);
  console.log(ctx.content[0].text);
}

await client.close();
