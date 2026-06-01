import React from 'react';
import { useTournament } from '../../context/TournamentContext';
import { formatChips } from '../../utils/blindStructures';
import { calculateTotalPrizePool, formatMoney } from '../../utils/payoutCalculator';

export default function StatsBar() {
  const { state } = useTournament();
  const { players, config, structure, tournament } = state;

  const activePlayers = players.filter((p) => p.status === 'active');
  const totalPlayers = players.length;
  const totalEntries = totalPlayers + players.reduce((sum, p) => sum + p.rebuys, 0);
  const totalRebuys = players.reduce((sum, p) => sum + p.rebuys, 0);
  const totalAddOns = players.reduce((sum, p) => sum + p.addOns, 0);

  // Prize pool: entries + rebuys + add-ons
  const prizePool =
    totalPlayers * config.buyIn +
    totalRebuys * config.rebuyAmount +
    totalAddOns * config.addOnAmount;

  // Average and chip leader stats (conceptual — no chip tracking, just format)
  const totalChipsInPlay =
    totalPlayers * structure.startingChips +
    totalRebuys * config.rebuyChips +
    totalAddOns * config.addOnChips;

  const avgStack = activePlayers.length > 0
    ? Math.round(totalChipsInPlay / activePlayers.length)
    : 0;

  const stats = [
    { label: 'Players', value: `${activePlayers.length} / ${totalPlayers}`, sub: 'active / total' },
    { label: 'Avg Stack', value: formatChips(avgStack), sub: 'chips' },
    { label: 'Prize Pool', value: prizePool > 0 ? formatMoney(prizePool) : '—', sub: 'total' },
    totalRebuys > 0 && { label: 'Rebuys', value: totalRebuys, sub: 'total' },
  ].filter(Boolean);

  return (
    <div className="stats-bar">
      <div className="stats-bar-left">
        <span className="tournament-name">{config.name}</span>
        <span className="tournament-date text-muted">{config.date}</span>
      </div>
      <div className="stats-bar-stats">
        {stats.map((s, i) => (
          <div key={i} className="stat-item">
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>
      <style>{`
        .stats-bar {
          background: var(--surface);
          border-bottom: 1px solid var(--border);
          padding: 10px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-shrink: 0;
        }
        .stats-bar-left {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }
        .tournament-name {
          font-size: 1rem;
          font-weight: 800;
          color: var(--gold);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .tournament-date {
          font-size: 0.75rem;
        }
        .stats-bar-stats {
          display: flex;
          gap: 24px;
          align-items: center;
          flex-shrink: 0;
        }
        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1px;
        }
        .stat-value {
          font-size: 1.05rem;
          font-weight: 800;
          color: var(--text);
          line-height: 1;
        }
        .stat-label {
          font-size: 0.7rem;
          font-weight: 700;
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        @media (max-width: 640px) {
          .stats-bar-stats { gap: 12px; }
          .stat-value { font-size: 0.88rem; }
        }
      `}</style>
    </div>
  );
}
