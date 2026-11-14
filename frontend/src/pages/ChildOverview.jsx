import { formatDate } from '../format.js';
import { useChild } from './ChildLayout.jsx';

export default function ChildOverview() {
  const { child } = useChild();

  return (
    <section className="card" aria-labelledby="overview-title">
      <div className="card-head">
        <h2 id="overview-title">Profil</h2>
      </div>
      <dl className="facts">
        <div>
          <dt>Ad</dt>
          <dd>{child.name}</dd>
        </div>
        <div>
          <dt>Doğum tarihi</dt>
          <dd>{formatDate(child.birthDate)}</dd>
        </div>
        <div>
          <dt>Bu çocukla ilişkiniz</dt>
          <dd>{child.relation === 'parent' ? 'Ebeveyn' : 'Bağlı uzman'}</dd>
        </div>
      </dl>
    </section>
  );
}
