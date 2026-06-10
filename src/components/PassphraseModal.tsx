import { useState, useEffect, useRef } from 'react';
import { useI18n } from '../lib/i18n';

interface PassphraseModalProps {
  title: string;
  mode: 'export' | 'import';
  onConfirm(passphrase: string): void;
  onCancel(): void;
}

export function PassphraseModal({ title, mode, onConfirm, onCancel }: PassphraseModalProps) {
  const { t } = useI18n();
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
      setError(t('projects.passphrase.errorRequired'));
      return;
    }
    if (mode === 'export' && passphrase !== confirm) {
      setError(t('projects.passphrase.errorMismatch'));
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
              ? t('projects.passphrase.exportHint')
              : t('projects.passphrase.importHint')}
          </p>

          <div className="form-field">
            <label className="form-label" htmlFor="passphrase-input">
              {t('projects.passphrase.label')}
            </label>
            <input
              ref={inputRef}
              id="passphrase-input"
              type="password"
              className="form-input"
              value={passphrase}
              onChange={e => { setPassphrase(e.target.value); setError(''); }}
              autoComplete="new-password"
              placeholder={t('projects.passphrase.placeholder')}
            />
          </div>

          {mode === 'export' && (
            <div className="form-field">
              <label className="form-label" htmlFor="passphrase-confirm">
                {t('projects.passphrase.confirmLabel')}
              </label>
              <input
                id="passphrase-confirm"
                type="password"
                className="form-input"
                value={confirm}
                onChange={e => { setConfirm(e.target.value); setError(''); }}
                autoComplete="new-password"
                placeholder={t('projects.passphrase.confirmPlaceholder')}
              />
            </div>
          )}

          {error && <p className="form-error">{error}</p>}

          <div className="modal__actions">
            <button type="button" className="btn btn--ghost" onClick={onCancel}>
              {t('common.cancel')}
            </button>
            <button type="submit" className="btn btn--primary">
              {mode === 'export' ? t('projects.passphrase.exportBtn') : t('projects.passphrase.importBtn')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
