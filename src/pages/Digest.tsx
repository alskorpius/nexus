import { useState, useEffect, useRef, useCallback } from 'react';
import { useStore } from '../state/store';
import { fetchGitDigest } from '../adapters/git';
import type { GitDigest } from '../adapters/git';
import { useI18n } from '../lib/i18n';
import { timeAgo } from '../lib/format';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type DigestPeriod = 7 | 14 | 30;

const PERIOD_OPTIONS: DigestPeriod[] = [7, 14, 30];

type ProjectResult =
  | { kind: 'ok'; digest: GitDigest }
  | { kind: 'error'; projectName: string; message: string };

// ---------------------------------------------------------------------------
// Period switcher
// ---------------------------------------------------------------------------

interface PeriodSwitcherProps {
  value: DigestPeriod;
  onChange: (p: DigestPeriod) => void;
}

function DigestPeriodSwitcher({ value, onChange }: PeriodSwitcherProps) {
  const { t } = useI18n();
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {PERIOD_OPTIONS.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          style={{
            fontSize: 11,
            padding: '3px 7px',
            borderRadius: 4,
            border: '1px solid var(--border, #3a3a4a)',
            background: value === p ? 'var(--accent, #4f8ef7)' : 'transparent',
            color: value === p ? '#fff' : 'var(--text-muted)',
            cursor: 'pointer',
            fontWeight: value === p ? 600 : 400,
            lineHeight: 1.4,
            transition: 'background 0.15s, color 0.15s',
          }}
        >
          {t(`digest.period.${p}d`)}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Provider badge
// ---------------------------------------------------------------------------

function ProviderBadge({ provider }: { provider: 'github' | 'gitlab' }) {
  const label = provider === 'github' ? 'GitHub' : 'GitLab';
  const bg = provider === 'github' ? '#24292e' : '#e24329';
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: 4,
        fontSize: 11,
        fontWeight: 600,
        background: bg,
        color: '#fff',
        letterSpacing: '0.01em',
      }}
    >
      {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Per-project card
// ---------------------------------------------------------------------------

interface ProjectCardProps {
  result: ProjectResult;
}

function ProjectCard({ result }: ProjectCardProps) {
  const { t } = useI18n();

  if (result.kind === 'error') {
    return (
      <div className="card" style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span style={{ fontWeight: 600 }}>{result.projectName}</span>
        </div>
        <p style={{ color: 'var(--error, #ef4444)', fontSize: 13, margin: 0 }}>
          {t('digest.project.errorPrefix')}{result.message}
        </p>
      </div>
    );
  }

  const d = result.digest;
  const commitLabel = `${d.commitCount}${d.commitsTruncated ? '+' : ''}`;
  const mergedLabel = `${d.mergedMrCount}${d.mergedTruncated ? '+' : ''}`;
  const failedLabel = d.failedPipelineCount !== null ? String(d.failedPipelineCount) : '—';
  const authorsLine = d.authors.map((a) => `${a.name} (${a.commits})`).join(', ');

  return (
    <div className="card" style={{ padding: '14px 16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontWeight: 600, fontSize: 14 }}>{d.projectName}</span>
        <ProviderBadge provider={d.provider} />
      </div>

      {/* Stats line */}
      <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, flexWrap: 'wrap' }}>
        <span>
          <strong style={{ color: 'var(--text)' }}>{commitLabel}</strong>{' '}
          {t('digest.project.commits')}
        </span>
        <span>
          <strong style={{ color: 'var(--text)' }}>{mergedLabel}</strong>{' '}
          {t('digest.project.merged')}
        </span>
        <span>
          <strong style={{ color: 'var(--text)' }}>{d.openMrCount}</strong>{' '}
          {t('digest.project.open')}
        </span>
        <span>
          <strong style={{ color: 'var(--text)' }}>{failedLabel}</strong>{' '}
          {t('digest.project.failed')}
        </span>
      </div>

      {/* Top authors */}
      {d.authors.length > 0 && (
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
          <span style={{ fontWeight: 600, color: 'var(--text)' }}>{t('digest.project.topAuthors')}: </span>
          {authorsLine}
        </div>
      )}

      {/* Two-column lists */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 4 }}>
        {/* Recent commits */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>
            {t('digest.project.recentCommits')}
          </div>
          {d.recentCommits.length === 0 ? (
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
              {t('digest.project.noCommits')}
            </p>
          ) : (
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {d.recentCommits.map(c => (
                <li key={c.webUrl} style={{ fontSize: 12 }}>
                  <a
                    href={c.webUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: 'var(--accent, #4f8ef7)', textDecoration: 'none', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    title={c.message}
                  >
                    {c.message}
                  </a>
                  <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                    {c.author} · {timeAgo(c.date)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Merged MRs */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>
            {t('digest.project.mergedMrs')}
          </div>
          {d.mergedMrs.length === 0 ? (
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
              {t('digest.project.noMrs')}
            </p>
          ) : (
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {d.mergedMrs.map(mr => (
                <li key={mr.webUrl} style={{ fontSize: 12 }}>
                  <a
                    href={mr.webUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: 'var(--accent, #4f8ef7)', textDecoration: 'none', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    title={mr.title}
                  >
                    {mr.title}
                  </a>
                  <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                    {mr.author} · {timeAgo(mr.updatedAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export function Digest() {
  const { projects } = useStore();
  const { t } = useI18n();

  const [period, setPeriod] = useState<DigestPeriod>(7);
  const [results, setResults] = useState<ProjectResult[]>([]);
  const [loading, setLoading] = useState(false);
  const mountedRef = useRef(true);

  const gitProjects = projects.filter((p) => p.gitProvider !== 'none');

  const load = useCallback(
    async (days: DigestPeriod) => {
      if (gitProjects.length === 0) return;
      setLoading(true);
      const sinceIso = new Date(Date.now() - days * 86_400_000).toISOString();
      const settled = await Promise.allSettled(
        gitProjects.map((p) => fetchGitDigest(p, sinceIso)),
      );
      if (!mountedRef.current) return;

      const next: ProjectResult[] = [];
      for (let i = 0; i < settled.length; i++) {
        const res = settled[i];
        const proj = gitProjects[i];
        if (res.status === 'rejected') {
          next.push({
            kind: 'error',
            projectName: proj.name,
            message: res.reason instanceof Error ? res.reason.message : String(res.reason),
          });
        } else if (res.value !== null) {
          next.push({ kind: 'ok', digest: res.value });
        }
        // fulfilled + null → skip (no git configured, shouldn't happen since we filter above)
      }

      // Sort by commitCount descending
      next.sort((a, b) => {
        const ca = a.kind === 'ok' ? a.digest.commitCount : -1;
        const cb = b.kind === 'ok' ? b.digest.commitCount : -1;
        return cb - ca;
      });

      setResults(next);
      setLoading(false);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [gitProjects.map((p) => p.id).join(',')],
  );

  useEffect(() => {
    mountedRef.current = true;
    load(period);
    return () => {
      mountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, gitProjects.map((p) => p.id).join(',')]);

  const handlePeriodChange = (p: DigestPeriod) => {
    setPeriod(p);
  };

  // Totals
  const okResults = results.filter((r): r is Extract<ProjectResult, { kind: 'ok' }> => r.kind === 'ok');
  const anyTruncated = okResults.some((r) => r.digest.commitsTruncated);
  const totalCommits = okResults.reduce((s, r) => s + r.digest.commitCount, 0);
  const totalCommitsLabel = `${totalCommits}${anyTruncated ? '+' : ''}`;
  const anyMergedTruncated = okResults.some((r) => r.digest.mergedTruncated);
  const totalMerged = okResults.reduce((s, r) => s + r.digest.mergedMrCount, 0);
  const totalMergedLabel = `${totalMerged}${anyMergedTruncated ? '+' : ''}`;
  const totalOpen = okResults.reduce((s, r) => s + r.digest.openMrCount, 0);

  const failedResultsWithData = okResults.filter((r) => r.digest.failedPipelineCount !== null);
  const totalFailed = failedResultsWithData.length > 0
    ? failedResultsWithData.reduce((s, r) => s + (r.digest.failedPipelineCount ?? 0), 0)
    : null;
  const totalFailedLabel = totalFailed !== null ? String(totalFailed) : '—';

  const mostActive = okResults.length > 0
    ? okResults.reduce((best, r) => (r.digest.commitCount > best.digest.commitCount ? r : best)).digest.projectName
    : '—';

  // No git projects at all
  if (gitProjects.length === 0) {
    return (
      <div className="page page--empty">
        <div className="empty-state">
          <div className="empty-state__icon">⎇</div>
          <p className="empty-state__body">{t('digest.empty.noGit')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page__header">
        <h1 className="page__title">{t('digest.title')}</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <DigestPeriodSwitcher value={period} onChange={handlePeriodChange} />
          <button
            className="btn btn--ghost btn--icon-label"
            onClick={() => load(period)}
            disabled={loading}
          >
            <span className={`btn__icon${loading ? ' btn__icon--spin' : ''}`}>↻</span>
            {t('digest.refresh')}
          </button>
        </div>
      </div>

      {loading && results.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 24 }}>{t('digest.loading')}</p>
      ) : (
        <>
          {/* Totals row */}
          <div className="stat-grid">
            <div className="stat-card">
              <span className="stat-card__label">{t('digest.totals.commits')}</span>
              <span className="stat-card__value">{totalCommitsLabel}</span>
            </div>
            <div className="stat-card">
              <span className="stat-card__label">{t('digest.totals.mergedMrs')}</span>
              <span className="stat-card__value">{totalMergedLabel}</span>
            </div>
            <div className="stat-card">
              <span className="stat-card__label">{t('digest.totals.openMrs')}</span>
              <span className="stat-card__value">{totalOpen}</span>
            </div>
            <div className={`stat-card${totalFailed !== null && totalFailed > 0 ? ' stat-card--critical' : ''}`}>
              <span className="stat-card__label">{t('digest.totals.failedPipelines')}</span>
              <span className="stat-card__value">{totalFailedLabel}</span>
            </div>
            <div className="stat-card" style={{ gridColumn: 'span 2' }}>
              <span className="stat-card__label">{t('digest.totals.mostActive')}</span>
              <span
                className="stat-card__value"
                style={{ fontSize: 16, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              >
                {mostActive}
              </span>
            </div>
          </div>

          {/* Per-project cards */}
          <div className="section">
            {results.map((r, i) => (
              <ProjectCard key={r.kind === 'ok' ? r.digest.projectId : `err-${i}`} result={r} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
