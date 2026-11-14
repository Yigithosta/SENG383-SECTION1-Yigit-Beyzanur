import { CalendarBlank, ListChecks, UsersThree } from '@phosphor-icons/react';
import { NavLink } from 'react-router';
import { useAuth } from '../auth/AuthContext.jsx';

export function BrandMark() {
  return (
    <svg className="brand-mark" viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="currentColor" />
      <circle cx="16" cy="10.5" r="3.5" fill="var(--brand-mark-ink)" />
      <path
        d="M7.5 25c0-5 3.8-8.5 8.5-8.5s8.5 3.5 8.5 8.5"
        fill="none"
        stroke="var(--brand-mark-ink)"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

// Menu entries per role. Child-specific screens (schedule, tasks,
// specialists) are tabs on the child page, see pages/ChildLayout.jsx.
const NAV = {
  parent: [{ to: '/children', label: 'Çocuklarım', Icon: UsersThree }],
  specialist: [{ to: '/children', label: 'Bağlı çocuklar', Icon: UsersThree }],
  child: [
  { to: '/my-tasks', label: 'Görevlerim', Icon: ListChecks },
  { to: '/my-schedule', label: 'Haftalık Takvim', Icon: CalendarBlank },
],
};

export function Sidebar() {
  const { user } = useAuth();

  return (
    <aside className="sidebar">
      <div className="brand">
        <BrandMark />
        <span className="brand-name">Gelişim Takibi</span>
      </div>

      <nav aria-label="Ana menü">
        <ul className="nav-list">
          {(NAV[user.role] ?? []).map(({ to, label, Icon }) => (
            <li key={to}>
              <NavLink className={({ isActive }) => `nav-item${isActive ? ' is-active' : ''}`} to={to}>
                <Icon size={20} aria-hidden="true" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <p className="sidebar-foot">SENG 383 · Tüm veriler sentetiktir</p>
    </aside>
  );
}
