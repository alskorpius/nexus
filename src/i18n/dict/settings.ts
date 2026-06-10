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

const es: Record<keyof typeof en, string> = {
  'language.label': 'Idioma',
  'language.hint': 'Idioma de la interfaz. Se aplica de inmediato y se conserva entre reinicios.',

  title: 'Configuración',

  'workspace.title': 'Espacio de trabajo',
  'workspace.name.label': 'Nombre del espacio de trabajo',
  'workspace.name.hint': 'Se muestra en la barra lateral. Déjelo en blanco para usar el nombre predeterminado NEXUS.',
  'workspace.logo.label': 'Logotipo',
  'workspace.logo.upload': 'Subir logotipo',
  'workspace.logo.replace': 'Reemplazar logotipo',
  'workspace.logo.remove': 'Eliminar logotipo',
  'workspace.logo.alt': 'Logotipo del espacio de trabajo',
  'workspace.logo.hint': 'Máximo 200 KB. Se muestra con una altura de hasta 28 px en la barra lateral.',
  'workspace.logo.errorSize': 'La imagen debe tener 200 KB o menos.',
  'workspace.theme.label': 'Tema de color',
  'workspace.theme.hint': 'Se aplica de inmediato y se conserva entre reinicios.',

  'polling.title': 'Actualización automática',
  'polling.interval.label': 'Intervalo de actualización (segundos)',
  'polling.interval.hint': 'Mínimo 15 s. Con qué frecuencia Nexus vuelve a verificar todos los proyectos en segundo plano.',
  'polling.interval.errorMin': 'El intervalo mínimo es de 15 segundos.',

  'storage.title': 'Almacenamiento de datos',
  'storage.projectData.label': 'Datos del proyecto',
  'storage.projectData.value': 'Base de datos SQLite ({db}) en el directorio de datos de la aplicación. Los datos no salen de su equipo.',
  'storage.secrets.label': 'Secretos',
  'storage.secrets.value': 'Almacenados en el repositorio de credenciales del sistema operativo — Windows Credential Manager en Windows, macOS Keychain en macOS. Nunca se escriben en disco en texto plano.',
  'storage.bundle.label': 'Formato de paquete',
  'storage.bundle.value': 'Los archivos {ext} exportados se cifran con AES-256-GCM. La clave se deriva de su frase de contraseña mediante Argon2id. Sin la frase de contraseña, el archivo es ilegible.',

  'about.title': 'Acerca de',
  'about.version.label': 'Versión',
  'about.arch.label': 'Arquitectura',
  'about.arch.value': 'Tauri 2 · React 19 · local-first',
};

const de: Record<keyof typeof en, string> = {
  'language.label': 'Sprache',
  'language.hint': 'Oberflächensprache. Wird sofort übernommen und bei jedem Neustart beibehalten.',

  title: 'Einstellungen',

  'workspace.title': 'Arbeitsbereich',
  'workspace.name.label': 'Name des Arbeitsbereichs',
  'workspace.name.hint': 'Wird in der Seitenleiste angezeigt. Leer lassen, um das Standard-NEXUS-Branding zu verwenden.',
  'workspace.logo.label': 'Logo',
  'workspace.logo.upload': 'Logo hochladen',
  'workspace.logo.replace': 'Logo ersetzen',
  'workspace.logo.remove': 'Logo entfernen',
  'workspace.logo.alt': 'Arbeitsbereich-Logo',
  'workspace.logo.hint': 'Maximal 200 KB. In der Seitenleiste mit bis zu 28 px Höhe angezeigt.',
  'workspace.logo.errorSize': 'Das Bild darf maximal 200 KB groß sein.',
  'workspace.theme.label': 'Farbschema',
  'workspace.theme.hint': 'Wird sofort übernommen und bei jedem Neustart beibehalten.',

  'polling.title': 'Aktualisierung',
  'polling.interval.label': 'Aktualisierungsintervall (Sekunden)',
  'polling.interval.hint': 'Mindestens 15 s. Wie oft Nexus alle Projekte im Hintergrund neu prüft.',
  'polling.interval.errorMin': 'Das Mindestintervall beträgt 15 Sekunden.',

  'storage.title': 'Datenspeicherung',
  'storage.projectData.label': 'Projektdaten',
  'storage.projectData.value': 'SQLite-Datenbank ({db}) im App-Datenverzeichnis. Keine Daten verlassen Ihr Gerät.',
  'storage.secrets.label': 'Geheimnisse',
  'storage.secrets.value': 'Im Betriebssystem-Anmeldeinformationsspeicher abgelegt — Windows Credential Manager unter Windows, macOS Keychain unter macOS. Werden niemals im Klartext auf den Datenträger geschrieben.',
  'storage.bundle.label': 'Paketformat',
  'storage.bundle.value': 'Exportierte {ext}-Dateien werden mit AES-256-GCM verschlüsselt. Der Schlüssel wird mithilfe von Argon2id aus Ihrer Passphrase abgeleitet. Ohne die Passphrase ist die Datei nicht lesbar.',

  'about.title': 'Über',
  'about.version.label': 'Version',
  'about.arch.label': 'Architektur',
  'about.arch.value': 'Tauri 2 · React 19 · local-first',
};

