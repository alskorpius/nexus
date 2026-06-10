import { useState } from 'react';
import type { Ticket } from '../types';
import { timeAgo } from '../lib/format';
import { TicketModal } from './TicketModal';

type FilterTab = 'all' | 'open' | 'resolved' | 'closed';

interface TicketTableProps {
  tickets: Ticket[];
  onStatusChange?: (ticketId: number | string, status: string) => Promise<void>;
  onSendMessage?: (ticketId: number | string, message: string) => Promise<void>;
  onLoadMessages?: (ticketId: number | string) => Promise<import('../types').TicketMessage[]>;
}

const STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  pending: 'Pending',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
};

const PRIORITY_LABELS: Record<string, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

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
  const [filter, setFilter] = useState<FilterTab>('all');
  const [openTicketId, setOpenTicketId] = useState<number | string | null>(null);

  const openTicket = openTicketId !== null ? tickets.find(t => t.id === openTicketId) : undefined;

  const counts = {
    all: tickets.length,
    open: tickets.filter(isOpen).length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
    closed: tickets.filter(t => t.status === 'closed').length,
  };

  const filtered = tickets.filter(t => {
    if (filter === 'all') return true;
    if (filter === 'open') return isOpen(t);
    return t.status === filter;
  });

  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'open', label: 'Open' },
    { key: 'resolved', label: 'Resolved' },
    { key: 'closed', label: 'Closed' },
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
            {tab.label}
            <span className="chip__count">{counts[tab.key]}</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="ticket-table__empty">
          <span className="ticket-table__empty-icon">✓</span>
          <p>No tickets in this view.</p>
        </div>
      ) : (
        <table className="table table--clickable">
          <thead>
            <tr>
              <th>Subject</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Updated</th>
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
                    {STATUS_LABELS[ticket.status] ?? ticket.status}
                  </span>
                </td>
                <td>
                  <span className={priorityClass(ticket.priority)}>
                    {PRIORITY_LABELS[ticket.priority] ?? ticket.priority}
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
