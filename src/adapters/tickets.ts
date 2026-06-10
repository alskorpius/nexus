import type { Project, Ticket, TicketMessage } from '../types';
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
  id: number | string;
  ticket_number?: string;
  subject?: string;
  details?: string;
  description?: string;
  category?: string;
  priority?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

interface TicketsResponse {
  support_requests?: TicketRaw[];
  items?: TicketRaw[];
  results?: TicketRaw[];
  data?: TicketRaw[];
  total?: number;
}

interface TicketMessageRaw {
  id?: number | string;
  message?: string;
  text?: string;
  body?: string;
  content?: string;
  user_name?: string;
  author?: string | { name?: string; username?: string };
  sender?: string;
  user_id?: number | string;
  created_at?: string;
}

interface TicketMessagesResponse {
  messages?: TicketMessageRaw[];
  items?: TicketMessageRaw[];
  data?: TicketMessageRaw[];
}

function appendQueryParams(url: string, params: string): string {
  return url.includes('?') ? `${url}&${params}` : `${url}?${params}`;
}

function mapTicket(raw: TicketRaw): Ticket {
  return {
    id: raw.id,
    ref: raw.ticket_number ?? String(raw.id),
    subject: raw.subject ?? '(no subject)',
    details: raw.details ?? raw.description ?? '',
    priority: raw.priority ?? '',
    status: raw.status ?? '',
    createdAt: raw.created_at ?? '',
    updatedAt: raw.updated_at ?? raw.created_at ?? '',
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

// Tickets base URL without trailing slash: explicit supportEndpoint wins,
// otherwise derived from the API base
function ticketsBaseUrl(p: Project): string | null {
  if (p.supportEndpoint && p.supportEndpoint.trim() !== '') {
    return p.supportEndpoint.trim().replace(/\/+$/, '');
  }
  if (p.apiBaseUrl && p.apiBaseUrl.trim() !== '') {
    return `${p.apiBaseUrl.trim().replace(/\/+$/, '')}/v1/support-requests`;
  }
  return null;
}

async function fetchTicketsWithToken(
  p: Project,
  token: string | null,
): Promise<{ resp: Awaited<ReturnType<typeof httpRequest>>; ticketsUrl: string }> {
  // For the list call use the configured endpoint verbatim — trailing-slash
  // presence matters to some frameworks (FastAPI 307-redirects on mismatch)
  const configured = p.supportEndpoint?.trim();
  const baseUrl = configured && configured !== '' ? configured : `${ticketsBaseUrl(p)}/`;

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

// Run an authorized request; on 401 with login auth, re-login once and retry
async function withAuthRetry(
  p: Project,
  run: (token: string | null) => Promise<Awaited<ReturnType<typeof httpRequest>>>,
): Promise<Awaited<ReturnType<typeof httpRequest>>> {
  const token = await getToken(p);
  let resp = await run(token);
  if (resp.status === 401 && p.authMethod === 'login') {
    TOKEN_CACHE.delete(p.id);
    resp = await run(await login(p));
  }
  return resp;
}

// Update conventions, tried in order to fit different APIs:
//   PATCH {base}/{id}/status {"status"} → fallback PUT {base}/{id} {"status"}
export async function updateTicketStatus(
  p: Project,
  ticketId: number | string,
  status: string,
): Promise<void> {
  const base = ticketsBaseUrl(p);
  if (!base) {
    throw new Error('Support endpoint not configured');
  }

  const send = (method: string, url: string) => (token: string | null) => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return httpRequest({ method, url, headers, body: JSON.stringify({ status }), timeoutMs: 10_000 });
  };

  let resp = await withAuthRetry(p, send('PATCH', `${base}/${ticketId}/status`));

  if (resp.status === 404 || resp.status === 405) {
    resp = await withAuthRetry(p, send('PUT', `${base}/${ticketId}`));
  }

  if (!resp.ok) {
    throw new Error(`Status update failed (${resp.status}): ${resp.body.slice(0, 200)}`);
  }
}

// Message conventions: POST {base}/{id}/messages as JSON {"message"} →
// fallback to multipart/form-data with a "message" field (415/422)
export async function addTicketMessage(
  p: Project,
  ticketId: number | string,
  message: string,
): Promise<void> {
  const base = ticketsBaseUrl(p);
  if (!base) {
    throw new Error('Support endpoint not configured');
  }
  const url = `${base}/${ticketId}/messages`;

  const sendJson = (token: string | null) => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return httpRequest({ method: 'POST', url, headers, body: JSON.stringify({ message }), timeoutMs: 10_000 });
  };

  const sendMultipart = (token: string | null) => {
    const boundary = `----NexusBoundary${Date.now().toString(36)}`;
    const body =
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="message"\r\n\r\n` +
      `${message}\r\n` +
      `--${boundary}--\r\n`;
    const headers: Record<string, string> = {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return httpRequest({ method: 'POST', url, headers, body, timeoutMs: 10_000 });
  };

  let resp = await withAuthRetry(p, sendJson);

  if (resp.status === 415 || resp.status === 422) {
    resp = await withAuthRetry(p, sendMultipart);
  }

  if (!resp.ok) {
    throw new Error(`Send message failed (${resp.status}): ${resp.body.slice(0, 200)}`);
  }
}

function mapMessage(raw: TicketMessageRaw): TicketMessage {
  const author =
    raw.user_name ??
    (typeof raw.author === 'string' ? raw.author : raw.author?.name ?? raw.author?.username) ??
    raw.sender ??
    (raw.user_id != null ? `user ${raw.user_id}` : null);

  return {
    id: raw.id ?? null,
    author,
    message: raw.message ?? raw.text ?? raw.body ?? raw.content ?? '',
    createdAt: raw.created_at ?? null,
  };
}

// GET {base}/{id}/messages — accepts bare arrays and common wrapped shapes
export async function fetchTicketMessages(
  p: Project,
  ticketId: number | string,
): Promise<TicketMessage[]> {
  const base = ticketsBaseUrl(p);
  if (!base) {
    throw new Error('Support endpoint not configured');
  }
  const url = `${base}/${ticketId}/messages`;

  const resp = await withAuthRetry(p, (token) => {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return httpRequest({ method: 'GET', url, headers, timeoutMs: 10_000 });
  });

  if (!resp.ok) {
    throw new Error(`Messages fetch failed (${resp.status}): ${resp.body.slice(0, 200)}`);
  }

  const body = parseJson<TicketMessagesResponse | TicketMessageRaw[]>(resp);
  if (!body) return [];

  const raw = Array.isArray(body) ? body : body.messages ?? body.items ?? body.data;
  if (!raw) return [];

  return raw.map(mapMessage).filter(m => m.message !== '');
}
