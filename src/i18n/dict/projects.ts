// Projects page + ProjectForm + PassphraseModal strings.
// `en` is the source of truth; `uk` must mirror its keys.

const en = {
  // ── Projects page ────────────────────────────────────────────────────────
  'page.title': 'Projects',
  'page.importBtn': 'Import .nexusproj',
  'page.addBtn': '+ Add project',

  'alert.importFailed': 'Import failed: {error}',
  'alert.exportedTo': 'Exported to:',

  'empty.title': 'No projects',
  'empty.body': 'Add your first project to get started.',

  'table.name': 'Name',
  'table.apiBase': 'API Base',
  'table.git': 'Git',
  'table.health': 'Health',
  'table.actions': 'Actions',
  'table.open': 'Open',
  'table.export': 'Export',

  // ── Delete modal ─────────────────────────────────────────────────────────
  'delete.title': 'Delete Project',
  'delete.body': 'Delete {name}? This removes the project and all stored secrets. This action cannot be undone.',

  // ── Export / Import passphrase modal titles ───────────────────────────────
  'passphrase.exportTitle': 'Export Project Bundle',
  'passphrase.importTitle': 'Import Project Bundle',

  // ── PassphraseModal internal ──────────────────────────────────────────────
  'passphrase.label': 'Passphrase',
  'passphrase.confirmLabel': 'Confirm passphrase',
  'passphrase.placeholder': 'Enter passphrase',
  'passphrase.confirmPlaceholder': 'Repeat passphrase',
  'passphrase.exportHint': 'This passphrase encrypts the bundle file (AES-256-GCM + Argon2id). Store it safely — there is no recovery.',
  'passphrase.importHint': 'Enter the passphrase used when the bundle was exported.',
  'passphrase.exportBtn': 'Export',
  'passphrase.importBtn': 'Import',
  'passphrase.errorRequired': 'Passphrase is required.',
  'passphrase.errorMismatch': 'Passphrases do not match.',

  // ── ProjectForm — modal header ────────────────────────────────────────────
  'form.addTitle': 'Add Project',
  'form.editTitle': 'Edit {name}',
  'form.closeAriaLabel': 'Close',

  // ── ProjectForm — section legends ─────────────────────────────────────────
  'form.section.general': 'General',
  'form.section.endpoints': 'Endpoints',
  'form.section.repository': 'Repository',
  'form.section.links': 'Links',
  'form.section.notes': 'Notes',
  'form.section.secrets': 'Secrets',
  'form.section.secretsHint': ' — stored in OS credential store, never in DB',

  // ── ProjectForm — field labels ────────────────────────────────────────────
  'form.name': 'Name',
  'form.description': 'Description',
  'form.apiBaseUrl': 'API Base URL',
  'form.authMethod': 'Auth Method',
  'form.gitProvider': 'Git Provider',
  'form.loginEndpoint': 'Login Endpoint',
  'form.tokenField': 'Token Field',
  'form.tokenFieldHint': ' path to token in login response · empty = auto (access_token, token, data.access_token…)',
  'form.healthEndpoint': 'Health Endpoint',
  'form.supportEndpoint': 'Support Endpoint',
  'form.supportEndpointHint': ' empty → {url}/v1/support-requests/',
  'form.deployEndpoint': 'Deploy Endpoint',
  'form.repoUrl': 'Repo URL',
  'form.gitProjectId': 'Git Project ID',
  'form.gitProjectIdHint': ' owner/repo for GitHub · project ID or full path for GitLab',
  'form.docsUrl': 'Docs URL',
  'form.apiToken': 'API Token',
  'form.loginCreds': 'Login Credentials (request body)',
  'form.loginCredsHint': ' any fields your API expects — JSON or form-encoded (a=1&b=2).',
  'form.loginCredsHintEdit': ' Leave empty to keep stored credentials.',
  'form.gitHubToken': 'GitHub Token',
  'form.gitLabToken': 'GitLab Token',

  // ── ProjectForm — auth method option labels ───────────────────────────────
  'form.authNone': 'None',
  'form.authBearer': 'Bearer token (static)',
  'form.authLogin': 'Login endpoint (auto-refreshed token)',

  // ── ProjectForm — git provider option labels ──────────────────────────────
  'form.gitNone': 'None',

  // ── ProjectForm — placeholders ────────────────────────────────────────────
  'form.namePlaceholder': 'My Project',
  'form.descriptionPlaceholder': 'Short description',
  'form.supportEndpointPlaceholder': 'Leave empty to derive from API base',
  'form.notesPlaceholder': 'Free-form notes',
  'form.secretStoredPlaceholder': '•••• stored — leave empty to keep',

  // ── ProjectForm — git token hints ─────────────────────────────────────────
  'form.gitlabTokenHint': 'Project Access Token — role: Reporter, scopes: read_api.',
  'form.gitlabTokenLinkLabel': 'Open project access tokens ↗',
  'form.gitlabNoUrlHint': ' Fill in Repo URL to get a direct link (Settings → Access Tokens).',
  'form.githubTokenHint': 'Fine-grained personal access token — read-only: Contents, Pull requests, Actions.',
  'form.githubTokenLinkLabel': 'Create token on GitHub ↗',

  // ── ProjectForm — validation + submit ─────────────────────────────────────
  'form.errorNameRequired': 'Name is required.',
  'form.errorInvalidJson': 'Credentials look like JSON but do not parse — fix the syntax.',
  'form.savingBtn': 'Saving…',
  'form.saveChangesBtn': 'Save changes',
  'form.addProjectBtn': 'Add project',
};

