import { getDb } from './db';
import type { HealthState } from '../types';
import type { HealthCheckResult } from './health';

// ── Types ────────────────────────────────────────────────────────────────────

export interface HealthSample {
  checkedAt: string;
  health: HealthState;
  latencyMs: number | null;
  httpStatus: number | null;
  error: string | null;
}

export interface Incident {
  id: number;
  projectId: number;
  startedAt: string;
  endedAt: string | null;
  severity: 'warning' | 'critical';
  firstError: string | null;
  checksCount: number;
}

interface SampleRow {
  checked_at: string;
  health: string;
  latency_ms: number | null;
  http_status: number | null;
  error: string | null;
}

interface IncidentRow {
  id: number;
  project_id: number;
  started_at: string;
  ended_at: string | null;
  severity: string;
  first_error: string | null;
  checks_count: number;
}

const RETENTION_DAYS = 30;

/** What the incident state machine did with this sample. */
export type IncidentTransition =
  | { kind: 'opened'; severity: 'warning' | 'critical'; error: string | null }
  | { kind: 'closed'; severity: 'warning' | 'critical'; durationMs: number }
  | null;

// ── Recording ────────────────────────────────────────────────────────────────

/**
 * Persist one health check sample and maintain incident state:
 * a warning/critical check opens an incident (or escalates an open one),
 * the first healthy check closes it. 'unknown' checks are recorded but do
 * not affect incidents (no endpoint configured / not reachable conclusively).
 * Returns the transition so callers can dispatch notifications.
 */
