import { ReactNode } from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';

export default function JobsLayout({ children }: { children: ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
