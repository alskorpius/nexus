// Dashboard page strings. `en` is the source of truth; `uk` must mirror its keys.

const en = {
  title: 'Dashboard',
  // Sidebar nav labels
  'nav.dashboard': 'Dashboard',
  'nav.projects': 'Projects',
  'nav.ai': 'AI Usage',
  'nav.settings': 'Settings',
  'nav.subBrand': 'Project Control Center',
  // Empty state
  'empty.title': 'No projects yet',
  'empty.body': 'Add your first project to start monitoring services, tickets, and git activity.',
  'empty.cta': 'Go to Projects',
  'refreshAll': 'Refresh all',
  'stats.projects': 'Projects',
  'stats.healthy': 'Healthy',
  'stats.warning': 'Warning',
  'stats.critical': 'Critical',
  'stats.openTickets': 'Open Tickets',
  'stats.criticalTickets': 'Critical Tickets',
  'stats.openMrs': 'Open MRs',
  'stats.failedPipelines': 'Failed Pipelines',
  'section.projects': 'Projects',
  'row.tickets': '{n} tickets',
  'row.ticketsZero': '0 tickets',
  'row.mrs': '{n} MRs',
  'row.mrsZero': '0 MRs',
  'row.notChecked': 'not checked',
  'row.sslTitle': 'SSL expires in {n} days',
  'row.sslLabel': 'SSL {n}d',
  'row.refreshAriaLabel': 'Refresh project',
};

const uk: Record<keyof typeof en, string> = {
  title: 'Дашборд',
  // Sidebar nav labels
  'nav.dashboard': 'Дашборд',
  'nav.projects': 'Проєкти',
  'nav.ai': 'Використання AI',
  'nav.settings': 'Налаштування',
  'nav.subBrand': 'Центр керування проєктами',
  // Empty state
  'empty.title': 'Проєктів ще немає',
  'empty.body': 'Додайте перший проєкт, щоб стежити за сервісами, тікетами та активністю у репозиторії.',
  'empty.cta': 'Перейти до проєктів',
  'refreshAll': 'Оновити все',
  'stats.projects': 'Проєкти',
  'stats.healthy': 'Працюють',
  'stats.warning': 'Увага',
  'stats.critical': 'Критично',
  'stats.openTickets': 'Відкриті тікети',
  'stats.criticalTickets': 'Критичні тікети',
  'stats.openMrs': 'Відкриті MR',
  'stats.failedPipelines': 'Збої пайплайнів',
  'section.projects': 'Проєкти',
  'row.tickets': '{n} тікетів',
  'row.ticketsZero': '0 тікетів',
  'row.mrs': '{n} MR',
  'row.mrsZero': '0 MR',
  'row.notChecked': 'не перевірявся',
  'row.sslTitle': 'SSL спливає через {n} дн.',
  'row.sslLabel': 'SSL {n}д',
  'row.refreshAriaLabel': 'Оновити проєкт',
};

export const dashboard = { en, uk };