export async function recordHealthCheck(
  projectId: number,
  result: Pick<HealthCheckResult, 'health' | 'latencyMs' | 'httpStatus' | 'error'>,
  checkedAt: string,
): Promise<IncidentTransition> {
  const db = await getDb();

  await db.execute(
    `INSERT INTO health_history (project_id, checked_at, health, latency_ms, http_status, error)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [projectId, checkedAt, result.health, result.latencyMs, result.httpStatus, result.error],
  );

  // Retention: keep a rolling window per project.
  await db.execute(
    `DELETE FROM health_history
     WHERE project_id = $1 AND checked_at < datetime('now', '-${RETENTION_DAYS} days')`,
    [projectId],
  );

  const open = await getOpenIncident(projectId);

  // Note: incidents persist across app restarts. If the app was closed during
  // an outage, a recovery+new failure that happened while closed merges into
  // one incident — an inherent limitation of poll-based detection.
  if (result.health === 'warning' || result.health === 'critical') {
    if (open) {
      const severity =
        open.severity === 'critical' || result.health === 'critical' ? 'critical' : 'warning';
      await db.execute(
        'UPDATE incidents SET severity = $1, checks_count = checks_count + 1 WHERE id = $2',
        [severity, open.id],
      );
      return null; // escalation/continuation — no separate notification
    }
    await db.execute(
      `INSERT INTO incidents (project_id, started_at, severity, first_error)
       VALUES ($1, $2, $3, $4)`,
      [projectId, checkedAt, result.health, result.error],
    );
    return { kind: 'opened', severity: result.health, error: result.error };
  }

  if (result.health === 'healthy' && open) {
    await db.execute('UPDATE incidents SET ended_at = $1 WHERE id = $2', [checkedAt, open.id]);
    const durationMs =
      new Date(checkedAt).getTime() - new Date(open.startedAt).getTime();
    return { kind: 'closed', severity: open.severity, durationMs };
  }

  return null;
}

/**
 * Close any open incident without recording a sample — used when health
 * monitoring stops for a project (endpoint removed) so the incident does not
 * stay "ongoing" forever.
 */
export async function closeOpenIncident(projectId: number, atIso: string): Promise<void> {
  const db = await getDb();
  await db.execute(
    'UPDATE incidents SET ended_at = $1 WHERE project_id = $2 AND ended_at IS NULL',
    [atIso, projectId],
  );
}

export async function getOpenIncident(projectId: number): Promise<Incident | null> {
  const db = await getDb();
  const rows = await db.select<IncidentRow[]>(
    `SELECT * FROM incidents
     WHERE project_id = $1 AND ended_at IS NULL
     ORDER BY started_at DESC LIMIT 1`,
    [projectId],
  );
  return rows.length > 0 ? mapIncident(rows[0]) : null;
}

/** Remove all history + incidents for a deleted project. */
export async function deleteProjectHistory(projectId: number): Promise<void> {
  const db = await getDb();
  await db.execute('DELETE FROM health_history WHERE project_id = $1', [projectId]);
  await db.execute('DELETE FROM incidents WHERE project_id = $1', [projectId]);
}

// ── Queries ──────────────────────────────────────────────────────────────────

/** Samples since the given ISO timestamp, oldest first. */
export async function getHealthHistory(
  projectId: number,
  sinceIso: string,
): Promise<HealthSample[]> {
  const db = await getDb();
  const rows = await db.select<SampleRow[]>(
    `SELECT checked_at, health, latency_ms, http_status, error
     FROM health_history
     WHERE project_id = $1 AND checked_at >= $2
     ORDER BY checked_at ASC`,
    [projectId, sinceIso],
  );
  return rows.map(mapSample);
}

/** Last N samples, oldest first (for the tick strip). */
export async function getRecentChecks(projectId: number, limit: number): Promise<HealthSample[]> {
  const db = await getDb();
  const rows = await db.select<SampleRow[]>(
    `SELECT checked_at, health, latency_ms, http_status, error
     FROM health_history
     WHERE project_id = $1
     ORDER BY checked_at DESC LIMIT $2`,
    [projectId, limit],
  );
  return rows.map(mapSample).reverse();
}

/** Most recent incidents, newest first. Ongoing incident (if any) comes first. */
export async function getIncidents(projectId: number, limit = 20): Promise<Incident[]> {
  const db = await getDb();
  const rows = await db.select<IncidentRow[]>(
    `SELECT * FROM incidents
     WHERE project_id = $1
     ORDER BY (ended_at IS NULL) DESC, started_at DESC
     LIMIT $2`,
    [projectId, limit],
  );
  return rows.map(mapIncident);
}

// ── Derived metrics ──────────────────────────────────────────────────────────

export interface UptimeStats {
  healthy: number;
  /** Conclusive checks (unknown excluded). */
  counted: number;
}

/**
 * Aggregate uptime counters since the given ISO timestamp, computed in SQL so
 * large histories are never transferred over IPC just to be counted.
 */
export async function getUptimeStats(projectId: number, sinceIso: string): Promise<UptimeStats> {
  const db = await getDb();
  const rows = await db.select<Array<{ healthy: number | null; counted: number | null }>>(
    `SELECT
       SUM(CASE WHEN health = 'healthy' THEN 1 ELSE 0 END) AS healthy,
       SUM(CASE WHEN health != 'unknown' THEN 1 ELSE 0 END) AS counted
     FROM health_history
     WHERE project_id = $1 AND checked_at >= $2`,
    [projectId, sinceIso],
  );
  return { healthy: rows[0]?.healthy ?? 0, counted: rows[0]?.counted ?? 0 };
}

/** Uptime percentage from aggregate counters; null when nothing to count. */
export function uptimePct(stats: UptimeStats): number | null {
  if (stats.counted === 0) return null;
  return (stats.healthy / stats.counted) * 100;
}

/** Mean time to recovery over closed incidents, in milliseconds. Null when none. */
export function computeMttrMs(incidents: Incident[]): number | null {
  const closed = incidents.filter(i => i.endedAt !== null);
  if (closed.length === 0) return null;
  const total = closed.reduce(
    (sum, i) => sum + (new Date(i.endedAt as string).getTime() - new Date(i.startedAt).getTime()),
    0,
  );
  return total / closed.length;
}

// ── Row mapping ──────────────────────────────────────────────────────────────

function mapSample(row: SampleRow): HealthSample {
  return {
    checkedAt: row.checked_at,
    health: row.health as HealthState,
    latencyMs: row.latency_ms,
    httpStatus: row.http_status,
    error: row.error,
  };
}

function mapIncident(row: IncidentRow): Incident {
  return {
    id: row.id,
    projectId: row.project_id,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    severity: row.severity as Incident['severity'],
    firstError: row.first_error,
    checksCount: row.checks_count,
  };
}
