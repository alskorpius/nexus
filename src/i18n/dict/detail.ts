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

  // Section: Health History
  'history.title': 'Health History',
  'history.loading': 'Loading…',
  'history.collecting': 'Collecting data — checks are recorded every poll interval.',
  'history.ticksLabel': 'Last 60 health checks',
  'history.uptime24h': '24h',
  'history.uptime7d': '7d',
  'history.uptime30d': '30d',
  'history.incidents': 'Incidents',
  'history.noIncidents': 'No incidents recorded.',
  'history.ongoing': 'Ongoing',
  'history.mttr': 'MTTR: {duration}',
  'history.unit.m': 'm',
  'history.unit.h': 'h',
  'history.unit.d': 'd',

  // Section: Dependencies
  'deps.cardTitle': 'Dependencies',
  'deps.check': 'Check',
  'deps.checking': 'Checking…',
  'deps.lastChecked': 'last checked {ago}',
  'deps.error': 'Check failed:',
  'deps.notChecked': 'Not checked yet.',
  'deps.hint': 'Reads package.json / requirements.txt from the repo\'s default branch and compares declared versions against npm / PyPI registries + OSV.dev vulnerability database.',
  'deps.noManifests': 'No supported manifests found (package.json, requirements.txt at repo root).',
  'deps.summary.total': '{n} total',
  'deps.summary.vulnerable': '{n} vulnerable',
  'deps.summary.major': '{n} major',
  'deps.summary.minor': '{n} minor',
  'deps.summary.patch': '{n} patch',
  'deps.summary.current': '{n} current',
  'deps.summary.unknown': '{n} unknown',
  'deps.vulnTitle': 'Vulnerable',
  'deps.outdatedTitle': 'Outdated',
  'deps.outdatedMore': '+{n} more',
  'deps.devLabel': 'dev',
  'deps.staleness.major': 'major',
  'deps.staleness.minor': 'minor',
  'deps.staleness.patch': 'patch',
  'deps.staleness.current': 'current',
  'deps.staleness.unknown': 'unknown',

  // Section: AI Handover
  'handover.button': 'AI Context',
  'handover.title': 'AI Handover Document',
  'handover.hint': 'Generated in English for AI coding assistants — paste it into a Claude Code or Codex session to prime it with this project’s context.',
  'handover.copy': 'Copy',
  'handover.copied': 'Copied',
  'handover.save': 'Save .md',
  'handover.savedTo': 'Saved to:',
  'handover.generating': 'Generating…',
  'handover.error': 'Failed:',
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

  // Section: Health History
  'history.title': "Історія здоров’я",
  'history.loading': 'Завантаження…',
  'history.collecting': 'Збір даних — перевірки записуються при кожному опитуванні.',
  'history.ticksLabel': 'Останні 60 перевірок',
  'history.uptime24h': '24г',
  'history.uptime7d': '7д',
  'history.uptime30d': '30д',
  'history.incidents': 'Інциденти',
  'history.noIncidents': 'Інцидентів не зафіксовано.',
  'history.ongoing': 'Триває',
  'history.mttr': 'MTTR: {duration}',
  'history.unit.m': 'хв',
  'history.unit.h': 'год',
  'history.unit.d': 'д',

  // Section: Dependencies
  'deps.cardTitle': 'Залежності',
  'deps.check': 'Перевірити',
  'deps.checking': 'Перевірка…',
  'deps.lastChecked': 'перевірено {ago}',
  'deps.error': 'Помилка перевірки:',
  'deps.notChecked': 'Ще не перевірялось.',
  'deps.hint': 'Зчитує package.json / requirements.txt з гілки за замовчуванням та порівнює задекларовані версії з реєстрами npm / PyPI і базою вразливостей OSV.dev.',
  'deps.noManifests': 'Підтримувані маніфести не знайдено (package.json, requirements.txt у корені репозиторію).',
  'deps.summary.total': '{n} всього',
  'deps.summary.vulnerable': '{n} вразливих',
  'deps.summary.major': '{n} major',
  'deps.summary.minor': '{n} minor',
  'deps.summary.patch': '{n} patch',
  'deps.summary.current': '{n} актуальних',
  'deps.summary.unknown': '{n} невідомих',
  'deps.vulnTitle': 'Вразливі',
  'deps.outdatedTitle': 'Застарілі',
  'deps.outdatedMore': '+ще {n}',
  'deps.devLabel': 'dev',
  'deps.staleness.major': 'major',
  'deps.staleness.minor': 'minor',
  'deps.staleness.patch': 'patch',
  'deps.staleness.current': 'актуально',
  'deps.staleness.unknown': 'невідомо',

  // Section: AI Handover
  'handover.button': 'Контекст для AI',
  'handover.title': 'Handover-документ для AI',
  'handover.hint': 'Генерується англійською для AI-асистентів — вставте в сесію Claude Code чи Codex, щоб передати контекст проєкту.',
  'handover.copy': 'Копіювати',
  'handover.copied': 'Скопійовано',
  'handover.save': 'Зберегти .md',
  'handover.savedTo': 'Збережено до:',
  'handover.generating': 'Генерація…',
  'handover.error': 'Помилка:',
};

