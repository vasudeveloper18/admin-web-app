'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Menu } from 'lucide-react';
import { authApi, usersApi } from '@/lib/api';
import { User } from '@/types';
import { BRAND } from '@/lib/branding';

interface AppHeaderProps {
  onMenuToggle?: () => void;
}

export function AppHeader({ onMenuToggle }: AppHeaderProps) {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    usersApi.getMe()
      .then((res) => {
        if (res.success) setCurrentUser(res.data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const handleLogout = async () => {
    setMenuOpen(false);
    try {
      await authApi.logout();
    } catch {
      // Ignore errors on logout
    } finally {
      router.replace('/login');
    }
  };

  const displayName = currentUser
    ? `${currentUser.firstName} ${currentUser.lastName}`
    : 'Loading…';

  const initials = currentUser
    ? `${currentUser.firstName[0]}${currentUser.lastName[0]}`.toUpperCase()
    : '…';

  return (
    <header className="app-header">
      <div className="app-header__left">
        <button
          type="button"
          className="app-header__menu-btn"
          onClick={onMenuToggle}
          aria-label="Open navigation menu"
        >
          <Menu size={20} />
        </button>
        <span className="app-header__breadcrumb">
          {BRAND.applicationName} · Admin Panel
        </span>
      </div>

      <div className="profile-menu" ref={menuRef}>
        <button
          type="button"
          className={`profile-menu__trigger profile-menu__trigger--avatar-only${menuOpen ? ' profile-menu__trigger--open' : ''}`}
          onClick={() => setMenuOpen((o) => !o)}
          aria-expanded={menuOpen}
          aria-haspopup="true"
          aria-label="Open profile menu"
        >
          <span className="profile-menu__avatar">{initials}</span>
        </button>

        {menuOpen && (
          <div className="profile-menu__dropdown animate-fadeIn">
            <div className="profile-menu__card">
              <span className="profile-menu__card-avatar">{initials}</span>
              <div className="profile-menu__card-body">
                <span className="profile-menu__card-name">{displayName}</span>
                <span className="profile-menu__card-email">{currentUser?.email}</span>
                <span className="profile-menu__badge">ADMIN</span>
              </div>
            </div>

            <div className="profile-menu__divider" />

            <button type="button" className="profile-menu__signout" onClick={handleLogout}>
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
