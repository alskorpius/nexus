import { useEffect, useRef, useState } from 'react';
import { useStore } from '../state/store';
import {
  THEME_PRESETS,
  subscribeBranding,
  saveWorkspaceName,
  saveWorkspaceLogo,
  saveTheme,
} from '../lib/theme';
import type { BrandingState, ThemeId } from '../lib/theme';
import { LANGUAGES, saveLanguage, useI18n } from '../lib/i18n';
import type { Lang } from '../lib/i18n';
import { NotificationsCard } from '../components/NotificationsCard';

// ── Workspace card ───────────────────────────────────────────────────────────

function WorkspaceCard() {
  const { t, lang } = useI18n();
  const [branding, setBranding] = useState<BrandingState>({
    workspaceName: '',
    workspaceLogo: '',
    theme: 'nexus',
  });

  // Controlled input for workspace name (not yet saved).
  const [nameInput, setNameInput] = useState('');
  const [nameSaved, setNameSaved] = useState(false);
  const [logoError, setLogoError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsub = subscribeBranding(state => {
      setBranding(state);
      setNameInput(state.workspaceName);
    });
    return unsub;
  }, []);

  async function handleNameSave(e: React.FormEvent) {
    e.preventDefault();
    await saveWorkspaceName(nameInput.trim());
    setNameSaved(true);
    setTimeout(() => setNameSaved(false), 2500);
  }

  async function handleNameBlur() {
    if (nameInput.trim() !== branding.workspaceName) {
      await saveWorkspaceName(nameInput.trim());
      setNameSaved(true);
      setTimeout(() => setNameSaved(false), 2500);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLogoError('');

    if (file.size > 200 * 1024) {
      setLogoError(t('settings.workspace.logo.errorSize'));
      // Reset the file input so the same file triggers change again if needed.
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      await saveWorkspaceLogo(dataUrl);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsDataURL(file);
  }

  async function handleRemoveLogo() {
    await saveWorkspaceLogo('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleTheme(id: ThemeId) {
    await saveTheme(id);
  }

  return (
    <div className="card settings-card">
      <h2 className="settings-card__title">{t('settings.workspace.title')}</h2>

      {/* Workspace name */}
      <div className="form-field">
        <label className="form-label" htmlFor="workspace-name">
          {t('settings.workspace.name.label')}
        </label>
        <form onSubmit={handleNameSave}>
          <div className="settings-input-row">
            <input
              id="workspace-name"
              type="text"
              className="form-input"
              style={{ maxWidth: '260px' }}
              value={nameInput}
              placeholder="NEXUS"
              onChange={e => {
                setNameInput(e.target.value);
                setNameSaved(false);
              }}
              onBlur={handleNameBlur}
            />
            <button type="submit" className="btn btn--primary">
              {t('common.save')}
            </button>
            {nameSaved && <span className="settings-saved">{t('common.saved')}</span>}
          </div>
        </form>
        <p className="form-hint form-hint--block">
          {t('settings.workspace.name.hint')}
        </p>
      </div>

      {/* Logo upload */}
      <div className="form-field">
        <label className="form-label">{t('settings.workspace.logo.label')}</label>
        <div className="logo-upload-row">
          {branding.workspaceLogo ? (
            <img
              className="logo-preview"
              src={branding.workspaceLogo}
              alt={t('settings.workspace.logo.alt')}
            />
          ) : (
            <div className="logo-upload-placeholder" aria-hidden="true">⊞</div>
          )}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => fileInputRef.current?.click()}
            >
              {branding.workspaceLogo
                ? t('settings.workspace.logo.replace')
                : t('settings.workspace.logo.upload')}
            </button>
            {branding.workspaceLogo && (
              <button
                type="button"
                className="btn btn--danger btn--sm"
                onClick={handleRemoveLogo}
              >
                {t('settings.workspace.logo.remove')}
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="logo-upload-input"
            aria-hidden="true"
            onChange={handleFileChange}
          />
        </div>
        {logoError && <p className="logo-upload-error">{logoError}</p>}
        <p className="form-hint form-hint--block">
          {t('settings.workspace.logo.hint')}
        </p>
      </div>

      {/* Theme picker */}
      <div className="form-field">
        <label className="form-label">{t('settings.workspace.theme.label')}</label>
        <div className="theme-picker">
          {THEME_PRESETS.map(preset => (
            <button
              key={preset.id}
              type="button"
              className={`theme-swatch${branding.theme === preset.id ? ' theme-swatch--active' : ''}`}
              title={preset.label}
              onClick={() => handleTheme(preset.id)}
            >
              <span
                className="theme-swatch__dot"
                style={{
                  background: `linear-gradient(135deg, ${preset.swatchBg} 50%, ${preset.swatchAccent} 50%)`,
                }}
              />
              <span className="theme-swatch__label">{preset.label}</span>
            </button>
          ))}
        </div>
        <p className="form-hint form-hint--block" style={{ marginTop: '8px' }}>
          {t('settings.workspace.theme.hint')}
        </p>
      </div>

      {/* Language picker */}
      <div className="form-field">
        <label className="form-label">{t('settings.language.label')}</label>
        <select
          className="form-input"
          style={{ maxWidth: '260px' }}
          value={lang}
          onChange={e => saveLanguage(e.target.value as Lang)}
        >
          {LANGUAGES.map(option => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
        <p className="form-hint form-hint--block">{t('settings.language.hint')}</p>
      </div>
    </div>
  );
}

// ── Main Settings page ───────────────────────────────────────────────────────

export function Settings() {
  const { pollIntervalSec, updatePollInterval } = useStore();
  const { t } = useI18n();
  const [interval, setInterval] = useState(String(pollIntervalSec));
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const n = parseInt(interval, 10);
    if (isNaN(n) || n < 15) {
      setError(t('settings.polling.interval.errorMin'));
      return;
    }
    setError('');
    await updatePollInterval(n);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="page">
      <div className="page__header">
        <h1 className="page__title">{t('settings.title')}</h1>
      </div>

      <div className="settings-layout">
        {/* Workspace branding — first card */}
        <WorkspaceCard />

        {/* Poll interval */}
        <div className="card settings-card">
          <h2 className="settings-card__title">{t('settings.polling.title')}</h2>
          <form onSubmit={handleSave}>
            <div className="form-field">
              <label className="form-label" htmlFor="poll-interval">
                {t('settings.polling.interval.label')}
              </label>
              <div className="settings-input-row">
                <input
                  id="poll-interval"
                  type="number"
                  className={`form-input settings-input-narrow${error ? ' form-input--error' : ''}`}
                  value={interval}
                  min={15}
                  onChange={e => {
                    setInterval(e.target.value);
                    setError('');
                    setSaved(false);
                  }}
                />
                <button type="submit" className="btn btn--primary">
                  {t('common.save')}
                </button>
                {saved && <span className="settings-saved">{t('common.saved')}</span>}
              </div>
              {error && <p className="form-error">{error}</p>}
              <p className="form-hint form-hint--block">
                {t('settings.polling.interval.hint')}
              </p>
            </div>
          </form>
        </div>

        {/* Notifications */}
        <NotificationsCard />

        {/* Storage info */}
        <div className="card settings-card">
          <h2 className="settings-card__title">{t('settings.storage.title')}</h2>
          <div className="settings-info-list">
            <div className="settings-info-item">
              <span className="settings-info-item__label">{t('settings.storage.projectData.label')}</span>
              <span className="settings-info-item__value">
                {t('settings.storage.projectData.value', { db: 'nexus.db' })}
              </span>
            </div>
            <div className="settings-info-item">
              <span className="settings-info-item__label">{t('settings.storage.secrets.label')}</span>
              <span className="settings-info-item__value">
                {t('settings.storage.secrets.value')}
              </span>
            </div>
            <div className="settings-info-item">
              <span className="settings-info-item__label">{t('settings.storage.bundle.label')}</span>
              <span className="settings-info-item__value">
                {t('settings.storage.bundle.value', { ext: '.nexusproj' })}
              </span>
            </div>
          </div>
        </div>

        {/* About */}
        <div className="card settings-card">
          <h2 className="settings-card__title">{t('settings.about.title')}</h2>
          <div className="settings-info-list">
            <div className="settings-info-item">
              <span className="settings-info-item__label">{t('settings.about.version.label')}</span>
              <span className="settings-info-item__value">0.1.0</span>
            </div>
            <div className="settings-info-item">
              <span className="settings-info-item__label">{t('settings.about.arch.label')}</span>
              <span className="settings-info-item__value">
                {t('settings.about.arch.value')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
