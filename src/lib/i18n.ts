import { useEffect, useState } from 'react';
import { getSetting, setSetting } from './db';
import { MESSAGES } from '../i18n';

// ── Languages ────────────────────────────────────────────────────────────────

export type Lang = 'en' | 'uk';

export interface LanguageOption {
  id: Lang;
  /** Native name, never translated */
  label: string;
}

export const LANGUAGES: LanguageOption[] = [
  { id: 'en', label: 'English' },
  { id: 'uk', label: 'Українська' },
];

/** BCP 47 locale used for Intl date/number formatting per language. */
export const LOCALES: Record<Lang, string> = {
  en: 'en-US',
  uk: 'uk-UA',
};

// ── Current language state + pub/sub ─────────────────────────────────────────

type LangListener = (lang: Lang) => void;

const _listeners = new Set<LangListener>();
let _lang: Lang = 'en';

export function getLang(): Lang {
  return _lang;
}

export function getLocale(): string {
  return LOCALES[_lang];
}

export function subscribeLang(fn: LangListener): () => void {
  _listeners.add(fn);
  // Immediately call with current state so the subscriber is up to date.
  fn(_lang);
  return () => { _listeners.delete(fn); };
}

function _notify(): void {
  _listeners.forEach(fn => fn(_lang));
}

// ── Translation lookup ───────────────────────────────────────────────────────

/**
 * Translate a key like 'settings.title'. Falls back to English, then to the
 * key itself. Params interpolate `{name}` placeholders.
 */
export function t(key: string, params?: Record<string, string | number>): string {
  const msg = MESSAGES[_lang][key] ?? MESSAGES.en[key] ?? key;
  if (!params) return msg;
  return msg.replace(/\{(\w+)\}/g, (match, name) =>
    params[name] !== undefined ? String(params[name]) : match,
  );
}

/**
 * Hook for components: re-renders on language change.
 * Usage: const { t, lang } = useI18n();
 */
export function useI18n(): { t: typeof t; lang: Lang } {
  const [lang, setLang] = useState<Lang>(_lang);
  useEffect(() => subscribeLang(setLang), []);
  return { t, lang };
}

// ── Persistence ──────────────────────────────────────────────────────────────

export async function saveLanguage(lang: Lang): Promise<void> {
  await setSetting('language', lang);
  _lang = lang;
  _notify();
}

export async function loadLanguage(): Promise<Lang> {
  const stored = await getSetting('language');
  _lang = LANGUAGES.some(l => l.id === stored) ? (stored as Lang) : 'en';
  _notify();
  return _lang;
}
