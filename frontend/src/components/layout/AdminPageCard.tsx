'use client';

import { ReactNode } from 'react';

interface AdminPageCardProps {
  title: string;
  actions?: ReactNode;
  children: ReactNode;
  loading?: boolean;
  className?: string;
}

export function AdminPageCard({
  title,
  actions,
  children,
  loading,
  className,
}: AdminPageCardProps) {
  return (
    <div
      className={`admin-page-card${loading ? ' admin-page-card--loading' : ''}${className ? ` ${className}` : ''}`}
    >
      <div className="admin-page-card__header">
        <div className="admin-page-card__header-left">
          <h1 className="admin-page-card__title">{title}</h1>
        </div>
        {actions && (
          <div className="admin-page-card__header-right">{actions}</div>
        )}
      </div>
      {children}
    </div>
  );
}
