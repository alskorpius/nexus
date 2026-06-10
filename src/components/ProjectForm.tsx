import { useState, useEffect } from 'react';
import type { Project, ProjectDraft, AuthMethod, GitProvider } from '../types';
import { useStore } from '../state/store';

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
    if (!draft.name.trim()) errs.name = 'Name is required.';
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
            setErrors({ loginCreds: 'Credentials look like JSON but do not parse — fix the syntax.' });
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

  const secretPlaceholder = isEdit ? '•••• stored — leave empty to keep' : '';

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal--large">
        <div className="modal__header">
          <h2 className="modal__title">{isEdit ? `Edit ${project!.name}` : 'Add Project'}</h2>
          <button className="modal__close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <form className="modal__body modal__body--scroll" onSubmit={handleSubmit}>
          {/* Core */}
          <fieldset className="form-section">
            <legend className="form-section__legend">General</legend>

            <div className="form-field">
              <label className="form-label" htmlFor="pf-name">
                Name <span className="form-required">*</span>
              </label>
              <input
                id="pf-name"
                type="text"
                className={`form-input${errors.name ? ' form-input--error' : ''}`}
                value={draft.name}
                onChange={e => set('name', e.target.value)}
                placeholder="My Project"
              />
              {errors.name && <p className="form-error">{errors.name}</p>}
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="pf-desc">Description</label>
              <input
                id="pf-desc"
                type="text"
                className="form-input"
                value={draft.description}
                onChange={e => set('description', e.target.value)}
                placeholder="Short description"
              />
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="pf-api">API Base URL</label>
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
                <label className="form-label" htmlFor="pf-auth">Auth Method</label>
                <select
                  id="pf-auth"
                  className="form-select"
                  value={draft.authMethod}
                  onChange={e => set('authMethod', e.target.value as AuthMethod)}
                >
                  <option value="none">None</option>
                  <option value="bearer">Bearer token (static)</option>
                  <option value="login">Login endpoint (auto-refreshed token)</option>
                </select>
              </div>

              <div className="form-field">
                <label className="form-label" htmlFor="pf-git">Git Provider</label>
                <select
                  id="pf-git"
                  className="form-select"
                  value={draft.gitProvider}
                  onChange={e => set('gitProvider', e.target.value as GitProvider)}
                >
                  <option value="none">None</option>
                  <option value="github">GitHub</option>
                  <option value="gitlab">GitLab</option>
                </select>
              </div>
            </div>

            {showLoginCredentials && (
              <>
                <div className="form-field">
                  <label className="form-label" htmlFor="pf-login-url">Login Endpoint</label>
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
                    Token Field
                    <span className="form-hint"> path to token in login response · empty = auto (access_token, token, data.access_token…)</span>
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
            <legend className="form-section__legend">Endpoints</legend>

            <div className="form-field">
              <label className="form-label" htmlFor="pf-health">Health Endpoint</label>
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
                Support Endpoint
                <span className="form-hint"> empty → {draft.apiBaseUrl || '{apiBaseUrl}'}/v1/support-requests/</span>
              </label>
              <input
                id="pf-support"
                type="text"
                className="form-input"
                value={draft.supportEndpoint}
                onChange={e => set('supportEndpoint', e.target.value)}
                placeholder="Leave empty to derive from API base"
              />
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="pf-deploy">Deploy Endpoint</label>
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
            <legend className="form-section__legend">Repository</legend>

            <div className="form-field">
              <label className="form-label" htmlFor="pf-repo">Repo URL</label>
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
                Git Project ID
                <span className="form-hint"> owner/repo for GitHub · project ID or full path for GitLab</span>
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
            <legend className="form-section__legend">Links</legend>
            <div className="form-field">
              <label className="form-label" htmlFor="pf-docs">Docs URL</label>
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
            <legend className="form-section__legend">Notes</legend>
            <div className="form-field">
              <textarea
                className="form-input form-textarea"
                value={draft.notes}
                onChange={e => set('notes', e.target.value)}
                placeholder="Free-form notes"
                rows={3}
              />
            </div>
          </fieldset>

          {/* Secrets */}
          {hasSecrets && (
            <fieldset className="form-section form-section--secrets">
              <legend className="form-section__legend">
                Secrets
                <span className="form-hint"> — stored in OS credential store, never in DB</span>
              </legend>

              {showBearerToken && (
                <div className="form-field">
                  <label className="form-label" htmlFor="pf-api-token">API Token</label>
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
                    Login Credentials (request body)
                    <span className="form-hint">
                      {' '}any fields your API expects — JSON or form-encoded (a=1&b=2).
                      {isEdit ? ' Leave empty to keep stored credentials.' : ''}
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
                    {draft.gitProvider === 'github' ? 'GitHub' : 'GitLab'} Token
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
                </div>
              )}
            </fieldset>
          )}

          {errors._form && <p className="form-error form-error--global">{errors._form}</p>}

          <div className="modal__actions">
            <button type="button" className="btn btn--ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
