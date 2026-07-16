import { ReactNode } from 'react';
import { JobsSidebar } from '@/components/layout/JobsSidebar';

export default function JobsLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0f1117' }}>
      <JobsSidebar />
      <main style={{ flex: 1, overflow: 'auto', minWidth: 0 }}>
        {children}
      </main>
    </div>
  );
}
