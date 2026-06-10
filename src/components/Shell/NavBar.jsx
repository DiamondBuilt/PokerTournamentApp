import React from 'react';
import { NavLink } from 'react-router-dom';

const LINKS = [
  { to: '/', label: 'Home', icon: '🏠', end: true },
  { to: '/tournament', label: 'Tournament', icon: '🃏' },
  { to: '/players', label: 'Players', icon: '👥' },
  { to: '/settings', label: 'Settings', icon: '⚙️' },
];

export default function NavBar() {
  return (
    <nav className="app-nav">
      <div className="app-nav-brand">♠ Poker Director</div>
      <div className="app-nav-links">
        {LINKS.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            className={({ isActive }) => `app-nav-link${isActive ? ' active' : ''}`}
          >
            <span className="app-nav-icon">{l.icon}</span>
            <span className="app-nav-label">{l.label}</span>
          </NavLink>
        ))}
      </div>

      <style>{`
        .app-nav {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 10px 16px;
          padding-top: calc(10px + env(safe-area-inset-top));
          background: var(--surface);
          border-bottom: 1px solid var(--border);
          position: sticky;
          top: 0;
          z-index: 50;
        }
        .app-nav-brand {
          font-weight: 900;
          color: var(--gold);
          font-size: 1.05rem;
          white-space: nowrap;
        }
        .app-nav-links {
          display: flex;
          gap: 4px;
          margin-left: auto;
          overflow-x: auto;
        }
        .app-nav-link {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border-radius: var(--radius);
          color: var(--muted);
          text-decoration: none;
          font-weight: 600;
          font-size: 0.9rem;
          white-space: nowrap;
          transition: background 0.15s, color 0.15s;
        }
        .app-nav-link:hover { color: var(--text); background: var(--card); }
        .app-nav-link.active { color: #000; background: var(--gold); }
        .app-nav-icon { font-size: 1rem; }
        @media (max-width: 560px) {
          .app-nav-brand { display: none; }
          .app-nav-links { margin-left: 0; width: 100%; justify-content: space-between; }
          .app-nav-label { display: none; }
          .app-nav-link { padding: 8px 16px; font-size: 1.2rem; }
        }
      `}</style>
    </nav>
  );
}
