import { CareTeam } from './components/CareTeam.jsx';
import { ChildHero } from './components/ChildHero.jsx';
import { Sidebar } from './components/Sidebar.jsx';
import { DashboardSkeleton, EmptyState, ErrorState } from './components/States.jsx';
import { SystemStatus } from './components/SystemStatus.jsx';
import { TopBar } from './components/TopBar.jsx';
import { useDemoData } from './useDemoData.js';

export default function App() {
  const { data, error, loading, reload } = useDemoData();
  const summary = data?.summary;
  const children = summary?.children ?? [];

  return (
    <div className="app">
      <a className="skip-link" href="#main">
        İçeriğe geç
      </a>
      <Sidebar />

      <div className="app-body">
        <TopBar loading={loading} failed={Boolean(error)} onReload={reload} />

        <main id="main" className="content">
          {error && <ErrorState onRetry={reload} />}
          {!data && !error && <DashboardSkeleton />}

          {data && children.length === 0 && <EmptyState />}

          {data &&
            children.map((child) => (
              <div key={child.name} className="content-stack">
                <ChildHero child={child} users={summary.users} />
                <div className="content-columns">
                  <CareTeam child={child} />
                  <SystemStatus health={data.health} />
                </div>
              </div>
            ))}

          <p className="content-note">
            Tüm veriler sentetiktir. Giriş ekranı ve rol bazlı sayfalar M1 ile eklenecek.
          </p>
        </main>
      </div>
    </div>
  );
}
