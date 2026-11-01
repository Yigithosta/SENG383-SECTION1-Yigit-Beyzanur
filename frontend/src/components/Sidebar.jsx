import { SquaresFour } from '@phosphor-icons/react';

export function BrandMark() {
  return (
    <svg className="brand-mark" viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="currentColor" />
      <circle cx="16" cy="10.5" r="3.5" fill="var(--brand-mark-ink)" />
      <path
        d="M7.5 25c0-5 3.8-8.5 8.5-8.5s8.5 3.5 8.5 8.5"
        fill="none"
        stroke="var(--brand-mark-ink)"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">
        <BrandMark />
      </div>

      <nav aria-label="Ana menü">
        <ul className="nav-list">
          <li>
            <a className="nav-item is-active" href="#main" aria-current="page">
              <SquaresFour size={20} aria-hidden="true" />
              Genel bakış
            </a>
          </li>
        </ul>
      </nav>

      <p className="sidebar-foot">SENG 383 · Walking skeleton</p>
    </aside>
  );
}
