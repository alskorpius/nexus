// Utilities page strings. `en` is the source of truth. `uk` mirrors it;
// other languages fall back to English (registered as optional in index.ts).

const en = {
  title: 'Utilities',
  subtitle: 'Standalone tools that work on pasted input — no project required.',
  // Tabs
  'tab.deps': 'Dependencies Analyzer',
  // Dependencies analyzer
  'deps.heading': 'Dependencies Analyzer',
  'deps.description':
    'Paste a package.json or requirements.txt and check declared versions against the npm / PyPI registries and the OSV.dev vulnerability database.',
  'deps.kindLabel': 'Manifest type',
  'deps.kind.auto': 'Auto-detect',
  'deps.kind.package': 'package.json (npm)',
  'deps.kind.requirements': 'requirements.txt (PyPI)',
  'deps.placeholder': 'Paste your package.json or requirements.txt here…',
  'deps.dropHint': 'Tip: drag a package.json or requirements.txt file onto the box above.',
  'deps.analyze': 'Analyze',
  'deps.analyzing': 'Analyzing…',
  'deps.clear': 'Clear',
  'deps.error': 'Analysis failed:',
  'deps.empty': 'Paste a manifest above and press Analyze.',
  'deps.detected': 'Detected as {kind}',
};

const uk: Record<keyof typeof en, string> = {
  title: 'Утиліти',
  subtitle: 'Окремі інструменти, що працюють зі вставленим текстом — проєкт не потрібен.',
  // Tabs
  'tab.deps': 'Аналіз залежностей',
  // Dependencies analyzer
  'deps.heading': 'Аналіз залежностей',
  'deps.description':
    'Вставте package.json або requirements.txt і звірте оголошені версії з реєстрами npm / PyPI та базою вразливостей OSV.dev.',
  'deps.kindLabel': 'Тип маніфесту',
  'deps.kind.auto': 'Автовизначення',
  'deps.kind.package': 'package.json (npm)',
  'deps.kind.requirements': 'requirements.txt (PyPI)',
  'deps.placeholder': 'Вставте сюди package.json або requirements.txt…',
  'deps.dropHint': 'Підказка: перетягніть файл package.json або requirements.txt на поле вище.',
  'deps.analyze': 'Аналізувати',
  'deps.analyzing': 'Аналіз…',
  'deps.clear': 'Очистити',
  'deps.error': 'Помилка аналізу:',
  'deps.empty': 'Вставте маніфест вище та натисніть «Аналізувати».',
  'deps.detected': 'Визначено як {kind}',
};

export const utilities = { en, uk };
