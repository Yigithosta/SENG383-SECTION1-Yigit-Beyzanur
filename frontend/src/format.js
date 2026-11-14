const dateFormat = new Intl.DateTimeFormat('tr-TR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

export function formatDate(isoDate) {
  return dateFormat.format(new Date(isoDate));
}

export function initials(name) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toLocaleUpperCase('tr-TR');
}

export function ageInYears(birthDate, today = new Date()) {
  const birth = new Date(birthDate);
  const age = today.getUTCFullYear() - birth.getUTCFullYear();
  const hadBirthday =
    today.getUTCMonth() > birth.getUTCMonth() ||
    (today.getUTCMonth() === birth.getUTCMonth() && today.getUTCDate() >= birth.getUTCDate());
  return hadBirthday ? age : age - 1;
}

export const ROLE_LABELS = {
  parent: 'Ebeveyn',
  specialist: 'Uzman',
  child: 'Çocuk',
};

export const SPECIALIST_TYPES = {
  teacher: 'Öğretmen',
  psychologist: 'Psikolog',
  doctor: 'Doktor',
  special_education: 'Özel eğitim öğretmeni',
  coach: 'Koç',
};

// "Uzman · Öğretmen" for a specialist, "Ebeveyn" for a parent.
export function roleLabel(user) {
  const role = ROLE_LABELS[user.role] ?? user.role;
  if (user.role === 'specialist' && user.specialistType) {
    return `${role} · ${SPECIALIST_TYPES[user.specialistType] ?? user.specialistType}`;
  }
  return role;
}
