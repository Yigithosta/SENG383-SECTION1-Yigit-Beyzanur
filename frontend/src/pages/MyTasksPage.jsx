import { useEffect, useState } from 'react';
import { apiFetch } from '../api/client.js';

const AREA_LABELS = {
  language: 'Dil',
  motor: 'Motor',
  cognitive: 'Bilişsel',
  social_emotional: 'Sosyal-duygusal',
  self_care: 'Öz bakım',
};

function formatDate(value) {
  if (!value) return '';
  const date = new Date(`${value.slice(0, 10)}T00:00:00Z`);

  return new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

export default function MyTasksPage({ childId }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [completingId, setCompletingId] = useState(null);

  useEffect(() => {
    if (!childId) {
      setLoading(false);
      setError('Çocuk bilgisi bulunamadı.');
      return;
    }

    const controller = new AbortController();

    setLoading(true);
    setError('');

    apiFetch(`/api/children/${childId}/tasks`, {
      signal: controller.signal,
    })
      .then((data) => {
        if (!controller.signal.aborted) {
          setTasks(data);
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          setError(err.message);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [childId]);

  async function handleComplete(taskId) {
    setCompletingId(taskId);
    setError('');

    try {
      const updated = await apiFetch(
        `/api/children/${childId}/tasks/${taskId}/complete`,
        { method: 'PATCH' }
      );

      setTasks((current) =>
        current.map((task) => (task.id === taskId ? updated : task))
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setCompletingId(null);
    }
  }

  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.status !== b.status) {
      return a.status === 'pending' ? -1 : 1;
    }
    return a.dueDate.localeCompare(b.dueDate);
  });

  return (
    <section className="content-stack" aria-label="Görev listem">
      {loading && <p role="status">Görevlerin yükleniyor...</p>}

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      {!loading && !error && sortedTasks.length === 0 && (
        <p className="card">Henüz görevin yok.</p>
      )}

      {!loading && sortedTasks.length > 0 && (
        <ul className="my-tasks-list">
          {sortedTasks.map((task) => (
            <li className="card my-task-card" key={task.id}>
              <h2>{task.title}</h2>

              <p>{task.description}</p>

              <p>
                <strong>Alan:</strong> {AREA_LABELS[task.area] ?? task.area}
              </p>

              <p>
                <strong>Bitiş tarihi:</strong> {formatDate(task.dueDate)}
              </p>

              {task.status === 'completed' ? (
                <p className="task-completed">
                  ✓ Tamamlandı
                </p>
              ) : (
                <button
                  type="button"
                  className="button button-primary my-task-complete-button"
                  onClick={() => handleComplete(task.id)}
                  disabled={completingId !== null}
                >
                  {completingId === task.id
                    ? 'Kaydediliyor...'
                    : 'Tamamladım'}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}