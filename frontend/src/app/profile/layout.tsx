import { ReactNode } from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';

export default function AdminSectionLayout({ children }: { children: ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
