import type { Lang } from '../lib/i18n';
import { common } from './dict/common';
import { dashboard } from './dict/dashboard';
import { projects } from './dict/projects';
import { detail } from './dict/detail';
import { tickets } from './dict/tickets';
import { ai } from './dict/ai';
import { settings } from './dict/settings';
import { notify } from './dict/notify';

// Each namespace file exports per-language key maps with identical keys
// (type-checked in the dict file). `en` is mandatory; other languages are
// optional per namespace — t() falls back to English for missing ones.
// Keys are flattened here to '{namespace}.{key}'.

type NamespaceDict = { en: Record<string, string> } & Partial<Record<Lang, Record<string, string>>>;

const NAMESPACES: Record<string, NamespaceDict> = {
  common,
  dashboard,
  projects,
  detail,
  tickets,
  ai,
  settings,
  notify,
};

const ALL_LANGS: Lang[] = ['en', 'uk', 'es', 'de', 'fr', 'pt', 'zh', 'ar'];

export const MESSAGES: Record<Lang, Record<string, string>> = {
  en: {}, uk: {}, es: {}, de: {}, fr: {}, pt: {}, zh: {}, ar: {},
};

for (const [ns, dict] of Object.entries(NAMESPACES)) {
  for (const lang of ALL_LANGS) {
    const entries = dict[lang];
    if (!entries) continue;
    for (const [key, value] of Object.entries(entries)) {
      MESSAGES[lang][`${ns}.${key}`] = value;
    }
  }
}
