import type { HealthState } from '../types';

interface StatusPillProps {
  health: HealthState;
  size?: 'sm' | 'md';
}

const labels: Record<HealthState, string> = {
  healthy: 'Healthy',
  warning: 'Warning',
  critical: 'Critical',
  unknown: 'Unknown',
};

export function StatusPill({ health, size = 'md' }: StatusPillProps) {
  return (
    <span className={`status-pill status-pill--${health} status-pill--${size}`}>
      <span className="status-pill__dot" />
      <span className="status-pill__label">{labels[health]}</span>
    </span>
  );
}
