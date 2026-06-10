// AI Usage page strings. `en` is the source of truth; `uk` must mirror its keys.

const en = {
  // Page
  'page.title': 'AI Usage',
  'page.refreshAll': 'Refresh all',

  // Account card buttons
  'card.loading': 'Loading…',

  // Stats labels (use {period} placeholder for the period label)
  'stats.inputTokens': 'Input tokens (uncached, {period})',
  'stats.outputTokens': 'Output tokens ({period})',
  'stats.cacheReadTokens': 'Cache read tokens ({period})',
  'stats.cacheWriteTokens': 'Cache write tokens ({period})',
  'stats.cost': 'Cost ({period})',
  'stats.todayTokens': "Today's tokens",

  // Cost error prefix
  'stats.costUnavailable': 'Cost unavailable: ',

  // Period labels (compact)
  'period.24h': '24h',
  'period.7d': '7d',
  'period.30d': '30d',
  'period.90d': '90d',

  // Budget bar
  'budget.monthlyBudget': 'Monthly budget',
  'budget.overBudget': 'Over budget by {amount}',
  'budget.remaining': '{amount} remaining',
  'budget.spent': 'Spent: {amount}',
  'budget.budgetLabel': 'Budget: {amount}',

  // Budget / balance inline notices
  'budget.switchPeriod': 'Switch to a longer period to compute this',
  'budget.costUnavailable': 'Budget set, but cost data unavailable.',
  'balance.costUnavailable': 'Balance set, but cost data unavailable.',

  // Estimated balance section
  'balance.estimatedLabel': 'Estimated credit balance',
  'balance.snapshotNote': 'as of {date} snapshot ({snapshotAmount}) minus {spentAmount} spent since',

  // Chart caption
  'chart.captionToday': 'Daily token usage (today)',
  'chart.captionPeriod': 'Daily token usage (last {period})',

  // Chart bar tooltip
  'chart.barTooltip': '{date}: {total} tokens (in: {input}, cache-read: {cacheRead}, cache-write: {cacheWrite}, out: {output})',

  // No key stored
  'card.noKey': 'No admin key stored. Add one below or save the account again with a key.',
  'card.noKeyError': 'No admin key stored for this account.',

  // Monthly budget editor
  'budgetEditor.label': 'Monthly budget (USD):',
  'budgetEditor.placeholder': 'none',
  'budgetEditor.clear': 'Clear',

  // Credit balance editor
  'balanceEditor.label': 'Credit balance (USD):',
  'balanceEditor.placeholder': 'none',
  'balanceEditor.clear': 'Clear',
  'balanceEditor.hint': 'Enter your current credit balance from the provider console — Nexus will subtract API costs from this point.',

  // Add account form
  'addForm.title': 'Add AI account',
  'addForm.nameLabel': 'Account name',
  'addForm.namePlaceholder': 'e.g. My Anthropic Org',
  'addForm.providerLabel': 'Provider',
  'addForm.keyLabel': 'Admin API key',
  'addForm.keyHintAnthropic': 'Anthropic: use an sk-ant-admin… key from Claude Console → Org Settings → API Keys.',
  'addForm.keyHintOpenAI': 'OpenAI: use an admin key from platform.openai.com → Organization Settings → API Keys.',
  'addForm.keyStorageNote': 'Keys are stored in the OS keyring and never written to disk.',
  'addForm.errorNameRequired': 'Name is required.',
  'addForm.errorKeyRequired': 'Admin API key is required.',
  'addForm.submitSaving': 'Saving…',
  'addForm.submit': 'Add account',

  // Empty state
  'empty.title': 'No AI accounts yet',
  'empty.body': 'Add an Anthropic or OpenAI admin account above to see token and cost usage across your organization.',
};

