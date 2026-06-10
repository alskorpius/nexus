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

export const ai = { en, uk };
