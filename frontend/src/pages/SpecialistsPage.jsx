import { CheckCircle, Trash, UserPlus, WarningCircle } from '@phosphor-icons/react';
import { useState } from 'react';
import { apiFetch } from '../api/client.js';
import { useApi } from '../api/useApi.js';
import { ConfirmDialog } from '../components/ConfirmDialog.jsx';
import { ApiErrorState, PageLoading } from '../components/States.jsx';
import { formatDate, initials, SPECIALIST_TYPES } from '../format.js';
import { TEST_IDS } from '../testIds.js';
import { useChild } from './ChildLayout.jsx';

// M2 – Linked specialists (FR-M2-01, 02, 05, 06, 07).
// The parent links, lists and unlinks; a linked specialist only reads the list.
// The API enforces the same rules (POST and DELETE are parent only).
export default function SpecialistsPage() {
  const { child } = useChild();
  const isParent = child.relation === 'parent';
  const path = `/api/children/${child.id}/specialists`;
  const { data, error, loading, reload } = useApi(path);
  const specialists = data?.specialists ?? [];

  const [notice, setNotice] = useState(null);
  const [removing, setRemoving] = useState(null);
  const [removeBusy, setRemoveBusy] = useState(false);
  const [removeError, setRemoveError] = useState(null);

  async function confirmRemove() {
    setRemoveBusy(true);
    setRemoveError(null);
    try {
      await apiFetch(`${path}/${removing.id}`, { method: 'DELETE' });
      setNotice(`${removing.name} artık ${child.name} için bağlı değil.`);
      setRemoving(null);
      reload();
    } catch (err) {
      setRemoveError(err.message);
    } finally {
      setRemoveBusy(false);
    }
  }

  function cancelRemove() {
    setRemoving(null);
    setRemoveError(null);
  }

  return (
    <div className="content-stack">
      {isParent && (
        <AddSpecialistForm
          path={path}
          onLinked={(specialist) => {
            setNotice(`${specialist.name} ${child.name} için bağlandı.`);
            reload();
          }}
        />
      )}

      {notice && (
        <p className="form-success" role="status">
          <CheckCircle size={18} weight="fill" aria-hidden="true" />
          {notice}
        </p>
      )}

      <section className="card" aria-labelledby="specialists-title">
        <div className="card-head">
          <h2 id="specialists-title">Bağlı uzmanlar</h2>
          {!isParent && (
            <p className="muted">Uzmanları sadece ebeveyn ekleyip kaldırabilir.</p>
          )}
        </div>

        {loading && !data && <PageLoading />}
        {error && (
          <div className="card-body">
            <ApiErrorState error={error} onRetry={reload} />
          </div>
        )}
        {data && specialists.length === 0 && (
          <p className="card-body muted">Henüz bağlı uzman yok.</p>
        )}

        {specialists.length > 0 && (
          <ul data-testid={TEST_IDS.specialistsList}>
            {specialists.map((s) => (
              <li key={s.id} className="person" data-testid={TEST_IDS.specialistRow}>
                <span className="avatar" aria-hidden="true">
                  {initials(s.name)}
                </span>
                <div className="person-text">
                  <p className="person-name">{s.name}</p>
                  <p className="muted">
                    {SPECIALIST_TYPES[s.specialistType] ?? s.specialistType} · {s.email}
                  </p>
                  {s.linkedAt && <p className="muted">Bağlandı: {formatDate(s.linkedAt)}</p>}
                </div>
                {isParent && (
                  <button
                    type="button"
                    className="button"
                    onClick={() => setRemoving(s)}
                    aria-label={`${s.name} bağlantısını kaldır`}
                    data-testid={TEST_IDS.removeSpecialist}
                  >
                    <Trash size={16} weight="bold" aria-hidden="true" />
                    Kaldır
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {removing && (
        <ConfirmDialog
          title="Uzman bağlantısı kaldırılsın mı?"
          confirmLabel="Kaldır"
          busy={removeBusy}
          onConfirm={confirmRemove}
          onCancel={cancelRemove}
          testIds={{ confirm: TEST_IDS.confirmRemove }}
        >
          {removing.name}, {child.name} adlı çocuğun bilgilerine artık erişemeyecek.
          {removeError && (
            <span className="dialog-error" role="alert">
              {removeError}
            </span>
          )}
        </ConfirmDialog>
      )}
    </div>
  );
}

function AddSpecialistForm({ path, onLinked }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    if (!email.trim()) {
      setError('Uzmanın e-posta adresini yazın.');
      return;
    }
    setBusy(true);
    try {
      const { specialist } = await apiFetch(path, { method: 'POST', body: { email } });
      setEmail('');
      onLinked(specialist);
    } catch (err) {
      // 404 SPECIALIST_NOT_FOUND (FR-M2-05), 409 ALREADY_LINKED, 400.
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="card add-form" onSubmit={handleSubmit} noValidate aria-labelledby="add-title">
      <div className="card-head">
        <h2 id="add-title">Uzman ekle</h2>
        <p className="muted">Uzmanın sisteme kayıtlı olduğu e-posta adresini yazın.</p>
      </div>
      <div className="card-body add-form-row">
        <label className="field">
          <span>Uzmanın e-posta adresi</span>
          <input
            type="email"
            name="email"
            autoComplete="off"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? 'add-error' : undefined}
            data-testid={TEST_IDS.specialistEmail}
          />
        </label>
        <button
          type="submit"
          className="button button-primary"
          disabled={busy}
          data-testid={TEST_IDS.addSpecialist}
        >
          <UserPlus size={18} weight="bold" aria-hidden="true" />
          {busy ? 'Ekleniyor' : 'Ekle'}
        </button>
      </div>
      {error && (
        <p id="add-error" className="form-error add-form-error" role="alert" data-testid={TEST_IDS.specialistError}>
          <WarningCircle size={18} weight="fill" aria-hidden="true" />
          {error}
        </p>
      )}
    </form>
  );
}
