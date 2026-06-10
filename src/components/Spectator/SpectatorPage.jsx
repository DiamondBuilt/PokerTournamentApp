import React, { useEffect, useState } from 'react';
import { useData } from '../../context/DataContext';
import { useLiveQuery } from '../../hooks/useLiveQuery';
import { computeStandings } from '../../data/services/standingsService';
import { formatChips } from '../../utils/blindStructures';
import { formatMoney } from '../../utils/payoutCalculator';

const STORAGE_KEY = 'pokerTournamentState';
const MEDALS = ['🥇', '🥈', '🥉'];

function readState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

const fmt = (secs) => {
  const m = Math.floor((secs || 0) / 60);
  const s = (secs || 0) % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
};

/**
 * Read-only spectator display, designed for a TV, projector, or a second
 * tab/window. It never dispatches — it reads the director's live tournament
 * state straight from localStorage. The director tab persists on every timer
 * tick, and `storage` events fire across tabs, so this view updates within a
 * second of the real clock without any server. (A 1s poll covers the
 * same-tab case, where storage events don't fire.)
 */
export default function SpectatorPage() {
  const [t, setT] = useState(readState);
  const { settings } = useData();

  useEffect(() => {
    const sync = () => setT(readState());
    window.addEventListener('storage', sync);
    const iv = setInterval(sync, 1000);
    return () => {
      window.removeEventListener('storage', sync);
      clearInterval(iv);
    };
  }, []);

  const activeSeasonId = settings?.activeSeasonId || null;
  const seasonData = useLiveQuery(
    () => (activeSeasonId ? computeStandings(activeSeasonId) : Promise.resolve(null)),
    [activeSeasonId],
    undefined
  );

  const tournament = t?.tournament;
  const running = tournament && tournament.phase !== 'setup';
  const isBreak = tournament?.status === 'break';
  const level = running ? t.structure.levels[tournament.currentLevel - 1] : null;
  const nextLevel = running ? t.structure.levels[tournament.currentLevel] : null;
  const players = t?.players || [];
  const active = players.filter((p) => p.status === 'active').sort((a, b) => (a.seat || 0) - (b.seat || 0));
  const out = players
    .filter((p) => p.status === 'eliminated')
    .sort((a, b) => (a.finishPosition || 99) - (b.finishPosition || 99));

  const totalChips =
    running &&
    players.reduce(
      (sum, p) =>
        sum + t.structure.startingChips + (p.rebuys || 0) * (t.config.rebuyChips || 0) + (p.addOns || 0) * (t.config.addOnChips || 0),
      0
    );
  const avgStack = active.length > 0 ? Math.round(totalChips / active.length) : 0;

  return (
    <div className="spec">
      {running ? (
        <>
          <header className="spec-head">
            <h1 className="spec-name">{t.config.name}</h1>
            <span className={`spec-status ${tournament.status}`}>
              {tournament.phase === 'complete' ? 'FINISHED' : isBreak ? 'ON BREAK' : tournament.status.toUpperCase()}
            </span>
          </header>

          <div className="spec-main">
            <div className="spec-clock-zone">
              <div className="spec-level-label">
                {isBreak ? 'Break ends in' : `Level ${tournament.currentLevel}`}
              </div>
              <div className={`spec-clock${isBreak ? ' break' : ''}`}>
                {fmt(isBreak ? tournament.breakTimeRemaining : tournament.timeRemaining)}
              </div>
              {level && (
                <div className="spec-blinds">
                  {formatChips(level.sb)} / {formatChips(level.bb)}
                  {level.ante > 0 && <span className="spec-ante"> ante {formatChips(level.ante)}</span>}
                </div>
              )}
              {nextLevel && (
                <div className="spec-next text-muted">
                  Next: {formatChips(nextLevel.sb)} / {formatChips(nextLevel.bb)}
                  {nextLevel.ante > 0 && ` (${formatChips(nextLevel.ante)})`}
                </div>
              )}
              <div className="spec-meta">
                <span>{active.length} players left</span>
                {avgStack > 0 && <span>avg stack {formatChips(avgStack)}</span>}
              </div>
            </div>

            <div className="spec-players">
              <h2 className="spec-sub">Players</h2>
              <div className="spec-player-list">
                {active.map((p) => (
                  <div key={p.id} className="spec-player">
                    <span className="spec-player-seat">#{p.seat}</span>
                    <span className="spec-player-name">{p.name}</span>
                    {p.rebuys > 0 && <span className="spec-tag">{p.rebuys}R</span>}
                  </div>
                ))}
                {out.map((p) => (
                  <div key={p.id} className="spec-player out">
                    <span className="spec-player-seat">{p.finishPosition ? `${p.finishPosition}th` : '—'}</span>
                    <span className="spec-player-name">{p.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="spec-idle">
          <h1 className="spec-name">♠ Poker Director</h1>
          <p className="text-muted">No tournament running right now.</p>
        </div>
      )}

      {seasonData?.standings?.length > 0 && (
        <footer className="spec-season">
          <span className="spec-season-name">🏆 {seasonData.season.name}</span>
          {seasonData.standings.slice(0, 3).map((s, i) => (
            <span key={s.persistentId} className="spec-season-spot">
              {MEDALS[i]} {s.name} <strong>{s.points}</strong>
            </span>
          ))}
        </footer>
      )}

      <style>{`
        .spec {
          min-height: 100vh; min-height: 100dvh;
          display: flex; flex-direction: column;
          padding: 24px clamp(16px, 4vw, 48px);
          background: var(--bg);
        }
        .spec-head { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
        .spec-name { color: var(--gold); font-size: clamp(1.4rem, 3.5vw, 2.4rem); }
        .spec-status {
          font-weight: 900; letter-spacing: 0.1em; font-size: clamp(0.7rem, 1.5vw, 1rem);
          padding: 6px 14px; border-radius: 6px; border: 1px solid var(--border); color: var(--muted);
        }
        .spec-status.playing { color: var(--green-light); border-color: var(--green); }
        .spec-status.break { color: var(--blue-light); border-color: var(--blue); }
        .spec-main {
          flex: 1; display: grid; grid-template-columns: 1.4fr 1fr;
          gap: clamp(16px, 3vw, 48px); align-items: center; padding: 24px 0;
        }
        .spec-clock-zone { text-align: center; }
        .spec-level-label {
          font-size: clamp(1rem, 2.5vw, 1.6rem); text-transform: uppercase;
          letter-spacing: 0.12em; color: var(--muted); font-weight: 700;
        }
        .spec-clock {
          font-size: clamp(4rem, 16vw, 13rem); font-weight: 900; line-height: 1.05;
          font-variant-numeric: tabular-nums; color: var(--text);
        }
        .spec-clock.break { color: var(--blue-light); }
        .spec-blinds { font-size: clamp(1.6rem, 5vw, 3.4rem); font-weight: 900; color: var(--gold); }
        .spec-ante { font-size: 0.55em; color: var(--muted); font-weight: 700; }
        .spec-next { font-size: clamp(0.9rem, 2vw, 1.3rem); margin-top: 6px; }
        .spec-meta {
          display: flex; justify-content: center; gap: 24px; margin-top: 14px;
          font-size: clamp(0.85rem, 1.8vw, 1.15rem); color: var(--muted); font-weight: 600;
        }
        .spec-sub {
          font-size: clamp(0.85rem, 1.6vw, 1.1rem); text-transform: uppercase;
          letter-spacing: 0.1em; color: var(--gold); margin-bottom: 10px;
        }
        .spec-player-list { display: flex; flex-direction: column; gap: 6px; max-height: 60vh; overflow-y: auto; }
        .spec-player {
          display: flex; align-items: center; gap: 12px;
          background: var(--surface); border: 1px solid var(--border);
          border-radius: var(--radius); padding: 8px 14px;
          font-size: clamp(0.9rem, 1.8vw, 1.2rem);
        }
        .spec-player.out { opacity: 0.45; }
        .spec-player.out .spec-player-name { text-decoration: line-through; }
        .spec-player-seat { font-weight: 800; color: var(--gold); min-width: 44px; font-size: 0.85em; }
        .spec-player-name { flex: 1; font-weight: 700; }
        .spec-tag { font-size: 0.7em; font-weight: 800; color: var(--blue-light); }
        .spec-idle { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; }
        .spec-season {
          display: flex; align-items: center; gap: clamp(12px, 3vw, 32px); flex-wrap: wrap;
          border-top: 1px solid var(--border); padding-top: 16px;
          font-size: clamp(0.85rem, 1.8vw, 1.2rem);
        }
        .spec-season-name { color: var(--gold); font-weight: 800; }
        .spec-season-spot strong { color: var(--gold); }
        @media (max-width: 720px) {
          .spec-main { grid-template-columns: 1fr; }
          .spec-player-list { max-height: 38vh; }
        }
      `}</style>
    </div>
  );
}
