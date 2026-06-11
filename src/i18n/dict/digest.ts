// Git Digest page strings. `en` is the source of truth; all other languages must mirror its keys.

const en = {
  // Page header
  'title': 'Git Digest',
  'refresh': 'Refresh',

  // Period switcher labels
  'period.7d': '7d',
  'period.14d': '14d',
  'period.30d': '30d',

  // Totals row
  'totals.commits': 'Commits',
  'totals.mergedMrs': 'Merged MRs',
  'totals.openMrs': 'Open MRs',
  'totals.failedPipelines': 'Failed Pipelines',
  'totals.mostActive': 'Most Active Project',

  // Per-project section
  'project.commits': 'commits',
  'project.merged': 'merged',
  'project.open': 'open',
  'project.failed': 'failed',
  'project.topAuthors': 'Top authors',
  'project.recentCommits': 'Recent commits',
  'project.mergedMrs': 'Merged MRs',
  'project.noCommits': 'No commits in this period',
  'project.noMrs': 'No merged MRs in this period',
  'project.errorPrefix': 'Failed to load: ',

  // Loading / empty states
  'loading': 'Loading…',
  'empty.noGit': 'No projects with git configured. Add a GitHub or GitLab repository in project settings.',
};

const uk: Record<keyof typeof en, string> = {
  'title': 'Git-дайджест',
  'refresh': 'Оновити',

  'period.7d': '7 д',
  'period.14d': '14 д',
  'period.30d': '30 д',

  'totals.commits': 'Коміти',
  'totals.mergedMrs': 'Злиті MR',
  'totals.openMrs': 'Відкриті MR',
  'totals.failedPipelines': 'Збої пайплайнів',
  'totals.mostActive': 'Найактивніший проєкт',

  'project.commits': 'комітів',
  'project.merged': 'злито',
  'project.open': 'відкрито',
  'project.failed': 'збоїв',
  'project.topAuthors': 'Топ авторів',
  'project.recentCommits': 'Останні коміти',
  'project.mergedMrs': 'Злиті MR',
  'project.noCommits': 'Немає комітів за цей період',
  'project.noMrs': 'Немає злитих MR за цей період',
  'project.errorPrefix': 'Помилка завантаження: ',

  'loading': 'Завантаження…',
  'empty.noGit': 'Немає проєктів із налаштованим git. Додайте репозиторій GitHub або GitLab у налаштуваннях проєкту.',
};

const es: Record<keyof typeof en, string> = {
  'title': 'Resumen Git',
  'refresh': 'Actualizar',

  'period.7d': '7d',
  'period.14d': '14d',
  'period.30d': '30d',

  'totals.commits': 'Commits',
  'totals.mergedMrs': 'MRs fusionados',
  'totals.openMrs': 'MRs abiertos',
  'totals.failedPipelines': 'Pipelines fallidos',
  'totals.mostActive': 'Proyecto más activo',

  'project.commits': 'commits',
  'project.merged': 'fusionados',
  'project.open': 'abiertos',
  'project.failed': 'fallidos',
  'project.topAuthors': 'Autores principales',
  'project.recentCommits': 'Commits recientes',
  'project.mergedMrs': 'MRs fusionados',
  'project.noCommits': 'Sin commits en este período',
  'project.noMrs': 'Sin MRs fusionados en este período',
  'project.errorPrefix': 'Error al cargar: ',

  'loading': 'Cargando…',
  'empty.noGit': 'No hay proyectos con git configurado. Añade un repositorio de GitHub o GitLab en la configuración del proyecto.',
};

const de: Record<keyof typeof en, string> = {
  'title': 'Git-Digest',
  'refresh': 'Aktualisieren',

  'period.7d': '7 T',
  'period.14d': '14 T',
  'period.30d': '30 T',

  'totals.commits': 'Commits',
  'totals.mergedMrs': 'Gemergte MRs',
  'totals.openMrs': 'Offene MRs',
  'totals.failedPipelines': 'Fehlgeschlagene Pipelines',
  'totals.mostActive': 'Aktivstes Projekt',

  'project.commits': 'Commits',
  'project.merged': 'gemergt',
  'project.open': 'offen',
  'project.failed': 'fehlgeschlagen',
  'project.topAuthors': 'Top-Autoren',
  'project.recentCommits': 'Letzte Commits',
  'project.mergedMrs': 'Gemergte MRs',
  'project.noCommits': 'Keine Commits in diesem Zeitraum',
  'project.noMrs': 'Keine gemergten MRs in diesem Zeitraum',
  'project.errorPrefix': 'Fehler beim Laden: ',

  'loading': 'Wird geladen…',
  'empty.noGit': 'Keine Projekte mit konfiguriertem Git. Füge ein GitHub- oder GitLab-Repository in den Projekteinstellungen hinzu.',
};

