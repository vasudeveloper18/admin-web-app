'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Briefcase, PlusCircle, ChevronRight, X } from 'lucide-react';
import { BrandLogo } from '@/components/layout/BrandLogo';

const NAV_ITEMS = [
  { href: '/jobs', label: 'All Jobs', icon: Briefcase },
  { href: '/jobs/new', label: 'New Job', icon: PlusCircle },
];

interface JobsSidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export function JobsSidebar({ open = false, onClose }: JobsSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className={`dashboard-sidebar${open ? ' dashboard-sidebar--open' : ''}`}>
      <div className="dashboard-sidebar__header">
        <BrandLogo size="md" />
        <button
          type="button"
          className="dashboard-sidebar__close"
          onClick={onClose}
          aria-label="Close navigation menu"
        >
          <X size={18} />
        </button>
      </div>

      <nav className="dashboard-sidebar__nav">
        <div className="dashboard-sidebar__label">MANAGEMENT</div>
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === '/jobs'
              ? pathname === '/jobs' ||
                (pathname.startsWith('/jobs/') && !pathname.startsWith('/jobs/new'))
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`dashboard-sidebar__link${isActive ? ' dashboard-sidebar__link--active' : ''}`}
              onClick={onClose}
            >
              <Icon size={16} />
              <span style={{ flex: 1 }}>{label}</span>
              {isActive && <ChevronRight size={14} style={{ opacity: 0.6 }} />}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
