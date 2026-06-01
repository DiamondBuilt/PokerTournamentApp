import React from 'react';
import { useTournament } from '../../context/TournamentContext';
import {
  calculatePayouts,
  calculateTotalPrizePool,
  formatMoney,
} from '../../utils/payoutCalculator';
import { formatChips } from '../../utils/blindStructures';

function fmtTime(seconds) {
  const m = Math.floor(seconds / 60);
  return `${m} min`;
}

export default function ReviewSetup({ onPrev }) {
  const { state, dispatch } = useTournament();
  const { config, structure, players, payouts } = state;

  const playerCount = players.length;
  const totalEntries = playerCount * config.buyIn;
  const prizePool = calculateTotalPrizePool(config, playerCount);

  const payoutList = prizePool > 0
    ? calculatePayouts(
        prizePool,
        playerCount,
        payouts.mode === 'custom' ? payouts.customSplit : null
      )
    : [];

  const startTournament = () => {
    if (playerCount === 0) {
      // Start with no players - fine, add later
    }
    dispatch({ type: 'START_TOURNAMENT' });
  };

  const goToStep = (step) => dispatch({ type: 'SET_SETUP_STEP', payload: step });

  return (
    <div className="fade-in">
      <h2 className="step-title">Review & Start</h2>
      <p className="step-desc text-muted">
        Review your tournament settings before starting.
      </p>

      {/* Tournament Info */}
      <div className="review-section card mt-4">
        <div className="review-header">
          <h3 className="review-title">Tournament Info</h3>
          <button className="btn-ghost btn-sm" onClick={() => goToStep(0)}>Edit</button>
        </div>
        <div className="review-grid">
          <ReviewRow label="Name" value={config.name} />
          <ReviewRow label="Date" value={config.date} />
          <ReviewRow label="Buy-in" value={formatMoney(config.buyIn)} />
          {config.rebuyEnabled && (
            <>
              <ReviewRow label="Rebuys" value={`${formatMoney(config.rebuyAmount)} / ${formatChips(config.rebuyChips)} chips (max ${config.maxRebuys}, until level ${config.rebuyLevelLimit})`} />
            </>
          )}
          {config.addOnEnabled && (
            <ReviewRow label="Add-on" value={`${formatMoney(config.addOnAmount)} / ${formatChips(config.addOnChips)} chips at level ${config.addOnLevel} break`} />
          )}
        </div>
      </div>

      {/* Players */}
      <div className="review-section card mt-4">
        <div className="review-header">
          <h3 className="review-title">Players</h3>
          <button className="btn-ghost btn-sm" onClick={() => goToStep(1)}>Edit</button>
        </div>
        {playerCount === 0 ? (
          <p className="text-muted" style={{ fontSize: '0.88rem' }}>
            No players added yet — you can add them after starting.
          </p>
        ) : (
          <>
            <p style={{ marginBottom: 12 }}>
              <strong className="text-gold">{playerCount}</strong> players registered
              {prizePool > 0 && (
                <span className="text-muted"> · Prize pool: <strong className="text-gold">{formatMoney(prizePool)}</strong></span>
              )}
            </p>
            <div className="player-chips">
              {players.map((p) => (
                <span key={p.id} className="player-chip">
                  <span style={{ color: 'var(--gold)', fontSize: '0.75rem' }}>♠ Seat {p.seat}</span>{' '}
                  {p.name}
                </span>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Blind Structure */}
      <div className="review-section card mt-4">
        <div className="review-header">
          <h3 className="review-title">Blind Structure</h3>
          <button className="btn-ghost btn-sm" onClick={() => goToStep(2)}>Edit</button>
        </div>
        <div className="review-grid">
          <ReviewRow label="Template" value={structure.levels.length > 0 ? structure.template : '—'} />
          <ReviewRow label="Starting Chips" value={formatChips(structure.startingChips)} />
          <ReviewRow label="Level Duration" value={fmtTime(structure.levelDuration)} />
          <ReviewRow label="Break Duration" value={fmtTime(structure.breakDuration)} />
          <ReviewRow label="Total Levels" value={structure.levels.length} />
          <ReviewRow label="Breaks After Levels" value={structure.breakLevels?.join(', ') || 'None'} />
        </div>
      </div>

      {/* Payouts */}
      {prizePool > 0 && payoutList.length > 0 && (
        <div className="review-section card mt-4">
          <div className="review-header">
            <h3 className="review-title">Payouts ({payouts.mode})</h3>
            <button className="btn-ghost btn-sm" onClick={() => goToStep(3)}>Edit</button>
          </div>
          <div className="payout-compact">
            {payoutList.map((p) => (
              <div key={p.position} className="payout-compact-row">
                <span className="payout-compact-pos">
                  {p.position === 1 ? '🥇' : p.position === 2 ? '🥈' : p.position === 3 ? '🥉' : `${p.position}th`}
                </span>
                <span className="payout-compact-pct">{p.percentage}%</span>
                <span className="payout-compact-amt">{formatMoney(p.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Start button */}
      <div className="start-section mt-6">
        {playerCount === 0 && (
          <div className="warn-box mb-4">
            ⚠️ No players added. You can still start and add players during the tournament.
          </div>
        )}
        <div className="step-actions">
          <button className="btn-ghost" onClick={onPrev}>← Back</button>
          <button className="btn-green btn-lg start-btn" onClick={startTournament}>
            🃏 Start Tournament
          </button>
        </div>
      </div>

      <style>{`
        .step-title { font-size: 1.8rem; color: var(--gold); margin-bottom: 4px; }
        .step-desc  { font-size: 0.95rem; }
        .review-section {}
        .review-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        .review-title { font-size: 1rem; font-weight: 700; }
        .review-grid {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .review-row {
          display: flex;
          gap: 12px;
          font-size: 0.9rem;
          padding: 4px 0;
          border-bottom: 1px solid rgba(55,65,81,0.4);
        }
        .review-row:last-child { border-bottom: none; }
        .review-label {
          width: 160px;
          flex-shrink: 0;
          color: var(--muted);
          font-size: 0.82rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .review-value { font-weight: 600; }
        .player-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .player-chip {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 4px 10px;
          font-size: 0.82rem;
          font-weight: 600;
          display: flex;
          flex-direction: column;
          gap: 1px;
        }
        .payout-compact {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        .payout-compact-row {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--surface);
          border-radius: var(--radius);
          padding: 6px 14px;
          border: 1px solid var(--border);
        }
        .payout-compact-pos { font-size: 1.1rem; }
        .payout-compact-pct { color: var(--muted); font-size: 0.82rem; }
        .payout-compact-amt { font-weight: 800; color: var(--gold); }
        .warn-box {
          background: rgba(245,158,11,0.1);
          border: 1px solid var(--gold);
          border-radius: var(--radius);
          padding: 12px 16px;
          font-size: 0.88rem;
          color: var(--gold);
        }
        .start-section {}
        .step-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }
        .start-btn {
          font-size: 1.2rem;
          padding: 16px 40px;
        }
      `}</style>
    </div>
  );
}

function ReviewRow({ label, value }) {
  return (
    <div className="review-row">
      <span className="review-label">{label}</span>
      <span className="review-value">{value}</span>
    </div>
  );
}
