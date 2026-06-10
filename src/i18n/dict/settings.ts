// Settings page strings. `en` is the source of truth; `uk` must mirror its keys.

const en = {
  'language.label': 'Language',
  'language.hint': 'Interface language. Applied immediately and persisted across restarts.',

  // Page title
  title: 'Settings',

  // Workspace card
  'workspace.title': 'Workspace',
  'workspace.name.label': 'Workspace name',
  'workspace.name.hint': 'Shown in the sidebar. Leave blank to use the default NEXUS branding.',
  'workspace.logo.label': 'Logo',
  'workspace.logo.upload': 'Upload logo',
  'workspace.logo.replace': 'Replace logo',
  'workspace.logo.remove': 'Remove logo',
  'workspace.logo.alt': 'Workspace logo',
  'workspace.logo.hint': 'Max 200 KB. Displayed at up to 28 px height in the sidebar.',
  'workspace.logo.errorSize': 'Image must be 200 KB or smaller.',
  'workspace.theme.label': 'Color theme',
  'workspace.theme.hint': 'Applied immediately and persisted across restarts.',

  // Polling card
  'polling.title': 'Polling',
  'polling.interval.label': 'Refresh interval (seconds)',
  'polling.interval.hint': 'Minimum 15 s. How often Nexus re-checks all projects in the background.',
  'polling.interval.errorMin': 'Minimum interval is 15 seconds.',

  // Data Storage card
  'storage.title': 'Data Storage',
  'storage.projectData.label': 'Project data',
  'storage.projectData.value': 'SQLite database ({db}) in the app data directory. No data leaves your machine.',
  'storage.secrets.label': 'Secrets',
  'storage.secrets.value': 'Stored in the OS credential store — Windows Credential Manager on Windows, macOS Keychain on macOS. Never written to disk in plain text.',
  'storage.bundle.label': 'Bundle format',
  'storage.bundle.value': 'Exported {ext} files are encrypted with AES-256-GCM. The key is derived from your passphrase using Argon2id. Without the passphrase the file is unreadable.',

  // About card
  'about.title': 'About',
  'about.version.label': 'Version',
  'about.arch.label': 'Architecture',
  'about.arch.value': 'Tauri 2 · React 19 · local-first',
};

const uk: Record<keyof typeof en, string> = {
  'language.label': 'Мова',
  'language.hint': 'Мова інтерфейсу. Застосовується одразу і зберігається між запусками.',

  title: 'Налаштування',

  'workspace.title': 'Робочий простір',
  'workspace.name.label': 'Назва робочого простору',
  'workspace.name.hint': 'Відображається в бічній панелі. Залиште порожнім, щоб використовувати стандартне брендування NEXUS.',
  'workspace.logo.label': 'Логотип',
  'workspace.logo.upload': 'Завантажити логотип',
  'workspace.logo.replace': 'Замінити логотип',
  'workspace.logo.remove': 'Видалити логотип',
  'workspace.logo.alt': 'Логотип робочого простору',
  'workspace.logo.hint': 'Максимум 200 КБ. Відображається заввишки до 28 пікселів у бічній панелі.',
  'workspace.logo.errorSize': 'Розмір зображення не може перевищувати 200 КБ.',
  'workspace.theme.label': 'Колірна тема',
  'workspace.theme.hint': 'Застосовується одразу і зберігається між запусками.',

  'polling.title': 'Опитування',
  'polling.interval.label': 'Інтервал оновлення (секунди)',
  'polling.interval.hint': 'Мінімум 15 с. Як часто Nexus перевіряє всі проєкти у фоні.',
  'polling.interval.errorMin': 'Мінімальний інтервал — 15 секунд.',

  'storage.title': 'Зберігання даних',
  'storage.projectData.label': 'Дані проєктів',
  'storage.projectData.value': 'База даних SQLite ({db}) у директорії даних застосунку. Дані не залишають ваш пристрій.',
  'storage.secrets.label': 'Секрети',
  'storage.secrets.value': 'Зберігаються у сховищі облікових даних ОС — Windows Credential Manager на Windows, macOS Keychain на macOS. Ніколи не записуються на диск у відкритому вигляді.',
  'storage.bundle.label': 'Формат бандлу',
  'storage.bundle.value': 'Експортовані файли {ext} зашифровані за допомогою AES-256-GCM. Ключ виводиться з вашої парольної фрази за алгоритмом Argon2id. Без парольної фрази файл неможливо прочитати.',

  'about.title': 'Про застосунок',
  'about.version.label': 'Версія',
  'about.arch.label': 'Архітектура',
  'about.arch.value': 'Tauri 2 · React 19 · local-first',
};

export const settings = { en, uk };
