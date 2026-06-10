import { invoke } from '@tauri-apps/api/core';
import type { HttpResponse } from '../types';

export async function httpRequest(opts: {
  method: string;
  url: string;
  headers?: Record<string, string>;
  body?: string;
  timeoutMs?: number;
}): Promise<HttpResponse> {
  try {
    const response = await invoke<HttpResponse>('http_request', {
      method: opts.method,
      url: opts.url,
      headers: opts.headers,
      body: opts.body,
      timeoutMs: opts.timeoutMs,
    });
    return response;
  } catch (e: unknown) {
    const msg = typeof e === 'string' ? e : e instanceof Error ? e.message : String(e);
    throw new Error(`HTTP request failed: ${msg}`);
  }
}

export function parseJson<T>(r: HttpResponse): T | null {
  try {
    return JSON.parse(r.body) as T;
  } catch {
    return null;
  }
}
