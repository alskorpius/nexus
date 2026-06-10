// ProjectDetail page strings. `en` is the source of truth; `uk` must mirror its keys.

const en = {
  // Navigation
  'back': '← Projects',

  // Header actions
  'action.refresh': 'Refresh',
  'action.edit': 'Edit',
  'action.export': 'Export',
  'action.delete': 'Delete',

  // Checked at
  'checkedAgo': 'checked {ago}',

  // Export alerts
  'export.success': 'Exported to:',
  'export.failed': 'Export failed:',

  // Section: Service Health
  'health.title': 'Service Health',
  'health.label.endpoint': 'Endpoint',
  'health.label.httpStatus': 'HTTP Status',
  'health.label.error': 'Error',
  'health.label.reported': 'Reported',
  'health.notChecked': 'Not yet checked. Click Refresh.',
  'health.noEndpoint': 'No health endpoint configured.',

  // Section: SSL Certificate
  'ssl.title': 'SSL Certificate',
  'ssl.label.host': 'Host',
  'ssl.label.error': 'Error',
  'ssl.label.issuer': 'Issuer',
  'ssl.label.expires': 'Expires',
  'ssl.label.daysLeft': 'Days left',
  'ssl.label.note': 'Note',
  'ssl.days': '{days} days',

  // Section: Support Tickets
  'tickets.title': 'Support Tickets',
  'tickets.loadFailed': 'Failed to load tickets:',
  'tickets.configureAuth': 'Configure auth method and support endpoint to load tickets.',
  'tickets.notLoaded': 'Not yet loaded. Click Refresh.',

  // Section: Git Activity
  'git.title': 'Git Activity',
  'git.loadFailed': 'Failed to load git data:',
  'git.failedPipeline': '{count} failed pipeline',
  'git.failedPipelines': '{count} failed pipelines',
  'git.branches': 'Branches ({count})',
  'git.branchMore': '+{count} more',
  'git.mrs': 'Open MRs / PRs ({count})',
  'git.mrAuthor': 'by {author}',
  'git.commits': 'Recent Commits',
  'git.commitAuthor': 'by {author}',
  'git.noActivity': 'No recent activity.',
  'git.noProvider': 'No git provider configured.',
  'git.notLoaded': 'Not yet loaded. Click Refresh.',
  'git.branchUpdated': 'updated {ago}',

  // Section: Links
  'links.title': 'Links',
  'links.docs': '↗ Documentation',
  'links.repo': '↗ Repository',
  'links.deploy': '↗ Deploy',

  // Section: Notes
  'notes.title': 'Notes',

  // Delete modal
  'delete.title': 'Delete Project',
  'delete.body': 'Delete {name}? This removes the project and all stored secrets. This action cannot be undone.',
  'delete.confirm': 'Delete',

  // Not found
  'notFound': 'Project not found.',
  'notFound.back': 'Back to Projects',

  // Export modal title
  'export.modalTitle': 'Export "{name}"',
};

const uk: Record<keyof typeof en, string> = {
  'back': '← Проєкти',

  'action.refresh': 'Оновити',
  'action.edit': 'Редагувати',
  'action.export': 'Експорт',
  'action.delete': 'Видалити',

  'checkedAgo': 'перевірено {ago}',

  'export.success': 'Експортовано до:',
  'export.failed': 'Помилка експорту:',

  'health.title': 'Стан сервісу',
  'health.label.endpoint': 'Ендпоінт',
  'health.label.httpStatus': 'HTTP-статус',
  'health.label.error': 'Помилка',
  'health.label.reported': 'Повідомлено',
  'health.notChecked': 'Ще не перевірено. Натисніть «Оновити».',
  'health.noEndpoint': 'Ендпоінт перевірки не налаштовано.',

  'ssl.title': 'SSL-сертифікат',
  'ssl.label.host': 'Хост',
  'ssl.label.error': 'Помилка',
  'ssl.label.issuer': 'Видавець',
  'ssl.label.expires': 'Дійсний до',
  'ssl.label.daysLeft': 'Днів залишилось',
  'ssl.label.note': 'Примітка',
  'ssl.days': '{days} дн.',

  'tickets.title': 'Тікети підтримки',
  'tickets.loadFailed': 'Не вдалося завантажити тікети:',
  'tickets.configureAuth': 'Налаштуйте метод автентифікації та ендпоінт підтримки для завантаження тікетів.',
  'tickets.notLoaded': 'Ще не завантажено. Натисніть «Оновити».',

  'git.title': 'Git-активність',
  'git.loadFailed': 'Не вдалося завантажити дані Git:',
  'git.failedPipeline': '{count} невдалий пайплайн',
  'git.failedPipelines': '{count} невдалих пайплайнів',
  'git.branches': 'Гілки ({count})',
  'git.branchMore': '+ще {count}',
  'git.mrs': 'Відкриті MR / PR ({count})',
  'git.mrAuthor': 'від {author}',
  'git.commits': 'Останні коміти',
  'git.commitAuthor': 'від {author}',
  'git.noActivity': 'Немає останньої активності.',
  'git.noProvider': 'Git-провайдер не налаштовано.',
  'git.notLoaded': 'Ще не завантажено. Натисніть «Оновити».',
  'git.branchUpdated': 'оновлено {ago}',

  'links.title': 'Посилання',
  'links.docs': '↗ Документація',
  'links.repo': '↗ Репозиторій',
  'links.deploy': '↗ Деплой',

  'notes.title': 'Нотатки',

  'delete.title': 'Видалити проєкт',
  'delete.body': 'Видалити {name}? Це видалить проєкт і всі збережені секрети. Цю дію неможливо скасувати.',
  'delete.confirm': 'Видалити',

  'notFound': 'Проєкт не знайдено.',
  'notFound.back': 'До проєктів',

  'export.modalTitle': 'Експорт «{name}»',
};

export const detail = { en, uk };
