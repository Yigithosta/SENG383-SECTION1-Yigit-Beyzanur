import { ListChecks, UsersThree } from '@phosphor-icons/react';
import { Link, NavLink } from 'react-router';
import { useAuth } from '../auth/AuthContext.jsx';

export function BrandMark() {
  return (
    <svg className="brand-mark" viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="7" fill="currentColor" />
      <circle cx="16" cy="11" r="3.5" fill="var(--on-primary)" />
      <path
        d="M8.5 24.5c0-4.6 3.4-7.8 7.5-7.8s7.5 3.2 7.5 7.8"
        fill="none"
        stroke="var(--on-primary)"
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
  child: [{ to: '/my-tasks', label: 'Görevlerim', Icon: ListChecks }],
};

export function Sidebar() {
  const { user } = useAuth();

  return (
    <aside className="sidebar">
      <Link className="brand" to="/">
        <BrandMark />
        <span className="brand-name">Gelişim Takibi</span>
      </Link>

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

      <p className="sidebar-foot">Demo ortamı · Tüm veriler sentetiktir</p>
    </aside>
  );
}
