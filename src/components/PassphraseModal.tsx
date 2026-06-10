import { useState, useEffect, useRef } from 'react';

interface PassphraseModalProps {
  title: string;
  mode: 'export' | 'import';
  onConfirm(passphrase: string): void;
  onCancel(): void;
}

export function PassphraseModal({ title, mode, onConfirm, onCancel }: PassphraseModalProps) {
  const [passphrase, setPassphrase] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onCancel]);

  // Close on outside click only when the press also started on the overlay,
  // so a drag from inside an input to the overlay doesn't dismiss the modal
  const mouseDownOnOverlay = useRef(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passphrase.trim()) {
      setError('Passphrase is required.');
      return;
    }
    if (mode === 'export' && passphrase !== confirm) {
      setError('Passphrases do not match.');
      return;
    }
    onConfirm(passphrase);
  };

  return (
    <div
      className="modal-overlay"
      onMouseDown={e => { mouseDownOnOverlay.current = e.target === e.currentTarget; }}
      onClick={e => {
        if (e.target === e.currentTarget && mouseDownOnOverlay.current) onCancel();
        mouseDownOnOverlay.current = false;
      }}
    >
      <div className="modal">
        <div className="modal__header">
          <h2 className="modal__title">{title}</h2>
        </div>

        <form className="modal__body" onSubmit={handleSubmit}>
          <p className="modal__hint">
            {mode === 'export'
              ? 'This passphrase encrypts the bundle file (AES-256-GCM + Argon2id). Store it safely — there is no recovery.'
              : 'Enter the passphrase used when the bundle was exported.'}
          </p>

          <div className="form-field">
            <label className="form-label" htmlFor="passphrase-input">
              Passphrase
            </label>
            <input
              ref={inputRef}
              id="passphrase-input"
              type="password"
              className="form-input"
              value={passphrase}
              onChange={e => { setPassphrase(e.target.value); setError(''); }}
              autoComplete="new-password"
              placeholder="Enter passphrase"
            />
          </div>

          {mode === 'export' && (
            <div className="form-field">
              <label className="form-label" htmlFor="passphrase-confirm">
                Confirm passphrase
              </label>
              <input
                id="passphrase-confirm"
                type="password"
                className="form-input"
                value={confirm}
                onChange={e => { setConfirm(e.target.value); setError(''); }}
                autoComplete="new-password"
                placeholder="Repeat passphrase"
              />
            </div>
          )}

          {error && <p className="form-error">{error}</p>}

          <div className="modal__actions">
            <button type="button" className="btn btn--ghost" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="btn btn--primary">
              {mode === 'export' ? 'Export' : 'Import'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
