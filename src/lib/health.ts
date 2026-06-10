import type { Project, HealthState, HealthComponent, HealthMeta } from '../types';
import { httpRequest } from './http';
import { getSecret, secretKeys } from './secrets';

export interface HealthCheckResult {
  health: HealthState;
  latencyMs: number | null;
  httpStatus: number | null;
  error: string | null;
  components: HealthComponent[];
  meta: HealthMeta | null;
}

// Status strings treated as "component is fine"; anything else marks degradation
const OK_STATUSES = new Set([
  'ok', 'healthy', 'up', 'pass', 'passing', 'available',
  'running', 'ready', 'alive', 'online', 'operational', 'connected',
]);

// Top-level keys that may hold a map of named components
const COMPONENT_GROUP_KEYS = [
  'services', 'workers', 'components', 'checks', 'dependencies', 'instances',
];

export async function checkHealth(p: Project): Promise<HealthCheckResult> {
  const url = resolveHealthUrl(p);
  if (url === null) {
    return { health: 'unknown', latencyMs: null, httpStatus: null, error: null, components: [], meta: null };
  }

  const headers: Record<string, string> = {};
  if (p.authMethod === 'bearer') {
    const token = await getSecret(secretKeys.apiToken(p.id));
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const start = performance.now();
  try {
    const response = await httpRequest({ method: 'GET', url, headers, timeoutMs: 10000 });
    const latencyMs = performance.now() - start;
    const { components, meta } = parseHealthBody(response.body);
    const health = classify(response.ok, response.status, latencyMs, meta, components);
    return { health, latencyMs, httpStatus: response.status, error: null, components, meta };
  } catch (e: unknown) {
    const latencyMs = performance.now() - start;
    const msg = e instanceof Error ? e.message : String(e);
    return { health: 'critical', latencyMs, httpStatus: null, error: msg, components: [], meta: null };
  }
}

function isOkStatus(status: string): boolean {
  return OK_STATUSES.has(status.toLowerCase());
}

// Best-effort parse of an arbitrary health JSON body: overall status + meta
// fields + any recognized component groups. Non-JSON bodies yield nothing.
export function parseHealthBody(body: string): {
  components: HealthComponent[];
  meta: HealthMeta | null;
} {
  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    return { components: [], meta: null };
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { components: [], meta: null };
  }

  const root = parsed as Record<string, unknown>;

  const str = (v: unknown): string | null => (typeof v === 'string' && v !== '' ? v : null);
  const meta: HealthMeta = {
    status: str(root.status) ?? str(root.state),
    app: str(root.app) ?? str(root.name) ?? str(root.service),
    version: str(root.version),
    environment: str(root.environment) ?? str(root.env),
  };

  const components: HealthComponent[] = [];
  for (const group of COMPONENT_GROUP_KEYS) {
    const container = root[group];
    if (!container || typeof container !== 'object' || Array.isArray(container)) continue;

    for (const [name, value] of Object.entries(container as Record<string, unknown>)) {
      if (typeof value === 'string') {
        components.push({ group, name, status: value, ok: isOkStatus(value), error: null });
      } else if (value && typeof value === 'object') {
        const obj = value as Record<string, unknown>;
        const status = str(obj.status) ?? str(obj.state) ?? 'unknown';
        const error = str(obj.error) ?? str(obj.message);
        components.push({ group, name, status, ok: isOkStatus(status), error });
      }
    }
  }

  const hasMeta = meta.status || meta.app || meta.version || meta.environment;
  return { components, meta: hasMeta ? meta : null };
}

function resolveHealthUrl(p: Project): string | null {
  const endpoint = p.healthEndpoint.trim();
  if (!endpoint) return null;

  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint;
  }

  const base = p.apiBaseUrl.trim();
  if (!base) return null;

  try {
    const origin = new URL(base).origin;
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${origin}${path}`;
  } catch {
    return null;
  }
}

function classify(
  ok: boolean,
  status: number,
  latencyMs: number,
  meta: HealthMeta | null,
  components: HealthComponent[],
): HealthState {
  if (!ok) {
    if (status === 401 || status === 403) return 'warning';
    if (status === 404 || status >= 500) return 'critical';
    return 'critical';
  }

  // HTTP is fine but the body reports degradation → warning
  if (components.some(c => !c.ok)) return 'warning';
  if (meta?.status && !isOkStatus(meta.status)) return 'warning';

  return latencyMs < 2500 ? 'healthy' : 'warning';
}
