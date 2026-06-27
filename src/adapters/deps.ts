import type { Project } from '../types';
import { httpRequest, parseJson } from '../lib/http';
import { getSecret, secretKeys } from '../lib/secrets';

// Dependency staleness + vulnerability report.
//
// Scope (deliberate):
// - Manifests: package.json (npm) and requirements.txt (PyPI) anywhere in the
//   DEFAULT BRANCH tree (vendor/build dirs excluded, capped at 10 manifests),
//   fetched via the GitHub/GitLab APIs.
// - Versions compared are the MANIFEST SPECS (declared minimums), not
//   lockfile-resolved versions — lockfile parsing is out of scope.
// - Vulnerabilities via OSV.dev (no auth required).

export type DepEcosystem = 'npm' | 'PyPI';

export interface DepVuln {
  id: string;
  url: string;
  summary: string | null;
}

export type Staleness = 'current' | 'patch' | 'minor' | 'major' | 'unknown';

export interface DepStatus {
  name: string;
  ecosystem: DepEcosystem;
  /** Version extracted from the manifest spec (e.g. 1.2.3 from ^1.2.3); null if unparsable. */
  specVersion: string | null;
  /** Raw spec string from the manifest. */
  raw: string;
  /** devDependencies (npm only). */
  dev: boolean;
  /** Manifest path this dep came from, e.g. 'api/requirements.txt'. */
  source: string;
  latest: string | null;
  staleness: Staleness;
  vulns: DepVuln[];
}

export interface DepsReport {
  generatedAt: string;
  /** Manifests found at the repo root, e.g. ['package.json']. */
  manifests: string[];
  deps: DepStatus[];
  counts: {
    total: number;
    major: number;
    minor: number;
    patch: number;
    current: number;
    unknown: number;
    vulnerable: number;
  };
}

const REGISTRY_TIMEOUT = 10_000;
const CONCURRENCY = 8;
const OSV_DETAIL_CAP = 15;
const MAX_MANIFESTS = 10;

const MANIFEST_NAMES = new Set(['package.json', 'requirements.txt']);
// Directories whose manifests are vendored/generated — not the project's own.
const SKIP_DIRS = new Set([
  'node_modules', 'vendor', 'dist', 'build', 'out', 'target',
  'venv', '.venv', 'env', '__pycache__', 'site-packages',
  'examples', 'fixtures', 'test_data', 'testdata',
]);

function isWantedManifest(path: string): boolean {
  const parts = path.split('/');
  const base = parts[parts.length - 1];
  if (!MANIFEST_NAMES.has(base)) return false;
  return !parts.slice(0, -1).some(seg => SKIP_DIRS.has(seg) || seg.startsWith('.'));
}

/** Root manifests first, then by depth, then alphabetically. */
function sortManifestPaths(paths: string[]): string[] {
  return [...paths].sort((a, b) => {
    const da = a.split('/').length;
    const db = b.split('/').length;
    return da - db || a.localeCompare(b);
  });
}

// ── Small concurrency pool ───────────────────────────────────────────────────

