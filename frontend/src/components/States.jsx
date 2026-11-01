import { Database, PlugsConnected } from '@phosphor-icons/react';

export function DashboardSkeleton() {
  return (
    <div className="content-stack" aria-busy="true" aria-label="Veriler yükleniyor">
      <div className="skeleton skeleton-hero" />
      <div className="content-columns">
        <div className="skeleton skeleton-card" />
        <div className="skeleton skeleton-card" />
      </div>
    </div>
  );
}

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
      <button type="button" className="button button-primary" onClick={onRetry}>
        Tekrar dene
      </button>
    </section>
  );
}

export function EmptyState() {
  return (
    <section className="state" aria-labelledby="empty-title">
      <Database size={32} aria-hidden="true" />
      <div>
        <h2 id="empty-title">Veritabanında kayıt yok</h2>
        <p>
          Demo verisi için <code>backend</code> klasöründe <code>npm run seed</code> komutunu
          çalıştırıp <strong>Yenile</strong>'ye basın.
        </p>
      </div>
    </section>
  );
}
