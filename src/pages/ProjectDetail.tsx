import { useState } from 'react';
import { openUrl } from '@tauri-apps/plugin-opener';
import { useStore } from '../state/store';
import { StatusPill } from '../components/StatusPill';
import { ScoreBadge } from '../components/ScoreBadge';
import { TicketTable } from '../components/TicketTable';
import { ProjectForm } from '../components/ProjectForm';
import { PassphraseModal } from '../components/PassphraseModal';
import { HealthHistoryCard } from '../components/HealthHistoryCard';
import { HandoverModal } from '../components/HandoverModal';
import { timeAgo } from '../lib/format';
import { computeHealthScore } from '../lib/score';
import { useI18n, getLocale } from '../lib/i18n';

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
    updateTicketStatus,
    sendTicketMessage,
    loadTicketMessages,
    exportProject,
  } = useStore();

  const { t } = useI18n();

  const project = projects.find(p => p.id === projectId);
  const status = statuses[projectId];
  const isRefreshing = refreshing[projectId];

  const [showEdit, setShowEdit] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showHandover, setShowHandover] = useState(false);
  const [exportResult, setExportResult] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  if (!project) {
    return (
      <div className="page">
        <div className="empty-state">
          <p>{t('detail.notFound')}</p>
          <button className="btn btn--ghost" onClick={() => setNav({ page: 'projects' })}>
            {t('detail.notFound.back')}
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
  const scoreData = status ? computeHealthScore(status) : null;
  const ssl = status?.ssl ?? null;

  return (
    <div className="page">
      {/* Back */}
      <button
        className="back-link"
        onClick={() => setNav({ page: 'projects' })}
      >
        {t('detail.back')}
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
            {scoreData && <ScoreBadge score={scoreData.score} size="md" />}
            {status?.latencyMs != null && (
              <span className="detail-meta__latency muted">{status.latencyMs}ms</span>
            )}
            {status?.checkedAt && (
              <span className="muted detail-meta__time">
                {t('detail.checkedAgo', { ago: timeAgo(status.checkedAt) })}
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
              {t('detail.action.refresh')}
            </button>
            <button className="btn btn--ghost" onClick={() => setShowEdit(true)}>{t('detail.action.edit')}</button>
            <button className="btn btn--ghost" onClick={() => setShowHandover(true)}>{t('detail.handover.button')}</button>
            <button className="btn btn--ghost" onClick={() => setShowExport(true)}>{t('detail.action.export')}</button>
            <button className="btn btn--danger" onClick={() => setShowDelete(true)}>{t('detail.action.delete')}</button>
          </div>
        </div>
      </div>

      {exportResult && (
        <div className="alert alert--success">
          {t('detail.export.success')} <code>{exportResult}</code>
          <button className="alert__close" onClick={() => setExportResult(null)}>✕</button>
        </div>
      )}
      {exportError && (
        <div className="alert alert--error">
          {t('detail.export.failed')} {exportError}
          <button className="alert__close" onClick={() => setExportError(null)}>✕</button>
        </div>
      )}

      {/* 1. Service Health */}
      <div className="section">
        <h2 className="section__title">{t('detail.health.title')}</h2>
        <div className="card detail-health">
          {project.healthEndpoint ? (
            <>
              <div className="detail-health__row">
                <span className="detail-health__label">{t('detail.health.label.endpoint')}</span>
                <span className="mono muted">{project.healthEndpoint}</span>
              </div>
              <div className="detail-health__row">
                <span className="detail-health__label">{t('detail.health.label.httpStatus')}</span>
                <span className={status?.httpStatus && status.httpStatus >= 200 && status.httpStatus < 300 ? 'text-healthy' : 'text-critical'}>
                  {status?.httpStatus ?? '—'}
                </span>
              </div>
              {status?.error && (
                <div className="detail-health__row detail-health__row--error">
                  <span className="detail-health__label">{t('detail.health.label.error')}</span>
                  <span className="text-critical">{status.error}</span>
                </div>
              )}
              {status?.healthMeta && (
                <div className="detail-health__row">
                  <span className="detail-health__label">{t('detail.health.label.reported')}</span>
                  <span className="muted">
                    {[
                      status.healthMeta.status,
                      status.healthMeta.app,
                      status.healthMeta.version && `v${status.healthMeta.version}`,
                      status.healthMeta.environment,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                </div>
              )}
              {status?.healthComponents &&
                status.healthComponents.length > 0 &&
                Object.entries(
                  status.healthComponents.reduce<Record<string, typeof status.healthComponents>>(
                    (acc, c) => {
                      (acc[c.group] ??= []).push(c);
                      return acc;
                    },
                    {},
                  ),
                ).map(([group, comps]) => (
                  <div className="detail-health__row detail-health__row--components" key={group}>
                    <span className="detail-health__label">{group}</span>
                    <div className="health-chips">
                      {comps.map(c => (
                        <span
                          key={`${c.group}:${c.name}`}
                          className={`health-chip ${c.ok ? 'health-chip--ok' : 'health-chip--bad'}`}
                          title={c.error ? `${c.status}: ${c.error}` : c.status}
                        >
                          <span className="health-chip__dot" />
                          {c.name}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              {!status && (
                <p className="muted">{t('detail.health.notChecked')}</p>
              )}
            </>
          ) : (
            <p className="muted">{t('detail.health.noEndpoint')}</p>
          )}
        </div>
      </div>

      {/* 2. SSL Certificate */}
      {ssl && (
        <div className="section">
          <h2 className="section__title">{t('detail.ssl.title')}</h2>
          <div className="card detail-health">
            <div className="detail-health__row">
              <span className="detail-health__label">{t('detail.ssl.label.host')}</span>
              <span className="mono muted">{ssl.host}</span>
            </div>
            {ssl.error && !ssl.expiresAt ? (
              <div className="detail-health__row detail-health__row--error">
                <span className="detail-health__label">{t('detail.ssl.label.error')}</span>
                <span className="muted">{ssl.error}</span>
              </div>
            ) : (
              <>
                {ssl.issuer && (
                  <div className="detail-health__row">
                    <span className="detail-health__label">{t('detail.ssl.label.issuer')}</span>
                    <span className="muted">{ssl.issuer}</span>
                  </div>
                )}
                {ssl.expiresAt && (
                  <div className="detail-health__row">
                    <span className="detail-health__label">{t('detail.ssl.label.expires')}</span>
                    <span className="muted">
                      {new Date(ssl.expiresAt).toLocaleDateString(getLocale(), {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                )}
                {ssl.daysLeft !== null && (
                  <div className="detail-health__row">
                    <span className="detail-health__label">{t('detail.ssl.label.daysLeft')}</span>
                    <span
                      style={{
                        color: ssl.daysLeft < 7
                          ? 'var(--critical)'
                          : ssl.daysLeft < 30
                          ? 'var(--warning)'
                          : 'var(--healthy)',
                        fontWeight: 600,
                      }}
                    >
                      {t('detail.ssl.days', { days: ssl.daysLeft })}
                    </span>
                  </div>
                )}
                {ssl.error && (
                  <div className="detail-health__row">
                    <span className="detail-health__label">{t('detail.ssl.label.note')}</span>
                    <span className="muted">{ssl.error}</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* 3. Health History */}
      <div className="section">
        <h2 className="section__title">{t('detail.history.title')}</h2>
        <HealthHistoryCard projectId={projectId} checkedAt={status?.checkedAt} />
      </div>

      {/* 4. Support Tickets */}
      <div className="section">
        <h2 className="section__title">{t('detail.tickets.title')}</h2>
        {hasTicketsError ? (
          <div className="card">
            <p className="text-critical">
              {t('detail.tickets.loadFailed')} {status?.ticketsError}
            </p>
          </div>
        ) : status?.tickets ? (
          <TicketTable
            tickets={status.tickets}
            onStatusChange={(ticketId, s) => updateTicketStatus(projectId, ticketId, s)}
            onSendMessage={(ticketId, m) => sendTicketMessage(projectId, ticketId, m)}
            onLoadMessages={ticketId => loadTicketMessages(projectId, ticketId)}
          />
        ) : (
          <div className="card">
            <p className="muted">
              {project.authMethod === 'none' && !project.supportEndpoint
                ? t('detail.tickets.configureAuth')
                : t('detail.tickets.notLoaded')}
            </p>
          </div>
        )}
      </div>

      {/* 4. Git Activity */}
      <div className="section">
        <h2 className="section__title">{t('detail.git.title')}</h2>
        {hasGitError ? (
          <div className="card">
            <p className="text-critical">{t('detail.git.loadFailed')} {status?.gitError}</p>
          </div>
        ) : git ? (
          <div className="git-detail">
            {git.failedPipelines !== null && git.failedPipelines > 0 && (
              <div className="alert alert--error">
                {git.failedPipelines > 1
                  ? t('detail.git.failedPipelines', { count: git.failedPipelines })
                  : t('detail.git.failedPipeline', { count: git.failedPipelines })}
              </div>
            )}

            {git.branches.length > 0 && (
              <div className="card">
                <h3 className="card__subtitle">{t('detail.git.branches', { count: git.branches.length })}</h3>
                <div className="health-chips">
                  {git.branches.slice(0, 12).map(b => (
                    <button
                      key={b.name}
                      type="button"
                      className={`branch-chip${b.default ? ' branch-chip--default' : ''}`}
                      onClick={() => b.webUrl && openLink(b.webUrl)}
                      title={b.lastActivity ? t('detail.git.branchUpdated', { ago: timeAgo(b.lastActivity) }) : b.name}
                    >
                      {b.name}
                      {b.lastActivity && (
                        <span className="branch-chip__time">{timeAgo(b.lastActivity)}</span>
                      )}
                    </button>
                  ))}
                  {git.branches.length > 12 && (
                    <span className="muted">{t('detail.git.branchMore', { count: git.branches.length - 12 })}</span>
                  )}
                </div>
              </div>
            )}

            {git.mrs.length > 0 && (
              <div className="card">
                <h3 className="card__subtitle">{t('detail.git.mrs', { count: git.openMrCount })}</h3>
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
                        <span className="muted git-list__author">{t('detail.git.mrAuthor', { author: mr.author })}</span>
                      </div>
                      <span className="muted">{timeAgo(mr.updatedAt)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {git.commits.length > 0 && (
              <div className="card">
                <h3 className="card__subtitle">{t('detail.git.commits')}</h3>
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
                        <span className="muted git-list__author">{t('detail.git.commitAuthor', { author: commit.author })}</span>
                      </div>
                      <span className="muted">{timeAgo(commit.date)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {git.mrs.length === 0 && git.commits.length === 0 && git.branches.length === 0 && (
              <div className="card">
                <p className="muted">{t('detail.git.noActivity')}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="card">
            <p className="muted">
              {project.gitProvider === 'none'
                ? t('detail.git.noProvider')
                : t('detail.git.notLoaded')}
            </p>
          </div>
        )}
      </div>

      {/* 5. Links */}
      {hasLinks && (
        <div className="section">
          <h2 className="section__title">{t('detail.links.title')}</h2>
          <div className="links-row">
            {project.docsUrl && (
              <button className="btn btn--ghost" onClick={() => openLink(project.docsUrl)}>
                {t('detail.links.docs')}
              </button>
            )}
            {project.repoUrl && (
              <button className="btn btn--ghost" onClick={() => openLink(project.repoUrl)}>
                {t('detail.links.repo')}
              </button>
            )}
            {project.deployEndpoint && (
              <button className="btn btn--ghost" onClick={() => openLink(project.deployEndpoint)}>
                {t('detail.links.deploy')}
              </button>
            )}
          </div>
        </div>
      )}

      {/* 6. Notes */}
      {project.notes && (
        <div className="section">
          <h2 className="section__title">{t('detail.notes.title')}</h2>
          <div className="card">
            <pre className="notes-text">{project.notes}</pre>
          </div>
        </div>
      )}

      {/* Modals */}
      {showEdit && (
        <ProjectForm project={project} onClose={() => setShowEdit(false)} />
      )}
      {showHandover && (
        <HandoverModal
          project={project}
          status={status}
          onClose={() => setShowHandover(false)}
        />
      )}
      {showExport && (
        <PassphraseModal
          title={t('detail.export.modalTitle', { name: project.name })}
          mode="export"
          onConfirm={handleExport}
          onCancel={() => setShowExport(false)}
        />
      )}
      {showDelete && (
        <div className="modal-overlay" onClick={() => setShowDelete(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal__header">
              <h2 className="modal__title">{t('detail.delete.title')}</h2>
            </div>
            <div className="modal__body">
              <p>
                {t('detail.delete.body', { name: project.name })}
              </p>
              <div className="modal__actions">
                <button className="btn btn--ghost" onClick={() => setShowDelete(false)}>
                  {t('common.cancel')}
                </button>
                <button className="btn btn--danger" onClick={handleDelete}>
                  {t('detail.delete.confirm')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
