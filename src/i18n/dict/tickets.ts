// TicketTable + TicketModal strings. `en` is the source of truth; `uk` must mirror its keys.

const en = {
  // TicketTable filter tabs
  'filter.all': 'All',
  'filter.open': 'Open',
  'filter.resolved': 'Resolved',
  'filter.closed': 'Closed',

  // TicketTable empty state
  'empty': 'No tickets in this view.',

  // TicketTable column headers
  'col.subject': 'Subject',
  'col.status': 'Status',
  'col.priority': 'Priority',
  'col.updated': 'Updated',

  // Status labels (displayed in badges and select options)
  'status.open': 'Open',
  'status.pending': 'Pending',
  'status.inProgress': 'In Progress',
  'status.resolved': 'Resolved',
  'status.closed': 'Closed',

  // Priority labels
  'priority.critical': 'Critical',
  'priority.high': 'High',
  'priority.medium': 'Medium',
  'priority.low': 'Low',

  // TicketModal
  'modal.title': 'Ticket {ref}',
  'modal.close': 'Close',
  'modal.meta.priority': 'Priority',
  'modal.meta.created': 'Created',
  'modal.meta.updated': 'Updated',
  'modal.meta.details': 'Details',
  'modal.meta.status': 'Status',
  'modal.thread': 'Messages ({count})',
  'modal.author.unknown': 'unknown',
  'modal.threadError': 'Could not load messages:',
  'modal.reply.label': 'Reply',
  'modal.reply.placeholder': 'Write a message to this ticket…',
  'modal.reply.sending': 'Sending…',
  'modal.reply.send': 'Send message',
  'modal.reply.sent': 'Message sent.',
  'modal.status.saving': 'Saving…',
  'modal.status.update': 'Update status',
};

const uk: Record<keyof typeof en, string> = {
  'filter.all': 'Усі',
  'filter.open': 'Відкриті',
  'filter.resolved': 'Вирішені',
  'filter.closed': 'Закриті',

  'empty': 'Тікетів у цьому вигляді немає.',

  'col.subject': 'Тема',
  'col.status': 'Статус',
  'col.priority': 'Пріоритет',
  'col.updated': 'Оновлено',

  'status.open': 'Відкрито',
  'status.pending': 'В очікуванні',
  'status.inProgress': 'В роботі',
  'status.resolved': 'Вирішено',
  'status.closed': 'Закрито',

  'priority.critical': 'Критичний',
  'priority.high': 'Високий',
  'priority.medium': 'Середній',
  'priority.low': 'Низький',

  'modal.title': 'Тікет {ref}',
  'modal.close': 'Закрити',
  'modal.meta.priority': 'Пріоритет',
  'modal.meta.created': 'Створено',
  'modal.meta.updated': 'Оновлено',
  'modal.meta.details': 'Деталі',
  'modal.meta.status': 'Статус',
  'modal.thread': 'Повідомлення ({count})',
  'modal.author.unknown': 'невідомо',
  'modal.threadError': 'Не вдалося завантажити повідомлення:',
  'modal.reply.label': 'Відповідь',
  'modal.reply.placeholder': 'Напишіть повідомлення до цього тікета…',
  'modal.reply.sending': 'Надсилання…',
  'modal.reply.send': 'Надіслати повідомлення',
  'modal.reply.sent': 'Повідомлення надіслано.',
  'modal.status.saving': 'Збереження…',
  'modal.status.update': 'Оновити статус',
};

export const tickets = { en, uk };
