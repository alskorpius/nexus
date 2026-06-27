import type { DepsReport, DepStatus } from '../adapters/deps';
import { useI18n } from '../lib/i18n';

interface DepsReportViewProps {
  report: DepsReport;
}

const OUTDATED_CAP = 20;

function stalenessBadgeClass(s: DepStatus['staleness']): string {
  switch (s) {
    case 'major':   return 'badge badge--red';
    case 'minor':   return 'badge badge--amber';
    case 'patch':   return 'badge badge--blue';
    case 'current': return 'badge badge--green';
    default:        return 'badge badge--muted';
  }
}

/**
 * Presentational render of a dependency report: summary chips, vulnerable
 * packages, and outdated packages. Shared by DependenciesCard (per-project
 * repo scan) and the Utilities page (pasted manifest). i18n keys live under
 * the `detail.deps.*` namespace.
 */
export function DepsReportView({ report }: DepsReportViewProps) {
  const { t } = useI18n();

  const multiSource = report.manifests.length > 1;

  const vulnerable = report.deps.filter(d => d.vulns.length > 0);
  const outdated = report.deps
    .filter(d => d.staleness === 'major' || d.staleness === 'minor' || d.staleness === 'patch')
    .sort((a, b) => {
      const order: Record<DepStatus['staleness'], number> = { major: 0, minor: 1, patch: 2, current: 3, unknown: 4 };
      return order[a.staleness] - order[b.staleness];
    });
  const outdatedVisible = outdated.slice(0, OUTDATED_CAP);
  const outdatedMore = outdated.length - outdatedVisible.length;

  if (report.manifests.length === 0) {
    return (
      <p className="muted" style={{ fontSize: 13, marginTop: 10 }}>
        {t('detail.deps.noManifests')}
      </p>
    );
  }

  return (
    <>
      {/* Summary chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
        <span className="badge badge--muted">
          {t('detail.deps.summary.total', { n: report.counts.total })}
        </span>
        <span className={`badge ${report.counts.vulnerable > 0 ? 'badge--red' : 'badge--muted'}`}>
          {t('detail.deps.summary.vulnerable', { n: report.counts.vulnerable })}
        </span>
        <span className={`badge ${report.counts.major > 0 ? 'badge--red' : 'badge--muted'}`}>
          {t('detail.deps.summary.major', { n: report.counts.major })}
        </span>
        <span className={`badge ${report.counts.minor > 0 ? 'badge--amber' : 'badge--muted'}`}>
          {t('detail.deps.summary.minor', { n: report.counts.minor })}
        </span>
        <span className="badge badge--blue">
          {t('detail.deps.summary.patch', { n: report.counts.patch })}
        </span>
        <span className="badge badge--green">
          {t('detail.deps.summary.current', { n: report.counts.current })}
        </span>
        <span className="badge badge--muted">
          {t('detail.deps.summary.unknown', { n: report.counts.unknown })}
        </span>
      </div>

      {/* Vulnerable packages */}
      {vulnerable.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--critical)', marginBottom: 6 }}>
            {t('detail.deps.vulnTitle')}
          </p>
          <div className="git-list">
            {vulnerable.map(dep => (
              <div key={`${dep.source}:${dep.ecosystem}:${dep.name}`} className="git-list__item" style={{ flexWrap: 'wrap', gap: 4 }}>
                <div className="git-list__main" style={{ flexWrap: 'wrap', gap: 4 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--critical)' }}>
                    {dep.name}
                  </span>
                  <span className="badge badge--muted" style={{ fontSize: 10 }}>{dep.ecosystem}</span>
                  {dep.specVersion && (
                    <span className="muted" style={{ fontSize: 12 }}>{dep.specVersion}</span>
                  )}
                  {multiSource && dep.source && (
                    <span className="muted" style={{ fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                      {dep.source}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 2 }}>
                  {dep.vulns.map(v => (
                    <a
                      key={v.id}
                      href={v.url}
                      target="_blank"
                      rel="noreferrer"
                      className="badge badge--red"
                      style={{ textDecoration: 'none' }}
                      title={v.summary ?? v.id}
                    >
                      {v.id}
                      {v.summary && (
                        <span style={{ marginLeft: 4, fontWeight: 400, opacity: 0.85 }}>
                          — {v.summary.length > 60 ? v.summary.slice(0, 60) + '…' : v.summary}
                        </span>
                      )}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Outdated packages */}
      {outdated.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
            {t('detail.deps.outdatedTitle')}
          </p>
          <div className="git-list">
            {outdatedVisible.map(dep => (
              <div key={`${dep.source}:${dep.ecosystem}:${dep.name}`} className="git-list__item">
                <div className="git-list__main">
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>{dep.name}</span>
                  <span className="muted" style={{ fontSize: 12 }}>
                    {dep.specVersion ?? dep.raw} → {dep.latest ?? '?'}
                  </span>
                  {dep.dev && (
                    <span className="badge badge--muted" style={{ fontSize: 10 }}>
                      {t('detail.deps.devLabel')}
                    </span>
                  )}
                  {multiSource && dep.source && (
                    <span className="muted" style={{ fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                      {dep.source}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                  <span className="badge badge--muted" style={{ fontSize: 10 }}>{dep.ecosystem}</span>
                  <span className={stalenessBadgeClass(dep.staleness)} style={{ fontSize: 10 }}>
                    {t(`detail.deps.staleness.${dep.staleness}`)}
                  </span>
                </div>
              </div>
            ))}
            {outdatedMore > 0 && (
              <p className="muted" style={{ fontSize: 12, paddingTop: 4 }}>
                {t('detail.deps.outdatedMore', { n: outdatedMore })}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