const uk: Record<keyof typeof en, string> = {
  // Page
  'page.title': 'Використання AI',
  'page.refreshAll': 'Оновити все',

  // Account card buttons
  'card.loading': 'Завантаження…',

  // Stats labels
  'stats.inputTokens': 'Вхідні токени (без кешу, {period})',
  'stats.outputTokens': 'Вихідні токени ({period})',
  'stats.cacheReadTokens': 'Токени читання кешу ({period})',
  'stats.cacheWriteTokens': 'Токени запису кешу ({period})',
  'stats.cost': 'Вартість ({period})',
  'stats.todayTokens': 'Токени сьогодні',

  // Cost error prefix
  'stats.costUnavailable': 'Вартість недоступна: ',

  // Period labels (compact)
  'period.24h': '24 год',
  'period.7d': '7 д',
  'period.30d': '30 д',
  'period.90d': '90 д',

  // Budget bar
  'budget.monthlyBudget': 'Місячний бюджет',
  'budget.overBudget': 'Перевищення на {amount}',
  'budget.remaining': 'Залишок: {amount}',
  'budget.spent': 'Витрачено: {amount}',
  'budget.budgetLabel': 'Бюджет: {amount}',

  // Budget / balance inline notices
  'budget.switchPeriod': 'Виберіть довший період для розрахунку',
  'budget.costUnavailable': 'Бюджет задано, але дані про вартість недоступні.',
  'balance.costUnavailable': 'Баланс задано, але дані про вартість недоступні.',

  // Estimated balance section
  'balance.estimatedLabel': 'Орієнтовний кредитний баланс',
  'balance.snapshotNote': 'станом на {date} (знімок: {snapshotAmount}), витрачено з того часу: {spentAmount}',

  // Chart caption
  'chart.captionToday': 'Щоденне використання токенів (сьогодні)',
  'chart.captionPeriod': 'Щоденне використання токенів (останні {period})',

  // Chart bar tooltip
  'chart.barTooltip': '{date}: {total} токенів (вхід: {input}, кеш-читання: {cacheRead}, кеш-запис: {cacheWrite}, вихід: {output})',

  // No key stored
  'card.noKey': 'Адмін-ключ не збережено. Додайте його нижче або збережіть акаунт з ключем.',
  'card.noKeyError': 'Адмін-ключ для цього акаунту не збережено.',

  // Monthly budget editor
  'budgetEditor.label': 'Місячний бюджет (USD):',
  'budgetEditor.placeholder': 'не задано',
  'budgetEditor.clear': 'Очистити',

  // Credit balance editor
  'balanceEditor.label': 'Кредитний баланс (USD):',
  'balanceEditor.placeholder': 'не задано',
  'balanceEditor.clear': 'Очистити',
  'balanceEditor.hint': 'Введіть поточний кредитний баланс з консолі провайдера — Nexus відніматиме витрати на API з цієї точки.',

  // Add account form
  'addForm.title': 'Додати AI-акаунт',
  'addForm.nameLabel': 'Назва акаунту',
  'addForm.namePlaceholder': 'напр. Моя організація Anthropic',
  'addForm.providerLabel': 'Провайдер',
  'addForm.keyLabel': 'Адмін-ключ API',
  'addForm.keyHintAnthropic': 'Anthropic: використовуйте ключ sk-ant-admin… з Claude Console → Org Settings → API Keys.',
  'addForm.keyHintOpenAI': 'OpenAI: використовуйте адмін-ключ з platform.openai.com → Organization Settings → API Keys.',
  'addForm.keyStorageNote': 'Ключі зберігаються у сховищі облікових даних ОС і не записуються на диск.',
  'addForm.errorNameRequired': 'Назва обов\'язкова.',
  'addForm.errorKeyRequired': 'Адмін-ключ API обов\'язковий.',
  'addForm.submitSaving': 'Збереження…',
  'addForm.submit': 'Додати акаунт',

  // Empty state
  'empty.title': 'AI-акаунти відсутні',
  'empty.body': 'Додайте адмін-акаунт Anthropic або OpenAI вище, щоб переглянути використання токенів та витрати по організації.',
};

