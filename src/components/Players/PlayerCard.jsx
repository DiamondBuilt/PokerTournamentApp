import React from 'react';
import { formatMoney } from '../../utils/payoutCalculator';

export default function PlayerCard({ player, onClick }) {
  const stats = player.stats || {};
  const net = stats.netProfit || 0;
  return (
    <button className="player-card card" onClick={onClick}>
      <div className="player-card-top">
        <div className="player-card-avatar">{(player.name || '?').charAt(0).toUpperCase()}</div>
        <div className="player-card-id">
          <div className="player-card-name">{player.name}</div>
          {player.nickname && <div className="player-card-nick text-muted">"{player.nickname}"</div>}
        </div>
      </div>
      <div className="player-card-stats">
        <span>{stats.tournamentsPlayed || 0} events</span>
        <span>{stats.firstPlaces || 0} wins</span>
        <span className={net >= 0 ? 'text-green' : 'text-red'}>
          {net >= 0 ? '+' : ''}{formatMoney(net)}
        </span>
      </div>

      <style>{`
        .player-card {
          text-align: left;
          display: flex;
          flex-direction: column;
          gap: 12px;
          background: var(--card);
          border: 1px solid var(--border);
          width: 100%;
        }
        .player-card:hover { border-color: var(--gold); }
        .player-card-top { display: flex; align-items: center; gap: 12px; }
        .player-card-avatar {
          width: 44px; height: 44px; border-radius: 50%;
          background: var(--surface); border: 1px solid var(--border);
          display: flex; align-items: center; justify-content: center;
          font-weight: 900; color: var(--gold); font-size: 1.2rem; flex-shrink: 0;
        }
        .player-card-name { font-weight: 800; font-size: 1rem; }
        .player-card-nick { font-size: 0.8rem; }
        .player-card-stats {
          display: flex; justify-content: space-between; gap: 8px;
          font-size: 0.82rem; font-weight: 600; color: var(--muted);
        }
        .text-green { color: var(--green-light); }
        .text-red { color: var(--red-light); }
      `}</style>
    </button>
  );
}
