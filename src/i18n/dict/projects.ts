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

const es: Record<keyof typeof en, string> = {
  // ── Projects page ────────────────────────────────────────────────────────
  'page.title': 'Proyectos',
  'page.importBtn': 'Importar .nexusproj',
  'page.addBtn': '+ Agregar proyecto',

  'alert.importFailed': 'Error al importar: {error}',
  'alert.exportedTo': 'Exportado a:',

  'empty.title': 'Sin proyectos',
  'empty.body': 'Agrega tu primer proyecto para comenzar.',

  'table.name': 'Nombre',
  'table.apiBase': 'API Base',
  'table.git': 'Git',
  'table.health': 'Estado',
  'table.actions': 'Acciones',
  'table.open': 'Abrir',
  'table.export': 'Exportar',

  // ── Delete modal ─────────────────────────────────────────────────────────
  'delete.title': 'Eliminar proyecto',
  'delete.body': '¿Eliminar {name}? Se eliminarán el proyecto y todos los secretos almacenados. Esta acción no se puede deshacer.',

  // ── Export / Import passphrase modal titles ───────────────────────────────
  'passphrase.exportTitle': 'Exportar paquete del proyecto',
  'passphrase.importTitle': 'Importar paquete del proyecto',

  // ── PassphraseModal internal ──────────────────────────────────────────────
  'passphrase.label': 'Frase de contraseña',
  'passphrase.confirmLabel': 'Confirmar frase de contraseña',
  'passphrase.placeholder': 'Ingresa la frase de contraseña',
  'passphrase.confirmPlaceholder': 'Repite la frase de contraseña',
  'passphrase.exportHint': 'Esta frase de contraseña cifra el archivo del paquete (AES-256-GCM + Argon2id). Guárdala en un lugar seguro — no hay recuperación posible.',
  'passphrase.importHint': 'Ingresa la frase de contraseña utilizada al exportar el paquete.',
  'passphrase.exportBtn': 'Exportar',
  'passphrase.importBtn': 'Importar',
  'passphrase.errorRequired': 'La frase de contraseña es obligatoria.',
  'passphrase.errorMismatch': 'Las frases de contraseña no coinciden.',

  // ── ProjectForm — modal header ────────────────────────────────────────────
  'form.addTitle': 'Agregar proyecto',
  'form.editTitle': 'Editar {name}',
  'form.closeAriaLabel': 'Cerrar',

  // ── ProjectForm — section legends ─────────────────────────────────────────
  'form.section.general': 'General',
  'form.section.endpoints': 'Endpoints',
  'form.section.repository': 'Repositorio',
  'form.section.links': 'Enlaces',
  'form.section.notes': 'Notas',
  'form.section.secrets': 'Secretos',
  'form.section.secretsHint': ' — almacenados en el gestor de credenciales del SO, nunca en la BD',

  // ── ProjectForm — field labels ────────────────────────────────────────────
  'form.name': 'Nombre',
  'form.description': 'Descripción',
  'form.apiBaseUrl': 'URL base de la API',
  'form.authMethod': 'Método de autenticación',
  'form.gitProvider': 'Proveedor Git',
  'form.loginEndpoint': 'Endpoint de inicio de sesión',
  'form.tokenField': 'Campo del token',
  'form.tokenFieldHint': ' ruta al token en la respuesta de inicio de sesión · vacío = auto (access_token, token, data.access_token…)',
  'form.healthEndpoint': 'Endpoint de salud',
  'form.supportEndpoint': 'Endpoint de soporte',
  'form.supportEndpointHint': ' vacío → {url}/v1/support-requests/',
  'form.deployEndpoint': 'Endpoint de despliegue',
  'form.repoUrl': 'URL del repositorio',
  'form.gitProjectId': 'ID del proyecto Git',
  'form.gitProjectIdHint': ' owner/repo para GitHub · ID de proyecto o ruta completa para GitLab',
  'form.docsUrl': 'URL de documentación',
  'form.apiToken': 'Token de API',
  'form.loginCreds': 'Credenciales de inicio de sesión (cuerpo de la solicitud)',
  'form.loginCredsHint': ' cualquier campo que espere tu API — JSON o form-encoded (a=1&b=2).',
  'form.loginCredsHintEdit': ' Deja vacío para mantener las credenciales almacenadas.',
  'form.gitHubToken': 'GitHub Token',
  'form.gitLabToken': 'GitLab Token',

  // ── ProjectForm — auth method option labels ───────────────────────────────
  'form.authNone': 'Ninguno',
  'form.authBearer': 'Token Bearer (estático)',
  'form.authLogin': 'Endpoint de inicio de sesión (token con renovación automática)',

  // ── ProjectForm — git provider option labels ──────────────────────────────
  'form.gitNone': 'Ninguno',

  // ── ProjectForm — placeholders ────────────────────────────────────────────
  'form.namePlaceholder': 'Mi proyecto',
  'form.descriptionPlaceholder': 'Descripción breve',
  'form.supportEndpointPlaceholder': 'Dejar vacío para derivar de la URL base de la API',
  'form.notesPlaceholder': 'Notas de formato libre',
  'form.secretStoredPlaceholder': '•••• almacenado — deja vacío para conservar',

  // ── ProjectForm — git token hints ─────────────────────────────────────────
  'form.gitlabTokenHint': 'Project Access Token — rol: Reporter, ámbitos: read_api.',
  'form.gitlabTokenLinkLabel': 'Abrir tokens de acceso del proyecto ↗',
  'form.gitlabNoUrlHint': ' Completa la URL del repositorio para obtener un enlace directo (Settings → Access Tokens).',
  'form.githubTokenHint': 'Token de acceso personal detallado — solo lectura: Contents, Pull requests, Actions.',
  'form.githubTokenLinkLabel': 'Crear token en GitHub ↗',

  // ── ProjectForm — validation + submit ─────────────────────────────────────
  'form.errorNameRequired': 'El nombre es obligatorio.',
  'form.errorInvalidJson': 'Las credenciales parecen JSON pero no se pueden analizar — corrige la sintaxis.',
  'form.savingBtn': 'Guardando…',
  'form.saveChangesBtn': 'Guardar cambios',
  'form.addProjectBtn': 'Agregar proyecto',
};