const es: Record<keyof typeof en, string> = {
  // Page
  'page.title': 'Uso de AI',
  'page.refreshAll': 'Actualizar todo',

  // Account card buttons
  'card.loading': 'Cargando…',

  // Stats labels
  'stats.inputTokens': 'Tokens de entrada (sin caché, {period})',
  'stats.outputTokens': 'Tokens de salida ({period})',
  'stats.cacheReadTokens': 'Tokens de lectura de caché ({period})',
  'stats.cacheWriteTokens': 'Tokens de escritura de caché ({period})',
  'stats.cost': 'Costo ({period})',
  'stats.todayTokens': 'Tokens de hoy',

  // Cost error prefix
  'stats.costUnavailable': 'Costo no disponible: ',

  // Period labels (compact)
  'period.24h': '24 h',
  'period.7d': '7 d',
  'period.30d': '30 d',
  'period.90d': '90 d',

  // Budget bar
  'budget.monthlyBudget': 'Presupuesto mensual',
  'budget.overBudget': 'Excedido en {amount}',
  'budget.remaining': '{amount} restante',
  'budget.spent': 'Gastado: {amount}',
  'budget.budgetLabel': 'Presupuesto: {amount}',

  // Budget / balance inline notices
  'budget.switchPeriod': 'Selecciona un período más largo para calcular esto',
  'budget.costUnavailable': 'Presupuesto configurado, pero los datos de costo no están disponibles.',
  'balance.costUnavailable': 'Saldo configurado, pero los datos de costo no están disponibles.',

  // Estimated balance section
  'balance.estimatedLabel': 'Saldo de crédito estimado',
  'balance.snapshotNote': 'al {date} (instantánea: {snapshotAmount}) menos {spentAmount} gastado desde entonces',

  // Chart caption
  'chart.captionToday': 'Uso diario de tokens (hoy)',
  'chart.captionPeriod': 'Uso diario de tokens (últimos {period})',

  // Chart bar tooltip
  'chart.barTooltip': '{date}: {total} tokens (entrada: {input}, caché-lectura: {cacheRead}, caché-escritura: {cacheWrite}, salida: {output})',

  // No key stored
  'card.noKey': 'No hay clave de administrador guardada. Añade una abajo o guarda la cuenta con una clave.',
  'card.noKeyError': 'No hay clave de administrador guardada para esta cuenta.',

  // Monthly budget editor
  'budgetEditor.label': 'Presupuesto mensual (USD):',
  'budgetEditor.placeholder': 'ninguno',
  'budgetEditor.clear': 'Limpiar',

  // Credit balance editor
  'balanceEditor.label': 'Saldo de crédito (USD):',
  'balanceEditor.placeholder': 'ninguno',
  'balanceEditor.clear': 'Limpiar',
  'balanceEditor.hint': 'Ingresa tu saldo de crédito actual desde la consola del proveedor — Nexus restará los costos de API a partir de este punto.',

  // Add account form
  'addForm.title': 'Añadir cuenta de AI',
  'addForm.nameLabel': 'Nombre de la cuenta',
  'addForm.namePlaceholder': 'ej. Mi organización Anthropic',
  'addForm.providerLabel': 'Proveedor',
  'addForm.keyLabel': 'Clave de API de administrador',
  'addForm.keyHintAnthropic': 'Anthropic: usa una clave sk-ant-admin… de Claude Console → Org Settings → API Keys.',
  'addForm.keyHintOpenAI': 'OpenAI: usa una clave de administrador de platform.openai.com → Organization Settings → API Keys.',
  'addForm.keyStorageNote': 'Las claves se almacenan en el llavero del sistema operativo y nunca se escriben en disco.',
  'addForm.errorNameRequired': 'El nombre es obligatorio.',
  'addForm.errorKeyRequired': 'La clave de API de administrador es obligatoria.',
  'addForm.submitSaving': 'Guardando…',
  'addForm.submit': 'Añadir cuenta',

  // Empty state
  'empty.title': 'Aún no hay cuentas de AI',
  'empty.body': 'Añade una cuenta de administrador de Anthropic u OpenAI arriba para ver el uso de tokens y costos en tu organización.',
};

