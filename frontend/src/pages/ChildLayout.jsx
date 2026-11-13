import { CaretRight } from '@phosphor-icons/react';
import { Link, NavLink, Outlet, useOutletContext, useParams } from 'react-router';
import { useApi } from '../api/useApi.js';
import { ApiErrorState, PageLoading } from '../components/States.jsx';
import { ageInYears, formatDate } from '../format.js';
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
  parent: 'Ebeveyn',
  specialist: 'Bağlı uzman',
};

const LIST_LABELS = {
  parent: 'Çocuklarım',
  specialist: 'Bağlı çocuklar',
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
      <header className="page-head">
        <nav className="breadcrumb" aria-label="Konum">
          <Link to="/children">{LIST_LABELS[child.relation]}</Link>
          <CaretRight size={12} aria-hidden="true" />
          <span aria-current="page">{child.name}</span>
        </nav>
        <h1 id="child-name" data-testid={TEST_IDS.childName}>
          {child.name}
        </h1>
        <p className="page-meta">
          <span>
            {ageInYears(child.birthDate)} yaşında · Doğum tarihi {formatDate(child.birthDate)}
          </span>
          <span className="tag">{RELATION_LABELS[child.relation]}</span>
        </p>
      </header>

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
