import { useState } from 'react';
import type { Ticket } from '../types';
import { timeAgo } from '../lib/format';
import { TicketModal } from './TicketModal';
import { useI18n } from '../lib/i18n';

type FilterTab = 'all' | 'open' | 'resolved' | 'closed';

interface TicketTableProps {
  tickets: Ticket[];
  onStatusChange?: (ticketId: number | string, status: string) => Promise<void>;
  onSendMessage?: (ticketId: number | string, message: string) => Promise<void>;
  onLoadMessages?: (ticketId: number | string) => Promise<import('../types').TicketMessage[]>;
}

function statusClass(status: string): string {
  switch (status) {
    case 'open': return 'badge badge--blue';
    case 'pending': return 'badge badge--blue';
    case 'in_progress': return 'badge badge--amber';
    case 'resolved': return 'badge badge--green';
    case 'closed': return 'badge badge--muted';
    default: return 'badge badge--muted';
  }
}

function priorityClass(priority: string): string {
  switch (priority) {
    case 'critical': return 'badge badge--red-strong';
    case 'high': return 'badge badge--red';
    case 'medium': return 'badge badge--amber';
    case 'low': return 'badge badge--muted';
    default: return 'badge badge--muted';
  }
}

function isOpen(t: Ticket) {
  return t.status === 'open' || t.status === 'pending' || t.status === 'in_progress';
}

export function TicketTable({ tickets, onStatusChange, onSendMessage, onLoadMessages }: TicketTableProps) {
  const { t } = useI18n();
  const [filter, setFilter] = useState<FilterTab>('all');
  const [openTicketId, setOpenTicketId] = useState<number | string | null>(null);

  const openTicket = openTicketId !== null ? tickets.find(tk => tk.id === openTicketId) : undefined;

  const counts = {
    all: tickets.length,
    open: tickets.filter(isOpen).length,
    resolved: tickets.filter(tk => tk.status === 'resolved').length,
    closed: tickets.filter(tk => tk.status === 'closed').length,
  };

  const filtered = tickets.filter(tk => {
    if (filter === 'all') return true;
    if (filter === 'open') return isOpen(tk);
    return tk.status === filter;
  });

  // Status label lookup using i18n
  function statusLabel(status: string): string {
    const map: Record<string, string> = {
      open: t('tickets.status.open'),
      pending: t('tickets.status.pending'),
      in_progress: t('tickets.status.inProgress'),
      resolved: t('tickets.status.resolved'),
      closed: t('tickets.status.closed'),
    };
    return map[status] ?? status;
  }

  // Priority label lookup using i18n
  function priorityLabel(priority: string): string {
    const map: Record<string, string> = {
      critical: t('tickets.priority.critical'),
      high: t('tickets.priority.high'),
      medium: t('tickets.priority.medium'),
      low: t('tickets.priority.low'),
    };
    return map[priority] ?? priority;
  }

  const tabs: { key: FilterTab; labelKey: string }[] = [
    { key: 'all', labelKey: 'tickets.filter.all' },
    { key: 'open', labelKey: 'tickets.filter.open' },
    { key: 'resolved', labelKey: 'tickets.filter.resolved' },
    { key: 'closed', labelKey: 'tickets.filter.closed' },
  ];

  return (
    <div className="ticket-table">
      <div className="ticket-table__filters">
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`chip${filter === tab.key ? ' chip--active' : ''}`}
            onClick={() => setFilter(tab.key)}
          >
            {t(tab.labelKey)}
            <span className="chip__count">{counts[tab.key]}</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="ticket-table__empty">
          <span className="ticket-table__empty-icon">✓</span>
          <p>{t('tickets.empty')}</p>
        </div>
      ) : (
        <table className="table table--clickable">
          <thead>
            <tr>
              <th>{t('tickets.col.subject')}</th>
              <th>{t('tickets.col.status')}</th>
              <th>{t('tickets.col.priority')}</th>
              <th>{t('tickets.col.updated')}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(ticket => (
              <tr key={ticket.id} onClick={() => setOpenTicketId(ticket.id)}>
                <td className="table__subject">
                  <span className="table__subject-text" title={ticket.subject}>
                    {ticket.subject}
                  </span>
                </td>
                <td>
                  <span className={statusClass(ticket.status)}>
                    {statusLabel(ticket.status)}
                  </span>
                </td>
                <td>
                  <span className={priorityClass(ticket.priority)}>
                    {priorityLabel(ticket.priority)}
                  </span>
                </td>
                <td className="table__time">
                  <span className="muted">{timeAgo(ticket.updatedAt)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {openTicket && (
        <TicketModal
          ticket={openTicket}
          onClose={() => setOpenTicketId(null)}
          onStatusChange={
            onStatusChange ? status => onStatusChange(openTicket.id, status) : undefined
          }
          onSendMessage={
            onSendMessage ? message => onSendMessage(openTicket.id, message) : undefined
          }
          onLoadMessages={
            onLoadMessages ? () => onLoadMessages(openTicket.id) : undefined
          }
        />
      )}
    </div>
  );
}
