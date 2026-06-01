import React, { useState } from 'react';
import { useTournament } from '../../context/TournamentContext';

export default function PlayerManagement() {
  const { state, dispatch } = useTournament();
  const { players, config, tournament } = state;
  const [newName, setNewName] = useState('');

  const addPlayer = (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    dispatch({ type: 'ADD_PLAYER', payload: { name: newName.trim() } });
    setNewName('');
  };

  const eliminate = (id) => {
    const activePlayers = players.filter((p) => p.status === 'active');
    dispatch({
      type: 'ELIMINATE_PLAYER',
      payload: { playerId: id, position: activePlayers.length },
    });
  };

  const rebuy = (id) => {
    dispatch({ type: 'REBUY_PLAYER', payload: id });
  };

  const addOn = (id) => {
    dispatch({ type: 'ADDON_PLAYER', payload: id });
  };

  const activePlayers = players.filter((p) => p.status === 'active');
  const eliminatedPlayers = players
    .filter((p) => p.status === 'eliminated')
    .sort((a, b) => (a.finishPosition || 99) - (b.finishPosition || 99));

  const canRebuy = (p) =>
    config.rebuyEnabled &&
    p.rebuys < config.maxRebuys &&
    tournament.currentLevel <= config.rebuyLevelLimit;

  const canAddOn = (p) =>
    config.addOnEnabled &&
    p.addOns === 0;

  return (
    <div className="player-mgmt">
      <div className="pm-add-form">
        <form onSubmit={addPlayer} style={{ display: 'flex', gap: 10 }}>
          <input
            type="text"
            placeholder="Player name..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <button type="submit" className="btn-green" disabled={!newName.trim()}>
            + Add Player
          </button>
        </form>
      </div>

      {activePlayers.length > 0 && (
        <div className="pm-section mt-4">
          <h3 className="pm-section-title">
            Active Players ({activePlayers.length})
          </h3>
          <div className="pm-list">
            {activePlayers.map((p) => (
              <div key={p.id} className="pm-player-row">
                <div className="pm-player-info">
                  <span className="pm-seat">Seat {p.seat}</span>
                  <span className="pm-name">{p.name}</span>
                  <div className="pm-badges">
                    {p.rebuys > 0 && <span className="badge badge-blue">{p.rebuys}R</span>}
                    {p.addOns > 0 && <span className="badge badge-gold">{p.addOns}A</span>}
                  </div>
                </div>
                <div className="pm-actions">
                  {canRebuy(p) && (
                    <button className="btn-blue btn-sm" onClick={() => rebuy(p.id)}>
                      Rebuy
                    </button>
                  )}
                  {canAddOn(p) && (
                    <button className="btn-ghost btn-sm" onClick={() => addOn(p.id)}>
                      Add-on
                    </button>
                  )}
                  <button className="btn-red btn-sm" onClick={() => eliminate(p.id)}>
                    Eliminate
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {eliminatedPlayers.length > 0 && (
        <div className="pm-section mt-4">
          <h3 className="pm-section-title text-muted">
            Eliminated ({eliminatedPlayers.length})
          </h3>
          <div className="pm-list">
            {eliminatedPlayers.map((p) => (
              <div key={p.id} className="pm-player-row elim">
                <div className="pm-player-info">
                  <span className="pm-pos">#{p.finishPosition}</span>
                  <span className="pm-name elim-name">{p.name}</span>
                  <span className="text-muted" style={{ fontSize: '0.8rem' }}>
                    (Level {p.eliminatedLevel})
                  </span>
                </div>
                {canRebuy(p) && (
                  <button className="btn-blue btn-sm" onClick={() => rebuy(p.id)}>
                    Rebuy
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {players.length === 0 && (
        <div className="pm-empty mt-4">
          No players yet. Add players above.
        </div>
      )}

      <style>{`
        .player-mgmt {}
        .pm-section {}
        .pm-section-title {
          font-size: 0.85rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--muted);
          margin-bottom: 10px;
        }
        .pm-list { display: flex; flex-direction: column; gap: 6px; }
        .pm-player-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 10px 14px;
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: var(--radius);
        }
        .pm-player-row.elim { opacity: 0.6; }
        .pm-player-info {
          display: flex;
          align-items: center;
          gap: 10px;
          flex: 1;
          min-width: 0;
          flex-wrap: wrap;
        }
        .pm-seat, .pm-pos {
          font-size: 0.78rem;
          font-weight: 800;
          color: var(--gold);
          width: 48px;
          flex-shrink: 0;
        }
        .pm-name {
          font-weight: 700;
          flex: 1;
          min-width: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .elim-name { text-decoration: line-through; color: var(--muted); }
        .pm-badges { display: flex; gap: 4px; }
        .pm-actions { display: flex; gap: 6px; flex-shrink: 0; }
        .pm-empty {
          text-align: center;
          color: var(--muted);
          padding: 40px 0;
          font-size: 0.9rem;
        }
      `}</style>
    </div>
  );
}
