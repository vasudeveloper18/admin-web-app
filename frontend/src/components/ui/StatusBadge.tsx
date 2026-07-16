import { JobStatus } from '@/types';

const STATUS_CONFIG: Record<
  JobStatus,
  { label: string; bg: string; text: string; dot: string }
> = {
  [JobStatus.PENDING]: {
    label: 'Pending',
    bg: 'rgba(245,158,11,0.12)',
    text: '#fbbf24',
    dot: '#f59e0b',
  },
  [JobStatus.ASSIGNED]: {
    label: 'Assigned',
    bg: 'rgba(59,130,246,0.12)',
    text: '#60a5fa',
    dot: '#3b82f6',
  },
  [JobStatus.IN_PROGRESS]: {
    label: 'In Progress',
    bg: 'rgba(168,85,247,0.12)',
    text: '#c084fc',
    dot: '#a855f7',
  },
  [JobStatus.COMPLETED]: {
    label: 'Completed',
    bg: 'rgba(16,185,129,0.12)',
    text: '#34d399',
    dot: '#10b981',
  },
  [JobStatus.CANCELLED]: {
    label: 'Cancelled',
    bg: 'rgba(239,68,68,0.12)',
    text: '#f87171',
    dot: '#ef4444',
  },
};

interface StatusBadgeProps {
  status: JobStatus;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG[JobStatus.PENDING];
  const px = size === 'sm' ? '8px 10px' : '6px 12px';
  const fontSize = size === 'sm' ? '11px' : '12px';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: px,
        borderRadius: '20px',
        background: config.bg,
        color: config.text,
        fontSize,
        fontWeight: 600,
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: config.dot,
          flexShrink: 0,
        }}
      />
      {config.label}
    </span>
  );
}
