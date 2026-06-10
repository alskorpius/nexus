import { useState, useEffect, useRef, useCallback } from 'react';
import type { Ticket, TicketMessage } from '../types';
import { formatDate, timeAgo } from '../lib/format';
import { useI18n } from '../lib/i18n';

interface TicketModalProps {
  ticket: Ticket;
  onClose(): void;
  onStatusChange?: (status: string) => Promise<void>;
  onSendMessage?: (message: string) => Promise<void>;
  onLoadMessages?: () => Promise<TicketMessage[]>;
}

export function TicketModal({
  ticket,
  onClose,
  onStatusChange,
  onSendMessage,
  onLoadMessages,
}: TicketModalProps) {
  const { t } = useI18n();
  const [status, setStatus] = useState(ticket.status);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState('');
  const [thread, setThread] = useState<TicketMessage[] | null>(null);
  const [threadError, setThreadError] = useState('');

  const loadThread = useCallback(async () => {
    if (!onLoadMessages) return;
    try {
      setThread(await onLoadMessages());
      setThreadError('');
    } catch (err) {
      setThreadError(String(err));
    }
  }, [onLoadMessages]);

  useEffect(() => {
    loadThread();
  }, [loadThread]);

  // Close on outside click only when the press also started on the overlay
  const mouseDownOnOverlay = useRef(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  async function handleApply() {
    if (!onStatusChange || status === ticket.status) return;
    setSaving(true);
    setError('');
    try {
      await onStatusChange(status);
      onClose();
    } catch (err) {
      setError(String(err));
      setSaving(false);
    }
  }

  async function handleSend() {
    if (!onSendMessage || !message.trim()) return;
    setSending(true);
    setSendResult('');
    setError('');
    try {
      await onSendMessage(message.trim());
      setMessage('');
      setSendResult(t('tickets.modal.reply.sent'));
      loadThread();
    } catch (err) {
      setError(String(err));
    } finally {
      setSending(false);
    }
  }

  const statusChanged = status !== ticket.status;

  // Build the status options list. If the current ticket status is not in the
  // known set, show it verbatim as a leading option (API value, not translated).
  const knownValues = ['open', 'pending', 'in_progress', 'resolved', 'closed'];
  const knownStatus = knownValues.includes(ticket.status);

  // Priority display label; unknown API values fall back to the raw string.
  const priorityLabels: Record<string, string> = {
    critical: t('tickets.priority.critical'),
    high: t('tickets.priority.high'),
    medium: t('tickets.priority.medium'),
    low: t('tickets.priority.low'),
  };

  const statusOptions: { value: string; label: string }[] = [
    { value: 'open', label: t('tickets.status.open') },
    { value: 'pending', label: t('tickets.status.pending') },
    { value: 'in_progress', label: t('tickets.status.inProgress') },
    { value: 'resolved', label: t('tickets.status.resolved') },
    { value: 'closed', label: t('tickets.status.closed') },
  ];

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
          <h2 className="modal__title">{t('tickets.modal.title', { ref: ticket.ref })}</h2>
          <button className="modal__close" onClick={onClose} aria-label={t('tickets.modal.close')}>✕</button>
        </div>

        <div className="modal__body modal__body--scroll">
          <h3 className="ticket-modal__subject">{ticket.subject}</h3>

          <div className="ticket-modal__meta">
            <div className="ticket-modal__meta-item">
              <span className="ticket-modal__meta-label">{t('tickets.modal.meta.priority')}</span>
              <span>{priorityLabels[ticket.priority] ?? ticket.priority}</span>
            </div>
            <div className="ticket-modal__meta-item">
              <span className="ticket-modal__meta-label">{t('tickets.modal.meta.created')}</span>
              <span>{formatDate(ticket.createdAt)}</span>
            </div>
            <div className="ticket-modal__meta-item">
              <span className="ticket-modal__meta-label">{t('tickets.modal.meta.updated')}</span>
              <span>{formatDate(ticket.updatedAt)}</span>
            </div>
          </div>

          {ticket.details && (
            <div className="ticket-modal__details">
              <span className="ticket-modal__meta-label">{t('tickets.modal.meta.details')}</span>
              <pre className="notes-text">{ticket.details}</pre>
            </div>
          )}

          <div className="form-field">
            <label className="form-label" htmlFor="ticket-status">{t('tickets.modal.meta.status')}</label>
            <select
              id="ticket-status"
              className="form-select"
              value={status}
              onChange={e => setStatus(e.target.value)}
              disabled={!onStatusChange || saving}
            >
              {!knownStatus && <option value={ticket.status}>{ticket.status}</option>}
              {statusOptions.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {onLoadMessages && thread !== null && thread.length > 0 && (
            <div className="ticket-modal__thread">
              <span className="ticket-modal__meta-label">{t('tickets.modal.thread', { count: thread.length })}</span>
              {thread.map((m, i) => (
                <div key={m.id ?? i} className="ticket-message">
                  <div className="ticket-message__head">
                    <span className="ticket-message__author">{m.author ?? t('tickets.modal.author.unknown')}</span>
                    {m.createdAt && (
                      <span className="muted" title={formatDate(m.createdAt)}>
                        {timeAgo(m.createdAt)}
                      </span>
                    )}
                  </div>
                  <pre className="notes-text ticket-message__text">{m.message}</pre>
                </div>
              ))}
            </div>
          )}
          {threadError && (
            <p className="form-hint form-hint--block">{t('tickets.modal.threadError')} {threadError}</p>
          )}

          {onSendMessage && (
            <div className="form-field">
              <label className="form-label" htmlFor="ticket-message">{t('tickets.modal.reply.label')}</label>
              <textarea
                id="ticket-message"
                className="form-input form-textarea"
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder={t('tickets.modal.reply.placeholder')}
                rows={3}
                disabled={sending}
              />
              <div className="ticket-modal__send-row">
                {sendResult && <span className="text-healthy">{sendResult}</span>}
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={handleSend}
                  disabled={!message.trim() || sending}
                >
                  {sending ? t('tickets.modal.reply.sending') : t('tickets.modal.reply.send')}
                </button>
              </div>
            </div>
          )}

          {error && <p className="form-error form-error--global">{error}</p>}

          <div className="modal__actions">
            <button type="button" className="btn btn--ghost" onClick={onClose}>
              {t('common.close')}
            </button>
            {onStatusChange && (
              <button
                type="button"
                className="btn btn--primary"
                onClick={handleApply}
                disabled={!statusChanged || saving}
              >
                {saving ? t('tickets.modal.status.saving') : t('tickets.modal.status.update')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