const de: Record<keyof typeof en, string> = {
  // Page
  'page.title': 'AI-Nutzung',
  'page.refreshAll': 'Alles aktualisieren',

  // Account card buttons
  'card.loading': 'Wird geladen…',

  // Stats labels
  'stats.inputTokens': 'Eingabe-Tokens (nicht gecacht, {period})',
  'stats.outputTokens': 'Ausgabe-Tokens ({period})',
  'stats.cacheReadTokens': 'Cache-Lese-Tokens ({period})',
  'stats.cacheWriteTokens': 'Cache-Schreib-Tokens ({period})',
  'stats.cost': 'Kosten ({period})',
  'stats.todayTokens': 'Tokens heute',

  // Cost error prefix
  'stats.costUnavailable': 'Kosten nicht verfügbar: ',

  // Period labels (compact)
  'period.24h': '24 h',
  'period.7d': '7 T',
  'period.30d': '30 T',
  'period.90d': '90 T',

  // Budget bar
  'budget.monthlyBudget': 'Monatsbudget',
  'budget.overBudget': 'Budget überschritten um {amount}',
  'budget.remaining': '{amount} verbleibend',
  'budget.spent': 'Ausgegeben: {amount}',
  'budget.budgetLabel': 'Budget: {amount}',

  // Budget / balance inline notices
  'budget.switchPeriod': 'Wähle einen längeren Zeitraum, um dies zu berechnen',
  'budget.costUnavailable': 'Budget gesetzt, aber Kostendaten nicht verfügbar.',
  'balance.costUnavailable': 'Guthaben gesetzt, aber Kostendaten nicht verfügbar.',

  // Estimated balance section
  'balance.estimatedLabel': 'Geschätztes Guthaben',
  'balance.snapshotNote': 'Stand {date} (Snapshot: {snapshotAmount}) abzüglich {spentAmount} seitdem ausgegeben',

  // Chart caption
  'chart.captionToday': 'Tägliche Token-Nutzung (heute)',
  'chart.captionPeriod': 'Tägliche Token-Nutzung (letzte {period})',

  // Chart bar tooltip
  'chart.barTooltip': '{date}: {total} Tokens (Eingabe: {input}, Cache-Lesen: {cacheRead}, Cache-Schreiben: {cacheWrite}, Ausgabe: {output})',

  // No key stored
  'card.noKey': 'Kein Admin-Schlüssel gespeichert. Füge unten einen hinzu oder speichere das Konto erneut mit einem Schlüssel.',
  'card.noKeyError': 'Kein Admin-Schlüssel für dieses Konto gespeichert.',

  // Monthly budget editor
  'budgetEditor.label': 'Monatsbudget (USD):',
  'budgetEditor.placeholder': 'keines',
  'budgetEditor.clear': 'Löschen',

  // Credit balance editor
  'balanceEditor.label': 'Guthaben (USD):',
  'balanceEditor.placeholder': 'keines',
  'balanceEditor.clear': 'Löschen',
  'balanceEditor.hint': 'Gib dein aktuelles Guthaben aus der Anbieterkonsole ein — Nexus zieht die API-Kosten ab diesem Punkt ab.',

  // Add account form
  'addForm.title': 'AI-Konto hinzufügen',
  'addForm.nameLabel': 'Kontoname',
  'addForm.namePlaceholder': 'z. B. Meine Anthropic-Organisation',
  'addForm.providerLabel': 'Anbieter',
  'addForm.keyLabel': 'Admin-API-Schlüssel',
  'addForm.keyHintAnthropic': 'Anthropic: Verwende einen sk-ant-admin…-Schlüssel aus Claude Console → Org Settings → API Keys.',
  'addForm.keyHintOpenAI': 'OpenAI: Verwende einen Admin-Schlüssel von platform.openai.com → Organization Settings → API Keys.',
  'addForm.keyStorageNote': 'Schlüssel werden im OS-Schlüsselbund gespeichert und nie auf Disk geschrieben.',
  'addForm.errorNameRequired': 'Name ist erforderlich.',
  'addForm.errorKeyRequired': 'Admin-API-Schlüssel ist erforderlich.',
  'addForm.submitSaving': 'Wird gespeichert…',
  'addForm.submit': 'Konto hinzufügen',

  // Empty state
  'empty.title': 'Noch keine AI-Konten',
  'empty.body': 'Füge oben ein Anthropic- oder OpenAI-Administratorkonto hinzu, um die Token- und Kostennutzung in deiner Organisation einzusehen.',
};

