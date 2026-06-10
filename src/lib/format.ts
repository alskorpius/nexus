import { getLocale, t } from './i18n';

export function timeAgo(iso: string): string {
  const date = new Date(iso);
  const now = Date.now();
  const diff = now - date.getTime();

  if (diff < 0) return t('common.timeAgo.justNow');
  if (diff < 60_000) return t('common.timeAgo.seconds', { n: Math.floor(diff / 1000) });
  if (diff < 3_600_000) return t('common.timeAgo.minutes', { n: Math.floor(diff / 60_000) });
  if (diff < 86_400_000) return t('common.timeAgo.hours', { n: Math.floor(diff / 3_600_000) });
  if (diff < 604_800_000) return t('common.timeAgo.days', { n: Math.floor(diff / 86_400_000) });

  return date.toLocaleDateString(getLocale(), { month: 'short', day: 'numeric' });
}

export function formatDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString(getLocale(), {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
