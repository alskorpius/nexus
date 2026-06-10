import type { AiAccount } from '../lib/db';
import { httpRequest, parseJson } from '../lib/http';

// ---------------------------------------------------------------------------
// Public interfaces
// ---------------------------------------------------------------------------

export interface AiDailyUsage {
  date: string;
  /** Uncached input tokens only (billable at full input rate) */
  inputTokens: number;
  outputTokens: number;
  /** Anthropic cache-read tokens (billed at reduced rate). 0 for OpenAI. */
  cacheReadTokens: number;
  /** Anthropic cache-creation tokens (billed at higher rate). 0 for OpenAI. */
  cacheCreationTokens: number;
  costUsd: number | null;
}

export interface AiUsageSummary {
  days: AiDailyUsage[];
  totalInput: number;
  totalOutput: number;
  /** Anthropic only — 0 for OpenAI */
  totalCacheRead: number;
  /** Anthropic only — 0 for OpenAI */
  totalCacheCreation: number;
  totalCostUsd: number | null;
  /** Non-null when the cost endpoint failed independently of the usage endpoint */
  costError: string | null;
  error: string | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns a full RFC3339 UTC timestamp for the start of the day daysBack
 * days ago. Anthropic's cost_report and usage_report require this format.
 */
function rfc3339Minus(daysBack: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - daysBack);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString().replace('.000Z', 'Z');
}

function unixMinus(daysBack: number): number {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - daysBack);
  d.setUTCHours(0, 0, 0, 0);
  return Math.floor(d.getTime() / 1000);
}

function toNum(v: unknown): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const n = parseFloat(v);
    return isNaN(n) ? 0 : n;
  }
  return 0;
}

function authErrorMsg(provider: string): string {
  return `Admin API key required for ${provider} (organization admin keys only — regular API keys won't work)`;
}

// ---------------------------------------------------------------------------
// Anthropic
// ---------------------------------------------------------------------------

// Anthropic usage bucket — shapes may vary; be defensive
interface AnthropicBucket {
  starting_at?: string;
  ending_at?: string;
  results?: Array<Record<string, unknown>>;
  [k: string]: unknown;
}

interface AnthropicCostBucket {
  starting_at?: string;
  ending_at?: string;
  results?: Array<Record<string, unknown>>;
  [k: string]: unknown;
}

interface AnthropicPagedResponse<T> {
  data?: T[];
  has_more?: boolean;
  next_page?: string;
}

/**
 * Fetches all pages from a paginated Anthropic API endpoint.
 * The first URL must already include all query params except `page`.
 * Follows `next_page` while `has_more` is true, capped at maxPages total.
 */
async function fetchAnthropicPaged<T>(
  firstUrl: string,
  headers: Record<string, string>,
  maxPages = 4,
): Promise<{ data: T[]; httpStatus?: number; httpBody?: string; networkError?: string }> {
  const allData: T[] = [];
  let url: string | null = firstUrl;
  let pages = 0;

  while (url !== null && pages < maxPages) {
    pages++;
    let res;
    try {
      res = await httpRequest({ method: 'GET', url, headers, timeoutMs: 15_000 });
    } catch (e) {
      return { data: allData, networkError: String(e) };
    }

    if (!res.ok) {
      return { data: allData, httpStatus: res.status, httpBody: res.body };
    }

    const parsed = parseJson<AnthropicPagedResponse<T>>(res);
    if (!parsed?.data) break;

    allData.push(...parsed.data);

    if (parsed.has_more && parsed.next_page) {
      // Append page param — first URL has no `page` param
      const sep = firstUrl.includes('?') ? '&' : '?';
      url = `${firstUrl}${sep}page=${encodeURIComponent(parsed.next_page)}`;
    } else {
      url = null;
    }
  }

  return { data: allData };
}

function extractAnthropicDate(bucket: AnthropicBucket): string {
  return (bucket.starting_at as string | undefined)?.slice(0, 10) ?? '';
}

