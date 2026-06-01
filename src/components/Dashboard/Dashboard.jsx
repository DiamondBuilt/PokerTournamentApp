import React, { useState } from 'react';
import { useTournament } from '../../context/TournamentContext';
import { useTimer } from '../../hooks/useTimer';
import { useWakeLock } from '../../hooks/useWakeLock';
import { setMuted, isMuted } from '../../utils/audioManager';
import TimerDisplay from './TimerDisplay';
import BlindDisplay from './BlindDisplay';
import StatsBar from './StatsBar';
import PlayerManagement from '../Players/PlayerManagement';
import BlindSchedule from '../Schedule/BlindSchedule';
import PayoutView from '../Payouts/PayoutView';

export default function Dashboard() {
  const { state, dispatch } = useTournament();
  const { tournament, structure, config, players } = state;
  const { pause, resume, advanceLevel, previousLevel } = useTimer();

  const [showModal, setShowModal] = useState(null); // 'eliminate' | 'players' | 'schedule' | 'payouts' | null
  const [addPlayerName, setAddPlayerName] = useState('');
  const [muted, setMutedState] = useState(isMuted());

  const isPlaying = tournament.status === 'playing';
  const isBreak = tournament.status === 'break';
  const isPaused = tournament.status === 'paused';

  // Keep the screen awake while the clock is actively counting down.
  useWakeLock(isPlaying || isBreak);

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    setMutedState(next);
  };

  const currentLevelData = structure.levels[tournament.currentLevel - 1] || structure.levels[0];
  const activePlayers = players.filter((p) => p.status === 'active');

  const handleAddPlayer = (e) => {
    e.preventDefault();
    if (!addPlayerName.trim()) return;
    dispatch({ type: 'ADD_PLAYER', payload: { name: addPlayerName.trim() } });
    setAddPlayerName('');
  };

  const handleReset = () => {
    if (window.confirm('Reset tournament and return to setup? Current progress will be lost.')) {
      dispatch({ type: 'RESET_TOURNAMENT' });
    }
  };

  return (
    <div className="dashboard">
      {/* Top stats bar */}
      <StatsBar />

      {/* Main content */}
      <div className="dashboard-main">
        {/* Center column: timer + blinds */}
        <div className="center-col">
          {/* Status label */}
          <div className="status-label-row">
            {isBreak ? (
              <span className="badge badge-blue status-badge">☕ BREAK TIME</span>
            ) : (
              <span className={`status-badge-text ${isPlaying ? 'playing' : 'paused'}`}>
                {isPlaying ? '● PLAYING' : '⏸ PAUSED'}
              </span>
            )}
          </div>

          {/* Timer */}
          <TimerDisplay />

          {/* Blind info */}
          <BlindDisplay />

          {/* Controls */}
          <div className="controls">
            {/* Play/Pause */}
            {isPlaying || isBreak ? (
              <button className="ctrl-btn ctrl-pause" onClick={pause} title="Pause">
                ⏸ Pause
              </button>
            ) : (
              <button className="ctrl-btn ctrl-play" onClick={resume} title="Resume">
                ▶ Resume
              </button>
            )}

            <button
              className="ctrl-btn ctrl-prev"
              onClick={previousLevel}
              disabled={tournament.currentLevel <= 1}
              title="Previous Level"
            >
              ⏮ Prev
            </button>

            <button
              className="ctrl-btn ctrl-next"
              onClick={advanceLevel}
              title="Next Level"
              disabled={tournament.currentLevel >= structure.levels.length}
            >
              Next ⏭
            </button>

            <button
              className="ctrl-btn ctrl-eliminate"
              onClick={() => setShowModal('eliminate')}
              disabled={activePlayers.length < 2}
              title="Eliminate Player"
            >
              💀 Eliminate
            </button>
          </div>

          {/* Secondary controls */}
          <div className="secondary-controls">
            <button className="ctrl-sm" onClick={() => setShowModal('schedule')}>
              📋 Blind Schedule
            </button>
            <button className="ctrl-sm" onClick={() => setShowModal('payouts')}>
              💰 Payouts
            </button>
            <button
              className="ctrl-sm"
              onClick={toggleMute}
              title={muted ? 'Unmute alerts' : 'Mute alerts'}
            >
              {muted ? '🔇 Muted' : '🔔 Sound'}
            </button>
            <button className="ctrl-sm ctrl-reset" onClick={handleReset}>
              ↩ Reset
            </button>
          </div>
        </div>

        {/* Right sidebar: player list */}
        <aside className="sidebar">
          <div className="sidebar-header">
            <span className="sidebar-title">Players</span>
            <span className="badge badge-green">{activePlayers.length} Active</span>
          </div>

          {/* Quick add player */}
          <form onSubmit={handleAddPlayer} className="quick-add">
            <input
              type="text"
              placeholder="Add player..."
              value={addPlayerName}
              onChange={(e) => setAddPlayerName(e.target.value)}
              className="quick-add-input"
            />
            <button type="submit" className="quick-add-btn" disabled={!addPlayerName.trim()}>
              +
            </button>
          </form>

          {/* Player list */}
          <div className="player-list">
            {activePlayers.map((p) => (
              <div key={p.id} className="player-item active-player">
                <div className="player-item-info">
                  <span className="player-item-seat">#{p.seat}</span>
                  <span className="player-item-name">{p.name}</span>
                </div>
                <div className="player-item-meta">
                  {p.rebuys > 0 && <span className="badge badge-blue" style={{fontSize:'0.7rem'}}>{p.rebuys}R</span>}
                  {p.addOns > 0 && <span className="badge badge-gold" style={{fontSize:'0.7rem'}}>{p.addOns}A</span>}
                </div>
              </div>
            ))}

            {players.filter((p) => p.status === 'eliminated').length > 0 && (
              <>
                <div className="elim-divider">Eliminated</div>
                {players
                  .filter((p) => p.status === 'eliminated')
                  .sort((a, b) => (a.finishPosition || 99) - (b.finishPosition || 99))
                  .map((p) => (
                    <div key={p.id} className="player-item elim-player">
                      <div className="player-item-info">
                        <span className="player-item-pos">#{p.finishPosition}</span>
                        <span className="player-item-name elim-name">{p.name}</span>
                      </div>
                    </div>
                  ))}
              </>
            )}

            {players.length === 0 && (
              <div className="no-players">No players yet</div>
            )}
          </div>
        </aside>
      </div>

      {/* Modals */}
      {showModal === 'eliminate' && (
        <EliminateModal
          players={activePlayers}
          config={config}
          structure={structure}
          tournament={tournament}
          dispatch={dispatch}
          onClose={() => setShowModal(null)}
        />
      )}

      {showModal === 'schedule' && (
        <FullModal onClose={() => setShowModal(null)} title="Blind Schedule">
          <BlindSchedule />
        </FullModal>
      )}

      {showModal === 'payouts' && (
        <FullModal onClose={() => setShowModal(null)} title="Payouts">
          <PayoutView />
        </FullModal>
      )}

      <style>{`
        .dashboard {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: var(--bg);
        }
        .dashboard-main {
          flex: 1;
          display: flex;
          gap: 0;
        }
        .center-col {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 24px 20px;
          min-width: 0;
        }
        .status-label-row {
          margin-bottom: 12px;
          height: 28px;
          display: flex;
          align-items: center;
        }
        .status-badge-text {
          font-size: 0.85rem;
          font-weight: 800;
          letter-spacing: 0.12em;
        }
        .status-badge-text.playing { color: var(--green-light); }
        .status-badge-text.paused  { color: var(--muted); }
        .status-badge { font-size: 0.85rem; }
        .controls {
          display: flex;
          gap: 12px;
          margin-top: 28px;
          flex-wrap: wrap;
          justify-content: center;
        }
        .ctrl-btn {
          padding: 12px 22px;
          border-radius: var(--radius);
          font-size: 0.9rem;
          font-weight: 700;
          border: 2px solid transparent;
          cursor: pointer;
          transition: all 0.15s;
        }
        .ctrl-play {
          background: var(--green);
          color: #fff;
          border-color: var(--green);
        }
        .ctrl-play:hover { background: var(--green-light); }
        .ctrl-pause {
          background: var(--surface);
          color: var(--muted);
          border-color: var(--border);
        }
        .ctrl-pause:hover { color: var(--text); border-color: var(--muted); }
        .ctrl-prev, .ctrl-next {
          background: var(--card);
          color: var(--text);
          border-color: var(--border);
        }
        .ctrl-prev:hover:not(:disabled), .ctrl-next:hover:not(:disabled) {
          border-color: var(--gold);
          color: var(--gold);
        }
        .ctrl-eliminate {
          background: var(--red);
          color: #fff;
          border-color: var(--red);
        }
        .ctrl-eliminate:hover:not(:disabled) { background: var(--red-light); }
        .secondary-controls {
          display: flex;
          gap: 10px;
          margin-top: 16px;
          flex-wrap: wrap;
          justify-content: center;
        }
        .ctrl-sm {
          background: var(--surface);
          color: var(--muted);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 8px 16px;
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
        }
        .ctrl-sm:hover { color: var(--text); border-color: var(--muted); }
        .ctrl-reset { color: var(--red-light) !important; }
        .ctrl-reset:hover { border-color: var(--red) !important; }
        /* Sidebar */
        .sidebar {
          width: 260px;
          flex-shrink: 0;
          background: var(--surface);
          border-left: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          padding: 16px;
          overflow-y: auto;
          max-height: calc(100vh - 60px);
        }
        .sidebar-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }
        .sidebar-title {
          font-weight: 800;
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--muted);
        }
        .quick-add {
          display: flex;
          gap: 6px;
          margin-bottom: 12px;
        }
        .quick-add-input {
          flex: 1;
          padding: 6px 10px;
          font-size: 0.85rem;
        }
        .quick-add-btn {
          background: var(--green);
          color: #fff;
          border: none;
          border-radius: var(--radius);
          padding: 6px 12px;
          font-size: 1rem;
          font-weight: 800;
          cursor: pointer;
        }
        .quick-add-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .player-list { display: flex; flex-direction: column; gap: 4px; }
        .player-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 7px 10px;
          border-radius: var(--radius);
          border: 1px solid var(--border);
          background: var(--card);
          font-size: 0.85rem;
        }
        .active-player { border-color: rgba(22,163,74,0.3); }
        .elim-player { opacity: 0.55; }
        .player-item-info { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; }
        .player-item-seat, .player-item-pos {
          font-size: 0.72rem;
          font-weight: 800;
          color: var(--gold);
          flex-shrink: 0;
        }
        .player-item-name {
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .elim-name { color: var(--muted); text-decoration: line-through; }
        .player-item-meta { display: flex; gap: 4px; flex-shrink: 0; }
        .elim-divider {
          font-size: 0.72rem;
          font-weight: 700;
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          padding: 8px 4px 4px;
        }
        .no-players {
          text-align: center;
          color: var(--muted);
          font-size: 0.85rem;
          padding: 20px 0;
        }
        /* Full screen modal */
        .full-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.85);
          z-index: 1000;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .full-modal-header {
          background: var(--surface);
          border-bottom: 1px solid var(--border);
          padding: 16px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .full-modal-title {
          font-size: 1.2rem;
          font-weight: 800;
          color: var(--gold);
        }
        .full-modal-body {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
        }
        @media (max-width: 768px) {
          .sidebar { display: none; }
          .controls { gap: 8px; }
          .ctrl-btn { padding: 10px 14px; font-size: 0.82rem; }
        }
      `}</style>
    </div>
  );
}