const de: Record<keyof typeof en, string> = {
  // ── Projects page ────────────────────────────────────────────────────────
  'page.title': 'Projekte',
  'page.importBtn': '.nexusproj importieren',
  'page.addBtn': '+ Projekt hinzufügen',

  'alert.importFailed': 'Import fehlgeschlagen: {error}',
  'alert.exportedTo': 'Exportiert nach:',

  'empty.title': 'Keine Projekte',
  'empty.body': 'Füge dein erstes Projekt hinzu, um zu beginnen.',

  'table.name': 'Name',
  'table.apiBase': 'API Base',
  'table.git': 'Git',
  'table.health': 'Status',
  'table.actions': 'Aktionen',
  'table.open': 'Öffnen',
  'table.export': 'Exportieren',

  // ── Delete modal ─────────────────────────────────────────────────────────
  'delete.title': 'Projekt löschen',
  'delete.body': '{name} löschen? Dadurch werden das Projekt und alle gespeicherten Geheimnisse entfernt. Diese Aktion kann nicht rückgängig gemacht werden.',

  // ── Export / Import passphrase modal titles ───────────────────────────────
  'passphrase.exportTitle': 'Projektpaket exportieren',
  'passphrase.importTitle': 'Projektpaket importieren',

  // ── PassphraseModal internal ──────────────────────────────────────────────
  'passphrase.label': 'Passphrase',
  'passphrase.confirmLabel': 'Passphrase bestätigen',
  'passphrase.placeholder': 'Passphrase eingeben',
  'passphrase.confirmPlaceholder': 'Passphrase wiederholen',
  'passphrase.exportHint': 'Diese Passphrase verschlüsselt die Paketdatei (AES-256-GCM + Argon2id). Bewahre sie sicher auf — eine Wiederherstellung ist nicht möglich.',
  'passphrase.importHint': 'Gib die Passphrase ein, die beim Export des Pakets verwendet wurde.',
  'passphrase.exportBtn': 'Exportieren',
  'passphrase.importBtn': 'Importieren',
  'passphrase.errorRequired': 'Passphrase ist erforderlich.',
  'passphrase.errorMismatch': 'Passphrasen stimmen nicht überein.',

  // ── ProjectForm — modal header ────────────────────────────────────────────
  'form.addTitle': 'Projekt hinzufügen',
  'form.editTitle': '{name} bearbeiten',
  'form.closeAriaLabel': 'Schließen',

  // ── ProjectForm — section legends ─────────────────────────────────────────
  'form.section.general': 'Allgemein',
  'form.section.endpoints': 'Endpunkte',
  'form.section.repository': 'Repository',
  'form.section.links': 'Links',
  'form.section.notes': 'Notizen',
  'form.section.secrets': 'Geheimnisse',
  'form.section.secretsHint': ' — im Anmeldeinformationsspeicher des Betriebssystems gespeichert, nie in der DB',

  // ── ProjectForm — field labels ────────────────────────────────────────────
  'form.name': 'Name',
  'form.description': 'Beschreibung',
  'form.apiBaseUrl': 'API-Basis-URL',
  'form.authMethod': 'Authentifizierungsmethode',
  'form.gitProvider': 'Git-Anbieter',
  'form.loginEndpoint': 'Anmelde-Endpunkt',
  'form.tokenField': 'Token-Feld',
  'form.tokenFieldHint': ' Pfad zum Token in der Anmeldeantwort · leer = auto (access_token, token, data.access_token…)',
  'form.healthEndpoint': 'Health-Endpunkt',
  'form.supportEndpoint': 'Support-Endpunkt',
  'form.supportEndpointHint': ' leer → {url}/v1/support-requests/',
  'form.deployEndpoint': 'Deploy-Endpunkt',
  'form.repoUrl': 'Repository-URL',
  'form.gitProjectId': 'Git-Projekt-ID',
  'form.gitProjectIdHint': ' owner/repo für GitHub · Projekt-ID oder vollständiger Pfad für GitLab',
  'form.docsUrl': 'Dokumentations-URL',
  'form.apiToken': 'API-Token',
  'form.loginCreds': 'Anmeldedaten (Anfrage-Body)',
  'form.loginCredsHint': ' beliebige Felder, die deine API erwartet — JSON oder form-encoded (a=1&b=2).',
  'form.loginCredsHintEdit': ' Leer lassen, um die gespeicherten Anmeldedaten beizubehalten.',
  'form.gitHubToken': 'GitHub Token',
  'form.gitLabToken': 'GitLab Token',

  // ── ProjectForm — auth method option labels ───────────────────────────────
  'form.authNone': 'Keine',
  'form.authBearer': 'Bearer-Token (statisch)',
  'form.authLogin': 'Anmelde-Endpunkt (automatisch aktualisierter Token)',

  // ── ProjectForm — git provider option labels ──────────────────────────────
  'form.gitNone': 'Keine',

  // ── ProjectForm — placeholders ────────────────────────────────────────────
  'form.namePlaceholder': 'Mein Projekt',
  'form.descriptionPlaceholder': 'Kurze Beschreibung',
  'form.supportEndpointPlaceholder': 'Leer lassen, um von der API-Basis abzuleiten',
  'form.notesPlaceholder': 'Freiformnotizen',
  'form.secretStoredPlaceholder': '•••• gespeichert — leer lassen, um beizubehalten',

  // ── ProjectForm — git token hints ─────────────────────────────────────────
  'form.gitlabTokenHint': 'Project Access Token — Rolle: Reporter, Berechtigungen: read_api.',
  'form.gitlabTokenLinkLabel': 'Projektzugriffs-Tokens öffnen ↗',
  'form.gitlabNoUrlHint': ' Trage die Repository-URL ein, um einen direkten Link zu erhalten (Settings → Access Tokens).',
  'form.githubTokenHint': 'Detaillierter persönlicher Zugriffstoken — nur Lesen: Contents, Pull requests, Actions.',
  'form.githubTokenLinkLabel': 'Token auf GitHub erstellen ↗',

  // ── ProjectForm — validation + submit ─────────────────────────────────────
  'form.errorNameRequired': 'Name ist erforderlich.',
  'form.errorInvalidJson': 'Die Anmeldedaten sehen wie JSON aus, können aber nicht geparst werden — korrigiere die Syntax.',
  'form.savingBtn': 'Speichern…',
  'form.saveChangesBtn': 'Änderungen speichern',
  'form.addProjectBtn': 'Projekt hinzufügen',
};