const es: Record<keyof typeof en, string> = {
  // Navigation
  'back': '← Proyectos',

  // Header actions
  'action.refresh': 'Actualizar',
  'action.edit': 'Editar',
  'action.export': 'Exportar',
  'action.delete': 'Eliminar',

  // Checked at
  'checkedAgo': 'verificado {ago}',

  // Export alerts
  'export.success': 'Exportado a:',
  'export.failed': 'Error al exportar:',

  // Section: Service Health
  'health.title': 'Estado del servicio',
  'health.label.endpoint': 'Endpoint',
  'health.label.httpStatus': 'Estado HTTP',
  'health.label.error': 'Error',
  'health.label.reported': 'Reportado',
  'health.notChecked': 'Aún no verificado. Haz clic en Actualizar.',
  'health.noEndpoint': 'No hay endpoint de salud configurado.',

  // Section: SSL Certificate
  'ssl.title': 'Certificado SSL',
  'ssl.label.host': 'Host',
  'ssl.label.error': 'Error',
  'ssl.label.issuer': 'Emisor',
  'ssl.label.expires': 'Vence',
  'ssl.label.daysLeft': 'Días restantes',
  'ssl.label.note': 'Nota',
  'ssl.days': '{days} días',

  // Section: Support Tickets
  'tickets.title': 'Tickets de soporte',
  'tickets.loadFailed': 'Error al cargar los tickets:',
  'tickets.configureAuth': 'Configura el método de autenticación y el endpoint de soporte para cargar los tickets.',
  'tickets.notLoaded': 'Aún no cargado. Haz clic en Actualizar.',

  // Section: Git Activity
  'git.title': 'Actividad Git',
  'git.loadFailed': 'Error al cargar los datos de Git:',
  'git.failedPipeline': '{count} pipeline fallido',
  'git.failedPipelines': '{count} pipelines fallidos',
  'git.branches': 'Ramas ({count})',
  'git.branchMore': '+{count} más',
  'git.mrs': 'MR / PR abiertos ({count})',
  'git.mrAuthor': 'por {author}',
  'git.commits': 'Commits recientes',
  'git.commitAuthor': 'por {author}',
  'git.noActivity': 'Sin actividad reciente.',
  'git.noProvider': 'No hay proveedor Git configurado.',
  'git.notLoaded': 'Aún no cargado. Haz clic en Actualizar.',
  'git.branchUpdated': 'actualizado {ago}',

  // Section: Links
  'links.title': 'Enlaces',
  'links.docs': '↗ Documentación',
  'links.repo': '↗ Repositorio',
  'links.deploy': '↗ Despliegue',

  // Section: Notes
  'notes.title': 'Notas',

  // Delete modal
  'delete.title': 'Eliminar proyecto',
  'delete.body': '¿Eliminar {name}? Se eliminará el proyecto y todos los secretos almacenados. Esta acción no se puede deshacer.',
  'delete.confirm': 'Eliminar',

  // Not found
  'notFound': 'Proyecto no encontrado.',
  'notFound.back': 'Volver a proyectos',

  // Export modal title
  'export.modalTitle': 'Exportar «{name}»',

  // Section: Health History
  'history.title': 'Historial de salud',
  'history.loading': 'Cargando…',
  'history.collecting': 'Recopilando datos — las comprobaciones se registran en cada ciclo de sondeo.',
  'history.ticksLabel': 'Últimas 60 comprobaciones',
  'history.uptime24h': '24h',
  'history.uptime7d': '7d',
  'history.uptime30d': '30d',
  'history.incidents': 'Incidentes',
  'history.noIncidents': 'No se han registrado incidentes.',
  'history.ongoing': 'En curso',
  'history.mttr': 'MTTR: {duration}',
  'history.unit.m': 'm',
  'history.unit.h': 'h',
  'history.unit.d': 'd',

  // Section: Dependencies
  'deps.cardTitle': 'Dependencias',
  'deps.check': 'Verificar',
  'deps.checking': 'Verificando…',
  'deps.lastChecked': 'verificado {ago}',
  'deps.error': 'Error en la verificación:',
  'deps.notChecked': 'Aún no verificado.',
  'deps.hint': 'Lee package.json / requirements.txt de la rama principal y compara las versiones declaradas con los registros npm / PyPI y la base de datos de vulnerabilidades OSV.dev.',
  'deps.noManifests': 'No se encontraron manifiestos compatibles (package.json, requirements.txt en la raíz del repositorio).',
  'deps.summary.total': '{n} total',
  'deps.summary.vulnerable': '{n} vulnerables',
  'deps.summary.major': '{n} major',
  'deps.summary.minor': '{n} minor',
  'deps.summary.patch': '{n} patch',
  'deps.summary.current': '{n} actuales',
  'deps.summary.unknown': '{n} desconocidos',
  'deps.vulnTitle': 'Vulnerables',
  'deps.outdatedTitle': 'Desactualizados',
  'deps.outdatedMore': '+{n} más',
  'deps.devLabel': 'dev',
  'deps.staleness.major': 'major',
  'deps.staleness.minor': 'minor',
  'deps.staleness.patch': 'patch',
  'deps.staleness.current': 'actual',
  'deps.staleness.unknown': 'desconocido',

  // Section: AI Handover
  'handover.button': 'Contexto para IA',
  'handover.title': 'Documento de traspaso para IA',
  'handover.hint': 'Se genera en inglés para asistentes de codificación con IA: pégalo en una sesión de Claude Code o Codex para darle el contexto del proyecto.',
  'handover.copy': 'Copiar',
  'handover.copied': 'Copiado',
  'handover.save': 'Guardar .md',
  'handover.savedTo': 'Guardado en:',
  'handover.generating': 'Generando…',
  'handover.error': 'Error:',
};

