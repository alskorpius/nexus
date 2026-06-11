import type { Project } from '../types';
import { httpRequest, parseJson } from '../lib/http';
import { getSecret, secretKeys } from '../lib/secrets';

// Dependency staleness + vulnerability report.
//
// v1 scope (deliberate):
// - Manifests: package.json (npm) and requirements.txt (PyPI) at the REPO
//   ROOT of the DEFAULT BRANCH, fetched via the GitHub/GitLab APIs.
// - Versions compared are the MANIFEST SPECS (declared minimums), not
//   lockfile-resolved versions — lockfile parsing is out of scope for v1.
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
    const r = await httpRequest({
      method: 'GET',
      url: `https://api.github.com/repos/${repoSlug(p)}/contents/${encodeURIComponent(path)}`,
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

interface ParsedDep {
  name: string;
  ecosystem: DepEcosystem;
  specVersion: string | null;
  raw: string;
  dev: boolean;
}

function parsePackageJson(content: string): ParsedDep[] {
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
      });
    }
  }
  return out;
}

/** PEP 503 name normalization. */
function normalizePyName(name: string): string {
  return name.toLowerCase().replace(/[-_.]+/g, '-');
}

function parseRequirementsTxt(content: string): ParsedDep[] {
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

  // Resolve the GitLab default branch once for both file fetches.
  let gitlabRef: string | undefined;
  if (p.gitProvider === 'gitlab') {
    const host = gitlabHost(p);
    const projectId =
      p.gitProjectId && p.gitProjectId.trim() !== '' ? p.gitProjectId : repoSlug(p);
    const headers: Record<string, string> = {};
    if (token) headers['PRIVATE-TOKEN'] = token;
    gitlabRef = await gitlabDefaultBranch(host, encodeURIComponent(projectId), headers);
  }

  const [pkgJson, reqTxt] = await Promise.all([
    fetchRepoFile(p, token, 'package.json', gitlabRef),
    fetchRepoFile(p, token, 'requirements.txt', gitlabRef),
  ]);

  const manifests: string[] = [];
  const parsed: ParsedDep[] = [];
  if (pkgJson !== null) {
    manifests.push('package.json');
    parsed.push(...parsePackageJson(pkgJson));
  }
  if (reqTxt !== null) {
    manifests.push('requirements.txt');
    parsed.push(...parseRequirementsTxt(reqTxt));
  }

  // Latest versions (registry lookups are public + unauthenticated).
  const latests = await mapPool(parsed, CONCURRENCY, async d => {
    try {
      return d.ecosystem === 'npm' ? await fetchLatestNpm(d.name) : await fetchLatestPypi(d.name);
    } catch {
      return null;
    }
  });

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
