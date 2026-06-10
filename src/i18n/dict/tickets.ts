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

const es: Record<keyof typeof en, string> = {
  // TicketTable filter tabs
  'filter.all': 'Todos',
  'filter.open': 'Abiertos',
  'filter.resolved': 'Resueltos',
  'filter.closed': 'Cerrados',

  // TicketTable empty state
  'empty': 'No hay tickets en esta vista.',

  // TicketTable column headers
  'col.subject': 'Asunto',
  'col.status': 'Estado',
  'col.priority': 'Prioridad',
  'col.updated': 'Actualizado',

  // Status labels (displayed in badges and select options)
  'status.open': 'Abierto',
  'status.pending': 'Pendiente',
  'status.inProgress': 'En progreso',
  'status.resolved': 'Resuelto',
  'status.closed': 'Cerrado',

  // Priority labels
  'priority.critical': 'Crítico',
  'priority.high': 'Alto',
  'priority.medium': 'Medio',
  'priority.low': 'Bajo',

  // TicketModal
  'modal.title': 'Ticket {ref}',
  'modal.close': 'Cerrar',
  'modal.meta.priority': 'Prioridad',
  'modal.meta.created': 'Creado',
  'modal.meta.updated': 'Actualizado',
  'modal.meta.details': 'Detalles',
  'modal.meta.status': 'Estado',
  'modal.thread': 'Mensajes ({count})',
  'modal.author.unknown': 'desconocido',
  'modal.threadError': 'No se pudieron cargar los mensajes:',
  'modal.reply.label': 'Responder',
  'modal.reply.placeholder': 'Escribe un mensaje para este ticket…',
  'modal.reply.sending': 'Enviando…',
  'modal.reply.send': 'Enviar mensaje',
  'modal.reply.sent': 'Mensaje enviado.',
  'modal.status.saving': 'Guardando…',
  'modal.status.update': 'Actualizar estado',
};

const de: Record<keyof typeof en, string> = {
  // TicketTable filter tabs
  'filter.all': 'Alle',
  'filter.open': 'Offen',
  'filter.resolved': 'Gelöst',
  'filter.closed': 'Geschlossen',

  // TicketTable empty state
  'empty': 'Keine Tickets in dieser Ansicht.',

  // TicketTable column headers
  'col.subject': 'Betreff',
  'col.status': 'Status',
  'col.priority': 'Priorität',
  'col.updated': 'Aktualisiert',

  // Status labels (displayed in badges and select options)
  'status.open': 'Offen',
  'status.pending': 'Ausstehend',
  'status.inProgress': 'In Bearbeitung',
  'status.resolved': 'Gelöst',
  'status.closed': 'Geschlossen',

  // Priority labels
  'priority.critical': 'Kritisch',
  'priority.high': 'Hoch',
  'priority.medium': 'Mittel',
  'priority.low': 'Niedrig',

  // TicketModal
  'modal.title': 'Ticket {ref}',
  'modal.close': 'Schließen',
  'modal.meta.priority': 'Priorität',
  'modal.meta.created': 'Erstellt',
  'modal.meta.updated': 'Aktualisiert',
  'modal.meta.details': 'Details',
  'modal.meta.status': 'Status',
  'modal.thread': 'Nachrichten ({count})',
  'modal.author.unknown': 'unbekannt',
  'modal.threadError': 'Nachrichten konnten nicht geladen werden:',
  'modal.reply.label': 'Antworten',
  'modal.reply.placeholder': 'Schreibe eine Nachricht zu diesem Ticket…',
  'modal.reply.sending': 'Wird gesendet…',
  'modal.reply.send': 'Nachricht senden',
  'modal.reply.sent': 'Nachricht gesendet.',
  'modal.status.saving': 'Wird gespeichert…',
  'modal.status.update': 'Status aktualisieren',
};

const fr: Record<keyof typeof en, string> = {
  // TicketTable filter tabs
  'filter.all': 'Tous',
  'filter.open': 'Ouverts',
  'filter.resolved': 'Résolus',
  'filter.closed': 'Fermés',

  // TicketTable empty state
  'empty': 'Aucun ticket dans cette vue.',

  // TicketTable column headers
  'col.subject': 'Sujet',
  'col.status': 'Statut',
  'col.priority': 'Priorité',
  'col.updated': 'Mis à jour',

  // Status labels (displayed in badges and select options)
  'status.open': 'Ouvert',
  'status.pending': 'En attente',
  'status.inProgress': 'En cours',
  'status.resolved': 'Résolu',
  'status.closed': 'Fermé',

  // Priority labels
  'priority.critical': 'Critique',
  'priority.high': 'Élevée',
  'priority.medium': 'Moyenne',
  'priority.low': 'Faible',

  // TicketModal
  'modal.title': 'Ticket {ref}',
  'modal.close': 'Fermer',
  'modal.meta.priority': 'Priorité',
  'modal.meta.created': 'Créé',
  'modal.meta.updated': 'Mis à jour',
  'modal.meta.details': 'Détails',
  'modal.meta.status': 'Statut',
  'modal.thread': 'Messages ({count})',
  'modal.author.unknown': 'inconnu',
  'modal.threadError': 'Impossible de charger les messages :',
  'modal.reply.label': 'Répondre',
  'modal.reply.placeholder': 'Écrire un message pour ce ticket…',
  'modal.reply.sending': 'Envoi en cours…',
  'modal.reply.send': 'Envoyer le message',
  'modal.reply.sent': 'Message envoyé.',
  'modal.status.saving': 'Enregistrement…',
  'modal.status.update': 'Mettre à jour le statut',
};

