'use client';

import { useEffect } from 'react';
import { AlertCircle } from 'lucide-react';

export default function JobsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div style={{ padding: 40, textAlign: 'center', minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <AlertCircle size={40} color="#ef4444" />
      <h2 style={{ color: '#f0f2f8', fontSize: 18, fontWeight: 600 }}>Something went wrong</h2>
      <p style={{ color: '#8b92a9', fontSize: 14, maxWidth: 400 }}>{error.message || 'Failed to load jobs.'}</p>
      <button
        onClick={reset}
        style={{ padding: '10px 20px', borderRadius: 8, background: '#6366f1', color: 'white', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}
      >
        Try again
      </button>
    </div>
  );
}
