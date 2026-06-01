import React from 'react';
import { useTournament } from '../../context/TournamentContext';
import {
  calculatePayouts,
  calculateTotalPrizePool,
  formatMoney,
} from '../../utils/payoutCalculator';

export default function PayoutView() {
  const { state } = useTournament();
  const { players, config, payouts } = state;

  const totalPlayers = players.length;
  const totalRebuys = players.reduce((sum, p) => sum + p.rebuys, 0);
  const totalAddOns = players.reduce((sum, p) => sum + p.addOns, 0);

  const entryTotal  = totalPlayers * config.buyIn;
  const rebuyTotal  = totalRebuys  * config.rebuyAmount;
  const addOnTotal  = totalAddOns  * config.addOnAmount;
  const prizePool   = entryTotal + rebuyTotal + addOnTotal;

  const payoutList = prizePool > 0
    ? calculatePayouts(
        prizePool,
        totalPlayers,
        payouts.mode === 'custom' ? payouts.customSplit : null
      )
    : [];

  // Map eliminated players to positions
  const eliminatedMap = {};
  players.filter((p) => p.finishPosition).forEach((p) => {
    eliminatedMap[p.finishPosition] = p.name;
  });

  return (
    <div className="payout-view">
      {/* Prize pool breakdown */}
      <div className="card mb-4">
        <h3 className="pv-title">Prize Pool Breakdown</h3>
        <div className="pv-breakdown mt-4">
          <div className="pv-row">
            <span>Buy-ins ({totalPlayers} × {formatMoney(config.buyIn)})</span>
            <span className="pv-amount">{formatMoney(entryTotal)}</span>
          </div>
          {totalRebuys > 0 && (
            <div className="pv-row">
              <span>Rebuys ({totalRebuys} × {formatMoney(config.rebuyAmount)})</span>
              <span className="pv-amount">{formatMoney(rebuyTotal)}</span>
            </div>
          )}
          {totalAddOns > 0 && (
            <div className="pv-row">
              <span>Add-ons ({totalAddOns} × {formatMoney(config.addOnAmount)})</span>
              <span className="pv-amount">{formatMoney(addOnTotal)}</span>
            </div>
          )}
          <div className="pv-row pv-total">
            <span>Total Prize Pool</span>
            <span className="pv-amount text-gold">{formatMoney(prizePool)}</span>
          </div>
        </div>
      </div>

      {/* Payouts by position */}
      {payoutList.length > 0 ? (
        <div className="card">
          <h3 className="pv-title">Payouts</h3>
          <div className="pv-payouts mt-4">
            {payoutList.map((p) => {
              const playerName = eliminatedMap[p.position];
              return (
                <div key={p.position} className={`pv-payout-row ${p.position <= 3 ? 'top3' : ''}`}>
                  <div className="pv-payout-pos">
                    {p.position === 1 ? '🥇' : p.position === 2 ? '🥈' : p.position === 3 ? '🥉' : (
                      <span className="pv-pos-num">{p.position}</span>
                    )}
                  </div>
                  <div className="pv-payout-player">
                    {playerName ? (
                      <span className="pv-pname">{playerName}</span>
                    ) : (
                      <span className="text-muted" style={{ fontStyle: 'italic' }}>
                        TBD
                      </span>
                    )}
                  </div>
                  <div className="pv-pct">{p.percentage}%</div>
                  <div className="pv-payout-amount">{formatMoney(p.amount)}</div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="card">
          <p className="text-muted text-center" style={{ padding: '24px 0' }}>
            {prizePool === 0
              ? 'No prize pool (buy-in is $0).'
              : 'No payout data available.'}
          </p>
        </div>
      )}

      <style>{`
        .payout-view {}
        .pv-title { font-size: 1rem; font-weight: 700; }
        .pv-breakdown { display: flex; flex-direction: column; gap: 8px; }
        .pv-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          font-size: 0.9rem;
          border-bottom: 1px solid rgba(55,65,81,0.4);
        }
        .pv-row:last-child { border-bottom: none; }
        .pv-amount { font-weight: 700; }
        .pv-total {
          font-weight: 800;
          font-size: 1rem;
          margin-top: 4px;
          padding-top: 12px;
          border-top: 2px solid var(--border) !important;
          border-bottom: none !important;
        }
        .pv-payouts { display: flex; flex-direction: column; gap: 6px; }
        .pv-payout-row {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 12px 16px;
          background: var(--surface);
          border-radius: var(--radius);
          border: 1px solid var(--border);
          font-size: 0.9rem;
        }
        .pv-payout-row.top3 {
          border-color: rgba(245,158,11,0.3);
          background: rgba(245,158,11,0.05);
        }
        .pv-payout-pos { font-size: 1.4rem; width: 36px; flex-shrink: 0; text-align: center; }
        .pv-pos-num {
          font-size: 0.9rem;
          font-weight: 800;
          color: var(--muted);
        }
        .pv-payout-player { flex: 1; min-width: 0; }
        .pv-pname { font-weight: 700; }
        .pv-pct { color: var(--muted); font-size: 0.85rem; width: 48px; text-align: right; }
        .pv-payout-amount {
          font-weight: 900;
          font-size: 1.1rem;
          color: var(--gold);
          min-width: 80px;
          text-align: right;
        }
      `}</style>
    </div>
  );
}
