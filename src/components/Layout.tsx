import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  CalendarDays,
  CalendarPlus,
  LayoutDashboard,
  LogOut,
  Menu,
  Sparkles,
  Wrench,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fullName, initials } from '../lib/format';
import { API_BASE_URL } from '../lib/api';

const navItems = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/bookings', label: 'Bookings', icon: CalendarDays, end: true },
  { to: '/bookings/new', label: 'Create booking', icon: CalendarPlus, end: false },
  { to: '/services', label: 'Services', icon: Wrench, end: false },
];

export function Layout() {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const name = fullName(user?.firstName, user?.lastName);

  return (
    <div className="app-shell">
      <div
        className={`sidebar-scrim ${mobileOpen ? 'is-visible' : ''}`}
        onClick={() => setMobileOpen(false)}
      />
      <aside className={`sidebar ${mobileOpen ? 'is-open' : ''}`}>
        <div className="sidebar-brand">
          <span className="brand-mark">
            <Sparkles size={20} />
          </span>
          <div>
            <strong>ServiceHub</strong>
            <span>Admin console</span>
          </div>
          <button
            type="button"
            className="icon-button sidebar-close"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <X size={19} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <span className="sidebar-label">Workspace</span>
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'is-active' : ''}`
              }
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <span className="avatar">{initials(user?.firstName, user?.lastName)}</span>
            <div>
              <strong>{name}</strong>
              <span>{user?.email ?? 'Administrator'}</span>
            </div>
          </div>
          <button
            type="button"
            className="sidebar-logout"
            onClick={logout}
            title="Sign out"
          >
            <LogOut size={17} />
          </button>
        </div>
        <div className="sidebar-meta" title={API_BASE_URL}>
          API · {API_BASE_URL.replace(/^https?:\/\//, '')}
        </div>
      </aside>

      <div className="main-column">
        <header className="mobile-topbar">
          <button
            type="button"
            className="icon-button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={21} />
          </button>
          <span className="topbar-brand">
            <Sparkles size={17} /> ServiceHub Admin
          </span>
        </header>
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
