import { useState } from 'react';
import { openUrl } from '@tauri-apps/plugin-opener';
import { useStore } from '../state/store';
import { StatusPill } from '../components/StatusPill';
import { TicketTable } from '../components/TicketTable';
import { ProjectForm } from '../components/ProjectForm';
import { PassphraseModal } from '../components/PassphraseModal';
import { timeAgo } from '../lib/format';

interface ProjectDetailProps {
  projectId: number;
}

export function ProjectDetail({ projectId }: ProjectDetailProps) {
  const {
    projects,
    statuses,
    setNav,
    refreshProject,
    refreshing,
    removeProject,
    exportProject,
  } = useStore();

  const project = projects.find(p => p.id === projectId);
  const status = statuses[projectId];
  const isRefreshing = refreshing[projectId];

  const [showEdit, setShowEdit] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [exportResult, setExportResult] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  if (!project) {
    return (
      <div className="page">
        <div className="empty-state">
          <p>Project not found.</p>
          <button className="btn btn--ghost" onClick={() => setNav({ page: 'projects' })}>
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  async function handleExport(passphrase: string) {
    setShowExport(false);
    setExportError(null);
    try {
      const path = await exportProject(projectId, passphrase);
      if (path) setExportResult(path);
    } catch (err) {
      setExportError(String(err));
    }
  }

  async function handleDelete() {
    setShowDelete(false);
    await removeProject(projectId);
    setNav({ page: 'projects' });
  }

  async function openLink(url: string) {
    if (!url) return;
    await openUrl(url);
  }

  const git = status?.git;
  const hasGitError = Boolean(status?.gitError);
  const hasTicketsError = Boolean(status?.ticketsError);
  const hasLinks = project.docsUrl || project.repoUrl || project.deployEndpoint;

  return (
    <div className="page">
      {/* Back */}
      <button
        className="back-link"
        onClick={() => setNav({ page: 'projects' })}
      >
        ← Projects
      </button>

      {/* Header */}
      <div className="page__header page__header--detail">
        <div className="page__header-left">
          <h1 className="page__title">{project.name}</h1>
          {project.description && (
            <p className="page__subtitle muted">{project.description}</p>
          )}
        </div>
        <div className="page__header-right">
          <div className="detail-meta">
            <StatusPill health={status?.health ?? 'unknown'} />
            {status?.latencyMs != null && (
              <span className="detail-meta__latency muted">{status.latencyMs}ms</span>
            )}
            {status?.checkedAt && (
              <span className="muted detail-meta__time">
                checked {timeAgo(status.checkedAt)}
              </span>
            )}
          </div>
          <div className="page__actions">
            <button
              className="btn btn--ghost btn--icon-label"
              onClick={() => refreshProject(projectId)}
              disabled={isRefreshing}
            >
              <span className={isRefreshing ? 'btn__icon--spin' : ''}>↻</span>
              Refresh
            </button>
            <button className="btn btn--ghost" onClick={() => setShowEdit(true)}>Edit</button>
            <button className="btn btn--ghost" onClick={() => setShowExport(true)}>Export</button>
            <button className="btn btn--danger" onClick={() => setShowDelete(true)}>Delete</button>
          </div>
        </div>
      </div>

      {exportResult && (
        <div className="alert alert--success">
          Exported to: <code>{exportResult}</code>
          <button className="alert__close" onClick={() => setExportResult(null)}>✕</button>
        </div>
      )}
      {exportError && (
        <div className="alert alert--error">
          Export failed: {exportError}
          <button className="alert__close" onClick={() => setExportError(null)}>✕</button>
        </div>
      )}

      {/* 1. Service Health */}
      <div className="section">
        <h2 className="section__title">Service Health</h2>
        <div className="card detail-health">
          {project.healthEndpoint ? (
            <>
              <div className="detail-health__row">
                <span className="detail-health__label">Endpoint</span>
                <span className="mono muted">{project.healthEndpoint}</span>
              </div>
              <div className="detail-health__row">
                <span className="detail-health__label">HTTP Status</span>
                <span className={status?.httpStatus && status.httpStatus >= 200 && status.httpStatus < 300 ? 'text-healthy' : 'text-critical'}>
                  {status?.httpStatus ?? '—'}
                </span>
              </div>
              {status?.error && (
                <div className="detail-health__row detail-health__row--error">
                  <span className="detail-health__label">Error</span>
                  <span className="text-critical">{status.error}</span>
                </div>
              )}
              {!status && (
                <p className="muted">Not yet checked. Click Refresh.</p>
              )}
            </>
          ) : (
            <p className="muted">No health endpoint configured.</p>
          )}
        </div>
      </div>

      {/* 2. Support Tickets */}
      <div className="section">
        <h2 className="section__title">Support Tickets</h2>
        {hasTicketsError ? (
          <div className="card">
            <p className="text-critical">
              Failed to load tickets: {status?.ticketsError}
            </p>
          </div>
        ) : status?.tickets ? (
          <TicketTable tickets={status.tickets} />
        ) : (
          <div className="card">
            <p className="muted">
              {project.authMethod === 'none' && !project.supportEndpoint
                ? 'Configure auth method and support endpoint to load tickets.'
                : 'Not yet loaded. Click Refresh.'}
            </p>
          </div>
        )}
      </div>

      {/* 3. Git Activity */}
      <div className="section">
        <h2 className="section__title">Git Activity</h2>
        {hasGitError ? (
          <div className="card">
            <p className="text-critical">Failed to load git data: {status?.gitError}</p>
          </div>
        ) : git ? (
          <div className="git-detail">
            {git.failedPipelines !== null && git.failedPipelines > 0 && (
              <div className="alert alert--error">
                {git.failedPipelines} failed pipeline{git.failedPipelines > 1 ? 's' : ''}
              </div>
            )}

            {git.mrs.length > 0 && (
              <div className="card">
                <h3 className="card__subtitle">Open MRs / PRs ({git.openMrCount})</h3>
                <div className="git-list">
                  {git.mrs.map((mr, i) => (
                    <div key={i} className="git-list__item">
                      <div className="git-list__main">
                        <button
                          className="git-list__link"
                          onClick={() => openLink(mr.webUrl)}
                        >
                          {mr.title}
                        </button>
                        <span className="muted git-list__author">by {mr.author}</span>
                      </div>
                      <span className="muted">{timeAgo(mr.updatedAt)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {git.commits.length > 0 && (
              <div className="card">
                <h3 className="card__subtitle">Recent Commits</h3>
                <div className="git-list">
                  {git.commits.map((commit, i) => (
                    <div key={i} className="git-list__item">
                      <div className="git-list__main">
                        <button
                          className="git-list__link"
                          onClick={() => openLink(commit.webUrl)}
                        >
                          {commit.message}
                        </button>
                        <span className="muted git-list__author">by {commit.author}</span>
                      </div>
                      <span className="muted">{timeAgo(commit.date)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {git.mrs.length === 0 && git.commits.length === 0 && (
              <div className="card">
                <p className="muted">No recent activity.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="card">
            <p className="muted">
              {project.gitProvider === 'none'
                ? 'No git provider configured.'
                : 'Not yet loaded. Click Refresh.'}
            </p>
          </div>
        )}
      </div>

      {/* 4. Links */}
      {hasLinks && (
        <div className="section">
          <h2 className="section__title">Links</h2>
          <div className="links-row">
            {project.docsUrl && (
              <button className="btn btn--ghost" onClick={() => openLink(project.docsUrl)}>
                ↗ Documentation
              </button>
            )}
            {project.repoUrl && (
              <button className="btn btn--ghost" onClick={() => openLink(project.repoUrl)}>
                ↗ Repository
              </button>
            )}
            {project.deployEndpoint && (
              <button className="btn btn--ghost" onClick={() => openLink(project.deployEndpoint)}>
                ↗ Deploy
              </button>
            )}
          </div>
        </div>
      )}

      {/* 5. Notes */}
      {project.notes && (
        <div className="section">
          <h2 className="section__title">Notes</h2>
          <div className="card">
            <pre className="notes-text">{project.notes}</pre>
          </div>
        </div>
      )}

      {/* Modals */}
      {showEdit && (
        <ProjectForm project={project} onClose={() => setShowEdit(false)} />
      )}
      {showExport && (
        <PassphraseModal
          title={`Export "${project.name}"`}
          mode="export"
          onConfirm={handleExport}
          onCancel={() => setShowExport(false)}
        />
      )}
      {showDelete && (
        <div className="modal-overlay" onClick={() => setShowDelete(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal__header">
              <h2 className="modal__title">Delete Project</h2>
            </div>
            <div className="modal__body">
              <p>
                Delete <strong>{project.name}</strong>? This removes the project and all stored
                secrets. This action cannot be undone.
              </p>
              <div className="modal__actions">
                <button className="btn btn--ghost" onClick={() => setShowDelete(false)}>
                  Cancel
                </button>
                <button className="btn btn--danger" onClick={handleDelete}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
