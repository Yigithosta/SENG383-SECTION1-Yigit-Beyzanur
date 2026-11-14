
import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../api/client.js';
import { getWeekMonday, getWeekDays, shiftWeek } from '../scheduleDates.js';

export default function WeeklySchedule({ childId, canCreate = false }) {
  const [week, setWeek] = useState(() => getWeekMonday());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const [title, setTitle] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');

  const days = useMemo(() => getWeekDays(week), [week]);

  useEffect(() => {
    if (!childId) {
      setEvents([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError('');
    setEvents([]);

    apiFetch(
      `/api/children/${childId}/events?week=${week}`,
      { signal: controller.signal }
    )
      .then((data) => {
        if (!controller.signal.aborted) {
          setEvents(data);
        }
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setError(err.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [childId, week, reloadKey]);

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError('');
    setSaving(true);

    try {
      await apiFetch(`/api/children/${childId}/events`, {
        method: 'POST',
        body: {
          title,
          startsAt,
          endsAt
        }
      });

      setTitle('');
      setStartsAt('');
      setEndsAt('');

      // Show the week containing the newly created event.
      const [year, month, day] = startsAt.slice(0, 10).split('-').map(Number);
      const eventWeek = getWeekMonday(new Date(year, month - 1, day));

      setWeek(eventWeek);
      setReloadKey((value) => value + 1);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="content-stack" aria-label="Haftalık takvim">
      <div className="page-head">
        <h2>Haftalık Takvim</h2>
        <p className="muted">Etkinlikleri haftalık olarak görüntüleyin.</p>
      </div>

      <div className="schedule-toolbar">
        <button
          className="button"
          type="button"
          onClick={() => setWeek((value) => shiftWeek(value, -1))}
        >
          Önceki hafta
        </button>

        <strong>{days[0].date} – {days[6].date}</strong>

        <button
          className="button"
          type="button"
          onClick={() => setWeek((value) => shiftWeek(value, 1))}
        >
          Sonraki hafta
        </button>
      </div>

      {loading && <p role="status">Etkinlikler yükleniyor...</p>}

      {error && (
        <p className="form-error" role="alert">{error}</p>
      )}

      {!loading && !error && (
        <div className="schedule-grid" aria-label="Haftanın günleri">
          {days.map((day) => {
            const dayEvents = events
              .filter((item) => item.startsAt.slice(0, 10) === day.date)
              .sort((a, b) => a.startsAt.localeCompare(b.startsAt));

            return (
              <section className="schedule-day card" key={day.date}>
                <h3>{day.label}</h3>

                {dayEvents.length === 0 ? (
                  <p className="muted">Etkinlik yok</p>
                ) : (
                  <ul>
                    {dayEvents.map((item) => (
                      <li className="schedule-event" key={item.id}>
                        <strong>{item.title}</strong>
                        <span>
                          {item.startsAt.slice(11, 16)}
                          {' – '}
                          {item.endsAt.slice(11, 16)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      )}

      {canCreate && (
        <form className="card schedule-form" onSubmit={handleSubmit}>
          <h3>Yeni Etkinlik Ekle</h3>

          <label className="field">
            Başlık
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
            />
          </label>

          <label className="field">
            Başlangıç
            <input
              type="datetime-local"
              value={startsAt}
              onChange={(event) => setStartsAt(event.target.value)}
              required
            />
          </label>

          <label className="field">
            Bitiş
            <input
              type="datetime-local"
              value={endsAt}
              onChange={(event) => setEndsAt(event.target.value)}
              required
            />
          </label>

          {formError && (
            <p className="form-error" role="alert">{formError}</p>
          )}

          <button
            className="button button-primary"
            type="submit"
            disabled={saving}
          >
            {saving ? 'Kaydediliyor...' : 'Etkinlik Ekle'}
          </button>
        </form>
      )}
    </section>
  );
}
