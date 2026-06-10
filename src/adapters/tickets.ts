import type { Project, Ticket } from '../types';
import { httpRequest, parseJson } from '../lib/http';
import { getSecret, secretKeys } from '../lib/secrets';

interface TokenCache {
  token: string;
  fetchedAt: number;
}

const TOKEN_CACHE = new Map<number, TokenCache>();
// Re-login at most every 20h; a 401 response forces an earlier refresh
const TOKEN_TTL_MS = 20 * 60 * 60 * 1000;

interface TicketRaw {
  id: number;
  subject: string;
  details: string;
  priority: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface TicketsResponse {
  support_requests?: TicketRaw[];
  items?: TicketRaw[];
  results?: TicketRaw[];
  data?: TicketRaw[];
  total?: number;
}

function appendQueryParams(url: string, params: string): string {
  return url.includes('?') ? `${url}&${params}` : `${url}?${params}`;
}

function mapTicket(raw: TicketRaw): Ticket {
  return {
    id: raw.id,
    subject: raw.subject,
    details: raw.details,
    priority: raw.priority,
    status: raw.status,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

// Resolve the token from a login response. An explicit dot-path (`tokenField`)
// wins; otherwise common field names are tried in order.
function extractToken(body: unknown, tokenField: string): string | null {
  if (!body || typeof body !== 'object') return null;

  const paths =
    tokenField.trim() !== ''
      ? [tokenField.trim()]
      : ['access_token', 'token', 'data.access_token', 'data.token', 'jwt'];

  for (const path of paths) {
    let cur: unknown = body;
    for (const part of path.split('.')) {
      if (cur && typeof cur === 'object' && part in (cur as Record<string, unknown>)) {
        cur = (cur as Record<string, unknown>)[part];
      } else {
        cur = undefined;
        break;
      }
    }
    if (typeof cur === 'string' && cur !== '') return cur;
  }
  return null;
}

async function login(p: Project): Promise<string> {
  const endpoint = p.loginEndpoint.trim();
  if (!endpoint) {
    throw new Error('Login endpoint not configured');
  }

  const creds = await getSecret(secretKeys.loginCreds(p.id));
  if (!creds) {
    throw new Error('Login credentials not configured');
  }

  // Credentials are stored as the raw request body: JSON or form-encoded
  let contentType = 'application/json';
  try {
    JSON.parse(creds);
  } catch {
    contentType = 'application/x-www-form-urlencoded';
  }

  const resp = await httpRequest({
    method: 'POST',
    url: endpoint,
    headers: { 'Content-Type': contentType },
    body: creds,
    timeoutMs: 10_000,
  });

  if (!resp.ok) {
    throw new Error(`Login failed (${resp.status}): ${resp.body.slice(0, 200)}`);
  }

  const json = parseJson<unknown>(resp);
  const token = extractToken(json, p.tokenField);
  if (!token) {
    throw new Error('Login response missing token — set "Token field" in project settings');
  }

  TOKEN_CACHE.set(p.id, { token, fetchedAt: Date.now() });
  return token;
}

async function getToken(p: Project): Promise<string | null> {
  if (p.authMethod === 'none') {
    return null;
  }

  if (p.authMethod === 'bearer') {
    return getSecret(secretKeys.apiToken(p.id));
  }

  // login auth
  const cached = TOKEN_CACHE.get(p.id);
  if (cached && Date.now() - cached.fetchedAt < TOKEN_TTL_MS) {
    return cached.token;
  }

  return login(p);
}

async function fetchTicketsWithToken(
  p: Project,
  token: string | null,
): Promise<{ resp: Awaited<ReturnType<typeof httpRequest>>; ticketsUrl: string }> {
  const baseUrl =
    p.supportEndpoint && p.supportEndpoint.trim() !== ''
      ? p.supportEndpoint.trim()
      : `${p.apiBaseUrl}/v1/support-requests/`;

  const ticketsUrl = appendQueryParams(baseUrl, 'skip=0&limit=1000');

  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const resp = await httpRequest({ method: 'GET', url: ticketsUrl, headers, timeoutMs: 15_000 });
  return { resp, ticketsUrl };
}

export async function fetchTickets(p: Project): Promise<Ticket[]> {
  const hasSupport = p.supportEndpoint && p.supportEndpoint.trim() !== '';
  const hasBase = p.apiBaseUrl && p.apiBaseUrl.trim() !== '';
  if (!hasSupport && !hasBase) {
    return [];
  }

  let token = await getToken(p);

  let { resp } = await fetchTicketsWithToken(p, token);

  // On 401 with login auth: drop cache, re-login once, retry
  if (resp.status === 401 && p.authMethod === 'login') {
    TOKEN_CACHE.delete(p.id);
    token = await login(p);
    ({ resp } = await fetchTicketsWithToken(p, token));
  }

  if (!resp.ok) {
    throw new Error(`Support API ${resp.status}: ${resp.body.slice(0, 200)}`);
  }

  // Handle bare-array and common wrapped shapes
  const body = parseJson<TicketsResponse | TicketRaw[]>(resp);
  if (!body) {
    return [];
  }

  let rawTickets: TicketRaw[];
  if (Array.isArray(body)) {
    rawTickets = body;
  } else {
    const wrapped = body.support_requests ?? body.items ?? body.results ?? body.data;
    if (!wrapped) return [];
    rawTickets = wrapped;
  }

  return rawTickets.map(mapTicket);
}
