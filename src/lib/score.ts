import type { ProjectStatus } from '../types';

export interface ScoreFactor {
  label: string;
  delta: number;
}

export interface HealthScore {
  score: number;
  factors: ScoreFactor[];
}

/**
 * Compute a 0–100 health score for a project status.
 *
 * Scoring formula (start at 100, subtract penalties, clamp to [0, 100]):
 *   Health state:
 *     warning  → −20
 *     critical → −50
 *     unknown  → −30
 *   SSL:
 *     expired or < 7 days left  → −25
 *     7–29 days left            → −10
 *   Failed pipelines (capped at −20 total):
 *     each failed pipeline      → −10
 *   Open tickets:
 *     > 5 open tickets          → −10
 */
export function computeHealthScore(status: ProjectStatus): HealthScore {
  const factors: ScoreFactor[] = [];
  let score = 100;

  // ── Health state ──────────────────────────────────────────────────────────
  if (status.health === 'warning') {
    factors.push({ label: 'Health warning', delta: -20 });
    score -= 20;
  } else if (status.health === 'critical') {
    factors.push({ label: 'Health critical', delta: -50 });
    score -= 50;
  } else if (status.health === 'unknown') {
    factors.push({ label: 'Health unknown', delta: -30 });
    score -= 30;
  }

  // ── SSL certificate ───────────────────────────────────────────────────────
  if (status.ssl) {
    const { daysLeft, error } = status.ssl;
    if (error && !daysLeft) {
      // SSL error but no expiry info — treat as expired/critical
      factors.push({ label: 'SSL error', delta: -25 });
      score -= 25;
    } else if (daysLeft !== null) {
      if (daysLeft < 7) {
        factors.push({ label: 'SSL expiring critically (<7 days)', delta: -25 });
        score -= 25;
      } else if (daysLeft < 30) {
        factors.push({ label: 'SSL expiring soon (<30 days)', delta: -10 });
        score -= 10;
      }
    }
  }

  // ── Failed pipelines (cap penalty at −20) ────────────────────────────────
  const failedPipelines = status.git?.failedPipelines ?? 0;
  if (failedPipelines > 0) {
    const penalty = Math.min(failedPipelines * 10, 20);
    factors.push({ label: `${failedPipelines} failed pipeline${failedPipelines > 1 ? 's' : ''}`, delta: -penalty });
    score -= penalty;
  }

  // ── Open tickets ─────────────────────────────────────────────────────────
  const openTickets = (status.tickets ?? []).filter(
    t => t.status === 'pending' || t.status === 'in_progress',
  ).length;
  if (openTickets > 5) {
    factors.push({ label: `${openTickets} open tickets`, delta: -10 });
    score -= 10;
  }

  // ── Clamp ─────────────────────────────────────────────────────────────────
  score = Math.max(0, Math.min(100, score));

  return { score, factors };
}

/**
 * Map a health score to a CSS variable name.
 *   ≥ 70 → '--healthy'
 *   ≥ 40 → '--warning'
 *   < 40 → '--critical'
 */
export function scoreColor(score: number): string {
  if (score >= 70) return '--healthy';
  if (score >= 40) return '--warning';
  return '--critical';
}

/**
 * Map a health score to a human-readable label.
 *   ≥ 90 → 'Excellent'
 *   ≥ 70 → 'Good'
 *   ≥ 40 → 'Fair'
 *   < 40 → 'Poor'
 */
export function scoreLabel(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Poor';
}

/**
 * Map a health score to an i18n key (common namespace).
 *   ≥ 90 → 'common.score.excellent'
 *   ≥ 70 → 'common.score.good'
 *   ≥ 40 → 'common.score.fair'
 *   < 40 → 'common.score.poor'
 */
export function scoreLabelKey(score: number): string {
  if (score >= 90) return 'common.score.excellent';
  if (score >= 70) return 'common.score.good';
  if (score >= 40) return 'common.score.fair';
  return 'common.score.poor';
}