const fr: Record<keyof typeof en, string> = {
  // Page
  'page.title': "Utilisation de l'AI",
  'page.refreshAll': 'Tout actualiser',

  // Account card buttons
  'card.loading': 'Chargement…',

  // Stats labels
  'stats.inputTokens': "Tokens d'entrée (non mis en cache, {period})",
  'stats.outputTokens': 'Tokens de sortie ({period})',
  'stats.cacheReadTokens': 'Tokens de lecture du cache ({period})',
  'stats.cacheWriteTokens': "Tokens d'écriture du cache ({period})",
  'stats.cost': 'Coût ({period})',
  'stats.todayTokens': "Tokens aujourd'hui",

  // Cost error prefix
  'stats.costUnavailable': 'Coût indisponible : ',

  // Period labels (compact)
  'period.24h': '24 h',
  'period.7d': '7 j',
  'period.30d': '30 j',
  'period.90d': '90 j',

  // Budget bar
  'budget.monthlyBudget': 'Budget mensuel',
  'budget.overBudget': 'Dépassement de {amount}',
  'budget.remaining': '{amount} restant',
  'budget.spent': 'Dépensé : {amount}',
  'budget.budgetLabel': 'Budget : {amount}',

  // Budget / balance inline notices
  'budget.switchPeriod': 'Sélectionnez une période plus longue pour calculer ceci',
  'budget.costUnavailable': 'Budget défini, mais les données de coût sont indisponibles.',
  'balance.costUnavailable': 'Solde défini, mais les données de coût sont indisponibles.',

  // Estimated balance section
  'balance.estimatedLabel': 'Solde de crédit estimé',
  'balance.snapshotNote': 'au {date} (instantané : {snapshotAmount}) moins {spentAmount} dépensé depuis',

  // Chart caption
  'chart.captionToday': "Utilisation quotidienne de tokens (aujourd'hui)",
  'chart.captionPeriod': 'Utilisation quotidienne de tokens (derniers {period})',

  // Chart bar tooltip
  'chart.barTooltip': '{date} : {total} tokens (entrée : {input}, lecture cache : {cacheRead}, écriture cache : {cacheWrite}, sortie : {output})',

  // No key stored
  'card.noKey': "Aucune clé d'administration enregistrée. Ajoutez-en une ci-dessous ou enregistrez à nouveau le compte avec une clé.",
  'card.noKeyError': "Aucune clé d'administration enregistrée pour ce compte.",

  // Monthly budget editor
  'budgetEditor.label': 'Budget mensuel (USD) :',
  'budgetEditor.placeholder': 'aucun',
  'budgetEditor.clear': 'Effacer',

  // Credit balance editor
  'balanceEditor.label': 'Solde de crédit (USD) :',
  'balanceEditor.placeholder': 'aucun',
  'balanceEditor.clear': 'Effacer',
  'balanceEditor.hint': 'Entrez votre solde de crédit actuel depuis la console du fournisseur — Nexus déduira les coûts API à partir de ce point.',

  // Add account form
  'addForm.title': 'Ajouter un compte AI',
  'addForm.nameLabel': 'Nom du compte',
  'addForm.namePlaceholder': 'ex. Mon organisation Anthropic',
  'addForm.providerLabel': 'Fournisseur',
  'addForm.keyLabel': "Clé API d'administration",
  'addForm.keyHintAnthropic': 'Anthropic : utilisez une clé sk-ant-admin… depuis Claude Console → Org Settings → API Keys.',
  'addForm.keyHintOpenAI': 'OpenAI : utilisez une clé d\'administration depuis platform.openai.com → Organization Settings → API Keys.',
  'addForm.keyStorageNote': "Les clés sont stockées dans le trousseau du système d'exploitation et ne sont jamais écrites sur disque.",
  'addForm.errorNameRequired': 'Le nom est obligatoire.',
  'addForm.errorKeyRequired': "La clé API d'administration est obligatoire.",
  'addForm.submitSaving': 'Enregistrement…',
  'addForm.submit': 'Ajouter le compte',

  // Empty state
  'empty.title': 'Aucun compte AI pour le moment',
  'empty.body': "Ajoutez un compte administrateur Anthropic ou OpenAI ci-dessus pour voir l'utilisation des tokens et les coûts dans votre organisation.",
};

