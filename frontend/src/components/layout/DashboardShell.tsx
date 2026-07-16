'use client';

import { useState, ReactNode } from 'react';
import { JobsSidebar } from '@/components/layout/JobsSidebar';
import { AppHeader } from '@/components/layout/AppHeader';

export function DashboardShell({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="dashboard-shell">
      <div
        className={`sidebar-backdrop${sidebarOpen ? ' sidebar-backdrop--visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden={!sidebarOpen}
      />
      <JobsSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="dashboard-main">
        <AppHeader onMenuToggle={() => setSidebarOpen((o) => !o)} />
        <main className="dashboard-content">{children}</main>
      </div>
    </div>
  );
}
