const dateFormat = new Intl.DateTimeFormat('tr-TR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

export function initials(name) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toLocaleUpperCase('tr-TR');
}

function ageInYears(birthDate, today = new Date()) {
  const birth = new Date(birthDate);
  const age = today.getUTCFullYear() - birth.getUTCFullYear();
  const hadBirthday =
    today.getUTCMonth() > birth.getUTCMonth() ||
    (today.getUTCMonth() === birth.getUTCMonth() && today.getUTCDate() >= birth.getUTCDate());
  return hadBirthday ? age : age - 1;
}

export function ChildHero({ child, users }) {
  const totalUsers = users.parent + users.child + users.specialist;
  const stats = [
    { label: 'Bağlı uzman', value: child.linkedSpecialists.length },
    { label: 'Bağlı olmayan uzman', value: child.unlinkedSpecialists.length },
    { label: 'Kayıtlı kullanıcı', value: totalUsers },
  ];

  return (
    <section className="hero" aria-labelledby="child-name">
      <div className="hero-profile">
        <span className="avatar avatar-lg" aria-hidden="true">
          {initials(child.name)}
        </span>
        <div>
          <p className="eyebrow">Çocuk profili</p>
          <h2 id="child-name" className="hero-name">
            {child.name}
          </h2>
          <p className="muted">
            {ageInYears(child.birthDate)} yaşında · {dateFormat.format(new Date(child.birthDate))}
          </p>
          <p className="muted">Ebeveyn: {child.parentName}</p>
        </div>
      </div>

      <dl className="hero-stats">
        {stats.map((stat) => (
          <div key={stat.label} className="stat">
            <dd>{stat.value}</dd>
            <dt>{stat.label}</dt>
          </div>
        ))}
      </dl>
    </section>
  );
}
