import { Outlet } from 'react-router';
import { Sidebar } from './Sidebar.jsx';
import { TopBar } from './TopBar.jsx';

// Layout for every screen after login.
export function AppShell() {
  return (
    <div className="app">
      <a className="skip-link" href="#main">
        İçeriğe geç
      </a>
      <Sidebar />

      <div className="app-body">
        <TopBar />
        <main id="main" className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
