import Link from 'next/link';
import { AlertCircle } from 'lucide-react';

export default function JobNotFound() {
  return (
    <div style={{ padding: 40, textAlign: 'center', minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <AlertCircle size={40} color="#8b92a9" />
      <h2 style={{ color: '#f0f2f8', fontSize: 18, fontWeight: 600 }}>Job not found</h2>
      <p style={{ color: '#8b92a9', fontSize: 14 }}>The job you are looking for does not exist or was removed.</p>
      <Link href="/jobs" style={{ padding: '10px 20px', borderRadius: 8, background: '#6366f1', color: 'white', textDecoration: 'none', fontSize: 13 }}>
        Back to Jobs
      </Link>
    </div>
  );
}
