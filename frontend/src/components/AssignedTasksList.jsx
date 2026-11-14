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

export default function AssignedTasksList({ childId, reloadKey = 0 }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    setLoading(true);
    setError('');
    setTasks([]);

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
  }, [childId, reloadKey]);

  return (
    <section className="card assigned-tasks" aria-label="Atanan görevler">
      <h2>Atanan Görevler</h2>

      {loading && <p role="status">Görevler yükleniyor...</p>}

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      {!loading && !error && tasks.length === 0 && (
        <p className="muted">Henüz atanmış görev bulunmuyor.</p>
      )}

      {!loading && !error && tasks.length > 0 && (
        <ul className="assigned-tasks-list">
          {tasks.map((task) => (
            <li className="assigned-task-item" key={task.id}>
              <h3>{task.title}</h3>

              <p>
                <strong>Gelişim alanı:</strong>{' '}
                {AREA_LABELS[task.area] ?? task.area}
              </p>

              <p>
                <strong>Bitiş tarihi:</strong> {formatDate(task.dueDate)}
              </p>

              <p>
                <strong>Atayan:</strong> {task.assignedBy.name}
              </p>

              <p>
                <strong>Durum:</strong>{' '}
                {task.status === 'completed' ? (
                  <span>
                    Tamamlandı
                    {task.completedAt &&
                      ` (${formatDate(task.completedAt)})`}
                  </span>
                ) : (
                  <span>Bekliyor</span>
                )}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
