import { useState } from 'react';
import { useStore } from '../state/store';

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