function FullModal({ title, onClose, children }) {
  return (
    <div className="full-modal-overlay">
      <div className="full-modal-header">
        <span className="full-modal-title">{title}</span>
        <button className="btn-ghost btn-sm" onClick={onClose}>✕ Close</button>
      </div>
      <div className="full-modal-body">
        {children}
      </div>
    </div>
  );
}

function EliminateModal({ players, config, structure, tournament, dispatch, onClose }) {
  const [selected, setSelected] = useState(null);
  const [doRebuy, setDoRebuy] = useState(false);

  const finishPos = players.length; // current active count = their finish position
  const canRebuy = (p) =>
    config.rebuyEnabled &&
    p.rebuys < config.maxRebuys &&
    tournament.currentLevel <= config.rebuyLevelLimit;

  const handleEliminate = () => {
    if (!selected) return;
    if (doRebuy) {
      dispatch({ type: 'REBUY_PLAYER', payload: selected });
    } else {
      dispatch({ type: 'ELIMINATE_PLAYER', payload: { playerId: selected, position: finishPos } });
    }
    onClose();
  };

  const selectedPlayer = players.find((p) => p.id === selected);

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: 520 }}>
        <h2>💀 Eliminate Player</h2>
        <p className="text-muted" style={{ fontSize: '0.88rem', marginBottom: 16 }}>
          Select the player who was just eliminated (finishes in position <strong>#{finishPos}</strong>).
        </p>

        <div className="elim-player-list">
          {players.map((p) => (
            <button
              key={p.id}
              className={`elim-player-option ${selected === p.id ? 'selected' : ''}`}
              onClick={() => { setSelected(p.id); setDoRebuy(false); }}
            >
              <span className="elim-seat">Seat {p.seat}</span>
              <span className="elim-pname">{p.name}</span>
              {p.rebuys > 0 && <span className="badge badge-blue" style={{fontSize:'0.7rem'}}>{p.rebuys}R</span>}
            </button>
          ))}
        </div>

        {selected && canRebuy(selectedPlayer) && (
          <div className="rebuy-option">
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={doRebuy}
                onChange={(e) => setDoRebuy(e.target.checked)}
              />
              <span>
                Player rebuys instead (${config.rebuyAmount} · {config.rebuyChips.toLocaleString()} chips)
              </span>
            </label>
          </div>
        )}

        <div className="modal-actions">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button
            className={doRebuy ? 'btn-blue' : 'btn-red'}
            disabled={!selected}
            onClick={handleEliminate}
          >
            {doRebuy ? '🔄 Process Rebuy' : `💀 Eliminate (${finishPos}${finishPos === 1 ? 'st' : finishPos === 2 ? 'nd' : finishPos === 3 ? 'rd' : 'th'} place)`}
          </button>
        </div>
      </div>

      <style>{`
        .elim-player-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
          max-height: 300px;
          overflow-y: auto;
          margin-bottom: 16px;
        }
        .elim-player-option {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          background: var(--card);
          border: 2px solid var(--border);
          border-radius: var(--radius);
          color: var(--text);
          text-align: left;
          cursor: pointer;
          transition: border-color 0.15s;
        }
        .elim-player-option:hover { border-color: var(--muted); }
        .elim-player-option.selected { border-color: var(--red); background: rgba(220,38,38,0.1); }
        .elim-seat { color: var(--muted); font-size: 0.8rem; width: 52px; flex-shrink: 0; }
        .elim-pname { flex: 1; font-weight: 700; }
        .rebuy-option {
          background: rgba(59,130,246,0.1);
          border: 1px solid var(--blue);
          border-radius: var(--radius);
          padding: 12px 16px;
          margin-bottom: 12px;
          font-size: 0.88rem;
        }
      `}</style>
    </div>
  );
}
