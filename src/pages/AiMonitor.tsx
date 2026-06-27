import { useCallback, useEffect, useRef, useState } from 'react';
import {
  fetchAiMonitor,
  type AiAgent,
  type AiMonitorReport,
  type AiSession,
  type SessionStatus,
} from '../lib/aimon';
import { timeAgo } from '../lib/format';
import { useI18n } from '../lib/i18n';

const POLL_MS = 8000;
const PROC_PREVIEW = 8;

// ── small formatters ─────────────────────────────────────────────────────────

function fmtTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function agoFromMs(ms: number): string {
  if (!ms) return '—';
  return timeAgo(new Date(ms).toISOString());
}

function agentBadgeClass(agent: AiAgent): string {
  switch (agent) {
    case 'claude': return 'badge badge--blue';
    case 'codex':  return 'badge badge--green';
    case 'gemini': return 'badge badge--amber';
    default:       return 'badge badge--muted';
  }
}

function statusColor(s: SessionStatus): string {
  switch (s) {
    case 'active': return 'var(--healthy)';
    case 'idle':   return 'var(--warning)';
    default:       return 'var(--unknown)';
  }
}

function ctxColor(pct: number): string {
  if (pct >= 80) return 'var(--critical)';
  if (pct >= 50) return 'var(--warning)';
  return 'var(--healthy)';
}

// ── 14-day activity, derived client-side from the parsed sessions ────────────

interface DayBucket {
  label: string;
  tokens: number;
  sessions: number;
}

function buildActivity(sessions: AiSession[]): DayBucket[] {
  const DAYS = 14;
  const byDay = new Map<string, DayBucket>();
  const now = new Date();
  const keys: string[] = [];
  for (let i = DAYS - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    keys.push(key);
    byDay.set(key, { label: `${d.getMonth() + 1}/${d.getDate()}`, tokens: 0, sessions: 0 });
  }
  for (const s of sessions) {
    if (!s.last_activity_ms) continue;
    const key = new Date(s.last_activity_ms).toISOString().slice(0, 10);
    const bucket = byDay.get(key);
    if (bucket) {
      bucket.tokens += s.total_tokens;
      bucket.sessions += 1;
    }
  }
  return keys.map(k => byDay.get(k)!);
}

// ── page ─────────────────────────────────────────────────────────────────────