const fr: Record<keyof typeof en, string> = {
  // ── Projects page ────────────────────────────────────────────────────────
  'page.title': 'Projets',
  'page.importBtn': 'Importer .nexusproj',
  'page.addBtn': '+ Ajouter un projet',

  'alert.importFailed': 'Échec de l\'importation : {error}',
  'alert.exportedTo': 'Exporté vers :',

  'empty.title': 'Aucun projet',
  'empty.body': 'Ajoutez votre premier projet pour commencer.',

  'table.name': 'Nom',
  'table.apiBase': 'API Base',
  'table.git': 'Git',
  'table.health': 'État',
  'table.actions': 'Actions',
  'table.open': 'Ouvrir',
  'table.export': 'Exporter',

  // ── Delete modal ─────────────────────────────────────────────────────────
  'delete.title': 'Supprimer le projet',
  'delete.body': 'Supprimer {name} ? Cela supprimera le projet et tous les secrets stockés. Cette action est irréversible.',

  // ── Export / Import passphrase modal titles ───────────────────────────────
  'passphrase.exportTitle': 'Exporter le paquet du projet',
  'passphrase.importTitle': 'Importer le paquet du projet',

  // ── PassphraseModal internal ──────────────────────────────────────────────
  'passphrase.label': 'Phrase secrète',
  'passphrase.confirmLabel': 'Confirmer la phrase secrète',
  'passphrase.placeholder': 'Saisir la phrase secrète',
  'passphrase.confirmPlaceholder': 'Répéter la phrase secrète',
  'passphrase.exportHint': 'Cette phrase secrète chiffre le fichier du paquet (AES-256-GCM + Argon2id). Conservez-la en lieu sûr — aucune récupération n\'est possible.',
  'passphrase.importHint': 'Saisissez la phrase secrète utilisée lors de l\'exportation du paquet.',
  'passphrase.exportBtn': 'Exporter',
  'passphrase.importBtn': 'Importer',
  'passphrase.errorRequired': 'La phrase secrète est obligatoire.',
  'passphrase.errorMismatch': 'Les phrases secrètes ne correspondent pas.',

  // ── ProjectForm — modal header ────────────────────────────────────────────
  'form.addTitle': 'Ajouter un projet',
  'form.editTitle': 'Modifier {name}',
  'form.closeAriaLabel': 'Fermer',

  // ── ProjectForm — section legends ─────────────────────────────────────────
  'form.section.general': 'Général',
  'form.section.endpoints': 'Endpoints',
  'form.section.repository': 'Dépôt',
  'form.section.links': 'Liens',
  'form.section.notes': 'Notes',
  'form.section.secrets': 'Secrets',
  'form.section.secretsHint': ' — stockés dans le gestionnaire d\'informations d\'identification du système, jamais en BDD',

  // ── ProjectForm — field labels ────────────────────────────────────────────
  'form.name': 'Nom',
  'form.description': 'Description',
  'form.apiBaseUrl': 'URL de base de l\'API',
  'form.authMethod': 'Méthode d\'authentification',
  'form.gitProvider': 'Fournisseur Git',
  'form.loginEndpoint': 'Endpoint de connexion',
  'form.tokenField': 'Champ du token',
  'form.tokenFieldHint': ' chemin vers le token dans la réponse de connexion · vide = auto (access_token, token, data.access_token…)',
  'form.healthEndpoint': 'Endpoint de santé',
  'form.supportEndpoint': 'Endpoint de support',
  'form.supportEndpointHint': ' vide → {url}/v1/support-requests/',
  'form.deployEndpoint': 'Endpoint de déploiement',
  'form.repoUrl': 'URL du dépôt',
  'form.gitProjectId': 'ID du projet Git',
  'form.gitProjectIdHint': ' owner/repo pour GitHub · ID de projet ou chemin complet pour GitLab',
  'form.docsUrl': 'URL de la documentation',
  'form.apiToken': 'Token API',
  'form.loginCreds': 'Informations de connexion (corps de la requête)',
  'form.loginCredsHint': ' tout champ attendu par votre API — JSON ou form-encoded (a=1&b=2).',
  'form.loginCredsHintEdit': ' Laisser vide pour conserver les informations stockées.',
  'form.gitHubToken': 'GitHub Token',
  'form.gitLabToken': 'GitLab Token',

  // ── ProjectForm — auth method option labels ───────────────────────────────
  'form.authNone': 'Aucun',
  'form.authBearer': 'Token Bearer (statique)',
  'form.authLogin': 'Endpoint de connexion (token avec renouvellement automatique)',

  // ── ProjectForm — git provider option labels ──────────────────────────────
  'form.gitNone': 'Aucun',

  // ── ProjectForm — placeholders ────────────────────────────────────────────
  'form.namePlaceholder': 'Mon projet',
  'form.descriptionPlaceholder': 'Description courte',
  'form.supportEndpointPlaceholder': 'Laisser vide pour dériver de l\'URL de base de l\'API',
  'form.notesPlaceholder': 'Notes libres',
  'form.secretStoredPlaceholder': '•••• stocké — laisser vide pour conserver',

  // ── ProjectForm — git token hints ─────────────────────────────────────────
  'form.gitlabTokenHint': 'Project Access Token — rôle : Reporter, portées : read_api.',
  'form.gitlabTokenLinkLabel': 'Ouvrir les tokens d\'accès du projet ↗',
  'form.gitlabNoUrlHint': ' Renseignez l\'URL du dépôt pour obtenir un lien direct (Settings → Access Tokens).',
  'form.githubTokenHint': 'Token d\'accès personnel affiné — lecture seule : Contents, Pull requests, Actions.',
  'form.githubTokenLinkLabel': 'Créer un token sur GitHub ↗',

  // ── ProjectForm — validation + submit ─────────────────────────────────────
  'form.errorNameRequired': 'Le nom est obligatoire.',
  'form.errorInvalidJson': 'Les informations d\'identification ressemblent à du JSON mais ne peuvent pas être analysées — corrigez la syntaxe.',
  'form.savingBtn': 'Enregistrement…',
  'form.saveChangesBtn': 'Enregistrer les modifications',
  'form.addProjectBtn': 'Ajouter un projet',
};

