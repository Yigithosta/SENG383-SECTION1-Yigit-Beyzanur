import { CaretRight } from '@phosphor-icons/react';
import { Link } from 'react-router';
import { useApi } from '../api/useApi.js';
import { ApiErrorState, EmptyState, PageLoading } from '../components/States.jsx';
import { ageInYears, initials } from '../format.js';
import { TEST_IDS } from '../testIds.js';

// GET /api/children already returns only the children this user may access.
export function ChildrenList({ title, intro, emptyTitle, emptyText }) {
  const { data, error, loading, reload } = useApi('/api/children');
  const children = data?.children ?? [];

  return (
    <div className="content-stack">
      <div className="page-head">
        <h1>{title}</h1>
        {intro && <p className="muted">{intro}</p>}
      </div>

      {loading && !data && <PageLoading />}
      {error && <ApiErrorState error={error} onRetry={reload} />}
      {data && children.length === 0 && <EmptyState title={emptyTitle}>{emptyText}</EmptyState>}

      {children.length > 0 && (
        <ul className="card child-list" data-testid={TEST_IDS.childrenList}>
          {children.map((child) => (
            <li key={child.id}>
              <Link className="person person-link" to={`/children/${child.id}`} data-testid={TEST_IDS.childCard}>
                <span className="avatar" aria-hidden="true">
                  {initials(child.name)}
                </span>
                <span className="person-text">
                  <span className="person-name">{child.name}</span>
                  <span className="muted">{ageInYears(child.birthDate)} yaşında</span>
                </span>
                <CaretRight size={18} aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