function sumAnthropicTokens(
  results: Array<Record<string, unknown>>,
): { input: number; output: number; cacheRead: number; cacheCreation: number } {
  let input = 0;
  let output = 0;
  let cacheRead = 0;
  let cacheCreation = 0;
  for (const r of results) {
    input += toNum(r['uncached_input_tokens']);
    output += toNum(r['output_tokens']);
    cacheRead += toNum(r['cache_read_input_tokens']);
    cacheCreation += toNum(r['cache_creation_input_tokens']);
  }
  return { input, output, cacheRead, cacheCreation };
}

function sumAnthropicCost(results: Array<Record<string, unknown>>): number {
  // cost_report `amount` is a decimal STRING in lowest currency units (cents):
  // "123.45" with currency "USD" means $1.2345 — divide by 100.
  let totalCents = 0;
  for (const r of results) {
    const v = r['amount'];
    if (typeof v === 'string' || typeof v === 'number') {
      totalCents += toNum(v);
    } else if (v !== null && typeof v === 'object') {
      totalCents += toNum((v as Record<string, unknown>)['value'] ?? 0);
    }
  }
  return totalCents / 100;
}

async function fetchAnthropicUsage(
  adminKey: string,
  daysBack: number,
): Promise<AiUsageSummary> {
  // Anthropic requires full RFC3339 timestamps for starting_at
  const startingAt = rfc3339Minus(daysBack);
  const headers = {
    'x-api-key': adminKey,
    'anthropic-version': '2023-06-01',
    'content-type': 'application/json',
  };

  // Limit per page: max 31 for 1d buckets. For daysBack <= 31 a single page suffices.
  const pageLimit = 31;

  const usageBaseUrl =
    `https://api.anthropic.com/v1/organizations/usage_report/messages?starting_at=${encodeURIComponent(startingAt)}&bucket_width=1d&limit=${pageLimit}`;
  const costBaseUrl =
    `https://api.anthropic.com/v1/organizations/cost_report?starting_at=${encodeURIComponent(startingAt)}&bucket_width=1d&limit=${pageLimit}`;

  const [usageResult, costResult] = await Promise.allSettled([
    fetchAnthropicPaged<AnthropicBucket>(usageBaseUrl, headers),
    fetchAnthropicPaged<AnthropicCostBucket>(costBaseUrl, headers),
  ]);

  const emptyAnthropicSummary = (error: string): AiUsageSummary => ({
    days: [], totalInput: 0, totalOutput: 0, totalCacheRead: 0, totalCacheCreation: 0,
    totalCostUsd: null, costError: null, error,
  });

  // Check auth / network on usage (primary)
  if (usageResult.status === 'rejected') {
    return emptyAnthropicSummary(`Network error: ${String(usageResult.reason)}`);
  }
  const usagePaged = usageResult.value;
  if (usagePaged.networkError) {
    return emptyAnthropicSummary(`Network error: ${usagePaged.networkError}`);
  }
  if (usagePaged.httpStatus !== undefined) {
    if (usagePaged.httpStatus === 401 || usagePaged.httpStatus === 403) {
      return emptyAnthropicSummary(authErrorMsg('Anthropic'));
    }
    return emptyAnthropicSummary(
      `Anthropic usage ${usagePaged.httpStatus}: ${(usagePaged.httpBody ?? '').slice(0, 200)}`,
    );
  }

  const usageData = usagePaged.data;

  // Determine cost error, if any
  let costError: string | null = null;
  let costBuckets: AnthropicCostBucket[] = [];

  if (costResult.status === 'rejected') {
    costError = `Cost network error: ${String(costResult.reason)}`;
  } else {
    const cp = costResult.value;
    if (cp.networkError) {
      costError = `Cost network error: ${cp.networkError}`;
    } else if (cp.httpStatus !== undefined) {
      if (cp.httpStatus === 401 || cp.httpStatus === 403) {
        costError = `Cost endpoint: ${authErrorMsg('Anthropic')}`;
      } else {
        costError = `Anthropic cost_report ${cp.httpStatus}: ${(cp.httpBody ?? '').slice(0, 150)}`;
        console.warn('[ai adapter] Anthropic cost_report status:', cp.httpStatus, (cp.httpBody ?? '').slice(0, 500));
      }
    } else if (cp.data.length === 0) {
      // Empty is valid — no costs yet
      costBuckets = [];
    } else {
      costBuckets = cp.data;
    }
  }

  // Build cost lookup by date
  const costByDate = new Map<string, number>();
  for (const bucket of costBuckets) {
    const date = (bucket.starting_at as string | undefined)?.slice(0, 10) ?? '';
    if (!date) continue;
    const cost = bucket.results ? sumAnthropicCost(bucket.results) : 0;
    costByDate.set(date, (costByDate.get(date) ?? 0) + cost);
  }

  // costError === null → cost is known (may be 0 for the period)
  // costError !== null → cost unknown, leave costUsd null on each day

  const days: AiDailyUsage[] = usageData
    .map((bucket) => {
      const date = extractAnthropicDate(bucket);
      const { input, output, cacheRead, cacheCreation } = sumAnthropicTokens(bucket.results ?? []);
      return {
        date,
        inputTokens: input,
        outputTokens: output,
        cacheReadTokens: cacheRead,
        cacheCreationTokens: cacheCreation,
        costUsd: costError === null ? (costByDate.get(date) ?? 0) : null,
      };
    })
    .filter((d) => d.date !== '')
    .sort((a, b) => a.date.localeCompare(b.date));

  const totalInput = days.reduce((s, d) => s + d.inputTokens, 0);
  const totalOutput = days.reduce((s, d) => s + d.outputTokens, 0);
  const totalCacheRead = days.reduce((s, d) => s + d.cacheReadTokens, 0);
  const totalCacheCreation = days.reduce((s, d) => s + d.cacheCreationTokens, 0);
  const totalCostUsd = costError === null
    ? days.reduce((s, d) => s + (d.costUsd ?? 0), 0)
    : null;

  return {
    days, totalInput, totalOutput, totalCacheRead, totalCacheCreation,
    totalCostUsd, costError, error: null,
  };
}