const pt: Record<keyof typeof en, string> = {
  // ── Projects page ────────────────────────────────────────────────────────
  'page.title': 'Projetos',
  'page.importBtn': 'Importar .nexusproj',
  'page.addBtn': '+ Adicionar projeto',

  'alert.importFailed': 'Falha na importação: {error}',
  'alert.exportedTo': 'Exportado para:',

  'empty.title': 'Nenhum projeto',
  'empty.body': 'Adicione seu primeiro projeto para começar.',

  'table.name': 'Nome',
  'table.apiBase': 'API Base',
  'table.git': 'Git',
  'table.health': 'Status',
  'table.actions': 'Ações',
  'table.open': 'Abrir',
  'table.export': 'Exportar',

  // ── Delete modal ─────────────────────────────────────────────────────────
  'delete.title': 'Excluir projeto',
  'delete.body': 'Excluir {name}? Isso remove o projeto e todos os segredos armazenados. Esta ação não pode ser desfeita.',

  // ── Export / Import passphrase modal titles ───────────────────────────────
  'passphrase.exportTitle': 'Exportar pacote do projeto',
  'passphrase.importTitle': 'Importar pacote do projeto',

  // ── PassphraseModal internal ──────────────────────────────────────────────
  'passphrase.label': 'Frase-senha',
  'passphrase.confirmLabel': 'Confirmar frase-senha',
  'passphrase.placeholder': 'Digite a frase-senha',
  'passphrase.confirmPlaceholder': 'Repita a frase-senha',
  'passphrase.exportHint': 'Esta frase-senha criptografa o arquivo do pacote (AES-256-GCM + Argon2id). Guarde-a com segurança — não há recuperação possível.',
  'passphrase.importHint': 'Digite a frase-senha usada ao exportar o pacote.',
  'passphrase.exportBtn': 'Exportar',
  'passphrase.importBtn': 'Importar',
  'passphrase.errorRequired': 'A frase-senha é obrigatória.',
  'passphrase.errorMismatch': 'As frases-senha não coincidem.',

  // ── ProjectForm — modal header ────────────────────────────────────────────
  'form.addTitle': 'Adicionar projeto',
  'form.editTitle': 'Editar {name}',
  'form.closeAriaLabel': 'Fechar',

  // ── ProjectForm — section legends ─────────────────────────────────────────
  'form.section.general': 'Geral',
  'form.section.endpoints': 'Endpoints',
  'form.section.repository': 'Repositório',
  'form.section.links': 'Links',
  'form.section.notes': 'Notas',
  'form.section.secrets': 'Segredos',
  'form.section.secretsHint': ' — armazenados no cofre de credenciais do SO, nunca no BD',

  // ── ProjectForm — field labels ────────────────────────────────────────────
  'form.name': 'Nome',
  'form.description': 'Descrição',
  'form.apiBaseUrl': 'URL base da API',
  'form.authMethod': 'Método de autenticação',
  'form.gitProvider': 'Provedor Git',
  'form.loginEndpoint': 'Endpoint de login',
  'form.tokenField': 'Campo do token',
  'form.tokenFieldHint': ' caminho para o token na resposta de login · vazio = auto (access_token, token, data.access_token…)',
  'form.healthEndpoint': 'Endpoint de saúde',
  'form.supportEndpoint': 'Endpoint de suporte',
  'form.supportEndpointHint': ' vazio → {url}/v1/support-requests/',
  'form.deployEndpoint': 'Endpoint de deploy',
  'form.repoUrl': 'URL do repositório',
  'form.gitProjectId': 'ID do projeto Git',
  'form.gitProjectIdHint': ' owner/repo para GitHub · ID do projeto ou caminho completo para GitLab',
  'form.docsUrl': 'URL da documentação',
  'form.apiToken': 'Token de API',
  'form.loginCreds': 'Credenciais de login (corpo da requisição)',
  'form.loginCredsHint': ' qualquer campo que sua API espera — JSON ou form-encoded (a=1&b=2).',
  'form.loginCredsHintEdit': ' Deixe vazio para manter as credenciais armazenadas.',
  'form.gitHubToken': 'GitHub Token',
  'form.gitLabToken': 'GitLab Token',

  // ── ProjectForm — auth method option labels ───────────────────────────────
  'form.authNone': 'Nenhum',
  'form.authBearer': 'Token Bearer (estático)',
  'form.authLogin': 'Endpoint de login (token com renovação automática)',

  // ── ProjectForm — git provider option labels ──────────────────────────────
  'form.gitNone': 'Nenhum',

  // ── ProjectForm — placeholders ────────────────────────────────────────────
  'form.namePlaceholder': 'Meu Projeto',
  'form.descriptionPlaceholder': 'Descrição curta',
  'form.supportEndpointPlaceholder': 'Deixe vazio para derivar da URL base da API',
  'form.notesPlaceholder': 'Notas de texto livre',
  'form.secretStoredPlaceholder': '•••• armazenado — deixe vazio para manter',

  // ── ProjectForm — git token hints ─────────────────────────────────────────
  'form.gitlabTokenHint': 'Project Access Token — função: Reporter, escopos: read_api.',
  'form.gitlabTokenLinkLabel': 'Abrir tokens de acesso do projeto ↗',
  'form.gitlabNoUrlHint': ' Preencha a URL do repositório para obter um link direto (Settings → Access Tokens).',
  'form.githubTokenHint': 'Token de acesso pessoal refinado — somente leitura: Contents, Pull requests, Actions.',
  'form.githubTokenLinkLabel': 'Criar token no GitHub ↗',

  // ── ProjectForm — validation + submit ─────────────────────────────────────
  'form.errorNameRequired': 'O nome é obrigatório.',
  'form.errorInvalidJson': 'As credenciais parecem JSON mas não podem ser analisadas — corrija a sintaxe.',
  'form.savingBtn': 'Salvando…',
  'form.saveChangesBtn': 'Salvar alterações',
  'form.addProjectBtn': 'Adicionar projeto',
};

