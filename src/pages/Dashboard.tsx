import { useStore } from '../state/store';
import { StatusPill } from '../components/StatusPill';
import { ScoreBadge } from '../components/ScoreBadge';
import { timeAgo } from '../lib/format';
import { computeHealthScore } from '../lib/score';
import type { Ticket } from '../types';

function isOpen(t: Ticket) {
  return t.status === 'pending' || t.status === 'in_progress';
}

function isCritical(t: Ticket) {
  return (t.priority === 'critical' || t.priority === 'high') && isOpen(t);
}

export function Dashboard() {
  const { projects, statuses, setNav, refreshAll, refreshProject, refreshing } = useStore();

  if (projects.length === 0) {
    return (
      <div className="page page--empty">
        <div className="empty-state">
          <div className="empty-state__icon">⬡</div>
          <h2 className="empty-state__title">No projects yet</h2>
          <p className="empty-state__body">
            Add your first project to start monitoring services, tickets, and git activity.
          </p>
          <button className="btn btn--primary" onClick={() => setNav({ page: 'projects' })}>
            Go to Projects
          </button>
        </div>
      </div>
    );
  }

  const statusList = Object.values(statuses);
  const healthyCount = statusList.filter(s => s.health === 'healthy').length;
  const warningCount = statusList.filter(s => s.health === 'warning').length;
  const criticalCount = statusList.filter(s => s.health === 'critical').length;

  const allTickets = statusList.flatMap(s => s.tickets ?? []);
  const openTickets = allTickets.filter(isOpen).length;
  const criticalTickets = allTickets.filter(isCritical).length;

  const openMrs = statusList.reduce((acc, s) => acc + (s.git?.openMrCount ?? 0), 0);
  const failedPipelines = statusList.reduce(
    (acc, s) => acc + (s.git?.failedPipelines ?? 0),
    0
  );

  const anyRefreshing = Object.values(refreshing).some(Boolean);

  return (
    <div className="page">
      <div className="page__header">
        <h1 className="page__title">Dashboard</h1>
        <button
          className="btn btn--ghost btn--icon-label"
          onClick={refreshAll}
          disabled={anyRefreshing}
        >
          <span className={`btn__icon${anyRefreshing ? ' btn__icon--spin' : ''}`}>↻</span>
          Refresh all
        </button>
      </div>

      {/* Stat cards */}
      <div className="stat-grid">
        <div className="stat-card">
          <span className="stat-card__label">Projects</span>
          <span className="stat-card__value">{projects.length}</span>
        </div>
        <div className="stat-card stat-card--healthy">
          <span className="stat-card__label">Healthy</span>
          <span className="stat-card__value">{healthyCount}</span>
        </div>
        <div className="stat-card stat-card--warning">
          <span className="stat-card__label">Warning</span>
          <span className="stat-card__value">{warningCount}</span>
        </div>
        <div className="stat-card stat-card--critical">
          <span className="stat-card__label">Critical</span>
          <span className="stat-card__value">{criticalCount}</span>
        </div>
        <div className="stat-card">
          <span className="stat-card__label">Open Tickets</span>
          <span className="stat-card__value">{openTickets}</span>
        </div>
        <div className={`stat-card${criticalTickets > 0 ? ' stat-card--critical' : ''}`}>
          <span className="stat-card__label">Critical Tickets</span>
          <span className="stat-card__value">{criticalTickets}</span>
        </div>
        <div className="stat-card">
          <span className="stat-card__label">Open MRs</span>
          <span className="stat-card__value">{openMrs}</span>
        </div>
        <div className={`stat-card${failedPipelines > 0 ? ' stat-card--critical' : ''}`}>
          <span className="stat-card__label">Failed Pipelines</span>
          <span className="stat-card__value">{failedPipelines}</span>
        </div>
      </div>

      {/* Project rows */}
      <div className="section">
        <h2 className="section__title">Projects</h2>
        <div className="project-list">
          {projects.map(project => {
            const status = statuses[project.id];
            const projectTickets = status?.tickets ?? [];
            const openCount = projectTickets.filter(isOpen).length;
            const mrCount = status?.git?.openMrCount ?? 0;
            const isRefreshing = refreshing[project.id];

            const scoreData = status ? computeHealthScore(status) : null;
            const sslDaysLeft = status?.ssl?.daysLeft ?? null;
            const sslExpiringSoon = sslDaysLeft !== null && sslDaysLeft < 30;

            return (
              <div
                key={project.id}
                className="project-row"
                onClick={() => setNav({ page: 'project', projectId: project.id })}
                role="button"
                tabIndex={0}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setNav({ page: 'project', projectId: project.id });
                  }
                }}
              >
                <div className="project-row__name">{project.name}</div>
                <div className="project-row__status">
                  <StatusPill health={status?.health ?? 'unknown'} size="sm" />
                </div>
                <div className="project-row__latency">
                  {status?.latencyMs != null ? (
                    <span className="muted">{status.latencyMs}ms</span>
                  ) : (
                    <span className="muted">—</span>
                  )}
                </div>
                <div className="project-row__tickets">
                  {openCount > 0 ? (
                    <span className="badge badge--amber">{openCount} tickets</span>
                  ) : (
                    <span className="muted">0 tickets</span>
                  )}
                </div>
                <div className="project-row__mrs">
                  {mrCount > 0 ? (
                    <span className="badge badge--blue">{mrCount} MRs</span>
                  ) : (
                    <span className="muted">0 MRs</span>
                  )}
                </div>
                <div className="project-row__score" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {scoreData ? (
                    <ScoreBadge score={scoreData.score} size="sm" />
                  ) : (
                    <span className="muted">—</span>
                  )}
                  {sslExpiringSoon && (
                    <span
                      className="badge"
                      style={{
                        background: sslDaysLeft !== null && sslDaysLeft < 7
                          ? 'var(--red-badge-bg)'
                          : 'var(--amber-badge-bg)',
                        color: sslDaysLeft !== null && sslDaysLeft < 7
                          ? 'var(--red-badge-text)'
                          : 'var(--amber-badge-text)',
                      }}
                      title={`SSL expires in ${sslDaysLeft} days`}
                    >
                      SSL {sslDaysLeft}d
                    </span>
                  )}
                </div>
                <div className="project-row__time">
                  {status?.checkedAt ? (
                    <span className="muted">{timeAgo(status.checkedAt)}</span>
                  ) : (
                    <span className="muted">not checked</span>
                  )}
                </div>
                <div className="project-row__actions">
                  <button
                    className="btn btn--ghost btn--sm"
                    onClick={e => {
                      e.stopPropagation();
                      refreshProject(project.id);
                    }}
                    disabled={isRefreshing}
                    aria-label="Refresh project"
                  >
                    <span className={isRefreshing ? 'btn__icon--spin' : ''}>↻</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