async function mapPool<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  async function worker(): Promise<void> {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

// ── Repo file fetching ───────────────────────────────────────────────────────

function repoSlug(p: Project): string {
  if (p.gitProjectId && p.gitProjectId.includes('/')) return p.gitProjectId;
  try {
    const u = new URL(p.repoUrl);
    return u.pathname.replace(/^\//, '').replace(/\.git$/, '');
  } catch {
    return p.repoUrl.replace(/^.*github\.com\//, '').replace(/\.git$/, '');
  }
}

function gitlabHost(p: Project): string {
  if (p.repoUrl.startsWith('http')) {
    try {
      const u = new URL(p.repoUrl);
      return `${u.protocol}//${u.host}`;
    } catch {
      // fall through
    }
  }
  return 'https://gitlab.com';
}

// ── Manifest discovery (recursive tree listing) ──────────────────────────────

interface GithubTreeResponse {
  tree?: Array<{ path?: string; type?: string }>;
  truncated?: boolean;
}

async function listGithubManifests(slug: string, token: string | null): Promise<string[]> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  // Trees API needs a real ref — resolve the default branch first.
  const repoR = await httpRequest({
    method: 'GET',
    url: `https://api.github.com/repos/${slug}`,
    headers,
    timeoutMs: REGISTRY_TIMEOUT,
  });
  if (!repoR.ok) throw new Error(`GitHub ${repoR.status} while resolving the default branch`);
  const branch = parseJson<{ default_branch?: string }>(repoR)?.default_branch ?? 'main';

  const r = await httpRequest({
    method: 'GET',
    url: `https://api.github.com/repos/${slug}/git/trees/${encodeURIComponent(branch)}?recursive=1`,
    headers,
    timeoutMs: 20_000,
  });
  if (!r.ok) throw new Error(`GitHub ${r.status} while listing the repository tree`);
  const doc = parseJson<GithubTreeResponse>(r);
  return (doc?.tree ?? [])
    .filter(e => e.type === 'blob' && typeof e.path === 'string' && isWantedManifest(e.path))
    .map(e => e.path as string);
}

interface GitlabTreeEntry {
  path?: string;
  type?: string;
}

async function listGitlabManifests(
  host: string,
  encodedId: string,
  headers: Record<string, string>,
  ref: string,
): Promise<string[]> {
  const found: string[] = [];
  // Paginated recursive listing; bounded to keep huge repos cheap.
  for (let page = 1; page <= 10; page++) {
    const r = await httpRequest({
      method: 'GET',
      url: `${host}/api/v4/projects/${encodedId}/repository/tree?recursive=true&ref=${encodeURIComponent(ref)}&per_page=100&page=${page}`,
      headers,
      timeoutMs: 20_000,
    });
    if (!r.ok) throw new Error(`GitLab ${r.status} while listing the repository tree`);
    const entries = parseJson<GitlabTreeEntry[]>(r) ?? [];
    for (const e of entries) {
      if (e.type === 'blob' && typeof e.path === 'string' && isWantedManifest(e.path)) {
        found.push(e.path);
      }
    }
    if (entries.length < 100) break;
  }
  return found;
}

/** Resolve the GitLab default branch (the files raw endpoint requires a real ref). */
async function gitlabDefaultBranch(
  host: string,
  encodedId: string,
  headers: Record<string, string>,
): Promise<string> {
  const r = await httpRequest({
    method: 'GET',
    url: `${host}/api/v4/projects/${encodedId}`,
    headers,
    timeoutMs: REGISTRY_TIMEOUT,
  });
  if (!r.ok) throw new Error(`GitLab ${r.status} while resolving the default branch`);
  const doc = parseJson<{ default_branch?: string }>(r);
  return doc?.default_branch ?? 'main';
}

/**
 * Fetch a root file from the default branch; null when the file is absent.
 * Note: the GitHub contents API does not return raw bodies for files >1 MB —
 * irrelevant for manifests in practice.
 */
async function fetchRepoFile(
  p: Project,
  token: string | null,
  path: string,
  gitlabRef?: string,
): Promise<string | null> {
  if (p.gitProvider === 'github') {
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.raw+json',
      'X-GitHub-Api-Version': '2022-11-28',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    // Encode per segment — slashes must stay as path separators for GitHub.
    const encodedPath = path.split('/').map(encodeURIComponent).join('/');
    const r = await httpRequest({
      method: 'GET',
      url: `https://api.github.com/repos/${repoSlug(p)}/contents/${encodedPath}`,
      headers,
      timeoutMs: REGISTRY_TIMEOUT,
    });
    if (r.status === 404) return null;
    if (!r.ok) {
      // Full diagnostics to the console — edge/proxy blocks return HTML
      // bodies that carry the real story.
      console.warn(
        `[deps] GitHub ${r.status} for ${path}`,
        { headers: r.headers, body: r.body.slice(0, 500) },
      );
      // GitHub's body always states the exact cause — surface it.
      const apiMessage = parseJson<{ message?: string }>(r)?.message ?? '';
      if (
        (r.status === 403 || r.status === 429) &&
        r.headers['x-ratelimit-remaining'] === '0'
      ) {
        throw new Error(
          `GitHub rate limit reached while fetching ${path} — add a git token in project settings (or wait for the hourly reset)`,
        );
      }
      throw new Error(
        `GitHub ${r.status} for ${repoSlug(p)}/${path}${apiMessage ? ` — ${apiMessage}` : ''}`,
      );
    }
    return r.body;
  }

  // gitlab
  const host = gitlabHost(p);
  const projectId =
    p.gitProjectId && p.gitProjectId.trim() !== '' ? p.gitProjectId : repoSlug(p);
  const encodedId = encodeURIComponent(projectId);
  const headers: Record<string, string> = {};
  if (token) headers['PRIVATE-TOKEN'] = token;

  const ref = gitlabRef ?? (await gitlabDefaultBranch(host, encodedId, headers));
  const r = await httpRequest({
    method: 'GET',
    url: `${host}/api/v4/projects/${encodedId}/repository/files/${encodeURIComponent(path)}/raw?ref=${encodeURIComponent(ref)}`,
    headers,
    timeoutMs: REGISTRY_TIMEOUT,
  });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`GitLab ${r.status} while fetching ${path}`);
  return r.body;
}

// ── Manifest parsing ─────────────────────────────────────────────────────────

/** First numeric version triple found in a spec string. */
function extractVersion(spec: string): string | null {
  const m = spec.match(/(\d+)(?:\.(\d+))?(?:\.(\d+))?/);
  if (!m) return null;
  return `${m[1]}.${m[2] ?? '0'}.${m[3] ?? '0'}`;
}

export interface ParsedDep {
  name: string;
  ecosystem: DepEcosystem;
  specVersion: string | null;
  raw: string;
  dev: boolean;
  source: string;
}

export function parsePackageJson(content: string, source: string): ParsedDep[] {
  let pkg: unknown;
  try {
    pkg = JSON.parse(content);
  } catch {
    return [];
  }
  if (!pkg || typeof pkg !== 'object') return [];
  const root = pkg as Record<string, unknown>;
  const out: ParsedDep[] = [];
  for (const [field, dev] of [['dependencies', false], ['devDependencies', true]] as const) {
    const block = root[field];
    if (!block || typeof block !== 'object') continue;
    for (const [name, spec] of Object.entries(block as Record<string, unknown>)) {
      if (typeof spec !== 'string') continue;
      // Skip non-registry specs (git/file/workspace/link URLs).
      const isRegistry = !/^(git|file|link|workspace|https?):/i.test(spec);
      out.push({
        name,
        ecosystem: 'npm',
        specVersion: isRegistry ? extractVersion(spec) : null,
        raw: spec,
        dev,
        source,
      });
    }
  }
  return out;
}

/** PEP 503 name normalization. */
function normalizePyName(name: string): string {
  return name.toLowerCase().replace(/[-_.]+/g, '-');
}

export function parseRequirementsTxt(content: string, source: string): ParsedDep[] {
  const out: ParsedDep[] = [];
  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#') || line.startsWith('-')) continue;
    // Skip URLs / local paths / editable installs.
    if (/^(https?|git\+|file:|\.|\/)/i.test(line)) continue;
    // name[extras]<op>version ; markers
    const m = line.match(/^([A-Za-z0-9][A-Za-z0-9._-]*)\s*(\[[^\]]*\])?\s*(.*)$/);
    if (!m) continue;
    const spec = (m[3] ?? '').split(/[;#]/)[0].trim();
    out.push({
      name: normalizePyName(m[1]),
      ecosystem: 'PyPI',
      specVersion: spec ? extractVersion(spec) : null,
      raw: line,
      dev: false,
      source,
    });
  }
  return out;
}

// ── Latest version lookup ────────────────────────────────────────────────────

async function fetchLatestNpm(name: string): Promise<string | null> {
  // Scoped packages need the slash (and anything else unsafe) encoded.
  const encoded = name.startsWith('@')
    ? '@' + encodeURIComponent(name.slice(1))
    : encodeURIComponent(name);
  const r = await httpRequest({
    method: 'GET',
    url: `https://registry.npmjs.org/${encoded}`,
    headers: { Accept: 'application/vnd.npm.install-v1+json' },
    timeoutMs: REGISTRY_TIMEOUT,
  });
  if (!r.ok) return null;
  const doc = parseJson<{ 'dist-tags'?: { latest?: string } }>(r);
  return doc?.['dist-tags']?.latest ?? null;
}

async function fetchLatestPypi(name: string): Promise<string | null> {
  const r = await httpRequest({
    method: 'GET',
    url: `https://pypi.org/pypi/${encodeURIComponent(name)}/json`,
    timeoutMs: REGISTRY_TIMEOUT,
  });
  if (!r.ok) return null;
  const doc = parseJson<{ info?: { version?: string } }>(r);
  return doc?.info?.version ?? null;
}

// ── Staleness classification ─────────────────────────────────────────────────

function parseTriple(v: string): [number, number, number] | null {
  // Third component optional so CalVer-style versions (2024.1) still classify.
  const m = v.match(/^(\d+)\.(\d+)(?:\.(\d+))?/);
  if (!m) return null;
  return [Number(m[1]), Number(m[2]), Number(m[3] ?? 0)];
}

function classify(specVersion: string | null, latest: string | null): Staleness {
  if (!specVersion || !latest) return 'unknown';
  const a = parseTriple(specVersion);
  const b = parseTriple(latest);
  if (!a || !b) return 'unknown';
  if (a[0] < b[0]) return 'major';
  if (a[0] > b[0]) return 'current'; // spec ahead of registry (pre-release etc.)
  if (a[1] < b[1]) return 'minor';
  if (a[1] > b[1]) return 'current';
  if (a[2] < b[2]) return 'patch';
  return 'current';
}

// ── OSV vulnerability lookup ─────────────────────────────────────────────────

interface OsvBatchResult {
  results?: Array<{ vulns?: Array<{ id: string }> } | null>;
}

async function queryOsv(deps: ParsedDep[]): Promise<Map<number, string[]>> {
  const map = new Map<number, string[]>();
  const queryable = deps
    .map((d, i) => ({ d, i }))
    .filter(({ d }) => d.specVersion !== null);
  if (queryable.length === 0) return map;

  const r = await httpRequest({
    method: 'POST',
    url: 'https://api.osv.dev/v1/querybatch',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      queries: queryable.map(({ d }) => ({
        version: d.specVersion,
        package: { name: d.name, ecosystem: d.ecosystem },
      })),
    }),
    timeoutMs: 20_000,
  });
  if (!r.ok) return map; // vulnerability data is best-effort

  const parsed = parseJson<OsvBatchResult>(r);
  const results = parsed?.results ?? [];
  for (let q = 0; q < queryable.length; q++) {
    const vulns = results[q]?.vulns;
    if (vulns && vulns.length > 0) {
      map.set(queryable[q].i, vulns.map(v => v.id));
    }
  }
  return map;
}

