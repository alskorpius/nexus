import { useState, useEffect } from 'react';
import { openUrl } from '@tauri-apps/plugin-opener';
import type { Project, ProjectDraft, AuthMethod, GitProvider } from '../types';
import { useStore } from '../state/store';
import { useI18n } from '../lib/i18n';

// Token-creation guidance per git provider; the GitLab link is derived from Repo URL.
// Returns raw data only — translation happens at the call site inside the component.
function gitTokenHelpData(
  provider: GitProvider,
  repoUrl: string,
): { textKey: 'form.gitlabTokenHint' | 'form.githubTokenHint'; url: string | null; linkLabelKey: 'form.gitlabTokenLinkLabel' | 'form.githubTokenLinkLabel' } | null {
  if (provider === 'gitlab') {
    const repo = repoUrl.trim().replace(/\.git$/, '').replace(/\/+$/, '');
    return {
      textKey: 'form.gitlabTokenHint',
      url: repo.startsWith('http') ? `${repo}/-/settings/access_tokens` : null,
      linkLabelKey: 'form.gitlabTokenLinkLabel',
    };
  }
  if (provider === 'github') {
    return {
      textKey: 'form.githubTokenHint',
      url: 'https://github.com/settings/personal-access-tokens/new',
      linkLabelKey: 'form.githubTokenLinkLabel',
    };
  }
  return null;
}

interface ProjectFormProps {
  project?: Project;
  onClose(): void;
}

const EMPTY_DRAFT: ProjectDraft = {
  name: '',
  description: '',
  apiBaseUrl: '',
  authMethod: 'none',
  loginEndpoint: '',
  tokenField: '',
  gitProvider: 'none',
  repoUrl: '',
  gitProjectId: '',
  supportEndpoint: '',
  healthEndpoint: '',
  deployEndpoint: '',
  docsUrl: '',
  notes: '',
};