const pt: Record<keyof typeof en, string> = {
  // Page
  'page.title': 'Uso de AI',
  'page.refreshAll': 'Atualizar tudo',

  // Account card buttons
  'card.loading': 'Carregando…',

  // Stats labels
  'stats.inputTokens': 'Tokens de entrada (sem cache, {period})',
  'stats.outputTokens': 'Tokens de saída ({period})',
  'stats.cacheReadTokens': 'Tokens de leitura de cache ({period})',
  'stats.cacheWriteTokens': 'Tokens de escrita de cache ({period})',
  'stats.cost': 'Custo ({period})',
  'stats.todayTokens': 'Tokens de hoje',

  // Cost error prefix
  'stats.costUnavailable': 'Custo indisponível: ',

  // Period labels (compact)
  'period.24h': '24 h',
  'period.7d': '7 d',
  'period.30d': '30 d',
  'period.90d': '90 d',

  // Budget bar
  'budget.monthlyBudget': 'Orçamento mensal',
  'budget.overBudget': 'Excedido em {amount}',
  'budget.remaining': '{amount} restante',
  'budget.spent': 'Gasto: {amount}',
  'budget.budgetLabel': 'Orçamento: {amount}',

  // Budget / balance inline notices
  'budget.switchPeriod': 'Selecione um período mais longo para calcular isso',
  'budget.costUnavailable': 'Orçamento definido, mas dados de custo indisponíveis.',
  'balance.costUnavailable': 'Saldo definido, mas dados de custo indisponíveis.',

  // Estimated balance section
  'balance.estimatedLabel': 'Saldo de crédito estimado',
  'balance.snapshotNote': 'em {date} (instantâneo: {snapshotAmount}) menos {spentAmount} gasto desde então',

  // Chart caption
  'chart.captionToday': 'Uso diário de tokens (hoje)',
  'chart.captionPeriod': 'Uso diário de tokens (últimos {period})',

  // Chart bar tooltip
  'chart.barTooltip': '{date}: {total} tokens (entrada: {input}, leitura cache: {cacheRead}, escrita cache: {cacheWrite}, saída: {output})',

  // No key stored
  'card.noKey': 'Nenhuma chave de administrador salva. Adicione uma abaixo ou salve a conta novamente com uma chave.',
  'card.noKeyError': 'Nenhuma chave de administrador salva para esta conta.',

  // Monthly budget editor
  'budgetEditor.label': 'Orçamento mensal (USD):',
  'budgetEditor.placeholder': 'nenhum',
  'budgetEditor.clear': 'Limpar',

  // Credit balance editor
  'balanceEditor.label': 'Saldo de crédito (USD):',
  'balanceEditor.placeholder': 'nenhum',
  'balanceEditor.clear': 'Limpar',
  'balanceEditor.hint': 'Insira seu saldo de crédito atual do console do provedor — Nexus subtrairá os custos de API a partir deste ponto.',

  // Add account form
  'addForm.title': 'Adicionar conta de AI',
  'addForm.nameLabel': 'Nome da conta',
  'addForm.namePlaceholder': 'ex. Minha organização Anthropic',
  'addForm.providerLabel': 'Provedor',
  'addForm.keyLabel': 'Chave de API de administrador',
  'addForm.keyHintAnthropic': 'Anthropic: use uma chave sk-ant-admin… do Claude Console → Org Settings → API Keys.',
  'addForm.keyHintOpenAI': 'OpenAI: use uma chave de administrador de platform.openai.com → Organization Settings → API Keys.',
  'addForm.keyStorageNote': 'As chaves são armazenadas no chaveiro do sistema operacional e nunca gravadas em disco.',
  'addForm.errorNameRequired': 'O nome é obrigatório.',
  'addForm.errorKeyRequired': 'A chave de API de administrador é obrigatória.',
  'addForm.submitSaving': 'Salvando…',
  'addForm.submit': 'Adicionar conta',

  // Empty state
  'empty.title': 'Nenhuma conta de AI ainda',
  'empty.body': 'Adicione uma conta de administrador da Anthropic ou OpenAI acima para ver o uso de tokens e custos na sua organização.',
};

