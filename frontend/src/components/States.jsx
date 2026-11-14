import { CircleNotch, LockKey, PlugsConnected, WarningCircle } from '@phosphor-icons/react';

export function PageLoading({ label = 'Yükleniyor' }) {
  return (
    <div className="loading" role="status">
      <CircleNotch size={20} weight="bold" aria-hidden="true" />
      {label}
    </div>
  );
}

// Backend unreachable: the request never got an answer.
export function ErrorState({ onRetry }) {
  return (
    <section className="state state-error" role="alert">
      <PlugsConnected size={32} aria-hidden="true" />
      <div>
        <h2>Backend'e ulaşılamıyor</h2>
        <p>
          <code>backend</code> klasöründe <code>npm run dev</code> komutunun çalıştığından emin olun.
        </p>
      </div>
      {onRetry && (
        <button type="button" className="button button-primary" onClick={onRetry}>
          Tekrar dene
        </button>
      )}
    </section>
  );
}

/**
 * Shows any error from apiFetch. A network error gets the "backend is down"
 * panel; an answer from the API (403, 404, …) shows its own message.
 */
export function ApiErrorState({ error, onRetry }) {
  if (!error?.status) {
    return <ErrorState onRetry={onRetry} />;
  }

  const Icon = error.status === 403 ? LockKey : WarningCircle;
  const TITLES = { 403: 'Erişim izniniz yok', 404: 'Kayıt bulunamadı' };
  const title = TITLES[error.status] ?? 'İşlem tamamlanamadı';

  return (
    <section className="state state-error" role="alert">
      <Icon size={32} aria-hidden="true" />
      <div>
        <h2>{title}</h2>
        <p>{error.message}</p>
      </div>
    </section>
  );
}

export function EmptyState({ title, children }) {
  return (
    <section className="state">
      <div>
        <h2>{title}</h2>
        <p>{children}</p>
      </div>
    </section>
  );
}