const de: Record<keyof typeof en, string> = {
  // Navigation
  'back': '← Projekte',

  // Header actions
  'action.refresh': 'Aktualisieren',
  'action.edit': 'Bearbeiten',
  'action.export': 'Exportieren',
  'action.delete': 'Löschen',

  // Checked at
  'checkedAgo': 'geprüft {ago}',

  // Export alerts
  'export.success': 'Exportiert nach:',
  'export.failed': 'Export fehlgeschlagen:',

  // Section: Service Health
  'health.title': 'Service-Status',
  'health.label.endpoint': 'Endpoint',
  'health.label.httpStatus': 'HTTP-Status',
  'health.label.error': 'Fehler',
  'health.label.reported': 'Gemeldet',
  'health.notChecked': 'Noch nicht geprüft. Klicken Sie auf Aktualisieren.',
  'health.noEndpoint': 'Kein Health-Endpoint konfiguriert.',

  // Section: SSL Certificate
  'ssl.title': 'SSL-Zertifikat',
  'ssl.label.host': 'Host',
  'ssl.label.error': 'Fehler',
  'ssl.label.issuer': 'Aussteller',
  'ssl.label.expires': 'Läuft ab',
  'ssl.label.daysLeft': 'Verbleibende Tage',
  'ssl.label.note': 'Hinweis',
  'ssl.days': '{days} Tage',

  // Section: Support Tickets
  'tickets.title': 'Support-Tickets',
  'tickets.loadFailed': 'Tickets konnten nicht geladen werden:',
  'tickets.configureAuth': 'Konfigurieren Sie die Authentifizierungsmethode und den Support-Endpoint, um Tickets zu laden.',
  'tickets.notLoaded': 'Noch nicht geladen. Klicken Sie auf Aktualisieren.',

  // Section: Git Activity
  'git.title': 'Git-Aktivität',
  'git.loadFailed': 'Git-Daten konnten nicht geladen werden:',
  'git.failedPipeline': '{count} fehlgeschlagene Pipeline',
  'git.failedPipelines': '{count} fehlgeschlagene Pipelines',
  'git.branches': 'Branches ({count})',
  'git.branchMore': '+{count} weitere',
  'git.mrs': 'Offene MR / PR ({count})',
  'git.mrAuthor': 'von {author}',
  'git.commits': 'Neueste Commits',
  'git.commitAuthor': 'von {author}',
  'git.noActivity': 'Keine neuere Aktivität.',
  'git.noProvider': 'Kein Git-Anbieter konfiguriert.',
  'git.notLoaded': 'Noch nicht geladen. Klicken Sie auf Aktualisieren.',
  'git.branchUpdated': 'aktualisiert {ago}',

  // Section: Links
  'links.title': 'Links',
  'links.docs': '↗ Dokumentation',
  'links.repo': '↗ Repository',
  'links.deploy': '↗ Deployment',

  // Section: Notes
  'notes.title': 'Notizen',

  // Delete modal
  'delete.title': 'Projekt löschen',
  'delete.body': '{name} löschen? Damit werden das Projekt und alle gespeicherten Geheimnisse entfernt. Diese Aktion kann nicht rückgängig gemacht werden.',
  'delete.confirm': 'Löschen',

  // Not found
  'notFound': 'Projekt nicht gefunden.',
  'notFound.back': 'Zurück zu Projekten',

  // Export modal title
  'export.modalTitle': '„{name}" exportieren',

  // Section: Health History
  'history.title': 'Zustandsverlauf',
  'history.loading': 'Laden…',
  'history.collecting': 'Daten werden gesammelt — Prüfungen werden bei jedem Abrufzyklus gespeichert.',
  'history.ticksLabel': 'Letzte 60 Prüfungen',
  'history.uptime24h': '24h',
  'history.uptime7d': '7T',
  'history.uptime30d': '30T',
  'history.incidents': 'Vorfälle',
  'history.noIncidents': 'Keine Vorfälle aufgezeichnet.',
  'history.ongoing': 'Laufend',
  'history.mttr': 'MTTR: {duration}',
  'history.unit.m': 'Min',
  'history.unit.h': 'Std',
  'history.unit.d': 'T',

  // Section: Dependencies
  'deps.cardTitle': 'Abhängigkeiten',
  'deps.check': 'Prüfen',
  'deps.checking': 'Prüfen…',
  'deps.lastChecked': 'zuletzt geprüft {ago}',
  'deps.error': 'Prüfung fehlgeschlagen:',
  'deps.notChecked': 'Noch nicht geprüft.',
  'deps.hint': 'Liest package.json / requirements.txt aus dem Standard-Branch und vergleicht deklarierte Versionen mit npm- / PyPI-Registries und der OSV.dev-Schwachstellendatenbank.',
  'deps.noManifests': 'Keine unterstützten Manifeste gefunden (package.json, requirements.txt im Repository-Stammverzeichnis).',
  'deps.summary.total': '{n} gesamt',
  'deps.summary.vulnerable': '{n} anfällig',
  'deps.summary.major': '{n} major',
  'deps.summary.minor': '{n} minor',
  'deps.summary.patch': '{n} patch',
  'deps.summary.current': '{n} aktuell',
  'deps.summary.unknown': '{n} unbekannt',
  'deps.vulnTitle': 'Anfällige Pakete',
  'deps.outdatedTitle': 'Veraltete Pakete',
  'deps.outdatedMore': '+{n} weitere',
  'deps.devLabel': 'dev',
  'deps.staleness.major': 'major',
  'deps.staleness.minor': 'minor',
  'deps.staleness.patch': 'patch',
  'deps.staleness.current': 'aktuell',
  'deps.staleness.unknown': 'unbekannt',

  // Section: AI Handover
  'handover.button': 'KI-Kontext',
  'handover.title': 'KI-Übergabedokument',
  'handover.hint': 'Wird auf Englisch für KI-Coding-Assistenten generiert — fügen Sie es in eine Claude-Code- oder Codex-Sitzung ein, um den Projektkontext zu übergeben.',
  'handover.copy': 'Kopieren',
  'handover.copied': 'Kopiert',
  'handover.save': 'Als .md speichern',
  'handover.savedTo': 'Gespeichert unter:',
  'handover.generating': 'Wird generiert…',
  'handover.error': 'Fehlgeschlagen:',
};

