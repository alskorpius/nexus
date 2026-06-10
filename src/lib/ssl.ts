import { invoke } from '@tauri-apps/api/core';
import type { Project, SslInfo } from '../types';

interface SslCheckResult {
  host: string;
  expires_at: string | null;
  days_left: number | null;
  issuer: string | null;
  error: string | null;
}

/** Extract the hostname from a URL string. Returns null if the URL is invalid. */
function extractHost(url: string): string | null {
  try {
    const parsed = new URL(url.trim());
    return parsed.hostname || null;
  } catch {
    return null;
  }
}

/** Return true if the hostname is local and should not be checked. */
function isLocalHost(hostname: string): boolean {
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1' ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.localhost')
  );
}

/**
 * Check the SSL certificate for the project's primary HTTPS host.
 *
 * URL priority: apiBaseUrl → healthEndpoint (repoUrl is NOT used).
 * Returns null for http://, localhost, 127.0.0.1, or missing URLs.
 */
export async function checkSsl(project: Project): Promise<SslInfo | null> {
  // Find the first HTTPS URL to use
  const candidates = [project.apiBaseUrl, project.healthEndpoint].filter(Boolean);

  let host: string | null = null;
  for (const url of candidates) {
    if (!url) continue;
    const trimmed = url.trim();
    // Only check https:// URLs
    if (!trimmed.toLowerCase().startsWith('https://')) continue;
    const h = extractHost(trimmed);
    if (h && !isLocalHost(h)) {
      host = h;
      break;
    }
  }

  if (!host) return null;

  try {
    const result = await invoke<SslCheckResult>('ssl_check', { host });
    return {
      host: result.host,
      expiresAt: result.expires_at,
      daysLeft: result.days_left,
      issuer: result.issuer,
      error: result.error,
    };
  } catch (err) {
    // If the invoke itself fails (IPC error), return an error SslInfo rather than null
    // so the UI can show the failure instead of silently hiding SSL status.
    return {
      host,
      expiresAt: null,
      daysLeft: null,
      issuer: null,
      error: String(err),
    };
  }
}