export function ProjectForm({ project, onClose }: ProjectFormProps) {
  const { t } = useI18n();
  const { saveProjectWithSecrets } = useStore();
  const isEdit = Boolean(project);

  const [draft, setDraft] = useState<ProjectDraft>(() =>
    project
      ? {
          id: project.id,
          name: project.name,
          description: project.description,
          apiBaseUrl: project.apiBaseUrl,
          authMethod: project.authMethod,
          loginEndpoint: project.loginEndpoint,
          tokenField: project.tokenField,
          gitProvider: project.gitProvider,
          repoUrl: project.repoUrl,
          gitProjectId: project.gitProjectId,
          supportEndpoint: project.supportEndpoint,
          healthEndpoint: project.healthEndpoint,
          deployEndpoint: project.deployEndpoint,
          docsUrl: project.docsUrl,
          notes: project.notes,
        }
      : EMPTY_DRAFT
  );

  // Secret fields — write-only, never prefilled
  const [apiToken, setApiToken] = useState('');
  const [gitToken, setGitToken] = useState('');
  // Login credentials — raw request body for the login endpoint (JSON or form-encoded)
  const [loginCredsText, setLoginCredsText] = useState('');

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  function set<K extends keyof ProjectDraft>(key: K, value: ProjectDraft[K]) {
    setDraft(prev => ({ ...prev, [key]: value }));
    setErrors(prev => { const n = { ...prev }; delete n[key]; return n; });
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!draft.name.trim()) errs.name = t('projects.form.errorNameRequired');
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      // Credentials are stored as the raw login request body
      let loginCreds: string | undefined;
      if (draft.authMethod === 'login' && loginCredsText.trim()) {
        const text = loginCredsText.trim();
        if (text.startsWith('{') || text.startsWith('[')) {
          try {
            JSON.parse(text);
          } catch {
            setErrors({ loginCreds: t('projects.form.errorInvalidJson') });
            setSaving(false);
            return;
          }
        }
        loginCreds = text;
      }

      await saveProjectWithSecrets(draft, {
        apiToken: apiToken || undefined,
        gitToken: gitToken || undefined,
        loginCreds,
      });
      onClose();
    } catch (err) {
      setErrors({ _form: String(err) });
    } finally {
      setSaving(false);
    }
  }

  const showGitToken = draft.gitProvider !== 'none';
  const showBearerToken = draft.authMethod === 'bearer';
  const showLoginCredentials = draft.authMethod === 'login';
  const hasSecrets = showBearerToken || showLoginCredentials || showGitToken;

  const secretPlaceholder = isEdit ? t('projects.form.secretStoredPlaceholder') : '';

  return (
    // No click-outside close: the form is large and accidental clicks would lose input
    <div className="modal-overlay">
      <div className="modal modal--large">
        <div className="modal__header">
          <h2 className="modal__title">
            {isEdit
              ? t('projects.form.editTitle', { name: project!.name })
              : t('projects.form.addTitle')}
          </h2>
          <button className="modal__close" onClick={onClose} aria-label={t('projects.form.closeAriaLabel')}>✕</button>
        </div>

        <form className="modal__body modal__body--scroll" onSubmit={handleSubmit}>
          {/* Core */}
          <fieldset className="form-section">
            <legend className="form-section__legend">{t('projects.form.section.general')}</legend>

            <div className="form-field">
              <label className="form-label" htmlFor="pf-name">
                {t('projects.form.name')} <span className="form-required">*</span>
              </label>
              <input
                id="pf-name"
                type="text"
                className={`form-input${errors.name ? ' form-input--error' : ''}`}
                value={draft.name}
                onChange={e => set('name', e.target.value)}
                placeholder={t('projects.form.namePlaceholder')}
              />
              {errors.name && <p className="form-error">{errors.name}</p>}
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="pf-desc">{t('projects.form.description')}</label>
              <input
                id="pf-desc"
                type="text"
                className="form-input"
                value={draft.description}
                onChange={e => set('description', e.target.value)}
                placeholder={t('projects.form.descriptionPlaceholder')}
              />
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="pf-api">{t('projects.form.apiBaseUrl')}</label>
              <input
                id="pf-api"
                type="text"
                className="form-input"
                value={draft.apiBaseUrl}
                onChange={e => set('apiBaseUrl', e.target.value)}
                placeholder="https://api.example.com/api"
              />
            </div>

            <div className="form-row">
              <div className="form-field">
                <label className="form-label" htmlFor="pf-auth">{t('projects.form.authMethod')}</label>
                <select
                  id="pf-auth"
                  className="form-select"
                  value={draft.authMethod}
                  onChange={e => set('authMethod', e.target.value as AuthMethod)}
                >
                  <option value="none">{t('projects.form.authNone')}</option>
                  <option value="bearer">{t('projects.form.authBearer')}</option>
                  <option value="login">{t('projects.form.authLogin')}</option>
                </select>
              </div>

              <div className="form-field">
                <label className="form-label" htmlFor="pf-git">{t('projects.form.gitProvider')}</label>
                <select
                  id="pf-git"
                  className="form-select"
                  value={draft.gitProvider}
                  onChange={e => set('gitProvider', e.target.value as GitProvider)}
                >
                  <option value="none">{t('projects.form.gitNone')}</option>
                  <option value="github">GitHub</option>
                  <option value="gitlab">GitLab</option>
                </select>
              </div>
            </div>

            {showLoginCredentials && (
              <>
                <div className="form-field">
                  <label className="form-label" htmlFor="pf-login-url">{t('projects.form.loginEndpoint')}</label>
                  <input
                    id="pf-login-url"
                    type="text"
                    className="form-input"
                    value={draft.loginEndpoint}
                    onChange={e => set('loginEndpoint', e.target.value)}
                    placeholder="https://api.example.com/api/v1/users/login"
                  />
                </div>
                <div className="form-field">
                  <label className="form-label" htmlFor="pf-token-field">
                    {t('projects.form.tokenField')}
                    <span className="form-hint">{t('projects.form.tokenFieldHint')}</span>
                  </label>
                  <input
                    id="pf-token-field"
                    type="text"
                    className="form-input"
                    value={draft.tokenField}
                    onChange={e => set('tokenField', e.target.value)}
                    placeholder="access_token"
                  />
                </div>
              </>
            )}
          </fieldset>

          {/* Endpoints */}
          <fieldset className="form-section">
            <legend className="form-section__legend">{t('projects.form.section.endpoints')}</legend>

            <div className="form-field">
              <label className="form-label" htmlFor="pf-health">{t('projects.form.healthEndpoint')}</label>
              <input
                id="pf-health"
                type="text"
                className="form-input"
                value={draft.healthEndpoint}
                onChange={e => set('healthEndpoint', e.target.value)}
                placeholder="https://host/health"
              />
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="pf-support">
                {t('projects.form.supportEndpoint')}
                <span className="form-hint">{t('projects.form.supportEndpointHint', { url: draft.apiBaseUrl || '{apiBaseUrl}' })}</span>
              </label>
              <input
                id="pf-support"
                type="text"
                className="form-input"
                value={draft.supportEndpoint}
                onChange={e => set('supportEndpoint', e.target.value)}
                placeholder={t('projects.form.supportEndpointPlaceholder')}
              />
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="pf-deploy">{t('projects.form.deployEndpoint')}</label>
              <input
                id="pf-deploy"
                type="text"
                className="form-input"
                value={draft.deployEndpoint}
                onChange={e => set('deployEndpoint', e.target.value)}
                placeholder="https://..."
              />
            </div>
          </fieldset>

          {/* Git */}
          <fieldset className="form-section">
            <legend className="form-section__legend">{t('projects.form.section.repository')}</legend>

            <div className="form-field">
              <label className="form-label" htmlFor="pf-repo">{t('projects.form.repoUrl')}</label>
              <input
                id="pf-repo"
                type="text"
                className="form-input"
                value={draft.repoUrl}
                onChange={e => set('repoUrl', e.target.value)}
                placeholder="https://github.com/owner/repo"
              />
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="pf-gitid">
                {t('projects.form.gitProjectId')}
                <span className="form-hint">{t('projects.form.gitProjectIdHint')}</span>
              </label>
              <input
                id="pf-gitid"
                type="text"
                className="form-input"
                value={draft.gitProjectId}
                onChange={e => set('gitProjectId', e.target.value)}
                placeholder="owner/repo"
              />
            </div>
          </fieldset>

          {/* Links */}
          <fieldset className="form-section">
            <legend className="form-section__legend">{t('projects.form.section.links')}</legend>
            <div className="form-field">
              <label className="form-label" htmlFor="pf-docs">{t('projects.form.docsUrl')}</label>
              <input
                id="pf-docs"
                type="text"
                className="form-input"
                value={draft.docsUrl}
                onChange={e => set('docsUrl', e.target.value)}
                placeholder="https://..."
              />
            </div>
          </fieldset>

          {/* Notes */}
          <fieldset className="form-section">
            <legend className="form-section__legend">{t('projects.form.section.notes')}</legend>
            <div className="form-field">
              <textarea
                className="form-input form-textarea"
                value={draft.notes}
                onChange={e => set('notes', e.target.value)}
                placeholder={t('projects.form.notesPlaceholder')}
                rows={3}
              />
            </div>
          </fieldset>

          {/* Secrets */}
          {hasSecrets && (
            <fieldset className="form-section form-section--secrets">
              <legend className="form-section__legend">
                {t('projects.form.section.secrets')}
                <span className="form-hint">{t('projects.form.section.secretsHint')}</span>
              </legend>

              {showBearerToken && (
                <div className="form-field">
                  <label className="form-label" htmlFor="pf-api-token">{t('projects.form.apiToken')}</label>
                  <input
                    id="pf-api-token"
                    type="password"
                    className="form-input"
                    value={apiToken}
                    onChange={e => setApiToken(e.target.value)}
                    autoComplete="new-password"
                    placeholder={secretPlaceholder}
                  />
                </div>
              )}

              {showLoginCredentials && (
                <div className="form-field">
                  <label className="form-label" htmlFor="pf-login-creds">
                    {t('projects.form.loginCreds')}
                    <span className="form-hint">
                      {t('projects.form.loginCredsHint')}
                      {isEdit ? t('projects.form.loginCredsHintEdit') : ''}
                    </span>
                  </label>
                  <textarea
                    id="pf-login-creds"
                    className={`form-input form-textarea${errors.loginCreds ? ' form-input--error' : ''}`}
                    value={loginCredsText}
                    onChange={e => setLoginCredsText(e.target.value)}
                    autoComplete="new-password"
                    placeholder={secretPlaceholder || '{"email": "you@example.com", "password": "…"}'}
                    rows={4}
                    spellCheck={false}
                  />
                  {errors.loginCreds && <p className="form-error">{errors.loginCreds}</p>}
                </div>
              )}

              {showGitToken && (
                <div className="form-field">
                  <label className="form-label" htmlFor="pf-git-token">
                    {draft.gitProvider === 'github' ? t('projects.form.gitHubToken') : t('projects.form.gitLabToken')}
                  </label>
                  <input
                    id="pf-git-token"
                    type="password"
                    className="form-input"
                    value={gitToken}
                    onChange={e => setGitToken(e.target.value)}
                    autoComplete="new-password"
                    placeholder={secretPlaceholder}
                  />
                  {(() => {
                    const help = gitTokenHelpData(draft.gitProvider, draft.repoUrl);
                    if (!help) return null;
                    return (
                      <p className="form-hint form-hint--block">
                        {t(`projects.${help.textKey}`)}
                        {help.url ? (
                          <>
                            {' '}
                            <button
                              type="button"
                              className="form-hint__link"
                              onClick={() => openUrl(help.url!)}
                            >
                              {t(`projects.${help.linkLabelKey}`)}
                            </button>
                          </>
                        ) : (
                          draft.gitProvider === 'gitlab' && (
                            <>{t('projects.form.gitlabNoUrlHint')}</>
                          )
                        )}
                      </p>
                    );
                  })()}
                </div>
              )}
            </fieldset>
          )}

          {errors._form && <p className="form-error form-error--global">{errors._form}</p>}

          <div className="modal__actions">
            <button type="button" className="btn btn--ghost" onClick={onClose}>
              {t('common.cancel')}
            </button>
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving
                ? t('projects.form.savingBtn')
                : isEdit
                  ? t('projects.form.saveChangesBtn')
                  : t('projects.form.addProjectBtn')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