// ---------------------------------------------------------------------------
// OpenAI
// ---------------------------------------------------------------------------

interface OpenAiBucket {
  start_time?: number;
  end_time?: number;
  results?: Array<Record<string, unknown>>;
  [k: string]: unknown;
}

interface OpenAiCostBucket {
  start_time?: number;
  end_time?: number;
  results?: Array<Record<string, unknown>>;
  [k: string]: unknown;
}

function unixToDateStr(ts: number): string {
  return new Date(ts * 1000).toISOString().slice(0, 10);
}

function sumOpenAiTokens(
  results: Array<Record<string, unknown>>,
): { input: number; output: number } {
  let input = 0;
  let output = 0;
  for (const r of results) {
    input += toNum(r['input_tokens'] ?? r['prompt_tokens'] ?? 0);
    output += toNum(r['output_tokens'] ?? r['completion_tokens'] ?? 0);
  }
  return { input, output };
}

function sumOpenAiCost(results: Array<Record<string, unknown>>): number {
  let total = 0;
  for (const r of results) {
    const amount = r['amount'];
    if (amount !== null && typeof amount === 'object') {
      const obj = amount as Record<string, unknown>;
      total += toNum(obj['value'] ?? 0);
    } else {
      total += toNum(r['cost'] ?? r['amount'] ?? 0);
    }
  }
  return total;
}

