import { ArrowClockwise, CheckCircle, CircleNotch, WarningCircle } from '@phosphor-icons/react';
import { BrandMark } from './Sidebar.jsx';

function connectionState({ loading, failed }) {
  if (loading) return { key: 'pending', label: 'Kontrol ediliyor', Icon: CircleNotch };
  if (failed) return { key: 'down', label: 'Backend bağlantısı yok', Icon: WarningCircle };
  return { key: 'ok', label: 'Sistem çalışıyor', Icon: CheckCircle };
}

export function TopBar({ loading, failed, onReload }) {
  const { key, label, Icon } = connectionState({ loading, failed });

  return (
    <header className="topbar">
      <div className="topbar-title">
        <BrandMark />
        <h1>Genel bakış</h1>
      </div>
      <div className="topbar-actions">
        <p className={`status-pill is-${key}`} role="status">
          <Icon size={16} weight="bold" aria-hidden="true" />
          {label}
        </p>
        <button type="button" className="button" onClick={onReload} disabled={loading}>
          <ArrowClockwise size={16} weight="bold" aria-hidden="true" />
          Yenile
        </button>
      </div>
    </header>
  );
}
