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

// ── Workspace card ───────────────────────────────────────────────────────────

function WorkspaceCard() {
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
      setLogoError('Image must be 200 KB or smaller.');
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
      <h2 className="settings-card__title">Workspace</h2>

      {/* Workspace name */}
      <div className="form-field">
        <label className="form-label" htmlFor="workspace-name">
          Workspace name
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
              Save
            </button>
            {nameSaved && <span className="settings-saved">Saved</span>}
          </div>
        </form>
        <p className="form-hint form-hint--block">
          Shown in the sidebar. Leave blank to use the default NEXUS branding.
        </p>
      </div>

      {/* Logo upload */}
      <div className="form-field">
        <label className="form-label">Logo</label>
        <div className="logo-upload-row">
          {branding.workspaceLogo ? (
            <img
              className="logo-preview"
              src={branding.workspaceLogo}
              alt="Workspace logo"
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
              {branding.workspaceLogo ? 'Replace logo' : 'Upload logo'}
            </button>
            {branding.workspaceLogo && (
              <button
                type="button"
                className="btn btn--danger btn--sm"
                onClick={handleRemoveLogo}
              >
                Remove logo
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
          Max 200 KB. Displayed at up to 28 px height in the sidebar.
        </p>
      </div>

      {/* Theme picker */}
      <div className="form-field">
        <label className="form-label">Color theme</label>
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
          Applied immediately and persisted across restarts.
        </p>
      </div>
    </div>
  );
}

// ── Main Settings page ───────────────────────────────────────────────────────

export function Settings() {
  const { pollIntervalSec, updatePollInterval } = useStore();
  const [interval, setInterval] = useState(String(pollIntervalSec));
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const n = parseInt(interval, 10);
    if (isNaN(n) || n < 15) {
      setError('Minimum interval is 15 seconds.');
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
        <h1 className="page__title">Settings</h1>
      </div>

      <div className="settings-layout">
        {/* Workspace branding — first card */}
        <WorkspaceCard />

        {/* Poll interval */}
        <div className="card settings-card">
          <h2 className="settings-card__title">Polling</h2>
          <form onSubmit={handleSave}>
            <div className="form-field">
              <label className="form-label" htmlFor="poll-interval">
                Refresh interval (seconds)
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
                  Save
                </button>
                {saved && <span className="settings-saved">Saved</span>}
              </div>
              {error && <p className="form-error">{error}</p>}
              <p className="form-hint form-hint--block">
                Minimum 15 s. How often Nexus re-checks all projects in the background.
              </p>
            </div>
          </form>
        </div>

        {/* Storage info */}
        <div className="card settings-card">
          <h2 className="settings-card__title">Data Storage</h2>
          <div className="settings-info-list">
            <div className="settings-info-item">
              <span className="settings-info-item__label">Project data</span>
              <span className="settings-info-item__value">
                SQLite database (<code>nexus.db</code>) in the app data directory.
                No data leaves your machine.
              </span>
            </div>
            <div className="settings-info-item">
              <span className="settings-info-item__label">Secrets</span>
              <span className="settings-info-item__value">
                Stored in the OS credential store — Windows Credential Manager on
                Windows, macOS Keychain on macOS. Never written to disk in plain text.
              </span>
            </div>
            <div className="settings-info-item">
              <span className="settings-info-item__label">Bundle format</span>
              <span className="settings-info-item__value">
                Exported <code>.nexusproj</code> files are encrypted with AES-256-GCM.
                The key is derived from your passphrase using Argon2id.
                Without the passphrase the file is unreadable.
              </span>
            </div>
          </div>
        </div>

        {/* About */}
        <div className="card settings-card">
          <h2 className="settings-card__title">About</h2>
          <div className="settings-info-list">
            <div className="settings-info-item">
              <span className="settings-info-item__label">Version</span>
              <span className="settings-info-item__value">0.1.0</span>
            </div>
            <div className="settings-info-item">
              <span className="settings-info-item__label">Architecture</span>
              <span className="settings-info-item__value">
                Tauri 2 · React 19 · local-first
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
