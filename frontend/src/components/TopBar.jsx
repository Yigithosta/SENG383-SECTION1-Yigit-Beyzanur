import { SignOut } from '@phosphor-icons/react';
import { Link } from 'react-router';
import { useAuth } from '../auth/AuthContext.jsx';
import { initials, roleLabel } from '../format.js';
import { TEST_IDS } from '../testIds.js';
import { BrandMark } from './Sidebar.jsx';

export function TopBar() {
  const { user, logout } = useAuth();

  return (
    <header className="topbar">
      <Link className="topbar-title" to="/">
        <BrandMark />
        <span className="brand-name">Gelişim Takibi</span>
      </Link>

      <div className="topbar-actions">
        <div className="current-user" data-testid={TEST_IDS.currentUser}>
          <span className="avatar" aria-hidden="true">
            {initials(user.name)}
          </span>
          <div>
            <p className="person-name">{user.name}</p>
            <p className="muted">{roleLabel(user)}</p>
          </div>
        </div>
        <button
          type="button"
          className="button"
          onClick={logout}
          data-testid={TEST_IDS.logoutButton}
        >
          <SignOut size={16} weight="bold" aria-hidden="true" />
          Çıkış yap
        </button>
      </div>
    </header>
  );
}