const fr: Record<keyof typeof en, string> = {
  'title': 'Synthèse Git',
  'refresh': 'Actualiser',

  'period.7d': '7 j',
  'period.14d': '14 j',
  'period.30d': '30 j',

  'totals.commits': 'Commits',
  'totals.mergedMrs': 'MR fusionnées',
  'totals.openMrs': 'MR ouvertes',
  'totals.failedPipelines': 'Pipelines échoués',
  'totals.mostActive': 'Projet le plus actif',

  'project.commits': 'commits',
  'project.merged': 'fusionnés',
  'project.open': 'ouvertes',
  'project.failed': 'échoués',
  'project.topAuthors': 'Auteurs principaux',
  'project.recentCommits': 'Commits récents',
  'project.mergedMrs': 'MR fusionnées',
  'project.noCommits': 'Aucun commit sur cette période',
  'project.noMrs': 'Aucune MR fusionnée sur cette période',
  'project.errorPrefix': 'Échec du chargement : ',

  'loading': 'Chargement…',
  'empty.noGit': "Aucun projet avec git configuré. Ajoutez un dépôt GitHub ou GitLab dans les paramètres du projet.",
};

const pt: Record<keyof typeof en, string> = {
  'title': 'Resumo Git',
  'refresh': 'Atualizar',

  'period.7d': '7d',
  'period.14d': '14d',
  'period.30d': '30d',

  'totals.commits': 'Commits',
  'totals.mergedMrs': 'MRs mesclados',
  'totals.openMrs': 'MRs abertos',
  'totals.failedPipelines': 'Pipelines com falha',
  'totals.mostActive': 'Projeto mais ativo',

  'project.commits': 'commits',
  'project.merged': 'mesclados',
  'project.open': 'abertos',
  'project.failed': 'falhas',
  'project.topAuthors': 'Principais autores',
  'project.recentCommits': 'Commits recentes',
  'project.mergedMrs': 'MRs mesclados',
  'project.noCommits': 'Nenhum commit neste período',
  'project.noMrs': 'Nenhum MR mesclado neste período',
  'project.errorPrefix': 'Falha ao carregar: ',

  'loading': 'Carregando…',
  'empty.noGit': 'Nenhum projeto com git configurado. Adicione um repositório do GitHub ou GitLab nas configurações do projeto.',
};

const zh: Record<keyof typeof en, string> = {
  'title': 'Git 摘要',
  'refresh': '刷新',

  'period.7d': '7天',
  'period.14d': '14天',
  'period.30d': '30天',

  'totals.commits': '提交',
  'totals.mergedMrs': '已合并 MR',
  'totals.openMrs': '待处理 MR',
  'totals.failedPipelines': '失败流水线',
  'totals.mostActive': '最活跃项目',

  'project.commits': '次提交',
  'project.merged': '已合并',
  'project.open': '待处理',
  'project.failed': '次失败',
  'project.topAuthors': '主要贡献者',
  'project.recentCommits': '最近提交',
  'project.mergedMrs': '已合并 MR',
  'project.noCommits': '此期间内无提交',
  'project.noMrs': '此期间内无已合并 MR',
  'project.errorPrefix': '加载失败：',

  'loading': '加载中…',
  'empty.noGit': '没有配置 Git 的项目。请在项目设置中添加 GitHub 或 GitLab 仓库。',
};

const ar: Record<keyof typeof en, string> = {
  'title': 'ملخص Git',
  'refresh': 'تحديث',

  'period.7d': '7ي',
  'period.14d': '14ي',
  'period.30d': '30ي',

  'totals.commits': 'الإيداعات',
  'totals.mergedMrs': 'طلبات الدمج المُغلقة',
  'totals.openMrs': 'طلبات الدمج المفتوحة',
  'totals.failedPipelines': 'خطوط الأنابيب الفاشلة',
  'totals.mostActive': 'المشروع الأكثر نشاطاً',

  'project.commits': 'إيداع',
  'project.merged': 'مدموج',
  'project.open': 'مفتوح',
  'project.failed': 'فاشل',
  'project.topAuthors': 'أبرز المساهمين',
  'project.recentCommits': 'الإيداعات الأخيرة',
  'project.mergedMrs': 'طلبات الدمج المُغلقة',
  'project.noCommits': 'لا توجد إيداعات في هذه الفترة',
  'project.noMrs': 'لا توجد طلبات دمج مُغلقة في هذه الفترة',
  'project.errorPrefix': 'فشل التحميل: ',

  'loading': 'جارٍ التحميل…',
  'empty.noGit': 'لا توجد مشاريع بإعداد Git. أضف مستودع GitHub أو GitLab في إعدادات المشروع.',
};

export const digest = { en, uk, es, de, fr, pt, zh, ar };
