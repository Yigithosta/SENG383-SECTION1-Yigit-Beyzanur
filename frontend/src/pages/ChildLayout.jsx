import { NavLink, Outlet, useOutletContext, useParams } from 'react-router';
import { useApi } from '../api/useApi.js';
import { ApiErrorState, PageLoading } from '../components/States.jsx';
import { ageInYears, formatDate, initials } from '../format.js';
import { TEST_IDS } from '../testIds.js';

// Tabs on the child page. M3 and M4 screens replace their placeholder
// route in App.jsx; the tab itself stays here.
const TABS = [
  { to: '', label: 'Genel bakış', end: true },
  { to: 'schedule', label: 'Haftalık takvim' },
  { to: 'tasks', label: 'Görevler' },
  { to: 'specialists', label: 'Uzmanlar' },
];

const RELATION_LABELS = {
  parent: 'Ebeveyni olduğunuz çocuk',
  specialist: 'Bağlı uzmanı olduğunuz çocuk',
};

// /children/:childId. The API answers 403 when the user is not the parent or
// a linked specialist (FR-M2-03), and the page shows that message.
export default function ChildLayout() {
  const { childId } = useParams();
  const { data, error, loading, reload } = useApi(`/api/children/${childId}`);
  const child = data?.child;

  if (loading && !child) return <PageLoading />;
  if (error) return <ApiErrorState error={error} onRetry={reload} />;

  return (
    <div className="content-stack">
      <section className="hero" aria-labelledby="child-name">
        <div className="hero-profile">
          <span className="avatar avatar-lg" aria-hidden="true">
            {initials(child.name)}
          </span>
          <div>
            <p className="eyebrow">{RELATION_LABELS[child.relation]}</p>
            <h1 id="child-name" className="hero-name" data-testid={TEST_IDS.childName}>
              {child.name}
            </h1>
            <p className="muted">
              {ageInYears(child.birthDate)} yaşında · {formatDate(child.birthDate)}
            </p>
          </div>
        </div>
      </section>

      <nav className="tabs" aria-label="Çocuk sayfaları" data-testid={TEST_IDS.childNav}>
        {TABS.map((tab) => (
          <NavLink
            key={tab.label}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) => `tab${isActive ? ' is-active' : ''}`}
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>

      <Outlet context={{ child }} />
    </div>
  );
}

/** Inside a child tab: const { child } = useChild(); child.id, child.name, child.relation */
export function useChild() {
  return useOutletContext();
}