const fr: Record<keyof typeof en, string> = {
  'language.label': 'Langue',
  'language.hint': "Langue de l'interface. Appliquée immédiatement et conservée entre les redémarrages.",

  title: 'Paramètres',

  'workspace.title': 'Espace de travail',
  'workspace.name.label': "Nom de l'espace de travail",
  'workspace.name.hint': "Affiché dans la barre latérale. Laissez vide pour utiliser le nom NEXUS par défaut.",
  'workspace.logo.label': 'Logo',
  'workspace.logo.upload': 'Téléverser un logo',
  'workspace.logo.replace': 'Remplacer le logo',
  'workspace.logo.remove': 'Supprimer le logo',
  'workspace.logo.alt': "Logo de l'espace de travail",
  'workspace.logo.hint': "Maximum 200 Ko. Affiché jusqu'à 28 px de hauteur dans la barre latérale.",
  'workspace.logo.errorSize': "L'image doit faire 200 Ko ou moins.",
  'workspace.theme.label': 'Thème de couleur',
  'workspace.theme.hint': 'Appliqué immédiatement et conservé entre les redémarrages.',

  'polling.title': 'Actualisation automatique',
  'polling.interval.label': "Intervalle d'actualisation (secondes)",
  'polling.interval.hint': 'Minimum 15 s. Fréquence à laquelle Nexus re-vérifie tous les projets en arrière-plan.',
  'polling.interval.errorMin': "L'intervalle minimum est de 15 secondes.",

  'storage.title': 'Stockage des données',
  'storage.projectData.label': 'Données du projet',
  'storage.projectData.value': "Base de données SQLite ({db}) dans le répertoire de données de l'application. Aucune donnée ne quitte votre appareil.",
  'storage.secrets.label': 'Secrets',
  'storage.secrets.value': "Stockés dans le gestionnaire de credentials du système d'exploitation — Windows Credential Manager sous Windows, macOS Keychain sous macOS. Jamais écrits en clair sur le disque.",
  'storage.bundle.label': 'Format de paquet',
  'storage.bundle.value': 'Les fichiers {ext} exportés sont chiffrés avec AES-256-GCM. La clé est dérivée de votre phrase secrète via Argon2id. Sans la phrase secrète, le fichier est illisible.',

  'about.title': 'À propos',
  'about.version.label': 'Version',
  'about.arch.label': 'Architecture',
  'about.arch.value': 'Tauri 2 · React 19 · local-first',
};

const pt: Record<keyof typeof en, string> = {
  'language.label': 'Idioma',
  'language.hint': 'Idioma da interface. Aplicado imediatamente e mantido entre reinicializações.',

  title: 'Configurações',

  'workspace.title': 'Área de trabalho',
  'workspace.name.label': 'Nome da área de trabalho',
  'workspace.name.hint': 'Exibido na barra lateral. Deixe em branco para usar o nome padrão NEXUS.',
  'workspace.logo.label': 'Logotipo',
  'workspace.logo.upload': 'Enviar logotipo',
  'workspace.logo.replace': 'Substituir logotipo',
  'workspace.logo.remove': 'Remover logotipo',
  'workspace.logo.alt': 'Logotipo da área de trabalho',
  'workspace.logo.hint': 'Máximo de 200 KB. Exibido com até 28 px de altura na barra lateral.',
  'workspace.logo.errorSize': 'A imagem deve ter 200 KB ou menos.',
  'workspace.theme.label': 'Tema de cores',
  'workspace.theme.hint': 'Aplicado imediatamente e mantido entre reinicializações.',

  'polling.title': 'Atualização automática',
  'polling.interval.label': 'Intervalo de atualização (segundos)',
  'polling.interval.hint': 'Mínimo de 15 s. Com que frequência o Nexus reverifica todos os projetos em segundo plano.',
  'polling.interval.errorMin': 'O intervalo mínimo é de 15 segundos.',

  'storage.title': 'Armazenamento de dados',
  'storage.projectData.label': 'Dados do projeto',
  'storage.projectData.value': 'Banco de dados SQLite ({db}) no diretório de dados do aplicativo. Nenhum dado sai do seu dispositivo.',
  'storage.secrets.label': 'Segredos',
  'storage.secrets.value': 'Armazenados no repositório de credenciais do sistema operacional — Windows Credential Manager no Windows, macOS Keychain no macOS. Nunca gravados em disco em texto simples.',
  'storage.bundle.label': 'Formato de pacote',
  'storage.bundle.value': 'Os arquivos {ext} exportados são criptografados com AES-256-GCM. A chave é derivada da sua frase secreta usando Argon2id. Sem a frase secreta, o arquivo é ilegível.',

  'about.title': 'Sobre',
  'about.version.label': 'Versão',
  'about.arch.label': 'Arquitetura',
  'about.arch.value': 'Tauri 2 · React 19 · local-first',
};

