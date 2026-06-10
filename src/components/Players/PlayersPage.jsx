import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useLiveQuery } from '../../hooks/useLiveQuery';
import { playersRepo } from '../../data/repositories/playersRepo';
import PlayerCard from './PlayerCard';
import PlayerProfile from './PlayerProfile';

export default function PlayersPage() {
  const { dbAvailable } = useData();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [adding, setAdding] = useState('');

  const players = useLiveQuery(() => playersRepo.getAll(), [], undefined);

  const filtered = (players || [])
    .filter((p) => !p.archived)
    .filter((p) => {
      const t = search.trim().toLowerCase();
      if (!t) return true;
      return p.nameKey.includes(t) || (p.nickname || '').toLowerCase().includes(t);
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const addPlayer = async () => {
    const name = adding.trim();
    if (!name) return;
    await playersRepo.ensureByName(name);
    setAdding('');
  };

  if (dbAvailable === false) {
    return (
      <div className="players-wrap fade-in">
        <h1 className="players-title">Players</h1>
        <p className="text-muted">
          Offline storage is unavailable in this browser, so the persistent player
          directory can't be used here. Tournaments still run normally.
        </p>
        {styleTag}
      </div>
    );
  }

  return (
    <div className="players-wrap fade-in">
      <header className="players-head">
        <h1 className="players-title">Players</h1>
        <span className="text-muted">{filtered.length} total</span>
      </header>

      <div className="players-controls">
        <input
          className="players-search"
          placeholder="Search players…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="players-add">
        <input
          className="players-search"
          placeholder="Add a player by name…"
          value={adding}
          onChange={(e) => setAdding(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addPlayer()}
        />
        <button className="btn-green btn-sm" onClick={addPlayer} disabled={!adding.trim()}>
          + Add
        </button>
      </div>

      {filtered.length === 0 ? (
        <p className="text-muted players-empty">
          {players && players.length === 0
            ? 'No players yet. Add one above, or they appear automatically when they join an event.'
            : 'No players match your search.'}
        </p>
      ) : (
        <div className="players-grid">
          {filtered.map((p) => (
            <PlayerCard key={p.id} player={p} onClick={() => setSelected(p)} />
          ))}
        </div>
      )}

      {selected && (
        <PlayerProfile
          player={players.find((p) => p.id === selected.id) || selected}
          onClose={() => setSelected(null)}
        />
      )}

      {styleTag}
    </div>
  );
}

const styleTag = (
  <style>{`
    .players-wrap { max-width: 860px; margin: 0 auto; padding: 24px 16px 48px; width: 100%; }
    .players-head { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 16px; }
    .players-title { color: var(--gold); font-size: 1.8rem; }
    .players-controls { margin-bottom: 12px; }
    .players-add { display: flex; gap: 8px; margin-bottom: 24px; }
    .players-search {
      flex: 1; background: var(--surface); border: 1px solid var(--border);
      border-radius: var(--radius); padding: 12px 14px; color: var(--text);
      font-family: inherit; font-size: 0.95rem;
    }
    .players-search:focus { outline: none; border-color: var(--gold); }
    .players-empty { font-size: 0.92rem; padding: 16px 0; }
    .players-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px;
    }
  `}</style>
);