const fr: Record<keyof typeof en, string> = {
  // Navigation
  'back': '← Projets',

  // Header actions
  'action.refresh': 'Actualiser',
  'action.edit': 'Modifier',
  'action.export': 'Exporter',
  'action.delete': 'Supprimer',

  // Checked at
  'checkedAgo': 'vérifié {ago}',

  // Export alerts
  'export.success': 'Exporté vers :',
  'export.failed': 'Échec de l\'export :',

  // Section: Service Health
  'health.title': 'État du service',
  'health.label.endpoint': 'Endpoint',
  'health.label.httpStatus': 'Statut HTTP',
  'health.label.error': 'Erreur',
  'health.label.reported': 'Signalé',
  'health.notChecked': 'Pas encore vérifié. Cliquez sur Actualiser.',
  'health.noEndpoint': 'Aucun endpoint de santé configuré.',

  // Section: SSL Certificate
  'ssl.title': 'Certificat SSL',
  'ssl.label.host': 'Hôte',
  'ssl.label.error': 'Erreur',
  'ssl.label.issuer': 'Émetteur',
  'ssl.label.expires': 'Expire le',
  'ssl.label.daysLeft': 'Jours restants',
  'ssl.label.note': 'Note',
  'ssl.days': '{days} jours',

  // Section: Support Tickets
  'tickets.title': 'Tickets de support',
  'tickets.loadFailed': 'Impossible de charger les tickets :',
  'tickets.configureAuth': 'Configurez la méthode d\'authentification et l\'endpoint de support pour charger les tickets.',
  'tickets.notLoaded': 'Pas encore chargé. Cliquez sur Actualiser.',

  // Section: Git Activity
  'git.title': 'Activité Git',
  'git.loadFailed': 'Impossible de charger les données Git :',
  'git.failedPipeline': '{count} pipeline en échec',
  'git.failedPipelines': '{count} pipelines en échec',
  'git.branches': 'Branches ({count})',
  'git.branchMore': '+{count} de plus',
  'git.mrs': 'MR / PR ouverts ({count})',
  'git.mrAuthor': 'par {author}',
  'git.commits': 'Commits récents',
  'git.commitAuthor': 'par {author}',
  'git.noActivity': 'Aucune activité récente.',
  'git.noProvider': 'Aucun fournisseur Git configuré.',
  'git.notLoaded': 'Pas encore chargé. Cliquez sur Actualiser.',
  'git.branchUpdated': 'mis à jour {ago}',

  // Section: Links
  'links.title': 'Liens',
  'links.docs': '↗ Documentation',
  'links.repo': '↗ Dépôt',
  'links.deploy': '↗ Déploiement',

  // Section: Notes
  'notes.title': 'Notes',

  // Delete modal
  'delete.title': 'Supprimer le projet',
  'delete.body': 'Supprimer {name} ? Cela supprime le projet et tous les secrets enregistrés. Cette action est irréversible.',
  'delete.confirm': 'Supprimer',

  // Not found
  'notFound': 'Projet introuvable.',
  'notFound.back': 'Retour aux projets',

  // Export modal title
  'export.modalTitle': 'Exporter « {name} »',

  // Section: Health History
  'history.title': 'Historique de santé',
  'history.loading': 'Chargement…',
  'history.collecting': 'Collecte des données — les vérifications sont enregistrées à chaque cycle d\'interrogation.',
  'history.ticksLabel': '60 dernières vérifications',
  'history.uptime24h': '24h',
  'history.uptime7d': '7j',
  'history.uptime30d': '30j',
  'history.incidents': 'Incidents',
  'history.noIncidents': 'Aucun incident enregistré.',
  'history.ongoing': 'En cours',
  'history.mttr': 'MTTR : {duration}',
  'history.unit.m': 'min',
  'history.unit.h': 'h',
  'history.unit.d': 'j',

  // Section: Dependencies
  'deps.cardTitle': 'Dépendances',
  'deps.check': 'Vérifier',
  'deps.checking': 'Vérification…',
  'deps.lastChecked': 'vérifié {ago}',
  'deps.error': 'Échec de la vérification :',
  'deps.notChecked': 'Pas encore vérifié.',
  'deps.hint': 'Lit package.json / requirements.txt depuis la branche principale et compare les versions déclarées avec les registres npm / PyPI et la base de données de vulnérabilités OSV.dev.',
  'deps.noManifests': 'Aucun manifeste pris en charge trouvé (package.json, requirements.txt à la racine du dépôt).',
  'deps.summary.total': '{n} au total',
  'deps.summary.vulnerable': '{n} vulnérables',
  'deps.summary.major': '{n} major',
  'deps.summary.minor': '{n} minor',
  'deps.summary.patch': '{n} patch',
  'deps.summary.current': '{n} à jour',
  'deps.summary.unknown': '{n} inconnus',
  'deps.vulnTitle': 'Vulnérables',
  'deps.outdatedTitle': 'Obsolètes',
  'deps.outdatedMore': '+{n} de plus',
  'deps.devLabel': 'dev',
  'deps.staleness.major': 'major',
  'deps.staleness.minor': 'minor',
  'deps.staleness.patch': 'patch',
  'deps.staleness.current': 'à jour',
  'deps.staleness.unknown': 'inconnu',

  // Section: AI Handover
  'handover.button': 'Contexte IA',
  'handover.title': "Document de passation pour l'IA",
  'handover.hint': "Généré en anglais pour les assistants de codage IA — collez-le dans une session Claude Code ou Codex pour lui transmettre le contexte du projet.",
  'handover.copy': 'Copier',
  'handover.copied': 'Copié',
  'handover.save': 'Enregistrer .md',
  'handover.savedTo': 'Enregistré dans :',
  'handover.generating': 'Génération…',
  'handover.error': 'Échec :',
};

