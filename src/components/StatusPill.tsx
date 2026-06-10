import { useI18n } from '../lib/i18n';
import type { HealthState } from '../types';

interface StatusPillProps {
  health: HealthState;
  size?: 'sm' | 'md';
}

export function StatusPill({ health, size = 'md' }: StatusPillProps) {
  const { t } = useI18n();

  const labels: Record<HealthState, string> = {
    healthy: t('common.health.healthy'),
    warning: t('common.health.warning'),
    critical: t('common.health.critical'),
    unknown: t('common.health.unknown'),
  };

  return (
    <span className={`status-pill status-pill--${health} status-pill--${size}`}>
      <span className="status-pill__dot" />
      <span className="status-pill__label">{labels[health]}</span>
    </span>
  );
}
