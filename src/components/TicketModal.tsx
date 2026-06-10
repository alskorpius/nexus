import { useState, useEffect, useRef, useCallback } from 'react';
import type { Ticket, TicketMessage } from '../types';
import { formatDate, timeAgo } from '../lib/format';

interface TicketModalProps {
  ticket: Ticket;
  onClose(): void;
  onStatusChange?: (status: string) => Promise<void>;
  onSendMessage?: (message: string) => Promise<void>;
  onLoadMessages?: () => Promise<TicketMessage[]>;
}

const STATUS_OPTIONS = [
  { value: 'open', label: 'Open' },
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

export function TicketModal({
  ticket,
  onClose,
  onStatusChange,
  onSendMessage,
  onLoadMessages,
}: TicketModalProps) {
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
      setSendResult('Message sent.');
      loadThread();
    } catch (err) {
      setError(String(err));
    } finally {
      setSending(false);
    }
  }

  const statusChanged = status !== ticket.status;
  const knownStatus = STATUS_OPTIONS.some(o => o.value === ticket.status);

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
          <h2 className="modal__title">Ticket {ticket.ref}</h2>
          <button className="modal__close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="modal__body modal__body--scroll">
          <h3 className="ticket-modal__subject">{ticket.subject}</h3>

          <div className="ticket-modal__meta">
            <div className="ticket-modal__meta-item">
              <span className="ticket-modal__meta-label">Priority</span>
              <span>{ticket.priority}</span>
            </div>
            <div className="ticket-modal__meta-item">
              <span className="ticket-modal__meta-label">Created</span>
              <span>{formatDate(ticket.createdAt)}</span>
            </div>
            <div className="ticket-modal__meta-item">
              <span className="ticket-modal__meta-label">Updated</span>
              <span>{formatDate(ticket.updatedAt)}</span>
            </div>
          </div>

          {ticket.details && (
            <div className="ticket-modal__details">
              <span className="ticket-modal__meta-label">Details</span>
              <pre className="notes-text">{ticket.details}</pre>
            </div>
          )}

          <div className="form-field">
            <label className="form-label" htmlFor="ticket-status">Status</label>
            <select
              id="ticket-status"
              className="form-select"
              value={status}
              onChange={e => setStatus(e.target.value)}
              disabled={!onStatusChange || saving}
            >
              {!knownStatus && <option value={ticket.status}>{ticket.status}</option>}
              {STATUS_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {onLoadMessages && thread !== null && thread.length > 0 && (
            <div className="ticket-modal__thread">
              <span className="ticket-modal__meta-label">Messages ({thread.length})</span>
              {thread.map((m, i) => (
                <div key={m.id ?? i} className="ticket-message">
                  <div className="ticket-message__head">
                    <span className="ticket-message__author">{m.author ?? 'unknown'}</span>
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
            <p className="form-hint form-hint--block">Could not load messages: {threadError}</p>
          )}

          {onSendMessage && (
            <div className="form-field">
              <label className="form-label" htmlFor="ticket-message">Reply</label>
              <textarea
                id="ticket-message"
                className="form-input form-textarea"
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Write a message to this ticket…"
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
                  {sending ? 'Sending…' : 'Send message'}
                </button>
              </div>
            </div>
          )}

          {error && <p className="form-error form-error--global">{error}</p>}

          <div className="modal__actions">
            <button type="button" className="btn btn--ghost" onClick={onClose}>
              Close
            </button>
            {onStatusChange && (
              <button
                type="button"
                className="btn btn--primary"
                onClick={handleApply}
                disabled={!statusChanged || saving}
              >
                {saving ? 'Saving…' : 'Update status'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