const pt: Record<keyof typeof en, string> = {
  // Navigation
  'back': '← Projetos',

  // Header actions
  'action.refresh': 'Atualizar',
  'action.edit': 'Editar',
  'action.export': 'Exportar',
  'action.delete': 'Excluir',

  // Checked at
  'checkedAgo': 'verificado {ago}',

  // Export alerts
  'export.success': 'Exportado para:',
  'export.failed': 'Falha ao exportar:',

  // Section: Service Health
  'health.title': 'Saúde do serviço',
  'health.label.endpoint': 'Endpoint',
  'health.label.httpStatus': 'Status HTTP',
  'health.label.error': 'Erro',
  'health.label.reported': 'Reportado',
  'health.notChecked': 'Ainda não verificado. Clique em Atualizar.',
  'health.noEndpoint': 'Nenhum endpoint de saúde configurado.',

  // Section: SSL Certificate
  'ssl.title': 'Certificado SSL',
  'ssl.label.host': 'Host',
  'ssl.label.error': 'Erro',
  'ssl.label.issuer': 'Emissor',
  'ssl.label.expires': 'Expira em',
  'ssl.label.daysLeft': 'Dias restantes',
  'ssl.label.note': 'Observação',
  'ssl.days': '{days} dias',

  // Section: Support Tickets
  'tickets.title': 'Tickets de suporte',
  'tickets.loadFailed': 'Falha ao carregar os tickets:',
  'tickets.configureAuth': 'Configure o método de autenticação e o endpoint de suporte para carregar os tickets.',
  'tickets.notLoaded': 'Ainda não carregado. Clique em Atualizar.',

  // Section: Git Activity
  'git.title': 'Atividade Git',
  'git.loadFailed': 'Falha ao carregar os dados do Git:',
  'git.failedPipeline': '{count} pipeline com falha',
  'git.failedPipelines': '{count} pipelines com falha',
  'git.branches': 'Branches ({count})',
  'git.branchMore': '+{count} mais',
  'git.mrs': 'MR / PR abertos ({count})',
  'git.mrAuthor': 'por {author}',
  'git.commits': 'Commits recentes',
  'git.commitAuthor': 'por {author}',
  'git.noActivity': 'Nenhuma atividade recente.',
  'git.noProvider': 'Nenhum provedor Git configurado.',
  'git.notLoaded': 'Ainda não carregado. Clique em Atualizar.',
  'git.branchUpdated': 'atualizado {ago}',

  // Section: Links
  'links.title': 'Links',
  'links.docs': '↗ Documentação',
  'links.repo': '↗ Repositório',
  'links.deploy': '↗ Deploy',

  // Section: Notes
  'notes.title': 'Notas',

  // Delete modal
  'delete.title': 'Excluir projeto',
  'delete.body': 'Excluir {name}? Isso remove o projeto e todos os segredos armazenados. Essa ação não pode ser desfeita.',
  'delete.confirm': 'Excluir',

  // Not found
  'notFound': 'Projeto não encontrado.',
  'notFound.back': 'Voltar para projetos',

  // Export modal title
  'export.modalTitle': 'Exportar "{name}"',

  // Section: Health History
  'history.title': 'Histórico de saúde',
  'history.loading': 'Carregando…',
  'history.collecting': 'Coletando dados — as verificações são registradas a cada ciclo de sondagem.',
  'history.ticksLabel': 'Últimas 60 verificações',
  'history.uptime24h': '24h',
  'history.uptime7d': '7d',
  'history.uptime30d': '30d',
  'history.incidents': 'Incidentes',
  'history.noIncidents': 'Nenhum incidente registrado.',
  'history.ongoing': 'Em andamento',
  'history.mttr': 'MTTR: {duration}',
  'history.unit.m': 'min',
  'history.unit.h': 'h',
  'history.unit.d': 'd',

  // Section: Dependencies
  'deps.cardTitle': 'Dependências',
  'deps.check': 'Verificar',
  'deps.checking': 'Verificando…',
  'deps.lastChecked': 'verificado {ago}',
  'deps.error': 'Falha na verificação:',
  'deps.notChecked': 'Ainda não verificado.',
  'deps.hint': 'Lê package.json / requirements.txt da branch padrão e compara as versões declaradas com os registros npm / PyPI e o banco de dados de vulnerabilidades OSV.dev.',
  'deps.noManifests': 'Nenhum manifesto compatível encontrado (package.json, requirements.txt na raiz do repositório).',
  'deps.summary.total': '{n} no total',
  'deps.summary.vulnerable': '{n} vulneráveis',
  'deps.summary.major': '{n} major',
  'deps.summary.minor': '{n} minor',
  'deps.summary.patch': '{n} patch',
  'deps.summary.current': '{n} atuais',
  'deps.summary.unknown': '{n} desconhecidos',
  'deps.vulnTitle': 'Vulneráveis',
  'deps.outdatedTitle': 'Desatualizados',
  'deps.outdatedMore': '+{n} mais',
  'deps.devLabel': 'dev',
  'deps.staleness.major': 'major',
  'deps.staleness.minor': 'minor',
  'deps.staleness.patch': 'patch',
  'deps.staleness.current': 'atualizado',
  'deps.staleness.unknown': 'desconhecido',

  // Section: AI Handover
  'handover.button': 'Contexto para IA',
  'handover.title': 'Documento de handover para IA',
  'handover.hint': 'Gerado em inglês para assistentes de codificação com IA — cole em uma sessão do Claude Code ou Codex para passar o contexto do projeto.',
  'handover.copy': 'Copiar',
  'handover.copied': 'Copiado',
  'handover.save': 'Salvar .md',
  'handover.savedTo': 'Salvo em:',
  'handover.generating': 'Gerando…',
  'handover.error': 'Falha:',
};

