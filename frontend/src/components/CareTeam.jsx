import { LinkSimple, LinkSimpleBreak } from '@phosphor-icons/react';
import { initials } from './ChildHero.jsx';

const SPECIALIST_TYPES = {
  teacher: 'Öğretmen',
  psychologist: 'Psikolog',
  doctor: 'Doktor',
  special_education: 'Özel eğitim öğretmeni',
  coach: 'Koç',
};

function SpecialistRow({ specialist, linked }) {
  const Icon = linked ? LinkSimple : LinkSimpleBreak;

  return (
    <li className="person">
      <span className={`avatar ${linked ? '' : 'avatar-muted'}`} aria-hidden="true">
        {initials(specialist.name)}
      </span>
      <div className="person-text">
        <p className="person-name">{specialist.name}</p>
        <p className="muted">{SPECIALIST_TYPES[specialist.type] ?? specialist.type}</p>
      </div>
      <span className={`badge ${linked ? 'badge-ok' : 'badge-neutral'}`}>
        <Icon size={14} weight="bold" aria-hidden="true" />
        {linked ? 'Bağlı' : 'Bağlı değil'}
      </span>
    </li>
  );
}

export function CareTeam({ child }) {
  return (
    <section className="card" aria-labelledby="team-title">
      <div className="card-head">
        <h2 id="team-title">Uzman ekibi</h2>
      </div>
      <ul className="people">
        {child.linkedSpecialists.map((specialist) => (
          <SpecialistRow key={specialist.name} specialist={specialist} linked />
        ))}
        {child.unlinkedSpecialists.map((specialist) => (
          <SpecialistRow key={specialist.name} specialist={specialist} linked={false} />
        ))}
      </ul>
      <p className="card-note">
        Bağlantılar veritabanından okunuyor. Erişim kısıtlaması M2 ile API'de uygulanacak.
      </p>
    </section>
  );
}
