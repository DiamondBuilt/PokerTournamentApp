import React, { useState, useRef, useEffect } from 'react';
import { useTournament } from '../context/TournamentContext';
import { THEMES, THEME_KEYS } from '../utils/themes';

export default function ThemePicker({ popupAlign = 'right' }) {
  const { state, dispatch } = useTournament();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', handler);
    return () => document.removeEventListener('pointerdown', handler);
  }, [open]);

  const setTheme = (key) => {
    dispatch({ type: 'SET_THEME', payload: key });
    setOpen(false);
  };

  return (
    <div className="theme-picker" ref={ref}>
      <button
        className="btn-icon theme-picker-btn"
        onClick={() => setOpen((o) => !o)}
        title="Change theme"
        aria-label="Change color theme"
      >
        🎨
      </button>

      {open && (
        <div className={`theme-popup theme-popup-${popupAlign}`}>
          <div className="theme-popup-title">Color Theme</div>
          <div className="theme-swatches">
            {THEME_KEYS.map((key) => {
              const t = THEMES[key];
              const active = state.theme === key;
              return (
                <button
                  key={key}
                  className={`theme-swatch ${active ? 'theme-swatch-active' : ''}`}
                  onClick={() => setTheme(key)}
                  title={t.name}
                >
                  <div
                    className="swatch-preview"
                    style={{
                      background: `linear-gradient(135deg, ${t.bg} 50%, ${t.gold} 50%)`,
                    }}
                  />
                  <span className="swatch-name">{t.name}</span>
                  {active && <span className="swatch-check">✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <style>{`
        .theme-picker {
          position: relative;
        }
        .theme-picker-btn {
          font-size: 1.2rem;
          padding: 6px 8px;
          min-height: 36px;
        }
        .theme-popup {
          position: absolute;
          top: calc(100% + 8px);
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 14px;
          z-index: 300;
          min-width: 200px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.6);
        }
        .theme-popup-right  { right: 0; }
        .theme-popup-left   { left: 0; }
        .theme-popup-center { left: 50%; transform: translateX(-50%); }
        .theme-popup-title {
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--muted);
          margin-bottom: 10px;
        }
        .theme-swatches {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .theme-swatch {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 10px;
          background: var(--card);
          border: 2px solid var(--border);
          border-radius: var(--radius);
          color: var(--text);
          cursor: pointer;
          text-align: left;
          transition: border-color 0.15s;
          min-height: 44px;
          width: 100%;
        }
        .theme-swatch:hover { border-color: var(--muted); }
        .theme-swatch-active { border-color: var(--gold) !important; }
        .swatch-preview {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          flex-shrink: 0;
          border: 1px solid rgba(255,255,255,0.15);
        }
        .swatch-name {
          flex: 1;
          font-size: 0.85rem;
          font-weight: 600;
        }
        .swatch-check {
          color: var(--gold);
          font-weight: 800;
          font-size: 0.9rem;
        }
      `}</style>
    </div>
  );
}
