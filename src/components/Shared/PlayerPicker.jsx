import React, { useRef, useState } from 'react';
import { useLiveQuery } from '../../hooks/useLiveQuery';
import { playersRepo, toNameKey } from '../../data/repositories/playersRepo';

/**
 * Name input backed by the persistent player directory: type to filter known
 * players, click (or Enter) to pick, or add a brand-new name. Used by the
 * tournament setup, the live dashboard quick-add, and cash sessions so a
 * player only ever has to be typed once.
 *
 * `excludeNames` are hidden from suggestions (players already seated).
 * `onPick(name)` fires with the chosen/typed name.
 */
export default function PlayerPicker({ excludeNames = [], onPick, placeholder = 'Player name…', compact = false }) {
  const [text, setText] = useState('');
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const wrapRef = useRef(null);

  const directory = useLiveQuery(() => playersRepo.getAll(), [], []);

  const excluded = new Set(excludeNames.map(toNameKey));
  const query = toNameKey(text);
  const matches = (directory || [])
    .filter((p) => !p.archived && !excluded.has(p.nameKey))
    .filter((p) => !query || p.nameKey.includes(query) || toNameKey(p.nickname).includes(query))
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, 8);

  const exactMatch = matches.some((p) => p.nameKey === query);
  const showAddNew = query.length > 0 && !exactMatch;
  // Options the keyboard can walk: matches first, then "add new" if shown.
  const optionCount = matches.length + (showAddNew ? 1 : 0);

  const pick = (name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onPick(trimmed);
    setText('');
    setHighlight(0);
    setOpen(true); // keep open for adding several players in a row
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, optionCount - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlight < matches.length && matches[highlight]) pick(matches[highlight].name);
      else if (text.trim()) pick(text);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div className={`ppick${compact ? ' compact' : ''}`} ref={wrapRef}>
      <input
        className="ppick-input"
        type="text"
        placeholder={placeholder}
        value={text}
        onChange={(e) => { setText(e.target.value); setOpen(true); setHighlight(0); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={onKeyDown}
      />
      {open && optionCount > 0 && (
        <div className="ppick-menu">
          {matches.map((p, i) => (
            <button
              key={p.id}
              type="button"
              className={`ppick-item${i === highlight ? ' hl' : ''}`}
              onMouseDown={(e) => { e.preventDefault(); pick(p.name); }}
              onMouseEnter={() => setHighlight(i)}
            >
              <span className="ppick-item-name">{p.name}</span>
              {p.nickname && <span className="ppick-item-nick">“{p.nickname}”</span>}
              <span className="ppick-item-meta">
                {(p.stats?.tournamentsPlayed || 0) + (p.stats?.cashSessionsPlayed || 0)} events
              </span>
            </button>
          ))}
          {showAddNew && (
            <button
              type="button"
              className={`ppick-item add-new${highlight === matches.length ? ' hl' : ''}`}
              onMouseDown={(e) => { e.preventDefault(); pick(text); }}
              onMouseEnter={() => setHighlight(matches.length)}
            >
              + Add “{text.trim()}” as new player
            </button>
          )}
        </div>
      )}

      <style>{`
        .ppick { position: relative; flex: 1; min-width: 0; }
        .ppick-input {
          width: 100%; background: var(--surface); border: 1px solid var(--border);
          border-radius: var(--radius); padding: 10px 12px; color: var(--text);
          font-family: inherit; font-size: 0.95rem;
        }
        .ppick.compact .ppick-input { padding: 8px 10px; font-size: 0.88rem; }
        .ppick-input:focus { outline: none; border-color: var(--gold); }
        .ppick-menu {
          position: absolute; top: calc(100% + 4px); left: 0; right: 0; z-index: 60;
          background: var(--card); border: 1px solid var(--border);
          border-radius: var(--radius); overflow: hidden;
          box-shadow: 0 8px 24px rgba(0,0,0,0.45);
          max-height: 260px; overflow-y: auto;
        }
        .ppick-item {
          display: flex; align-items: center; gap: 8px; width: 100%;
          background: none; border: none; text-align: left;
          padding: 10px 12px; color: var(--text); font-size: 0.9rem;
          border-bottom: 1px solid var(--border); cursor: pointer;
        }
        .ppick-item:last-child { border-bottom: none; }
        .ppick-item.hl { background: var(--surface); }
        .ppick-item-name { font-weight: 700; }
        .ppick-item-nick { color: var(--muted); font-size: 0.8rem; }
        .ppick-item-meta { margin-left: auto; color: var(--muted); font-size: 0.75rem; white-space: nowrap; }
        .ppick-item.add-new { color: var(--gold); font-weight: 700; }
      `}</style>
    </div>
  );
}