const uk: Record<keyof typeof en, string> = {
  // ── Projects page ────────────────────────────────────────────────────────
  'page.title': 'Проєкти',
  'page.importBtn': 'Імпортувати .nexusproj',
  'page.addBtn': '+ Додати проєкт',

  'alert.importFailed': 'Помилка імпорту: {error}',
  'alert.exportedTo': 'Експортовано до:',

  'empty.title': 'Немає проєктів',
  'empty.body': 'Додайте перший проєкт, щоб розпочати.',

  'table.name': 'Назва',
  'table.apiBase': 'API Base',
  'table.git': 'Git',
  'table.health': 'Стан',
  'table.actions': 'Дії',
  'table.open': 'Відкрити',
  'table.export': 'Експорт',

  // ── Delete modal ─────────────────────────────────────────────────────────
  'delete.title': 'Видалити проєкт',
  'delete.body': 'Видалити {name}? Буде видалено проєкт та всі збережені секрети. Цю дію неможливо скасувати.',

  // ── Export / Import passphrase modal titles ───────────────────────────────
  'passphrase.exportTitle': 'Експорт бандлу проєкту',
  'passphrase.importTitle': 'Імпорт бандлу проєкту',

  // ── PassphraseModal internal ──────────────────────────────────────────────
  'passphrase.label': 'Парольна фраза',
  'passphrase.confirmLabel': 'Підтвердіть парольну фразу',
  'passphrase.placeholder': 'Введіть парольну фразу',
  'passphrase.confirmPlaceholder': 'Повторіть парольну фразу',
  'passphrase.exportHint': 'Ця парольна фраза шифрує файл бандлу (AES-256-GCM + Argon2id). Збережіть її надійно — відновлення неможливе.',
  'passphrase.importHint': 'Введіть парольну фразу, яку було використано під час експорту.',
  'passphrase.exportBtn': 'Експортувати',
  'passphrase.importBtn': 'Імпортувати',
  'passphrase.errorRequired': 'Парольна фраза є обов\'язковою.',
  'passphrase.errorMismatch': 'Парольні фрази не збігаються.',

  // ── ProjectForm — modal header ────────────────────────────────────────────
  'form.addTitle': 'Додати проєкт',
  'form.editTitle': 'Редагувати {name}',
  'form.closeAriaLabel': 'Закрити',

  // ── ProjectForm — section legends ─────────────────────────────────────────
  'form.section.general': 'Загальне',
  'form.section.endpoints': 'Ендпоінти',
  'form.section.repository': 'Репозиторій',
  'form.section.links': 'Посилання',
  'form.section.notes': 'Нотатки',
  'form.section.secrets': 'Секрети',
  'form.section.secretsHint': ' — зберігаються у сховищі облікових даних ОС, не в БД',

  // ── ProjectForm — field labels ────────────────────────────────────────────
  'form.name': 'Назва',
  'form.description': 'Опис',
  'form.apiBaseUrl': 'Базова URL API',
  'form.authMethod': 'Метод автентифікації',
  'form.gitProvider': 'Git-провайдер',
  'form.loginEndpoint': 'Ендпоінт входу',
  'form.tokenField': 'Поле токена',
  'form.tokenFieldHint': ' шлях до токена у відповіді на вхід · порожньо = авто (access_token, token, data.access_token…)',
  'form.healthEndpoint': 'Ендпоінт перевірки стану',
  'form.supportEndpoint': 'Ендпоінт підтримки',
  'form.supportEndpointHint': ' порожньо → {url}/v1/support-requests/',
  'form.deployEndpoint': 'Ендпоінт деплою',
  'form.repoUrl': 'URL репозиторію',
  'form.gitProjectId': 'ID проєкту Git',
  'form.gitProjectIdHint': ' owner/repo для GitHub · ID проєкту або повний шлях для GitLab',
  'form.docsUrl': 'URL документації',
  'form.apiToken': 'API-токен',
  'form.loginCreds': 'Облікові дані для входу (тіло запиту)',
  'form.loginCredsHint': ' будь-які поля, які очікує ваш API — JSON або form-encoded (a=1&b=2).',
  'form.loginCredsHintEdit': ' Залиште порожнім, щоб зберегти поточні облікові дані.',
  'form.gitHubToken': 'GitHub Token',
  'form.gitLabToken': 'GitLab Token',

  // ── ProjectForm — auth method option labels ───────────────────────────────
  'form.authNone': 'Немає',
  'form.authBearer': 'Bearer-токен (статичний)',
  'form.authLogin': 'Ендпоінт входу (токен з автооновленням)',

  // ── ProjectForm — git provider option labels ──────────────────────────────
  'form.gitNone': 'Немає',

  // ── ProjectForm — placeholders ────────────────────────────────────────────
  'form.namePlaceholder': 'Мій проєкт',
  'form.descriptionPlaceholder': 'Короткий опис',
  'form.supportEndpointPlaceholder': 'Залиште порожнім для автовизначення з API base',
  'form.notesPlaceholder': 'Довільні нотатки',
  'form.secretStoredPlaceholder': '•••• збережено — залиште порожнім, щоб не змінювати',

  // ── ProjectForm — git token hints ─────────────────────────────────────────
  'form.gitlabTokenHint': 'Project Access Token — роль: Reporter, дозволи: read_api.',
  'form.gitlabTokenLinkLabel': 'Відкрити токени доступу проєкту ↗',
  'form.gitlabNoUrlHint': ' Заповніть URL репозиторію, щоб отримати пряме посилання (Settings → Access Tokens).',
  'form.githubTokenHint': 'Fine-grained personal access token — лише читання: Contents, Pull requests, Actions.',
  'form.githubTokenLinkLabel': 'Створити токен на GitHub ↗',

  // ── ProjectForm — validation + submit ─────────────────────────────────────
  'form.errorNameRequired': 'Назва є обов\'язковою.',
  'form.errorInvalidJson': 'Облікові дані схожі на JSON, але не парсяться — виправте синтаксис.',
  'form.savingBtn': 'Збереження…',
  'form.saveChangesBtn': 'Зберегти зміни',
  'form.addProjectBtn': 'Додати проєкт',
};

export const projects = { en, uk };
