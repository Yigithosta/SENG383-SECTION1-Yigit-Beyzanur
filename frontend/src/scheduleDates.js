
function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

// Returns the Monday of the week containing the given date.
export function getWeekMonday(date = new Date()) {
  const monday = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );

  const weekday = monday.getDay();
  const daysSinceMonday = (weekday + 6) % 7;

  monday.setDate(monday.getDate() - daysSinceMonday);

  return formatLocalDate(monday);
}

// Moves a Monday forward or backward by full weeks.
export function shiftWeek(mondayString, weeks) {
  const [year, month, day] = mondayString.split('-').map(Number);

  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + weeks * 7);

  return formatLocalDate(date);
}

// Returns all seven dates, Monday through Sunday.
export function getWeekDays(mondayString) {
  const [year, month, day] = mondayString.split('-').map(Number);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(year, month - 1, day + index);

    return {
      date: formatLocalDate(date),
      label: new Intl.DateTimeFormat('tr-TR', {
        weekday: 'long',
        day: 'numeric',
        month: 'short'
      }).format(date)
    };
  });
}