async function fetchOsvSummary(id: string): Promise<string | null> {
  const r = await httpRequest({
    method: 'GET',
    url: `https://api.osv.dev/v1/vulns/${encodeURIComponent(id)}`,
    timeoutMs: REGISTRY_TIMEOUT,
  });
  if (!r.ok) return null;
  const doc = parseJson<{ summary?: string }>(r);
  return doc?.summary ?? null;
}

// ── Report builder ───────────────────────────────────────────────────────────

/**
 * Build the dependency report for a project. Throws with a readable message
 * when the repo is unreachable; returns a report with empty manifests when
 * no supported manifest exists at the repo root.
 */
export async function buildDepsReport(p: Project): Promise<DepsReport> {
  if (p.gitProvider === 'none') {
    throw new Error('No git provider configured for this project');
  }

  const token = await getSecret(secretKeys.gitToken(p.id));

  // Resolve the GitLab default branch once for the tree listing + file fetches.
  let gitlabRef: string | undefined;
  if (p.gitProvider === 'gitlab') {
    const host = gitlabHost(p);
    const projectId =
      p.gitProjectId && p.gitProjectId.trim() !== '' ? p.gitProjectId : repoSlug(p);
    const headers: Record<string, string> = {};
    if (token) headers['PRIVATE-TOKEN'] = token;
    gitlabRef = await gitlabDefaultBranch(host, encodeURIComponent(projectId), headers);
  }

  // Discover manifests anywhere in the tree; fall back to root-only probing
  // if the tree listing is unavailable (huge/truncated repo, permissions).
  let manifestPaths: string[];
  try {
    if (p.gitProvider === 'github') {
      manifestPaths = await listGithubManifests(repoSlug(p), token);
    } else {
      const host = gitlabHost(p);
      const projectId =
        p.gitProjectId && p.gitProjectId.trim() !== '' ? p.gitProjectId : repoSlug(p);
      const headers: Record<string, string> = {};
      if (token) headers['PRIVATE-TOKEN'] = token;
      manifestPaths = await listGitlabManifests(
        host,
        encodeURIComponent(projectId),
        headers,
        gitlabRef ?? 'main',
      );
    }
  } catch {
    manifestPaths = ['package.json', 'requirements.txt'];
  }
  manifestPaths = sortManifestPaths(manifestPaths).slice(0, MAX_MANIFESTS);

  const contents = await mapPool(manifestPaths, 4, async path => {
    try {
      return await fetchRepoFile(p, token, path, gitlabRef);
    } catch (err) {
      // Root probe must surface real errors; discovered paths are best-effort.
      if (manifestPaths.length <= 2) throw err;
      return null;
    }
  });

  const manifests: string[] = [];
  const parsed: ParsedDep[] = [];
  for (let i = 0; i < manifestPaths.length; i++) {
    const content = contents[i];
    if (content === null) continue;
    const path = manifestPaths[i];
    manifests.push(path);
    const base = path.split('/').pop() ?? path;
    if (base === 'package.json') {
      parsed.push(...parsePackageJson(content, path));
    } else {
      parsed.push(...parseRequirementsTxt(content, path));
    }
  }

  return analyzeParsedDeps(parsed, manifests);
}

