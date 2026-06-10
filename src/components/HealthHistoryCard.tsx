import { useEffect, useState } from 'react';
import { getRecentChecks, getUptimeStats, uptimePct, getIncidents, computeMttrMs } from '../lib/history';
import type { HealthSample, Incident } from '../lib/history';
import { useI18n, getLocale } from '../lib/i18n';

interface HealthHistoryCardProps {
  projectId: number;
  /** Pass status.checkedAt so the card reloads after each poll cycle. */
  checkedAt: string | null | undefined;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function sinceIso(days: number): string {
  const d = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return d.toISOString();
}

function formatPct(v: number | null): string {
  if (v === null) return '—';
  return v.toFixed(1) + '%';
}

/** Humanize a duration in ms → e.g. "3m", "1h 22m", "2d 4h" */
function humanizeMs(ms: number, t: (k: string, p?: Record<string, string | number>) => string): string {
  if (!Number.isFinite(ms) || ms < 0) return '—';
  const totalSec = Math.round(ms / 1000);
  const totalMin = Math.round(totalSec / 60);
  if (totalMin < 1) return '< 1' + t('detail.history.unit.m');
  if (totalMin < 60) return totalMin + t('detail.history.unit.m');
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h < 24) return m > 0 ? `${h}${t('detail.history.unit.h')} ${m}${t('detail.history.unit.m')}` : `${h}${t('detail.history.unit.h')}`;
  const d = Math.floor(h / 24);
  const rh = h % 24;
  return rh > 0 ? `${d}${t('detail.history.unit.d')} ${rh}${t('detail.history.unit.h')}` : `${d}${t('detail.history.unit.d')}`;
}

function tickColor(health: HealthSample['health']): string {
  switch (health) {
    case 'healthy': return 'var(--healthy)';
    case 'warning': return 'var(--warning)';
    case 'critical': return 'var(--critical)';
    default: return 'var(--unknown)';
  }
}

function formatSampleTooltip(
  sample: HealthSample,
  t: (k: string, p?: Record<string, string | number>) => string,
): string {
  const locale = getLocale();
  const time = new Date(sample.checkedAt).toLocaleString(locale, {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
  const status = t(`common.health.${sample.health}`);
  const latency = sample.latencyMs !== null ? `${sample.latencyMs} ms` : '—';
  const tooltip = `${time} · ${latency} · ${status}`;
  return sample.error ? `${sample.error}\n${tooltip}` : tooltip;
}

function formatIncidentStart(iso: string): string {
  return new Date(iso).toLocaleString(getLocale(), {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function incidentDurationMs(incident: Incident): number {
  const end = incident.endedAt ? new Date(incident.endedAt).getTime() : Date.now();
  return end - new Date(incident.startedAt).getTime();
}

// ── Component ─────────────────────────────────────────────────────────────────

export function HealthHistoryCard({ projectId, checkedAt }: HealthHistoryCardProps) {
  const { t } = useI18n();

  const [ticks, setTicks] = useState<HealthSample[]>([]);
  const [uptimes, setUptimes] = useState<[number | null, number | null, number | null]>([null, null, null]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.all([
      getRecentChecks(projectId, 60),
      getUptimeStats(projectId, sinceIso(1)),
      getUptimeStats(projectId, sinceIso(7)),
      getUptimeStats(projectId, sinceIso(30)),
      getIncidents(projectId, 10),
    ])
      .then(([t, u24, u7, u30, i]) => {
        if (cancelled) return;
        setTicks(t);
        setUptimes([uptimePct(u24), uptimePct(u7), uptimePct(u30)]);
        setIncidents(i);
      })
      .catch(err => {
        if (cancelled) return;
        console.warn('[HealthHistoryCard] load error', err);
        setTicks([]);
        setUptimes([null, null, null]);
        setIncidents([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [projectId, checkedAt]);

  const [uptime24, uptime7, uptime30] = uptimes;

  const closedIncidents = incidents.filter(i => i.endedAt !== null);
  const mttrMs = computeMttrMs(closedIncidents);

  const hasData = ticks.length > 0 || uptime30 !== null || incidents.length > 0;

  return (
    <div className="card health-history-card">
      {/* Title */}
      <h3 className="card__subtitle">{t('detail.history.title')}</h3>

      {loading ? (
        <p className="muted" style={{ fontSize: 12 }}>{t('detail.history.loading')}</p>
      ) : !hasData ? (
        /* Empty state */
        <p className="muted" style={{ fontSize: 12 }}>{t('detail.history.collecting')}</p>
      ) : (
        <>
          {/* Tick strip */}
          {ticks.length > 0 && (
            <div className="history-ticks" aria-label={t('detail.history.ticksLabel')}>
              {ticks.map(s => (
                <span
                  key={s.checkedAt}
                  className="history-tick"
                  title={formatSampleTooltip(s, t)}
                  style={{ background: tickColor(s.health) }}
                />
              ))}
            </div>
          )}

          {/* Uptime row */}
          <div className="history-uptime-row">
            <span className="history-uptime-item">
              <span className="history-uptime-label">{t('detail.history.uptime24h')}</span>
              <span className="history-uptime-value">{formatPct(uptime24)}</span>
            </span>
            <span className="history-uptime-sep" />
            <span className="history-uptime-item">
              <span className="history-uptime-label">{t('detail.history.uptime7d')}</span>
              <span className="history-uptime-value">{formatPct(uptime7)}</span>
            </span>
            <span className="history-uptime-sep" />
            <span className="history-uptime-item">
              <span className="history-uptime-label">{t('detail.history.uptime30d')}</span>
              <span className="history-uptime-value">{formatPct(uptime30)}</span>
            </span>
          </div>

          {/* Incidents */}
          <div className="history-incidents">
            <p className="history-incidents__heading">{t('detail.history.incidents')}</p>

            {incidents.length === 0 ? (
              <p className="muted" style={{ fontSize: 12 }}>{t('detail.history.noIncidents')}</p>
            ) : (
              <div className="history-incident-list">
                {incidents.map(inc => (
                  <div key={inc.id} className="history-incident-row">
                    {/* Severity dot */}
                    <span
                      className="history-incident__dot"
                      style={{ background: inc.severity === 'critical' ? 'var(--critical)' : 'var(--warning)' }}
                    />

                    <div className="history-incident__body">
                      {/* Start time + duration */}
                      <div className="history-incident__meta">
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                          {formatIncidentStart(inc.startedAt)}
                        </span>
                        <span className="muted" style={{ fontSize: 12 }}>
                          {inc.endedAt === null ? (
                            <span className="history-ongoing-badge">{t('detail.history.ongoing')}</span>
                          ) : (
                            humanizeMs(incidentDurationMs(inc), t)
                          )}
                        </span>
                      </div>

                      {/* First error */}
                      {inc.firstError && (
                        <span
                          className="history-incident__error muted"
                          title={inc.firstError}
                        >
                          {inc.firstError.length > 80
                            ? inc.firstError.slice(0, 80) + '…'
                            : inc.firstError}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* MTTR */}
            {mttrMs !== null && (
              <p className="muted history-mttr">
                {t('detail.history.mttr', { duration: humanizeMs(mttrMs, t) })}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
