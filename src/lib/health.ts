import type { Project, HealthState } from '../types';
import { httpRequest } from './http';
import { getSecret, secretKeys } from './secrets';

export async function checkHealth(p: Project): Promise<{
  health: HealthState;
  latencyMs: number | null;
  httpStatus: number | null;
  error: string | null;
}> {
  const url = resolveHealthUrl(p);
  if (url === null) {
    return { health: 'unknown', latencyMs: null, httpStatus: null, error: null };
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
    const health = classify(response.ok, response.status, latencyMs);
    return { health, latencyMs, httpStatus: response.status, error: null };
  } catch (e: unknown) {
    const latencyMs = performance.now() - start;
    const msg = e instanceof Error ? e.message : String(e);
    return { health: 'critical', latencyMs, httpStatus: null, error: msg };
  }
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

function classify(ok: boolean, status: number, latencyMs: number): HealthState {
  if (!ok) {
    if (status === 401 || status === 403) return 'warning';
    if (status === 404 || status >= 500) return 'critical';
    return 'critical';
  }
  return latencyMs < 2500 ? 'healthy' : 'warning';
}