/**
 * Resolve latest versions, classify staleness, and query OSV for a set of
 * already-parsed dependencies. Shared by the repo scanner (buildDepsReport)
 * and the paste-text analyzer (analyzePastedManifest). All registry/OSV
 * lookups are best-effort: unreachable services degrade gracefully to
 * `unknown` staleness / no vulns rather than failing the whole report.
 */
export async function analyzeParsedDeps(
  parsed: ParsedDep[],
  manifests: string[],
): Promise<DepsReport> {
  // Latest versions (public registries) — deduped across manifests so the
  // same package is looked up once.
  const uniqueKeys = [...new Set(parsed.map(d => `${d.ecosystem}:${d.name}`))];
  const latestByKey = new Map<string, string | null>();
  await mapPool(uniqueKeys, CONCURRENCY, async key => {
    const [eco, ...nameParts] = key.split(':');
    const name = nameParts.join(':');
    try {
      latestByKey.set(
        key,
        eco === 'npm' ? await fetchLatestNpm(name) : await fetchLatestPypi(name),
      );
    } catch {
      latestByKey.set(key, null);
    }
  });
  const latests = parsed.map(d => latestByKey.get(`${d.ecosystem}:${d.name}`) ?? null);

  // Vulnerabilities (best-effort).
  let vulnIds = new Map<number, string[]>();
  try {
    vulnIds = await queryOsv(parsed);
  } catch {
    // OSV unreachable — staleness data is still useful.
  }

  // Summaries for the vulns we will display (capped).
  const allIds = [...new Set([...vulnIds.values()].flat())].slice(0, OSV_DETAIL_CAP);
  const summaries = new Map<string, string | null>();
  await mapPool(allIds, CONCURRENCY, async id => {
    try {
      summaries.set(id, await fetchOsvSummary(id));
    } catch {
      summaries.set(id, null);
    }
  });

  const deps: DepStatus[] = parsed.map((d, i) => ({
    ...d,
    latest: latests[i],
    staleness: classify(d.specVersion, latests[i]),
    vulns: (vulnIds.get(i) ?? []).map(id => ({
      id,
      url: `https://osv.dev/vulnerability/${id}`,
      summary: summaries.get(id) ?? null,
    })),
  }));

  const counts = {
    total: deps.length,
    major: deps.filter(d => d.staleness === 'major').length,
    minor: deps.filter(d => d.staleness === 'minor').length,
    patch: deps.filter(d => d.staleness === 'patch').length,
    current: deps.filter(d => d.staleness === 'current').length,
    unknown: deps.filter(d => d.staleness === 'unknown').length,
    vulnerable: deps.filter(d => d.vulns.length > 0).length,
  };

  return {
    generatedAt: new Date().toISOString(),
    manifests,
    deps,
    counts,
  };
}

