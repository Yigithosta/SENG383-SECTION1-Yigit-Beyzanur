import { useState } from 'react';
import { apiFetch } from '../api/client.js';

const AREAS = [
  { value: 'language', label: 'Dil' },
  { value: 'motor', label: 'Motor' },
  { value: 'cognitive', label: 'Bilişsel' },
  { value: 'social_emotional', label: 'Sosyal-duygusal' },
  { value: 'self_care', label: 'Öz bakım' },
];

export default function AssignTaskForm({ childId, onCreated }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [area, setArea] = useState('language');
  const [dueDate, setDueDate] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (!title.trim() || !description.trim()) {
      setError('Başlık ve açıklama zorunludur.');
      return;
    }

    if (!dueDate) {
      setError('Bitiş tarihi zorunludur.');
      return;
    }

    setSaving(true);

    try {
      await apiFetch(`/api/children/${childId}/tasks`, {
        method: 'POST',
        body: {
          title: title.trim(),
          description: description.trim(),
          area,
          dueDate,
        },
      });

      setTitle('');
      setDescription('');
      setArea('language');
      setDueDate('');
      onCreated?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="card task-form" onSubmit={handleSubmit} noValidate>
      <h2>Yeni Görev Ata</h2>

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
        Açıklama
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          required
        />
      </label>

      <label className="field">
        Gelişim alanı
        <select
          value={area}
          onChange={(event) => setArea(event.target.value)}
        >
          {AREAS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        Bitiş tarihi
        <input
          type="date"
          value={dueDate}
          onChange={(event) => setDueDate(event.target.value)}
          required
        />
      </label>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <button
        className="button button-primary"
        type="submit"
        disabled={saving}
      >
        {saving ? 'Kaydediliyor...' : 'Görev Ata'}
      </button>
    </form>
  );
}