const zh: Record<keyof typeof en, string> = {
  // Page
  'page.title': 'AI 用量',
  'page.refreshAll': '全部刷新',

  // Account card buttons
  'card.loading': '加载中…',

  // Stats labels
  'stats.inputTokens': '输入 Token（未缓存，{period}）',
  'stats.outputTokens': '输出 Token（{period}）',
  'stats.cacheReadTokens': '缓存读取 Token（{period}）',
  'stats.cacheWriteTokens': '缓存写入 Token（{period}）',
  'stats.cost': '费用（{period}）',
  'stats.todayTokens': '今日 Token',

  // Cost error prefix
  'stats.costUnavailable': '费用不可用：',

  // Period labels (compact)
  'period.24h': '24小时',
  'period.7d': '7天',
  'period.30d': '30天',
  'period.90d': '90天',

  // Budget bar
  'budget.monthlyBudget': '月度预算',
  'budget.overBudget': '超出预算 {amount}',
  'budget.remaining': '剩余 {amount}',
  'budget.spent': '已花费：{amount}',
  'budget.budgetLabel': '预算：{amount}',

  // Budget / balance inline notices
  'budget.switchPeriod': '请选择更长的时间段以进行计算',
  'budget.costUnavailable': '已设置预算，但费用数据不可用。',
  'balance.costUnavailable': '已设置余额，但费用数据不可用。',

  // Estimated balance section
  'balance.estimatedLabel': '预估信用余额',
  'balance.snapshotNote': '基于 {date} 快照（{snapshotAmount}），减去此后已花费的 {spentAmount}',

  // Chart caption
  'chart.captionToday': '每日 Token 用量（今日）',
  'chart.captionPeriod': '每日 Token 用量（最近 {period}）',

  // Chart bar tooltip
  'chart.barTooltip': '{date}：{total} Token（输入：{input}，缓存读取：{cacheRead}，缓存写入：{cacheWrite}，输出：{output}）',

  // No key stored
  'card.noKey': '未保存管理员密钥。请在下方添加，或重新保存带有密钥的账户。',
  'card.noKeyError': '此账户未保存管理员密钥。',

  // Monthly budget editor
  'budgetEditor.label': '月度预算（USD）：',
  'budgetEditor.placeholder': '无',
  'budgetEditor.clear': '清除',

  // Credit balance editor
  'balanceEditor.label': '信用余额（USD）：',
  'balanceEditor.placeholder': '无',
  'balanceEditor.clear': '清除',
  'balanceEditor.hint': '请从提供商控制台输入您当前的信用余额 — Nexus 将从此时起扣除 API 费用。',

  // Add account form
  'addForm.title': '添加 AI 账户',
  'addForm.nameLabel': '账户名称',
  'addForm.namePlaceholder': '例如：我的 Anthropic 组织',
  'addForm.providerLabel': '提供商',
  'addForm.keyLabel': '管理员 API 密钥',
  'addForm.keyHintAnthropic': 'Anthropic：请使用 Claude Console → Org Settings → API Keys 中的 sk-ant-admin… 密钥。',
  'addForm.keyHintOpenAI': 'OpenAI：请使用 platform.openai.com → Organization Settings → API Keys 中的管理员密钥。',
  'addForm.keyStorageNote': '密钥存储在操作系统密钥链中，不会写入磁盘。',
  'addForm.errorNameRequired': '名称为必填项。',
  'addForm.errorKeyRequired': '管理员 API 密钥为必填项。',
  'addForm.submitSaving': '保存中…',
  'addForm.submit': '添加账户',

  // Empty state
  'empty.title': '暂无 AI 账户',
  'empty.body': '请在上方添加 Anthropic 或 OpenAI 管理员账户，以查看您组织的 Token 用量和费用。',
};

