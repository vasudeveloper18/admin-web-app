interface SpinnerProps {
  size?: number;
  color?: string;
}

export function Spinner({ size = 24, color = '#6366f1' }: SpinnerProps) {
  return (
    <span
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        borderRadius: '50%',
        border: `2px solid rgba(255,255,255,0.1)`,
        borderTopColor: color,
        animation: 'spin 0.7s linear infinite',
      }}
    />
  );
}

export function PageLoader() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '60vh',
        gap: 16,
      }}
    >
      <Spinner size={40} />
      <p style={{ color: '#8b92a9', fontSize: 14 }}>Loading…</p>
    </div>
  );
}
