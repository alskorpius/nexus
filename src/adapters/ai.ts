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
  error: string | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isoDateMinus(daysBack: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - daysBack);
  return d.toISOString().slice(0, 10);
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
  let total = 0;
  for (const r of results) {
    // look for any numeric *amount* or *cost* field
    for (const [k, v] of Object.entries(r)) {
      if ((k.includes('amount') || k.includes('cost')) && typeof v === 'number') {
        total += v;
      } else if (k === 'amount' && v !== null && typeof v === 'object') {
        const obj = v as Record<string, unknown>;
        total += toNum(obj['value'] ?? obj['amount'] ?? 0);
      }
    }
  }
  return total;
}

async function fetchAnthropicUsage(
  adminKey: string,
  daysBack: number,
): Promise<AiUsageSummary> {
  const startingAt = isoDateMinus(daysBack);
  const headers = {
    'x-api-key': adminKey,
    'anthropic-version': '2023-06-01',
    'content-type': 'application/json',
  };

  const [usageRes, costRes] = await Promise.allSettled([
    httpRequest({
      method: 'GET',
      url: `https://api.anthropic.com/v1/organizations/usage_report/messages?starting_at=${startingAt}&bucket_width=1d&limit=31`,
      headers,
      timeoutMs: 15_000,
    }),
    httpRequest({
      method: 'GET',
      url: `https://api.anthropic.com/v1/organizations/cost_report?starting_at=${startingAt}&bucket_width=1d`,
      headers,
      timeoutMs: 15_000,
    }),
  ]);

  const emptyAnthropicSummary = (error: string): AiUsageSummary => ({
    days: [], totalInput: 0, totalOutput: 0, totalCacheRead: 0, totalCacheCreation: 0,
    totalCostUsd: null, error,
  });

  // Check auth on usage (primary)
  if (usageRes.status === 'fulfilled') {
    const r = usageRes.value;
    if (r.status === 401 || r.status === 403) {
      return emptyAnthropicSummary(authErrorMsg('Anthropic'));
    }
    if (!r.ok) {
      return emptyAnthropicSummary(`Anthropic usage ${r.status}: ${r.body.slice(0, 200)}`);
    }
  } else {
    return emptyAnthropicSummary(`Network error: ${String(usageRes.reason)}`);
  }

  const usageData = parseJson<{ data?: AnthropicBucket[] }>(usageRes.value)?.data ?? [];

  // Cost buckets (may fail — optional)
  const costBuckets: AnthropicCostBucket[] =
    costRes.status === 'fulfilled' && costRes.value.ok
      ? (parseJson<{ data?: AnthropicCostBucket[] }>(costRes.value)?.data ?? [])
      : [];

  // Build cost lookup by date
  const costByDate = new Map<string, number>();
  for (const bucket of costBuckets) {
    const date = (bucket.starting_at as string | undefined)?.slice(0, 10) ?? '';
    if (!date) continue;
    const cost = bucket.results ? sumAnthropicCost(bucket.results) : 0;
    costByDate.set(date, (costByDate.get(date) ?? 0) + cost);
  }

  const hasCosts = costBuckets.length > 0;

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
        costUsd: hasCosts ? (costByDate.get(date) ?? 0) : null,
      };
    })
    .filter((d) => d.date !== '')
    .sort((a, b) => a.date.localeCompare(b.date));

  const totalInput = days.reduce((s, d) => s + d.inputTokens, 0);
  const totalOutput = days.reduce((s, d) => s + d.outputTokens, 0);
  const totalCacheRead = days.reduce((s, d) => s + d.cacheReadTokens, 0);
  const totalCacheCreation = days.reduce((s, d) => s + d.cacheCreationTokens, 0);
  const totalCostUsd = hasCosts
    ? days.reduce((s, d) => s + (d.costUsd ?? 0), 0)
    : null;

  return { days, totalInput, totalOutput, totalCacheRead, totalCacheCreation, totalCostUsd, error: null };
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

  const [usageRes, costRes] = await Promise.allSettled([
    httpRequest({
      method: 'GET',
      url: `https://api.openai.com/v1/organization/usage/completions?start_time=${startTime}&bucket_width=1d&limit=31`,
      headers,
      timeoutMs: 15_000,
    }),
    httpRequest({
      method: 'GET',
      url: `https://api.openai.com/v1/organization/costs?start_time=${startTime}&limit=31`,
      headers,
      timeoutMs: 15_000,
    }),
  ]);

  const emptyOpenAiSummary = (error: string): AiUsageSummary => ({
    days: [], totalInput: 0, totalOutput: 0, totalCacheRead: 0, totalCacheCreation: 0,
    totalCostUsd: null, error,
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

  const costBuckets: OpenAiCostBucket[] =
    costRes.status === 'fulfilled' && costRes.value.ok
      ? (parseJson<{ data?: OpenAiCostBucket[] }>(costRes.value)?.data ?? [])
      : [];

  const costByDate = new Map<string, number>();
  for (const bucket of costBuckets) {
    if (typeof bucket.start_time !== 'number') continue;
    const date = unixToDateStr(bucket.start_time);
    const cost = bucket.results ? sumOpenAiCost(bucket.results) : 0;
    costByDate.set(date, (costByDate.get(date) ?? 0) + cost);
  }

  const hasCosts = costBuckets.length > 0;

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
        costUsd: hasCosts ? (costByDate.get(date) ?? 0) : null,
      };
    })
    .filter((d) => d.date !== '')
    .sort((a, b) => a.date.localeCompare(b.date));

  const totalInput = days.reduce((s, d) => s + d.inputTokens, 0);
  const totalOutput = days.reduce((s, d) => s + d.outputTokens, 0);
  const totalCostUsd = hasCosts
    ? days.reduce((s, d) => s + (d.costUsd ?? 0), 0)
    : null;

  return { days, totalInput, totalOutput, totalCacheRead: 0, totalCacheCreation: 0, totalCostUsd, error: null };
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
