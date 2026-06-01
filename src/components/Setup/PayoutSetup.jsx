import React, { useState, useMemo } from 'react';
import { useTournament } from '../../context/TournamentContext';
import {
  calculatePayouts,
  calculateTotalPrizePool,
  formatMoney,
  getAutoPayoutTier,
} from '../../utils/payoutCalculator';

export default function PayoutSetup({ onNext, onPrev }) {
  const { state, dispatch } = useTournament();
  const { payouts, players, config } = state;

  const playerCount = players.length || 9; // preview default
  const prizePool = calculateTotalPrizePool(config, playerCount);
  const autoTier = getAutoPayoutTier(playerCount);

  // Build initial custom split from auto tier or existing custom
  const [customSplit, setCustomSplit] = useState(() => {
    if (payouts.customSplit && payouts.customSplit.length > 0)
      return payouts.customSplit;
    return autoTier.splits || [35, 22, 15, 12, 9, 7];
  });

  const [positions, setPositions] = useState(customSplit.length);
  const mode = payouts.mode;

  const setMode = (m) => dispatch({ type: 'UPDATE_PAYOUTS', payload: { mode: m } });

  const preview = useMemo(() => {
    if (mode === 'auto') {
      return calculatePayouts(prizePool, playerCount);
    } else {
      return calculatePayouts(prizePool, playerCount, customSplit);
    }
  }, [mode, prizePool, playerCount, customSplit]);

  const customTotal = customSplit.reduce((a, b) => a + b, 0);

  const handlePositionChange = (n) => {
    const count = Number(n);
    setPositions(count);
    if (count > customSplit.length) {
      const extras = count - customSplit.length;
      setCustomSplit([...customSplit, ...Array(extras).fill(0)]);
    } else {
      setCustomSplit(customSplit.slice(0, count));
    }
  };

  const handlePctChange = (idx, val) => {
    const next = [...customSplit];
    next[idx] = Number(val);
    setCustomSplit(next);
  };

  const saveCustom = () => {
    dispatch({ type: 'UPDATE_PAYOUTS', payload: { mode: 'custom', customSplit } });
  };

  const ordinal = (n) => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  return (
    <div className="fade-in">
      <h2 className="step-title">Payouts</h2>
      <p className="step-desc text-muted">
        Configure how winnings are distributed among finishing positions.
        {players.length > 0 && ` Prize pool based on ${players.length} players.`}
      </p>

      {prizePool === 0 && (
        <div className="info-box mt-4">
          ℹ️ Buy-in is $0, so no prize pool to distribute. Set a buy-in in Tournament Info.
        </div>
      )}

      {/* Mode toggle */}
      <div className="card mt-4">
        <div className="mode-tabs">
          <button
            className={`mode-tab ${mode === 'auto' ? 'mode-tab-active' : ''}`}
            onClick={() => setMode('auto')}
          >
            Auto (Recommended)
          </button>
          <button
            className={`mode-tab ${mode === 'custom' ? 'mode-tab-active' : ''}`}
            onClick={() => setMode('custom')}
          >
            Custom Split
          </button>
        </div>

        {mode === 'auto' && (
          <div className="mt-4">
            <p className="text-muted" style={{ fontSize: '0.88rem' }}>
              Payouts are calculated automatically based on the number of registered players
              using standard poker tournament payout structures.
            </p>
            {autoTier.positions && (
              <p className="mt-2" style={{ fontSize: '0.88rem' }}>
                With <strong>{playerCount} players</strong>: pays top{' '}
                <strong>{autoTier.positions}</strong> position{autoTier.positions !== 1 ? 's' : ''}.
              </p>
            )}
          </div>
        )}

        {mode === 'custom' && (
          <div className="mt-4">
            <div className="form-row" style={{ maxWidth: 320 }}>
              <div className="form-group">
                <label>Paid Positions</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={positions}
                  onChange={(e) => handlePositionChange(e.target.value)}
                />
              </div>
            </div>

            <div className="custom-split-grid mt-4">
              {customSplit.map((pct, i) => (
                <div key={i} className="form-group">
                  <label>{ordinal(i + 1)} Place (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={pct}
                    onChange={(e) => handlePctChange(i, e.target.value)}
                  />
                </div>
              ))}
            </div>

            <div className="split-sum mt-4" style={{ color: customTotal === 100 ? 'var(--green-light)' : 'var(--red-light)' }}>
              Total: {customTotal}% {customTotal !== 100 && '⚠ Must equal 100%'}
            </div>

            <button
              className="btn-green btn-sm mt-4"
              onClick={saveCustom}
              disabled={customTotal !== 100}
            >
              Apply Custom Split
            </button>
          </div>
        )}
      </div>

      {/* Preview */}
      {prizePool > 0 && (
        <div className="card mt-4">
          <h3 className="section-heading">Payout Preview</h3>
          <p className="text-muted mt-2" style={{ fontSize: '0.82rem' }}>
            Based on {playerCount} player{playerCount !== 1 ? 's' : ''} × {formatMoney(config.buyIn)} buy-in = <strong>{formatMoney(prizePool)}</strong> prize pool
          </p>
          <div className="payout-preview mt-4">
            {preview.map((p) => (
              <div key={p.position} className="payout-row">
                <div className="payout-pos">
                  {p.position === 1 ? '🥇' : p.position === 2 ? '🥈' : p.position === 3 ? '🥉' : `${p.position}th`}
                </div>
                <div className="payout-pct">{p.percentage}%</div>
                <div className="payout-amt">{formatMoney(p.amount)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="step-actions mt-6">
        <button className="btn-ghost" onClick={onPrev}>← Back</button>
        <button className="btn-primary btn-lg" onClick={onNext}>
          Next: Review →
        </button>
      </div>

      <style>{`
        .step-title { font-size: 1.8rem; color: var(--gold); margin-bottom: 4px; }
        .step-desc  { font-size: 0.95rem; }
        .section-heading { font-size: 1rem; font-weight: 700; }
        .info-box {
          background: rgba(59,130,246,0.1);
          border: 1px solid var(--blue);
          border-radius: var(--radius);
          padding: 12px 16px;
          font-size: 0.88rem;
          color: var(--blue-light);
        }
        .mode-tabs {
          display: flex;
          gap: 0;
          border-bottom: 1px solid var(--border);
          padding-bottom: 0;
          margin-bottom: 0;
        }
        .mode-tab {
          padding: 10px 20px;
          background: transparent;
          color: var(--muted);
          border: none;
          border-bottom: 2px solid transparent;
          border-radius: 0;
          font-size: 0.9rem;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.15s;
          margin-bottom: -1px;
        }
        .mode-tab:hover { color: var(--text); }
        .mode-tab-active {
          color: var(--gold) !important;
          border-bottom-color: var(--gold) !important;
        }
        .custom-split-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
          gap: 12px;
        }
        .split-sum { font-size: 0.9rem; font-weight: 700; }
        .payout-preview { display: flex; flex-direction: column; gap: 8px; }
        .payout-row {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 10px 16px;
          background: var(--surface);
          border-radius: var(--radius);
          border: 1px solid var(--border);
        }
        .payout-pos { width: 48px; font-size: 1.1rem; }
        .payout-pct { flex: 1; color: var(--muted); font-size: 0.9rem; }
        .payout-amt { font-weight: 800; color: var(--gold); font-size: 1rem; }
        .step-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }
      `}</style>
    </div>
  );
}