const zh: Record<keyof typeof en, string> = {
  // ── Projects page ────────────────────────────────────────────────────────
  'page.title': '项目',
  'page.importBtn': '导入 .nexusproj',
  'page.addBtn': '+ 添加项目',

  'alert.importFailed': '导入失败：{error}',
  'alert.exportedTo': '已导出至：',

  'empty.title': '暂无项目',
  'empty.body': '添加您的第一个项目以开始使用。',

  'table.name': '名称',
  'table.apiBase': 'API Base',
  'table.git': 'Git',
  'table.health': '健康状态',
  'table.actions': '操作',
  'table.open': '打开',
  'table.export': '导出',

  // ── Delete modal ─────────────────────────────────────────────────────────
  'delete.title': '删除项目',
  'delete.body': '删除 {name}？这将删除该项目及所有存储的密钥。此操作无法撤销。',

  // ── Export / Import passphrase modal titles ───────────────────────────────
  'passphrase.exportTitle': '导出项目包',
  'passphrase.importTitle': '导入项目包',

  // ── PassphraseModal internal ──────────────────────────────────────────────
  'passphrase.label': '密码短语',
  'passphrase.confirmLabel': '确认密码短语',
  'passphrase.placeholder': '输入密码短语',
  'passphrase.confirmPlaceholder': '重复密码短语',
  'passphrase.exportHint': '此密码短语用于加密包文件（AES-256-GCM + Argon2id）。请妥善保管——无法恢复。',
  'passphrase.importHint': '请输入导出包时使用的密码短语。',
  'passphrase.exportBtn': '导出',
  'passphrase.importBtn': '导入',
  'passphrase.errorRequired': '密码短语为必填项。',
  'passphrase.errorMismatch': '两次输入的密码短语不一致。',

  // ── ProjectForm — modal header ────────────────────────────────────────────
  'form.addTitle': '添加项目',
  'form.editTitle': '编辑 {name}',
  'form.closeAriaLabel': '关闭',

  // ── ProjectForm — section legends ─────────────────────────────────────────
  'form.section.general': '基本信息',
  'form.section.endpoints': '端点',
  'form.section.repository': '代码仓库',
  'form.section.links': '链接',
  'form.section.notes': '备注',
  'form.section.secrets': '密钥',
  'form.section.secretsHint': ' — 存储在操作系统凭证库中，从不写入数据库',

  // ── ProjectForm — field labels ────────────────────────────────────────────
  'form.name': '名称',
  'form.description': '描述',
  'form.apiBaseUrl': 'API 基础 URL',
  'form.authMethod': '认证方式',
  'form.gitProvider': 'Git 提供商',
  'form.loginEndpoint': '登录端点',
  'form.tokenField': 'Token 字段',
  'form.tokenFieldHint': ' 登录响应中 token 的路径 · 留空 = 自动（access_token, token, data.access_token…）',
  'form.healthEndpoint': '健康检查端点',
  'form.supportEndpoint': '支持端点',
  'form.supportEndpointHint': ' 留空 → {url}/v1/support-requests/',
  'form.deployEndpoint': '部署端点',
  'form.repoUrl': '仓库 URL',
  'form.gitProjectId': 'Git 项目 ID',
  'form.gitProjectIdHint': ' GitHub 使用 owner/repo · GitLab 使用项目 ID 或完整路径',
  'form.docsUrl': '文档 URL',
  'form.apiToken': 'API Token',
  'form.loginCreds': '登录凭证（请求体）',
  'form.loginCredsHint': ' API 所需的任意字段 — JSON 或 form-encoded (a=1&b=2)。',
  'form.loginCredsHintEdit': ' 留空以保留已存储的凭证。',
  'form.gitHubToken': 'GitHub Token',
  'form.gitLabToken': 'GitLab Token',

  // ── ProjectForm — auth method option labels ───────────────────────────────
  'form.authNone': '无',
  'form.authBearer': 'Bearer token（静态）',
  'form.authLogin': '登录端点（自动刷新 token）',

  // ── ProjectForm — git provider option labels ──────────────────────────────
  'form.gitNone': '无',

  // ── ProjectForm — placeholders ────────────────────────────────────────────
  'form.namePlaceholder': '我的项目',
  'form.descriptionPlaceholder': '简短描述',
  'form.supportEndpointPlaceholder': '留空以从 API 基础 URL 推导',
  'form.notesPlaceholder': '自由格式备注',
  'form.secretStoredPlaceholder': '•••• 已存储 — 留空以保留',

  // ── ProjectForm — git token hints ─────────────────────────────────────────
  'form.gitlabTokenHint': 'Project Access Token — 角色：Reporter，权限范围：read_api。',
  'form.gitlabTokenLinkLabel': '打开项目访问 Token ↗',
  'form.gitlabNoUrlHint': ' 填写仓库 URL 以获取直接链接（Settings → Access Tokens）。',
  'form.githubTokenHint': '精细化个人访问 token — 只读权限：Contents, Pull requests, Actions。',
  'form.githubTokenLinkLabel': '在 GitHub 创建 token ↗',

  // ── ProjectForm — validation + submit ─────────────────────────────────────
  'form.errorNameRequired': '名称为必填项。',
  'form.errorInvalidJson': '凭证看起来像 JSON 但无法解析——请修正语法。',
  'form.savingBtn': '保存中…',
  'form.saveChangesBtn': '保存更改',
  'form.addProjectBtn': '添加项目',
};