const zh: Record<keyof typeof en, string> = {
  'language.label': '语言',
  'language.hint': '界面语言。立即生效并在重启后保留。',

  title: '设置',

  'workspace.title': '工作区',
  'workspace.name.label': '工作区名称',
  'workspace.name.hint': '显示在侧边栏中。留空则使用默认的 NEXUS 品牌名称。',
  'workspace.logo.label': '徽标',
  'workspace.logo.upload': '上传徽标',
  'workspace.logo.replace': '替换徽标',
  'workspace.logo.remove': '移除徽标',
  'workspace.logo.alt': '工作区徽标',
  'workspace.logo.hint': '最大 200 KB。在侧边栏中以最高 28 px 的高度显示。',
  'workspace.logo.errorSize': '图片大小必须在 200 KB 以内。',
  'workspace.theme.label': '颜色主题',
  'workspace.theme.hint': '立即生效并在重启后保留。',

  'polling.title': '自动刷新',
  'polling.interval.label': '刷新间隔（秒）',
  'polling.interval.hint': '最短 15 秒。Nexus 在后台重新检查所有项目的频率。',
  'polling.interval.errorMin': '最短间隔为 15 秒。',

  'storage.title': '数据存储',
  'storage.projectData.label': '项目数据',
  'storage.projectData.value': '应用数据目录中的 SQLite 数据库（{db}）。数据不会离开您的设备。',
  'storage.secrets.label': '密钥',
  'storage.secrets.value': '存储在操作系统凭据管理器中——Windows 上为 Windows Credential Manager，macOS 上为 macOS Keychain。从不以明文形式写入磁盘。',
  'storage.bundle.label': '包格式',
  'storage.bundle.value': '导出的 {ext} 文件使用 AES-256-GCM 加密。密钥通过 Argon2id 从您的密码短语派生。没有密码短语，文件将无法读取。',

  'about.title': '关于',
  'about.version.label': '版本',
  'about.arch.label': '架构',
  'about.arch.value': 'Tauri 2 · React 19 · local-first',
};

const ar: Record<keyof typeof en, string> = {
  'language.label': 'اللغة',
  'language.hint': 'لغة الواجهة. تُطبَّق فوراً وتُحفَظ بين عمليات إعادة التشغيل.',

  title: 'الإعدادات',

  'workspace.title': 'مساحة العمل',
  'workspace.name.label': 'اسم مساحة العمل',
  'workspace.name.hint': 'يظهر في الشريط الجانبي. اتركه فارغاً لاستخدام علامة NEXUS الافتراضية.',
  'workspace.logo.label': 'الشعار',
  'workspace.logo.upload': 'رفع شعار',
  'workspace.logo.replace': 'استبدال الشعار',
  'workspace.logo.remove': 'إزالة الشعار',
  'workspace.logo.alt': 'شعار مساحة العمل',
  'workspace.logo.hint': 'الحد الأقصى 200 KB. يُعرض بارتفاع يصل إلى 28 px في الشريط الجانبي.',
  'workspace.logo.errorSize': 'يجب أن يكون حجم الصورة 200 KB أو أقل.',
  'workspace.theme.label': 'نظام الألوان',
  'workspace.theme.hint': 'يُطبَّق فوراً ويُحفَظ بين عمليات إعادة التشغيل.',

  'polling.title': 'التحديث التلقائي',
  'polling.interval.label': 'فترة التحديث (بالثواني)',
  'polling.interval.hint': 'الحد الأدنى 15 ثانية. مدى تكرار قيام Nexus بإعادة فحص جميع المشاريع في الخلفية.',
  'polling.interval.errorMin': 'الحد الأدنى للفترة هو 15 ثانية.',

  'storage.title': 'تخزين البيانات',
  'storage.projectData.label': 'بيانات المشروع',
  'storage.projectData.value': 'قاعدة بيانات SQLite ({db}) في مجلد بيانات التطبيق. لا تغادر البيانات جهازك.',
  'storage.secrets.label': 'المفاتيح السرية',
  'storage.secrets.value': 'مُخزَّنة في مخزن بيانات الاعتماد بنظام التشغيل — Windows Credential Manager على Windows، وmacOS Keychain على macOS. لا تُكتب أبداً على القرص بنص واضح.',
  'storage.bundle.label': 'تنسيق الحزمة',
  'storage.bundle.value': 'تُشفَّر ملفات {ext} المُصدَّرة باستخدام AES-256-GCM. يُشتَقّ المفتاح من عبارة المرور الخاصة بك باستخدام Argon2id. بدون عبارة المرور، يكون الملف غير قابل للقراءة.',

  'about.title': 'حول التطبيق',
  'about.version.label': 'الإصدار',
  'about.arch.label': 'البنية',
  'about.arch.value': 'Tauri 2 · React 19 · local-first',
};

export const settings = { en, uk, es, de, fr, pt, zh, ar };