async function fetchOpenAiUsage(
  adminKey: string,
  daysBack: number,
): Promise<AiUsageSummary> {
  const startTime = unixMinus(daysBack);
  const headers = {
    Authorization: `Bearer ${adminKey}`,
    'content-type': 'application/json',
  };
  // OpenAI supports limit up to 180 for 1d buckets — a single request covers 90d fine.
  const limit = Math.min(daysBack + 1, 180);

  const [usageRes, costRes] = await Promise.allSettled([
    httpRequest({
      method: 'GET',
      url: `https://api.openai.com/v1/organization/usage/completions?start_time=${startTime}&bucket_width=1d&limit=${limit}`,
      headers,
      timeoutMs: 15_000,
    }),
    httpRequest({
      method: 'GET',
      url: `https://api.openai.com/v1/organization/costs?start_time=${startTime}&bucket_width=1d&limit=${limit}`,
      headers,
      timeoutMs: 15_000,
    }),
  ]);

  const emptyOpenAiSummary = (error: string): AiUsageSummary => ({
    days: [], totalInput: 0, totalOutput: 0, totalCacheRead: 0, totalCacheCreation: 0,
    totalCostUsd: null, costError: null, error,
  });

  if (usageRes.status === 'fulfilled') {
    const r = usageRes.value;
    if (r.status === 401 || r.status === 403) {
      return emptyOpenAiSummary(authErrorMsg('OpenAI'));
    }
    if (!r.ok) {
      return emptyOpenAiSummary(`OpenAI usage ${r.status}: ${r.body.slice(0, 200)}`);
    }
  } else {
    return emptyOpenAiSummary(`Network error: ${String(usageRes.reason)}`);
  }

  const usageData = parseJson<{ data?: OpenAiBucket[] }>(usageRes.value)?.data ?? [];

  // Determine cost error, if any
  let costError: string | null = null;
  let costBuckets: OpenAiCostBucket[] = [];

  if (costRes.status === 'rejected') {
    costError = `Cost network error: ${String(costRes.reason)}`;
  } else {
    const cr = costRes.value;
    if (cr.status === 401 || cr.status === 403) {
      costError = `Cost endpoint: ${authErrorMsg('OpenAI')}`;
    } else if (!cr.ok) {
      costError = `OpenAI costs ${cr.status}: ${cr.body.slice(0, 150)}`;
      console.warn('[ai adapter] OpenAI costs raw body:', cr.body.slice(0, 500));
    } else {
      const parsed = parseJson<{ data?: OpenAiCostBucket[] }>(cr);
      if (parsed?.data) {
        costBuckets = parsed.data;
      } else {
        costError = 'Cost response had unexpected shape';
        console.warn('[ai adapter] OpenAI costs raw body:', cr.body.slice(0, 500));
      }
    }
  }

  const costByDate = new Map<string, number>();
  for (const bucket of costBuckets) {
    if (typeof bucket.start_time !== 'number') continue;
    const date = unixToDateStr(bucket.start_time);
    const cost = bucket.results ? sumOpenAiCost(bucket.results) : 0;
    costByDate.set(date, (costByDate.get(date) ?? 0) + cost);
  }

  const days: AiDailyUsage[] = usageData
    .map((bucket) => {
      const date =
        typeof bucket.start_time === 'number' ? unixToDateStr(bucket.start_time) : '';
      const { input, output } = sumOpenAiTokens(bucket.results ?? []);
      return {
        date,
        inputTokens: input,
        outputTokens: output,
        cacheReadTokens: 0,
        cacheCreationTokens: 0,
        costUsd: costError === null ? (costByDate.get(date) ?? 0) : null,
      };
    })
    .filter((d) => d.date !== '')
    .sort((a, b) => a.date.localeCompare(b.date));

  const totalInput = days.reduce((s, d) => s + d.inputTokens, 0);
  const totalOutput = days.reduce((s, d) => s + d.outputTokens, 0);
  const totalCostUsd = costError === null
    ? days.reduce((s, d) => s + (d.costUsd ?? 0), 0)
    : null;

  return {
    days, totalInput, totalOutput, totalCacheRead: 0, totalCacheCreation: 0,
    totalCostUsd, costError, error: null,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function fetchAiUsage(
  account: AiAccount,
  adminKey: string,
  daysBack = 30,
): Promise<AiUsageSummary> {
  if (account.provider === 'anthropic') {
    return fetchAnthropicUsage(adminKey, daysBack);
  }
  return fetchOpenAiUsage(adminKey, daysBack);
}