export function AiMonitor() {
  const { t } = useI18n();
  const [report, setReport] = useState<AiMonitorReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [onlyActive, setOnlyActive] = useState(false);
  const [projectFilter, setProjectFilter] = useState('');
  const [showAllProcs, setShowAllProcs] = useState(false);
  const cancelled = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetchAiMonitor();
      if (cancelled.current) return;
      setReport(r);
      setError(null);
    } catch (err) {
      if (cancelled.current) return;
      setError(String(err instanceof Error ? err.message : err));
    } finally {
      if (!cancelled.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    cancelled.current = false;
    load();
    return () => { cancelled.current = true; };
  }, [load]);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [paused, load]);

  const sessions = report?.sessions ?? [];
  const processes = report?.processes ?? [];
  const ports = report?.orphan_ports ?? [];
  const activeCount = sessions.filter(s => s.status === 'active').length;
  const recentTokens = sessions.reduce((sum, s) => sum + s.total_tokens, 0);
  const activity = buildActivity(sessions);
  const maxTokens = Math.max(1, ...activity.map(d => d.tokens));

  // Session filters (active-only + project) — applied to the Sessions list only.
  const projectOptions = [...new Set(sessions.map(s => s.project))].sort((a, b) => a.localeCompare(b));
  const filteredSessions = sessions.filter(
    s =>
      (!onlyActive || s.status === 'active') &&
      (projectFilter === '' || s.project === projectFilter),
  );

  return (
    <div className="page">
      <div className="page__header">
        <h1 className="page__title">{t('aimon.title')}</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {report && (
            <span className="muted" style={{ fontSize: 12 }}>
              {t('aimon.updated', { ago: agoFromMs(report.generated_at_ms) })}
            </span>
          )}
          <button
            className="btn btn--ghost btn--sm"
            onClick={() => setPaused(p => !p)}
            title={t('aimon.pollHint')}
          >
            {paused ? t('aimon.resume') : t('aimon.pause')}
          </button>
          <button
            className="btn btn--ghost btn--sm btn--icon-label"
            onClick={load}
            disabled={loading}
          >
            <span className={loading ? 'btn__icon--spin' : ''}>↻</span>
            {t('aimon.refresh')}
          </button>
        </div>
      </div>
      <p className="page__subtitle muted" style={{ marginTop: 4 }}>{t('aimon.subtitle')}</p>

      {error && (
        <p className="text-critical" style={{ fontSize: 13, marginTop: 12 }}>
          {t('aimon.error')} {error}
        </p>
      )}

      {/* Summary stat cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: 'var(--space-3)',
          marginTop: 'var(--space-6)',
        }}
      >
        <StatCard label={t('aimon.stat.active')} value={String(activeCount)} accent="var(--healthy)" />
        <StatCard label={t('aimon.stat.sessions')} value={String(sessions.length)} />
        <StatCard label={t('aimon.stat.tokens')} value={fmtTokens(recentTokens)} />
        <StatCard label={t('aimon.stat.processes')} value={String(processes.length)} />
        <StatCard
          label={t('aimon.stat.ports')}
          value={String(ports.length)}
          accent={ports.length > 0 ? 'var(--warning)' : undefined}
        />
      </div>

      {/* Activity chart */}
      <Section title={t('aimon.section.activity')}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 96 }}>
            {activity.map((d, i) => (
              <div
                key={i}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}
                title={`${d.label}: ${fmtTokens(d.tokens)} tokens · ${d.sessions} ${t('aimon.chart.sessions')}`}
              >
                <div
                  style={{
                    width: '100%',
                    height: `${Math.max(2, (d.tokens / maxTokens) * 72)}px`,
                    background: d.tokens > 0 ? 'var(--accent)' : 'var(--bg-card-hover)',
                    borderRadius: 3,
                    transition: 'height var(--transition)',
                  }}
                />
                <span className="muted" style={{ fontSize: 9, fontFamily: 'var(--font-mono)' }}>{d.label}</span>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Sessions */}
      <Section title={t('aimon.section.sessions')} count={filteredSessions.length}>
        {sessions.length === 0 ? (
          <p className="muted" style={{ fontSize: 13 }}>{t('aimon.empty.sessions')}</p>
        ) : (
          <>
            {/* Filters */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 'var(--space-3)', flexWrap: 'wrap' }}>
              <button
                className={`btn btn--sm ${onlyActive ? 'btn--primary' : 'btn--ghost'}`}
                onClick={() => setOnlyActive(v => !v)}
              >
                ● {t('aimon.filter.onlyActive')}
              </button>
              <select
                className="form-select"
                style={{ width: 'auto', minWidth: 160, fontSize: 12.5, padding: '5px 28px 5px 10px' }}
                value={projectFilter}
                onChange={e => setProjectFilter(e.target.value)}
              >
                <option value="">{t('aimon.filter.allProjects')}</option>
                {projectOptions.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              {(onlyActive || projectFilter !== '') && (
                <button className="btn btn--ghost btn--sm" onClick={() => { setOnlyActive(false); setProjectFilter(''); }}>
                  {t('aimon.filter.clear')}
                </button>
              )}
            </div>

            {filteredSessions.length === 0 ? (
              <p className="muted" style={{ fontSize: 13 }}>{t('aimon.filter.none')}</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {filteredSessions.map(s => <SessionRow key={`${s.agent}:${s.id}`} s={s} />)}
              </div>
            )}
          </>
        )}
      </Section>

      {/* Processes */}
      <Section title={t('aimon.section.processes')} count={processes.length}>
        {processes.length === 0 ? (
          <p className="muted" style={{ fontSize: 13 }}>{t('aimon.empty.processes')}</p>
        ) : (
          <div className="card" style={{ padding: 0 }}>
            <div className="git-list git-list--inset">
              {(showAllProcs ? processes : processes.slice(0, PROC_PREVIEW)).map(p => (
                <div key={p.pid} className="git-list__item" style={{ gap: 12, alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                    <span className={agentBadgeClass(p.agent)} style={{ fontSize: 10, flexShrink: 0 }}>{p.agent}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, flexShrink: 0 }}>{p.name}</span>
                    <span className="muted" style={{ fontSize: 11, fontFamily: 'var(--font-mono)', flexShrink: 0 }}>#{p.pid}</span>
                    {p.cwd && (
                      <span
                        className="muted"
                        title={p.cwd}
                        style={{
                          fontSize: 11,
                          fontFamily: 'var(--font-mono)',
                          minWidth: 0,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {p.cwd}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 12, flexShrink: 0, fontFamily: 'var(--font-mono)' }}>
                    <span className="muted" style={{ fontSize: 12, width: 56, textAlign: 'right' }}>{p.cpu.toFixed(0)}% cpu</span>
                    <span className="muted" style={{ fontSize: 12, width: 60, textAlign: 'right' }}>{p.mem_mb} MB</span>
                  </div>
                </div>
              ))}
            </div>
            {processes.length > PROC_PREVIEW && (
              <button
                className="btn btn--ghost btn--sm"
                style={{ margin: 'var(--space-2) var(--space-3)' }}
                onClick={() => setShowAllProcs(v => !v)}
              >
                {showAllProcs ? t('aimon.showLess') : t('aimon.showMore', { n: processes.length - PROC_PREVIEW })}
              </button>
            )}
          </div>
        )}
      </Section>

      {/* Orphan ports */}
      <Section title={t('aimon.section.ports')} count={ports.length}>
        {ports.length === 0 ? (
          <p className="muted" style={{ fontSize: 13 }}>{t('aimon.empty.ports')}</p>
        ) : (
          <div className="card" style={{ padding: 0 }}>
            <div className="git-list git-list--inset">
              {ports.map(p => (
                <div key={`${p.proto}:${p.port}`} className="git-list__item" style={{ alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                    <span className="badge badge--amber" style={{ fontSize: 11, fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
                      :{p.port}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>{p.process}</span>
                  </div>
                  <span className="muted" style={{ fontSize: 11, fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
                    {p.proto} · pid {p.pid}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Section>

      {report && report.errors.length > 0 && (
        <div style={{ marginTop: 'var(--space-4)' }}>
          {report.errors.map((e, i) => (
            <p key={i} className="muted" style={{ fontSize: 11.5 }}>⚠ {e}</p>
          ))}
        </div>
      )}
    </div>
  );
}

// ── sub-components ────────────────────────────────────────────────────────────

function StatCard({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="card" style={{ padding: 'var(--space-4)' }}>
      <div style={{ fontSize: 24, fontWeight: 600, color: accent ?? 'var(--text)', lineHeight: 1.1 }}>
        {value}
      </div>
      <div className="muted" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 4 }}>
        {label}
      </div>
    </div>
  );
}

function Section({ title, count, children }: { title: string; count?: number; children: React.ReactNode }) {
  return (
    <div className="section" style={{ marginTop: 'var(--space-6)' }}>
      <p className="section__title" style={{ marginBottom: 'var(--space-3)' }}>
        {title}{count != null ? ` · ${count}` : ''}
      </p>
      {children}
    </div>
  );
}

function SessionRow({ s }: { s: AiSession }) {
  const { t } = useI18n();
  const pct = Math.min(100, s.context_pct);
  return (
    <div className="card" style={{ padding: 'var(--space-4)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor(s.status), flexShrink: 0 }} />
        <span className={agentBadgeClass(s.agent)} style={{ fontSize: 10 }}>{s.agent}</span>
        <span style={{ fontWeight: 600, fontSize: 14 }}>{s.project}</span>
        {s.git_branch && (
          <span className="muted" style={{ fontSize: 11, fontFamily: 'var(--font-mono)' }}>⎇ {s.git_branch}</span>
        )}
        {s.model && (
          <span className="badge badge--muted" style={{ fontSize: 10 }}>{s.model}</span>
        )}
        <span className="muted" style={{ fontSize: 12, marginLeft: 'auto' }}>{agoFromMs(s.last_activity_ms)}</span>
      </div>

      {s.title && (
        <p className="muted" style={{ fontSize: 12.5, marginTop: 6, marginBottom: 0 }}>{s.title}</p>
      )}

      {/* Context window bar */}
      <div style={{ marginTop: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
          <span className="muted">{t('aimon.session.context')}</span>
          <span className="muted" style={{ fontFamily: 'var(--font-mono)' }}>
            {fmtTokens(s.context_tokens)} / {fmtTokens(s.context_window)} ({pct.toFixed(0)}%)
          </span>
        </div>
        <div style={{ height: 6, background: 'var(--bg-input)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: ctxColor(pct), transition: 'width var(--transition)' }} />
        </div>
      </div>

      {/* Token breakdown */}
      <div style={{ display: 'flex', gap: 12, marginTop: 10, flexWrap: 'wrap' }}>
        <TokenStat label={t('aimon.session.in')} value={fmtTokens(s.input_tokens)} />
        <TokenStat label={t('aimon.session.out')} value={fmtTokens(s.output_tokens)} />
        <TokenStat label={t('aimon.session.cache')} value={fmtTokens(s.cache_tokens)} />
        <TokenStat label={t('aimon.session.total')} value={fmtTokens(s.total_tokens)} />
        <TokenStat label={t('aimon.session.messages')} value={String(s.message_count)} />
      </div>
    </div>
  );
}

function TokenStat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)' }}>{value}</span>
      <span className="muted" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.03em' }}>{label}</span>
    </div>
  );
}
