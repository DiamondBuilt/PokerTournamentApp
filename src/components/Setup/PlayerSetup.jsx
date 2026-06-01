import React, { useState } from 'react';
import { useTournament } from '../../context/TournamentContext';

export default function PlayerSetup({ onNext, onPrev }) {
  const { state, dispatch } = useTournament();
  const { players } = state;
  const [newName, setNewName] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [showBulk, setShowBulk] = useState(false);

  const addPlayer = (name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    dispatch({ type: 'ADD_PLAYER', payload: { name: trimmed } });
  };

  const handleAddSingle = (e) => {
    e.preventDefault();
    addPlayer(newName);
    setNewName('');
  };

  const handleBulkAdd = () => {
    const names = bulkText.split('\n').map((n) => n.trim()).filter(Boolean);
    names.forEach((n) => addPlayer(n));
    setBulkText('');
    setShowBulk(false);
  };

  const removePlayer = (id) => dispatch({ type: 'REMOVE_PLAYER', payload: id });

  const generateSeating = () => {
    const shuffled = [...players].sort(() => Math.random() - 0.5);
    shuffled.forEach((p, i) =>
      dispatch({ type: 'UPDATE_PLAYER', payload: { id: p.id, updates: { seat: i + 1 } } })
    );
  };

  return (
    <div className="fade-in">
      <h2 className="step-title">Players</h2>
      <p className="step-desc text-muted">
        Add players to the tournament. You can also add players once the tournament starts.
      </p>

      {/* Add player form */}
      <div className="card mt-4">
        <form onSubmit={handleAddSingle} style={{ display: 'flex', gap: 10 }}>
          <input
            type="text"
            placeholder="Player name..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <button type="submit" className="btn-green" disabled={!newName.trim()}>
            + Add
          </button>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => setShowBulk(!showBulk)}
          >
            Bulk
          </button>
        </form>

        {showBulk && (
          <div className="mt-4">
            <div className="form-group">
              <label>Enter names (one per line)</label>
              <textarea
                rows={6}
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder={"Alice\nBob\nCarol\nDave"}
                style={{ resize: 'vertical' }}
              />
            </div>
            <button className="btn-green btn-sm mt-2" onClick={handleBulkAdd}>
              Add All Players
            </button>
          </div>
        )}
      </div>

      {/* Player list */}
      {players.length > 0 && (
        <div className="card mt-4">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <span className="section-heading">
                {players.length} Player{players.length !== 1 ? 's' : ''}
              </span>
              <span className="text-muted" style={{ fontSize: '0.85rem', marginLeft: 8 }}>
                registered
              </span>
            </div>
            <button className="btn-ghost btn-sm" onClick={generateSeating} disabled={players.length < 2}>
              🔀 Random Seats
            </button>
          </div>

          <div className="player-grid">
            {players.map((p, idx) => (
              <div key={p.id} className="player-row">
                <span className="player-seat">Seat {p.seat || idx + 1}</span>
                <span className="player-name">{p.name}</span>
                <button
                  className="btn-icon"
                  onClick={() => removePlayer(p.id)}
                  title="Remove player"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {players.length === 0 && (
        <div className="empty-hint card mt-4">
          <span>No players yet. Add players above, or you can add them after starting.</span>
        </div>
      )}

      <div className="step-actions mt-6">
        <button className="btn-ghost" onClick={onPrev}>← Back</button>
        <button className="btn-primary btn-lg" onClick={onNext}>
          Next: Blind Structure →
        </button>
      </div>

      <style>{`
        .step-title { font-size: 1.8rem; color: var(--gold); margin-bottom: 4px; }
        .step-desc  { font-size: 0.95rem; }
        .section-heading { font-size: 1rem; font-weight: 700; }
        .player-grid { display: flex; flex-direction: column; gap: 8px; }
        .player-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          background: var(--surface);
          border-radius: var(--radius);
          border: 1px solid var(--border);
        }
        .player-seat {
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--gold);
          width: 56px;
          flex-shrink: 0;
        }
        .player-name { flex: 1; font-weight: 600; }
        .empty-hint {
          color: var(--muted);
          text-align: center;
          padding: 32px;
          font-size: 0.9rem;
        }
        .step-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }
      `}</style>
    </div>
  );
}
