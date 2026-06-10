// Shared strings used across pages and components.
// Pattern: `en` is the source of truth; `uk` is type-checked to have the same keys.

const en = {
  save: 'Save',
  saved: 'Saved',
  cancel: 'Cancel',
  delete: 'Delete',
  close: 'Close',
  edit: 'Edit',
  refresh: 'Refresh',
  loading: 'Loading…',
  'health.healthy': 'Healthy',
  'health.warning': 'Warning',
  'health.critical': 'Critical',
  'health.unknown': 'Unknown',
  'timeAgo.justNow': 'just now',
  'timeAgo.seconds': '{n}s ago',
  'timeAgo.minutes': '{n}m ago',
  'timeAgo.hours': '{n}h ago',
  'timeAgo.days': '{n}d ago',
  'score.excellent': 'Excellent',
  'score.good': 'Good',
  'score.fair': 'Fair',
  'score.poor': 'Poor',
};

const uk: Record<keyof typeof en, string> = {
  save: 'Зберегти',
  saved: 'Збережено',
  cancel: 'Скасувати',
  delete: 'Видалити',
  close: 'Закрити',
  edit: 'Редагувати',
  refresh: 'Оновити',
  loading: 'Завантаження…',
  'health.healthy': 'Працює',
  'health.warning': 'Увага',
  'health.critical': 'Критично',
  'health.unknown': 'Невідомо',
  'timeAgo.justNow': 'щойно',
  'timeAgo.seconds': '{n} с тому',
  'timeAgo.minutes': '{n} хв тому',
  'timeAgo.hours': '{n} год тому',
  'timeAgo.days': '{n} дн тому',
  'score.excellent': 'Відмінно',
  'score.good': 'Добре',
  'score.fair': 'Задовільно',
  'score.poor': 'Погано',
};

export const common = { en, uk };