export type ManifestKind = 'auto' | 'package.json' | 'requirements.txt';

/** Heuristic: JSON-looking content is a package.json, everything else is requirements.txt. */
function detectManifestKind(content: string): 'package.json' | 'requirements.txt' {
  const trimmed = content.trimStart();
  if (trimmed.startsWith('{')) return 'package.json';
  try {
    const v = JSON.parse(content);
    if (v && typeof v === 'object') return 'package.json';
  } catch {
    // not JSON
  }
  return 'requirements.txt';
}

/**
 * Analyze a manifest pasted as raw text (no repo access). Mirrors the repo
 * scanner's pipeline — same staleness + OSV checks — but takes the manifest
 * body directly. Throws a readable error when a package.json cannot be parsed.
 */
export async function analyzePastedManifest(
  content: string,
  kind: ManifestKind = 'auto',
): Promise<DepsReport> {
  const trimmed = content.trim();
  if (!trimmed) throw new Error('Paste a package.json or requirements.txt first.');

  const resolved = kind === 'auto' ? detectManifestKind(content) : kind;

  let parsed: ParsedDep[];
  if (resolved === 'package.json') {
    try {
      JSON.parse(content);
    } catch (err) {
      throw new Error(`Invalid package.json — could not parse JSON: ${String(err)}`);
    }
    parsed = parsePackageJson(content, 'package.json');
  } else {
    parsed = parseRequirementsTxt(content, 'requirements.txt');
  }

  if (parsed.length === 0) {
    throw new Error(
      resolved === 'package.json'
        ? 'No dependencies found — package.json has no dependencies / devDependencies.'
        : 'No dependencies found — no parseable requirement lines.',
    );
  }

  return analyzeParsedDeps(parsed, [resolved]);
}