const zh: Record<keyof typeof en, string> = {
  // Navigation
  'back': '← 项目',

  // Header actions
  'action.refresh': '刷新',
  'action.edit': '编辑',
  'action.export': '导出',
  'action.delete': '删除',

  // Checked at
  'checkedAgo': '{ago}前已检查',

  // Export alerts
  'export.success': '已导出至：',
  'export.failed': '导出失败：',

  // Section: Service Health
  'health.title': '服务健康状态',
  'health.label.endpoint': '端点',
  'health.label.httpStatus': 'HTTP 状态',
  'health.label.error': '错误',
  'health.label.reported': '上报时间',
  'health.notChecked': '尚未检查。请点击"刷新"。',
  'health.noEndpoint': '未配置健康检查端点。',

  // Section: SSL Certificate
  'ssl.title': 'SSL 证书',
  'ssl.label.host': '主机',
  'ssl.label.error': '错误',
  'ssl.label.issuer': '颁发机构',
  'ssl.label.expires': '到期时间',
  'ssl.label.daysLeft': '剩余天数',
  'ssl.label.note': '备注',
  'ssl.days': '{days} 天',

  // Section: Support Tickets
  'tickets.title': '支持工单',
  'tickets.loadFailed': '工单加载失败：',
  'tickets.configureAuth': '请配置身份验证方式和支持端点以加载工单。',
  'tickets.notLoaded': '尚未加载。请点击"刷新"。',

  // Section: Git Activity
  'git.title': 'Git 活动',
  'git.loadFailed': 'Git 数据加载失败：',
  'git.failedPipeline': '{count} 个流水线失败',
  'git.failedPipelines': '{count} 个流水线失败',
  'git.branches': '分支（{count}）',
  'git.branchMore': '+{count} 个',
  'git.mrs': '开放的 MR / PR（{count}）',
  'git.mrAuthor': '作者：{author}',
  'git.commits': '最近提交',
  'git.commitAuthor': '作者：{author}',
  'git.noActivity': '暂无近期活动。',
  'git.noProvider': '未配置 Git 提供方。',
  'git.notLoaded': '尚未加载。请点击"刷新"。',
  'git.branchUpdated': '{ago}前已更新',

  // Section: Links
  'links.title': '链接',
  'links.docs': '↗ 文档',
  'links.repo': '↗ 仓库',
  'links.deploy': '↗ 部署',

  // Section: Notes
  'notes.title': '备注',

  // Delete modal
  'delete.title': '删除项目',
  'delete.body': '确定要删除 {name} 吗？这将删除该项目及所有已存储的密钥，此操作无法撤销。',
  'delete.confirm': '删除',

  // Not found
  'notFound': '未找到该项目。',
  'notFound.back': '返回项目列表',

  // Export modal title
  'export.modalTitle': '导出"{name}"',

  // Section: Health History
  'history.title': '健康历史',
  'history.loading': '加载中…',
  'history.collecting': '正在收集数据 — 每次轮询周期都会记录检查结果。',
  'history.ticksLabel': '最近 60 次检查',
  'history.uptime24h': '24小时',
  'history.uptime7d': '7天',
  'history.uptime30d': '30天',
  'history.incidents': '事件',
  'history.noIncidents': '未记录任何事故。',
  'history.ongoing': '进行中',
  'history.mttr': 'MTTR：{duration}',
  'history.unit.m': '分',
  'history.unit.h': '时',
  'history.unit.d': '天',

  // Section: Dependencies
  'deps.cardTitle': '依赖项',
  'deps.check': '检查',
  'deps.checking': '检查中…',
  'deps.lastChecked': '{ago}前已检查',
  'deps.error': '检查失败：',
  'deps.notChecked': '尚未检查。',
  'deps.hint': '从默认分支读取 package.json / requirements.txt，并将声明的版本与 npm / PyPI 注册表及 OSV.dev 漏洞数据库进行比对。',
  'deps.noManifests': '未找到受支持的清单文件（package.json、requirements.txt 应位于仓库根目录）。',
  'deps.summary.total': '共 {n} 个',
  'deps.summary.vulnerable': '{n} 个存在漏洞',
  'deps.summary.major': '{n} 个 major 落后',
  'deps.summary.minor': '{n} 个 minor 落后',
  'deps.summary.patch': '{n} 个 patch 落后',
  'deps.summary.current': '{n} 个最新',
  'deps.summary.unknown': '{n} 个未知',
  'deps.vulnTitle': '存在漏洞',
  'deps.outdatedTitle': '已过时',
  'deps.outdatedMore': '+{n} 个',
  'deps.devLabel': 'dev',
  'deps.staleness.major': 'major',
  'deps.staleness.minor': 'minor',
  'deps.staleness.patch': 'patch',
  'deps.staleness.current': '最新',
  'deps.staleness.unknown': '未知',

  // Section: AI Handover
  'handover.button': 'AI 上下文',
  'handover.title': 'AI 交接文档',
  'handover.hint': '以英文生成，供 AI 编程助手使用——粘贴到 Claude Code 或 Codex 会话中即可传递项目上下文。',
  'handover.copy': '复制',
  'handover.copied': '已复制',
  'handover.save': '保存 .md',
  'handover.savedTo': '已保存到:',
  'handover.generating': '生成中…',
  'handover.error': '失败:',
};