const ar: Record<keyof typeof en, string> = {
  // Page
  'page.title': 'استخدام AI',
  'page.refreshAll': 'تحديث الكل',

  // Account card buttons
  'card.loading': 'جارٍ التحميل…',

  // Stats labels
  'stats.inputTokens': 'رموز الإدخال (غير مخزَّنة مؤقتاً، {period})',
  'stats.outputTokens': 'رموز الإخراج ({period})',
  'stats.cacheReadTokens': 'رموز قراءة التخزين المؤقت ({period})',
  'stats.cacheWriteTokens': 'رموز كتابة التخزين المؤقت ({period})',
  'stats.cost': 'التكلفة ({period})',
  'stats.todayTokens': 'رموز اليوم',

  // Cost error prefix
  'stats.costUnavailable': 'التكلفة غير متاحة: ',

  // Period labels (compact)
  'period.24h': '24س',
  'period.7d': '7ي',
  'period.30d': '30ي',
  'period.90d': '90ي',

  // Budget bar
  'budget.monthlyBudget': 'الميزانية الشهرية',
  'budget.overBudget': 'تجاوز الميزانية بمقدار {amount}',
  'budget.remaining': 'المتبقي: {amount}',
  'budget.spent': 'المُنفق: {amount}',
  'budget.budgetLabel': 'الميزانية: {amount}',

  // Budget / balance inline notices
  'budget.switchPeriod': 'اختر فترة أطول لحساب هذا',
  'budget.costUnavailable': 'تم تعيين الميزانية، لكن بيانات التكلفة غير متاحة.',
  'balance.costUnavailable': 'تم تعيين الرصيد، لكن بيانات التكلفة غير متاحة.',

  // Estimated balance section
  'balance.estimatedLabel': 'الرصيد الائتماني التقديري',
  'balance.snapshotNote': 'اعتباراً من لقطة {date} ({snapshotAmount}) مطروحاً منها {spentAmount} المُنفقة منذ ذلك الحين',

  // Chart caption
  'chart.captionToday': 'استخدام الرموز اليومي (اليوم)',
  'chart.captionPeriod': 'استخدام الرموز اليومي (آخر {period})',

  // Chart bar tooltip
  'chart.barTooltip': '{date}: {total} رمز (الإدخال: {input}، قراءة التخزين المؤقت: {cacheRead}، كتابة التخزين المؤقت: {cacheWrite}، الإخراج: {output})',

  // No key stored
  'card.noKey': 'لا يوجد مفتاح مسؤول محفوظ. أضف واحداً أدناه أو احفظ الحساب مجدداً بمفتاح.',
  'card.noKeyError': 'لا يوجد مفتاح مسؤول محفوظ لهذا الحساب.',

  // Monthly budget editor
  'budgetEditor.label': 'الميزانية الشهرية (USD):',
  'budgetEditor.placeholder': 'لا يوجد',
  'budgetEditor.clear': 'مسح',

  // Credit balance editor
  'balanceEditor.label': 'الرصيد الائتماني (USD):',
  'balanceEditor.placeholder': 'لا يوجد',
  'balanceEditor.clear': 'مسح',
  'balanceEditor.hint': 'أدخل رصيدك الائتماني الحالي من لوحة تحكم المزود — سيطرح Nexus تكاليف API من هذه النقطة.',

  // Add account form
  'addForm.title': 'إضافة حساب AI',
  'addForm.nameLabel': 'اسم الحساب',
  'addForm.namePlaceholder': 'مثال: مؤسستي على Anthropic',
  'addForm.providerLabel': 'المزود',
  'addForm.keyLabel': 'مفتاح API للمسؤول',
  'addForm.keyHintAnthropic': 'Anthropic: استخدم مفتاح sk-ant-admin… من Claude Console → Org Settings → API Keys.',
  'addForm.keyHintOpenAI': 'OpenAI: استخدم مفتاح المسؤول من platform.openai.com → Organization Settings → API Keys.',
  'addForm.keyStorageNote': 'تُخزَّن المفاتيح في سلسلة مفاتيح نظام التشغيل ولا تُكتب على القرص أبداً.',
  'addForm.errorNameRequired': 'الاسم مطلوب.',
  'addForm.errorKeyRequired': 'مفتاح API للمسؤول مطلوب.',
  'addForm.submitSaving': 'جارٍ الحفظ…',
  'addForm.submit': 'إضافة الحساب',

  // Empty state
  'empty.title': 'لا توجد حسابات AI بعد',
  'empty.body': 'أضف حساب مسؤول من Anthropic أو OpenAI أعلاه لعرض استخدام الرموز والتكاليف عبر مؤسستك.',
};

export const ai = { en, uk, es, de, fr, pt, zh, ar };
