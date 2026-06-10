import { useState } from 'react';
import type { Project } from '../types';
import { useStore } from '../state/store';
import { StatusPill } from '../components/StatusPill';
import { ProjectForm } from '../components/ProjectForm';
import { PassphraseModal } from '../components/PassphraseModal';
import { useI18n } from '../lib/i18n';

type Modal =
  | { type: 'add' }
  | { type: 'edit'; project: Project }
  | { type: 'export'; projectId: number }
  | { type: 'import' }
  | { type: 'delete'; project: Project }
  | null;

export function Projects() {
  const { t } = useI18n();
  const { projects, statuses, setNav, removeProject, exportProject, importProject } = useStore();
  const [modal, setModal] = useState<Modal>(null);
  const [exportResult, setExportResult] = useState<{ id: number; path: string } | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  async function handleExport(projectId: number, passphrase: string) {
    setModal(null);
    const path = await exportProject(projectId, passphrase);
    if (path) setExportResult({ id: projectId, path });
  }

  async function handleImport(passphrase: string) {
    setModal(null);
    setImportError(null);
    try {
      const project = await importProject(passphrase);
      if (project) {
        setNav({ page: 'project', projectId: project.id });
      }
    } catch (err) {
      setImportError(String(err));
    }
  }

  async function handleDelete(project: Project) {
    setModal(null);
    await removeProject(project.id);
  }

  const gitProviderLabel = (p: string) => {
    if (p === 'github') return 'GitHub';
    if (p === 'gitlab') return 'GitLab';
    return '—';
  };

  return (
    <div className="page">
      <div className="page__header">
        <h1 className="page__title">{t('projects.page.title')}</h1>
        <div className="page__actions">
          <button className="btn btn--ghost" onClick={() => setModal({ type: 'import' })}>
            {t('projects.page.importBtn')}
          </button>
          <button className="btn btn--primary" onClick={() => setModal({ type: 'add' })}>
            {t('projects.page.addBtn')}
          </button>
        </div>
      </div>

      {importError && (
        <div className="alert alert--error">
          {t('projects.alert.importFailed', { error: importError })}
          <button className="alert__close" onClick={() => setImportError(null)}>✕</button>
        </div>
      )}

      {exportResult && (
        <div className="alert alert--success">
          {t('projects.alert.exportedTo')} <code>{exportResult.path}</code>
          <button className="alert__close" onClick={() => setExportResult(null)}>✕</button>
        </div>
      )}

      {projects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon">⊞</div>
          <h2 className="empty-state__title">{t('projects.empty.title')}</h2>
          <p className="empty-state__body">{t('projects.empty.body')}</p>
          <button className="btn btn--primary" onClick={() => setModal({ type: 'add' })}>
            {t('projects.page.addBtn')}
          </button>
        </div>
      ) : (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>{t('projects.table.name')}</th>
                <th>{t('projects.table.apiBase')}</th>
                <th>{t('projects.table.git')}</th>
                <th>{t('projects.table.health')}</th>
                <th>{t('projects.table.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {projects.map(project => {
                const status = statuses[project.id];
                return (
                  <tr key={project.id}>
                    <td>
                      <div className="table__project-name">{project.name}</div>
                      {project.description && (
                        <div className="table__project-desc muted">{project.description}</div>
                      )}
                    </td>
                    <td>
                      <span className="muted mono">{project.apiBaseUrl || '—'}</span>
                    </td>
                    <td>
                      <span className="muted">{gitProviderLabel(project.gitProvider)}</span>
                    </td>
                    <td>
                      <StatusPill health={status?.health ?? 'unknown'} size="sm" />
                    </td>
                    <td>
                      <div className="table__actions">
                        <button
                          className="btn btn--ghost btn--sm"
                          onClick={() => setNav({ page: 'project', projectId: project.id })}
                        >
                          {t('projects.table.open')}
                        </button>
                        <button
                          className="btn btn--ghost btn--sm"
                          onClick={() => setModal({ type: 'edit', project })}
                        >
                          {t('common.edit')}
                        </button>
                        <button
                          className="btn btn--ghost btn--sm"
                          onClick={() => setModal({ type: 'export', projectId: project.id })}
                        >
                          {t('projects.table.export')}
                        </button>
                        <button
                          className="btn btn--danger btn--sm"
                          onClick={() => setModal({ type: 'delete', project })}
                        >
                          {t('common.delete')}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      {modal?.type === 'add' && (
        <ProjectForm onClose={() => setModal(null)} />
      )}
      {modal?.type === 'edit' && (
        <ProjectForm project={modal.project} onClose={() => setModal(null)} />
      )}
      {modal?.type === 'export' && (
        <PassphraseModal
          title={t('projects.passphrase.exportTitle')}
          mode="export"
          onConfirm={p => handleExport(modal.projectId, p)}
          onCancel={() => setModal(null)}
        />
      )}
      {modal?.type === 'import' && (
        <PassphraseModal
          title={t('projects.passphrase.importTitle')}
          mode="import"
          onConfirm={handleImport}
          onCancel={() => setModal(null)}
        />
      )}
      {modal?.type === 'delete' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal__header">
              <h2 className="modal__title">{t('projects.delete.title')}</h2>
            </div>
            <div className="modal__body">
              <p>
                {t('projects.delete.body', { name: modal.project.name })}
              </p>
              <div className="modal__actions">
                <button className="btn btn--ghost" onClick={() => setModal(null)}>
                  {t('common.cancel')}
                </button>
                <button
                  className="btn btn--danger"
                  onClick={() => handleDelete(modal.project)}
                >
                  {t('common.delete')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