const ar: Record<keyof typeof en, string> = {
  // Navigation
  'back': '← المشاريع',

  // Header actions
  'action.refresh': 'تحديث',
  'action.edit': 'تعديل',
  'action.export': 'تصدير',
  'action.delete': 'حذف',

  // Checked at
  'checkedAgo': 'تم الفحص {ago}',

  // Export alerts
  'export.success': 'تم التصدير إلى:',
  'export.failed': 'فشل التصدير:',

  // Section: Service Health
  'health.title': 'صحة الخدمة',
  'health.label.endpoint': 'نقطة النهاية',
  'health.label.httpStatus': 'حالة HTTP',
  'health.label.error': 'خطأ',
  'health.label.reported': 'تاريخ الإبلاغ',
  'health.notChecked': 'لم يُفحص بعد. انقر على تحديث.',
  'health.noEndpoint': 'لم يتم تكوين نقطة نهاية للفحص.',

  // Section: SSL Certificate
  'ssl.title': 'شهادة SSL',
  'ssl.label.host': 'المضيف',
  'ssl.label.error': 'خطأ',
  'ssl.label.issuer': 'الجهة المُصدِرة',
  'ssl.label.expires': 'تنتهي في',
  'ssl.label.daysLeft': 'الأيام المتبقية',
  'ssl.label.note': 'ملاحظة',
  'ssl.days': '{days} أيام',

  // Section: Support Tickets
  'tickets.title': 'تذاكر الدعم',
  'tickets.loadFailed': 'فشل تحميل التذاكر:',
  'tickets.configureAuth': 'قم بتكوين طريقة المصادقة ونقطة نهاية الدعم لتحميل التذاكر.',
  'tickets.notLoaded': 'لم يُحمَّل بعد. انقر على تحديث.',

  // Section: Git Activity
  'git.title': 'نشاط Git',
  'git.loadFailed': 'فشل تحميل بيانات Git:',
  'git.failedPipeline': '{count} خط أنابيب فاشل',
  'git.failedPipelines': '{count} خطوط أنابيب فاشلة',
  'git.branches': 'الفروع ({count})',
  'git.branchMore': '+{count} أكثر',
  'git.mrs': 'MR / PR المفتوحة ({count})',
  'git.mrAuthor': 'بواسطة {author}',
  'git.commits': 'أحدث الالتزامات',
  'git.commitAuthor': 'بواسطة {author}',
  'git.noActivity': 'لا يوجد نشاط حديث.',
  'git.noProvider': 'لم يتم تكوين موفر Git.',
  'git.notLoaded': 'لم يُحمَّل بعد. انقر على تحديث.',
  'git.branchUpdated': 'تم التحديث {ago}',

  // Section: Links
  'links.title': 'الروابط',
  'links.docs': '↗ التوثيق',
  'links.repo': '↗ المستودع',
  'links.deploy': '↗ النشر',

  // Section: Notes
  'notes.title': 'الملاحظات',

  // Delete modal
  'delete.title': 'حذف المشروع',
  'delete.body': 'هل تريد حذف {name}؟ سيؤدي ذلك إلى إزالة المشروع وجميع الأسرار المخزّنة. لا يمكن التراجع عن هذا الإجراء.',
  'delete.confirm': 'حذف',

  // Not found
  'notFound': 'المشروع غير موجود.',
  'notFound.back': 'العودة إلى المشاريع',

  // Export modal title
  'export.modalTitle': 'تصدير "{name}"',

  // Section: Health History
  'history.title': 'سجل الحالة الصحية',
  'history.loading': 'جارٍ التحميل…',
  'history.collecting': 'جمع البيانات — يتم تسجيل الفحوصات في كل دورة استطلاع.',
  'history.ticksLabel': 'آخر 60 فحصًا',
  'history.uptime24h': '24س',
  'history.uptime7d': '7أ',
  'history.uptime30d': '30أ',
  'history.incidents': 'الحوادث',
  'history.noIncidents': 'لم يتم تسجيل أي حوادث.',
  'history.ongoing': 'جارٍ',
  'history.mttr': 'MTTR: {duration}',
  'history.unit.m': 'د',
  'history.unit.h': 'س',
  'history.unit.d': 'أ',

  // Section: Dependencies
  'deps.cardTitle': 'التبعيات',
  'deps.check': 'فحص',
  'deps.checking': 'جارٍ الفحص…',
  'deps.lastChecked': 'تم الفحص {ago}',
  'deps.error': 'فشل الفحص:',
  'deps.notChecked': 'لم يُفحص بعد.',
  'deps.hint': 'يقرأ package.json / requirements.txt من الفرع الافتراضي ويقارن الإصدارات المُعلنة بسجلات npm / PyPI وقاعدة بيانات الثغرات OSV.dev.',
  'deps.noManifests': 'لم يُعثر على أي ملفات إعداد مدعومة (package.json أو requirements.txt في جذر المستودع).',
  'deps.summary.total': '{n} إجمالاً',
  'deps.summary.vulnerable': '{n} ثغرات',
  'deps.summary.major': '{n} major',
  'deps.summary.minor': '{n} minor',
  'deps.summary.patch': '{n} patch',
  'deps.summary.current': '{n} محدَّثة',
  'deps.summary.unknown': '{n} غير معروف',
  'deps.vulnTitle': 'الحزم المعرَّضة لثغرات',
  'deps.outdatedTitle': 'الحزم القديمة',
  'deps.outdatedMore': '+{n} أكثر',
  'deps.devLabel': 'dev',
  'deps.staleness.major': 'major',
  'deps.staleness.minor': 'minor',
  'deps.staleness.patch': 'patch',
  'deps.staleness.current': 'محدَّث',
  'deps.staleness.unknown': 'غير معروف',

  // Section: AI Handover
  'handover.button': 'سياق AI',
  'handover.title': 'مستند تسليم لـ AI',
  'handover.hint': 'يُنشأ بالإنجليزية لمساعدي البرمجة بالذكاء الاصطناعي — الصقه في جلسة Claude Code أو Codex لنقل سياق المشروع.',
  'handover.copy': 'نسخ',
  'handover.copied': 'تم النسخ',
  'handover.save': 'حفظ ‎.md',
  'handover.savedTo': 'حُفظ في:',
  'handover.generating': 'جارٍ الإنشاء…',
  'handover.error': 'فشل:',
};

export const detail = { en, uk, es, de, fr, pt, zh, ar };
