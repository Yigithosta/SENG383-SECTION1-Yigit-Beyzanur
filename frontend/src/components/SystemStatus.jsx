import { Browser, CheckCircle, Database, HardDrives, XCircle } from '@phosphor-icons/react';

export function SystemStatus({ health }) {
  const layers = [
    { name: 'React', detail: 'Arayüz', ok: true, Icon: Browser },
    { name: 'Express', detail: 'REST API', ok: health.status === 'ok', Icon: HardDrives },
    { name: 'SQLite', detail: 'Veritabanı', ok: health.database === 'ok', Icon: Database },
  ];

  return (
    <section className="card" aria-labelledby="system-title">
      <div className="card-head">
        <h2 id="system-title">Sistem katmanları</h2>
      </div>
      <ol className="layers">
        {layers.map(({ name, detail, ok, Icon }) => {
          const StatusIcon = ok ? CheckCircle : XCircle;
          return (
            <li key={name} className="layer">
              <span className="layer-icon">
                <Icon size={20} aria-hidden="true" />
              </span>
              <div className="person-text">
                <p className="person-name">{name}</p>
                <p className="muted">{detail}</p>
              </div>
              <span className={`layer-state ${ok ? 'is-ok' : 'is-down'}`}>
                <StatusIcon size={16} weight="fill" aria-hidden="true" />
                {ok ? 'Çalışıyor' : 'Hata'}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