const pt: Record<keyof typeof en, string> = {
  // TicketTable filter tabs
  'filter.all': 'Todos',
  'filter.open': 'Abertos',
  'filter.resolved': 'Resolvidos',
  'filter.closed': 'Fechados',

  // TicketTable empty state
  'empty': 'Nenhum chamado nesta visualização.',

  // TicketTable column headers
  'col.subject': 'Assunto',
  'col.status': 'Status',
  'col.priority': 'Prioridade',
  'col.updated': 'Atualizado',

  // Status labels (displayed in badges and select options)
  'status.open': 'Aberto',
  'status.pending': 'Pendente',
  'status.inProgress': 'Em andamento',
  'status.resolved': 'Resolvido',
  'status.closed': 'Fechado',

  // Priority labels
  'priority.critical': 'Crítico',
  'priority.high': 'Alto',
  'priority.medium': 'Médio',
  'priority.low': 'Baixo',

  // TicketModal
  'modal.title': 'Chamado {ref}',
  'modal.close': 'Fechar',
  'modal.meta.priority': 'Prioridade',
  'modal.meta.created': 'Criado',
  'modal.meta.updated': 'Atualizado',
  'modal.meta.details': 'Detalhes',
  'modal.meta.status': 'Status',
  'modal.thread': 'Mensagens ({count})',
  'modal.author.unknown': 'desconhecido',
  'modal.threadError': 'Não foi possível carregar as mensagens:',
  'modal.reply.label': 'Responder',
  'modal.reply.placeholder': 'Escreva uma mensagem para este chamado…',
  'modal.reply.sending': 'Enviando…',
  'modal.reply.send': 'Enviar mensagem',
  'modal.reply.sent': 'Mensagem enviada.',
  'modal.status.saving': 'Salvando…',
  'modal.status.update': 'Atualizar status',
};

const zh: Record<keyof typeof en, string> = {
  // TicketTable filter tabs
  'filter.all': '全部',
  'filter.open': '待处理',
  'filter.resolved': '已解决',
  'filter.closed': '已关闭',

  // TicketTable empty state
  'empty': '此视图中没有工单。',

  // TicketTable column headers
  'col.subject': '主题',
  'col.status': '状态',
  'col.priority': '优先级',
  'col.updated': '更新时间',

  // Status labels (displayed in badges and select options)
  'status.open': '待处理',
  'status.pending': '等待中',
  'status.inProgress': '处理中',
  'status.resolved': '已解决',
  'status.closed': '已关闭',

  // Priority labels
  'priority.critical': '紧急',
  'priority.high': '高',
  'priority.medium': '中',
  'priority.low': '低',

  // TicketModal
  'modal.title': '工单 {ref}',
  'modal.close': '关闭',
  'modal.meta.priority': '优先级',
  'modal.meta.created': '创建时间',
  'modal.meta.updated': '更新时间',
  'modal.meta.details': '详情',
  'modal.meta.status': '状态',
  'modal.thread': '消息（{count}）',
  'modal.author.unknown': '未知',
  'modal.threadError': '无法加载消息：',
  'modal.reply.label': '回复',
  'modal.reply.placeholder': '为此工单撰写消息…',
  'modal.reply.sending': '发送中…',
  'modal.reply.send': '发送消息',
  'modal.reply.sent': '消息已发送。',
  'modal.status.saving': '保存中…',
  'modal.status.update': '更新状态',
};

const ar: Record<keyof typeof en, string> = {
  // TicketTable filter tabs
  'filter.all': 'الكل',
  'filter.open': 'مفتوحة',
  'filter.resolved': 'محلولة',
  'filter.closed': 'مغلقة',

  // TicketTable empty state
  'empty': 'لا توجد تذاكر في هذا العرض.',

  // TicketTable column headers
  'col.subject': 'الموضوع',
  'col.status': 'الحالة',
  'col.priority': 'الأولوية',
  'col.updated': 'آخر تحديث',

  // Status labels (displayed in badges and select options)
  'status.open': 'مفتوحة',
  'status.pending': 'قيد الانتظار',
  'status.inProgress': 'قيد المعالجة',
  'status.resolved': 'محلولة',
  'status.closed': 'مغلقة',

  // Priority labels
  'priority.critical': 'حرجة',
  'priority.high': 'عالية',
  'priority.medium': 'متوسطة',
  'priority.low': 'منخفضة',

  // TicketModal
  'modal.title': 'تذكرة {ref}',
  'modal.close': 'إغلاق',
  'modal.meta.priority': 'الأولوية',
  'modal.meta.created': 'تاريخ الإنشاء',
  'modal.meta.updated': 'آخر تحديث',
  'modal.meta.details': 'التفاصيل',
  'modal.meta.status': 'الحالة',
  'modal.thread': 'الرسائل ({count})',
  'modal.author.unknown': 'غير معروف',
  'modal.threadError': 'تعذّر تحميل الرسائل:',
  'modal.reply.label': 'رد',
  'modal.reply.placeholder': 'اكتب رسالة لهذه التذكرة…',
  'modal.reply.sending': 'جارٍ الإرسال…',
  'modal.reply.send': 'إرسال الرسالة',
  'modal.reply.sent': 'تم إرسال الرسالة.',
  'modal.status.saving': 'جارٍ الحفظ…',
  'modal.status.update': 'تحديث الحالة',
};

export const tickets = { en, uk, es, de, fr, pt, zh, ar };
