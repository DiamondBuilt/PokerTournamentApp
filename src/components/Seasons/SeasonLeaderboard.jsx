import React from 'react';
import { formatMoney } from '../../utils/payoutCalculator';

const MEDALS = ['🥇', '🥈', '🥉'];

/**
 * Season standings: a podium for the top 3, a table for everyone else.
 * Rows inside the finale-qualifier cutoff are flagged.
 */
export default function SeasonLeaderboard({ standings, rules, totalEvents, compact = false }) {
  if (!standings || standings.length === 0) {
    return (
      <p className="text-muted" style={{ fontSize: '0.9rem', padding: '8px 0' }}>
        No events scored yet — finish a tournament while this season is active
        and the leaderboard fills in automatically.
      </p>
    );
  }

  const podium = standings.slice(0, 3);
  const rest = compact ? [] : standings.slice(3);
  // Podium renders 2nd, 1st, 3rd left-to-right so the leader sits center.
  const podiumOrder = [podium[1], podium[0], podium[2]].filter(Boolean);

  return (
    <div className="lb-wrap">
      <div className="lb-podium">
        {podiumOrder.map((s) => {
          const rank = standings.indexOf(s) + 1;
          return (
            <div key={s.persistentId} className={`lb-podium-spot rank-${rank}`}>
              <div className="lb-podium-medal">{MEDALS[rank - 1]}</div>
              <div className="lb-podium-name">{s.name}</div>
              <div className="lb-podium-points">{s.points}</div>
              <div className="lb-podium-label">pts</div>
            </div>
          );
        })}
      </div>

      {rest.length > 0 && (
        <div className="lb-rows">
          {rest.map((s, i) => {
            const rank = i + 4;
            const qualifies = rank <= (rules?.finaleQualifiers || 0);
            return (
              <div key={s.persistentId} className={`lb-row${qualifies ? ' qualifies' : ''}`}>
                <span className="lb-rank">{rank}</span>
                <span className="lb-name">
                  {s.name}
                  {qualifies && <span className="lb-q-badge" title="Qualifies for season finale">★</span>}
                </span>
                <span className="lb-meta text-muted">
                  {s.eventsPlayed}/{totalEvents} played
                  {s.wins > 0 && ` · ${s.wins}W`}
                </span>
                <span className={`lb-net ${s.netProfit >= 0 ? 'text-green' : 'text-red'}`}>
                  {s.netProfit >= 0 ? '+' : ''}{formatMoney(s.netProfit)}
                </span>
                <span className="lb-points">{s.points}</span>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        .lb-wrap { display: flex; flex-direction: column; gap: 16px; }
        .lb-podium {
          display: flex; justify-content: center; align-items: flex-end; gap: 12px;
        }
        .lb-podium-spot {
          flex: 1; max-width: 180px; text-align: center;
          background: var(--surface); border: 1px solid var(--border);
          border-radius: var(--radius-lg); padding: 16px 10px;
        }
        .lb-podium-spot.rank-1 {
          border-color: var(--gold); padding: 24px 10px;
          background: linear-gradient(135deg, rgba(245,158,11,0.12), rgba(245,158,11,0.03));
          box-shadow: 0 0 24px rgba(245,158,11,0.15);
        }
        .lb-podium-spot.rank-2 { border-color: #9ca3af; }
        .lb-podium-spot.rank-3 { border-color: #d97706; }
        .lb-podium-medal { font-size: 1.8rem; line-height: 1; margin-bottom: 6px; }
        .lb-podium-name { font-weight: 800; font-size: 0.95rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .lb-podium-points { font-weight: 900; font-size: 1.5rem; color: var(--gold); }
        .lb-podium-label { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted); }
        .lb-rows { display: flex; flex-direction: column; gap: 6px; }
        .lb-row {
          display: flex; align-items: center; gap: 12px;
          background: var(--surface); border: 1px solid var(--border);
          border-radius: var(--radius); padding: 10px 14px; font-size: 0.9rem;
        }
        .lb-row.qualifies { border-color: var(--gold-dark); }
        .lb-rank { font-weight: 800; color: var(--muted); min-width: 24px; text-align: right; }
        .lb-name { flex: 1; font-weight: 700; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .lb-q-badge { color: var(--gold); margin-left: 6px; font-size: 0.8rem; }
        .lb-meta { font-size: 0.78rem; white-space: nowrap; }
        .lb-net { min-width: 64px; text-align: right; font-weight: 700; font-size: 0.82rem; }
        .lb-points { min-width: 48px; text-align: right; font-weight: 900; color: var(--gold); font-size: 1rem; }
        .text-green { color: var(--green-light); }
        .text-red { color: var(--red-light); }
        @media (max-width: 480px) {
          .lb-meta, .lb-net { display: none; }
        }
      `}</style>
    </div>
  );
}
