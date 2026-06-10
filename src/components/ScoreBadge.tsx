import { scoreColor, scoreLabel } from '../lib/score';

interface ScoreBadgeProps {
  score: number;
  size?: 'sm' | 'md';
}

export function ScoreBadge({ score, size = 'md' }: ScoreBadgeProps) {
  const cssVar = scoreColor(score);
  const label = scoreLabel(score);
  const color = `var(${cssVar})`;
  const dimColor = `var(${cssVar}-dim)`;

  if (size === 'sm') {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '2px 7px',
          borderRadius: '6px',
          fontSize: '11px',
          fontWeight: 600,
          fontFamily: 'var(--font-mono)',
          background: dimColor,
          color,
          border: `1px solid ${color}`,
          opacity: 0.92,
          letterSpacing: '0.02em',
          whiteSpace: 'nowrap',
        }}
        title={label}
      >
        {score}
      </span>
    );
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 10px',
        borderRadius: '8px',
        fontSize: '13px',
        fontWeight: 600,
        fontFamily: 'var(--font-mono)',
        background: dimColor,
        color,
        border: `1px solid ${color}`,
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap',
      }}
      title={label}
    >
      <span style={{ fontSize: '16px', fontWeight: 700, lineHeight: 1 }}>{score}</span>
      <span style={{ fontSize: '10px', opacity: 0.75, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </span>
    </span>
  );
}
