import { useEffect, useRef, useState } from 'react';
import type { Project, ProjectStatus } from '../types';
import { buildHandoverDoc, saveHandoverDoc } from '../lib/handover';
import { copyText } from '../lib/clipboard';
import { useI18n } from '../lib/i18n';

interface HandoverModalProps {
  project: Project;
  status: ProjectStatus | undefined;
  onClose: () => void;
}

export function HandoverModal({ project, status, onClose }: HandoverModalProps) {
  const { t } = useI18n();
  const [doc, setDoc] = useState('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [savedTo, setSavedTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mouseDownOnOverlay = useRef(false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    buildHandoverDoc(project, status)
      .then(text => { if (!cancelled) setDoc(text); })
      .catch(err => { if (!cancelled) setError(String(err)); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => {
      cancelled = true;
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
    };
    // Regenerate only when the modal is (re)opened for a project.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.id]);

  async function handleCopy() {
    const ok = await copyText(doc);
    if (!ok) {
      setError('clipboard unavailable');
      return;
    }
    setError(null);
    setCopied(true);
    copiedTimer.current = setTimeout(() => setCopied(false), 2500);
  }

  async function handleSave() {
    setError(null);
    setSavedTo(null);
    try {
      const path = await saveHandoverDoc(project.name, doc);
      if (path) setSavedTo(path);
    } catch (err) {
      setError(String(err));
    }
  }

  return (
    <div
      className="modal-overlay"
      onMouseDown={e => { mouseDownOnOverlay.current = e.target === e.currentTarget; }}
      onClick={e => {
        if (e.target === e.currentTarget && mouseDownOnOverlay.current) onClose();
        mouseDownOnOverlay.current = false;
      }}
    >
      <div className="modal modal--large">
        <div className="modal__header">
          <h2 className="modal__title">{t('detail.handover.title')}</h2>
          <button className="modal__close" onClick={onClose} aria-label={t('common.close')}>✕</button>
        </div>

        <div className="modal__body modal__body--scroll">
          <p className="form-hint form-hint--block">{t('detail.handover.hint')}</p>

          {error && <p className="form-error">{t('detail.handover.error')} {error}</p>}
          {savedTo && (
            <p className="form-hint form-hint--block">
              {t('detail.handover.savedTo')} <code>{savedTo}</code>
            </p>
          )}

          {loading ? (
            <p className="muted" style={{ fontSize: 13 }}>{t('detail.handover.generating')}</p>
          ) : (
            <pre
              className="notes-text"
              style={{
                maxHeight: '50vh',
                overflow: 'auto',
                fontSize: 12,
                lineHeight: 1.5,
                whiteSpace: 'pre-wrap',
                direction: 'ltr',
                textAlign: 'left',
              }}
            >
              {doc}
            </pre>
          )}
        </div>

        <div className="modal__footer" style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', padding: '12px 16px' }}>
          {copied && <span className="settings-saved">{t('detail.handover.copied')}</span>}
          <button className="btn btn--primary" onClick={handleCopy} disabled={loading || !doc}>
            {t('detail.handover.copy')}
          </button>
          <button className="btn btn--ghost" onClick={handleSave} disabled={loading || !doc}>
            {t('detail.handover.save')}
          </button>
          <button className="btn btn--ghost" onClick={onClose}>
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
}
