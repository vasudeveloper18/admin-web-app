import { AlertCircle, CheckCircle, Info } from 'lucide-react';

type AlertVariant = 'error' | 'success' | 'info';

interface AlertBannerProps {
  title: string;
  message?: string;
  variant?: AlertVariant;
}

const VARIANTS: Record<AlertVariant, { bg: string; border: string; color: string; Icon: typeof AlertCircle }> = {
  error: {
    bg: 'rgba(239,68,68,0.08)',
    border: 'rgba(239,68,68,0.22)',
    color: '#fca5a5',
    Icon: AlertCircle,
  },
  success: {
    bg: 'rgba(34,197,94,0.08)',
    border: 'rgba(34,197,94,0.22)',
    color: '#86efac',
    Icon: CheckCircle,
  },
  info: {
    bg: 'rgba(99,102,241,0.08)',
    border: 'rgba(99,102,241,0.22)',
    color: '#a5b4fc',
    Icon: Info,
  },
};

export function AlertBanner({ title, message, variant = 'error' }: AlertBannerProps) {
  const { bg, border, color, Icon } = VARIANTS[variant];

  return (
    <div
      role="alert"
      className="animate-fadeIn"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        padding: '14px 16px',
        borderRadius: 12,
        marginBottom: 24,
        background: bg,
        border: `1px solid ${border}`,
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: 'rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon size={18} color={color} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color, margin: 0, lineHeight: 1.4 }}>
          {title}
        </p>
        {message && (
          <p style={{ fontSize: 12, color: '#8b92a9', margin: '4px 0 0', lineHeight: 1.5 }}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
