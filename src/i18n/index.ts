import { common } from './dict/common';
import { dashboard } from './dict/dashboard';
import { projects } from './dict/projects';
import { detail } from './dict/detail';
import { tickets } from './dict/tickets';
import { ai } from './dict/ai';
import { settings } from './dict/settings';

// Each namespace file exports { en, uk } with identical keys (type-checked in
// the dict file). Keys are flattened here to '{namespace}.{key}'.

const NAMESPACES: Record<string, { en: Record<string, string>; uk: Record<string, string> }> = {
  common,
  dashboard,
  projects,
  detail,
  tickets,
  ai,
  settings,
};

export const MESSAGES: Record<'en' | 'uk', Record<string, string>> = { en: {}, uk: {} };

for (const [ns, dict] of Object.entries(NAMESPACES)) {
  for (const lang of ['en', 'uk'] as const) {
    for (const [key, value] of Object.entries(dict[lang])) {
      MESSAGES[lang][`${ns}.${key}`] = value;
    }
  }
}