const ar: Record<keyof typeof en, string> = {
  // ── Projects page ────────────────────────────────────────────────────────
  'page.title': 'المشاريع',
  'page.importBtn': 'استيراد .nexusproj',
  'page.addBtn': '+ إضافة مشروع',

  'alert.importFailed': 'فشل الاستيراد: {error}',
  'alert.exportedTo': 'تم التصدير إلى:',

  'empty.title': 'لا توجد مشاريع',
  'empty.body': 'أضف مشروعك الأول للبدء.',

  'table.name': 'الاسم',
  'table.apiBase': 'API Base',
  'table.git': 'Git',
  'table.health': 'الحالة',
  'table.actions': 'الإجراءات',
  'table.open': 'فتح',
  'table.export': 'تصدير',

  // ── Delete modal ─────────────────────────────────────────────────────────
  'delete.title': 'حذف المشروع',
  'delete.body': 'حذف {name}؟ سيؤدي ذلك إلى إزالة المشروع وجميع الأسرار المخزنة. لا يمكن التراجع عن هذا الإجراء.',

  // ── Export / Import passphrase modal titles ───────────────────────────────
  'passphrase.exportTitle': 'تصدير حزمة المشروع',
  'passphrase.importTitle': 'استيراد حزمة المشروع',

  // ── PassphraseModal internal ──────────────────────────────────────────────
  'passphrase.label': 'عبارة المرور',
  'passphrase.confirmLabel': 'تأكيد عبارة المرور',
  'passphrase.placeholder': 'أدخل عبارة المرور',
  'passphrase.confirmPlaceholder': 'كرر عبارة المرور',
  'passphrase.exportHint': 'تُشفِّر عبارة المرور هذه ملف الحزمة (AES-256-GCM + Argon2id). احتفظ بها في مكان آمن — لا يمكن الاسترداد.',
  'passphrase.importHint': 'أدخل عبارة المرور المستخدمة عند تصدير الحزمة.',
  'passphrase.exportBtn': 'تصدير',
  'passphrase.importBtn': 'استيراد',
  'passphrase.errorRequired': 'عبارة المرور مطلوبة.',
  'passphrase.errorMismatch': 'عبارتا المرور غير متطابقتين.',

  // ── ProjectForm — modal header ────────────────────────────────────────────
  'form.addTitle': 'إضافة مشروع',
  'form.editTitle': 'تعديل {name}',
  'form.closeAriaLabel': 'إغلاق',

  // ── ProjectForm — section legends ─────────────────────────────────────────
  'form.section.general': 'عام',
  'form.section.endpoints': 'نقاط النهاية',
  'form.section.repository': 'المستودع',
  'form.section.links': 'الروابط',
  'form.section.notes': 'ملاحظات',
  'form.section.secrets': 'الأسرار',
  'form.section.secretsHint': ' — مخزنة في مخزن بيانات الاعتماد بنظام التشغيل، ليس في قاعدة البيانات',

  // ── ProjectForm — field labels ────────────────────────────────────────────
  'form.name': 'الاسم',
  'form.description': 'الوصف',
  'form.apiBaseUrl': 'رابط API الأساسي',
  'form.authMethod': 'طريقة المصادقة',
  'form.gitProvider': 'مزود Git',
  'form.loginEndpoint': 'نقطة نهاية تسجيل الدخول',
  'form.tokenField': 'حقل الرمز المميز',
  'form.tokenFieldHint': ' المسار إلى الرمز المميز في استجابة تسجيل الدخول · فارغ = تلقائي (access_token, token, data.access_token…)',
  'form.healthEndpoint': 'نقطة نهاية الفحص الصحي',
  'form.supportEndpoint': 'نقطة نهاية الدعم',
  'form.supportEndpointHint': ' فارغ → {url}/v1/support-requests/',
  'form.deployEndpoint': 'نقطة نهاية النشر',
  'form.repoUrl': 'رابط المستودع',
  'form.gitProjectId': 'معرّف مشروع Git',
  'form.gitProjectIdHint': ' owner/repo لـ GitHub · معرّف المشروع أو المسار الكامل لـ GitLab',
  'form.docsUrl': 'رابط التوثيق',
  'form.apiToken': 'رمز API المميز',
  'form.loginCreds': 'بيانات اعتماد تسجيل الدخول (جسم الطلب)',
  'form.loginCredsHint': ' أي حقول تتوقعها واجهة API — JSON أو form-encoded (a=1&b=2).',
  'form.loginCredsHintEdit': ' اتركه فارغاً للاحتفاظ ببيانات الاعتماد المخزنة.',
  'form.gitHubToken': 'GitHub Token',
  'form.gitLabToken': 'GitLab Token',

  // ── ProjectForm — auth method option labels ───────────────────────────────
  'form.authNone': 'لا شيء',
  'form.authBearer': 'رمز Bearer المميز (ثابت)',
  'form.authLogin': 'نقطة نهاية تسجيل الدخول (رمز مميز بتحديث تلقائي)',

  // ── ProjectForm — git provider option labels ──────────────────────────────
  'form.gitNone': 'لا شيء',

  // ── ProjectForm — placeholders ────────────────────────────────────────────
  'form.namePlaceholder': 'مشروعي',
  'form.descriptionPlaceholder': 'وصف مختصر',
  'form.supportEndpointPlaceholder': 'اتركه فارغاً للاشتقاق من رابط API الأساسي',
  'form.notesPlaceholder': 'ملاحظات حرة',
  'form.secretStoredPlaceholder': '•••• مخزن — اتركه فارغاً للاحتفاظ به',

  // ── ProjectForm — git token hints ─────────────────────────────────────────
  'form.gitlabTokenHint': 'Project Access Token — الدور: Reporter، النطاقات: read_api.',
  'form.gitlabTokenLinkLabel': 'فتح رموز الوصول إلى المشروع ↗',
  'form.gitlabNoUrlHint': ' أدخل رابط المستودع للحصول على رابط مباشر (Settings → Access Tokens).',
  'form.githubTokenHint': 'رمز وصول شخصي دقيق الصلاحيات — للقراءة فقط: Contents, Pull requests, Actions.',
  'form.githubTokenLinkLabel': 'إنشاء رمز مميز على GitHub ↗',

  // ── ProjectForm — validation + submit ─────────────────────────────────────
  'form.errorNameRequired': 'الاسم مطلوب.',
  'form.errorInvalidJson': 'تبدو بيانات الاعتماد كـ JSON لكن لا يمكن تحليلها — صحِّح البنية.',
  'form.savingBtn': 'جاري الحفظ…',
  'form.saveChangesBtn': 'حفظ التغييرات',
  'form.addProjectBtn': 'إضافة مشروع',
};

export const projects = { en, uk, es, de, fr, pt, zh, ar };
