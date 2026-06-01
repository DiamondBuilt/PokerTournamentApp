import React, { useState, useMemo } from 'react';
import { useTournament } from '../../context/TournamentContext';
import {
  CHIP_PRESETS,
  recommendDistribution,
  totalChipsNeeded,
  getCoverageNote,
} from '../../utils/chipCalculator';
import { formatChips } from '../../utils/blindStructures';

export default function ChipSetup({ onNext, onPrev }) {
  const { state, dispatch } = useTournament();
  const { chipConfig, structure, players, config } = state;

  const [customInput, setCustomInput] = useState('');
  const [inputError, setInputError] = useState('');

  const denoms = chipConfig.denominations;

  const setDenoms = (newDenoms) => {
    dispatch({ type: 'UPDATE_CHIP_CONFIG', payload: { denominations: newDenoms } });
  };

  const applyPreset = (preset) => {
    setDenoms([...preset.denominations]);
    setInputError('');
  };

  const addDenom = () => {
    const val = parseInt(customInput, 10);
    if (!val || val <= 0) {
      setInputError('Enter a positive number.');
      return;
    }
    if (denoms.includes(val)) {
      setInputError(`${val} is already in the list.`);
      return;
    }
    setDenoms([...denoms, val].sort((a, b) => a - b));
    setCustomInput('');
    setInputError('');
  };

  const removeDenom = (d) => {
    setDenoms(denoms.filter((x) => x !== d));
  };

  const handleCustomKey = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); addDenom(); }
  };

  const distribution = useMemo(
    () => recommendDistribution(structure.startingChips, denoms),
    [structure.startingChips, denoms]
  );

  const playerCount = Math.max(players.length, 1);
  const rebuyBuffer = config.rebuyEnabled ? Math.ceil(playerCount * 0.5) : 0;
  const totals = useMemo(
    () => totalChipsNeeded(distribution, playerCount, rebuyBuffer),
    [distribution, playerCount, rebuyBuffer]
  );

  const perPlayerTotal = distribution.reduce((s, r) => s + r.subtotal, 0);
  const coverageNote = getCoverageNote(distribution, structure.levels);

  const activePreset = CHIP_PRESETS.findIndex(
    (p) =>
      p.denominations.length === denoms.length &&
      p.denominations.every((d, i) => d === [...denoms].sort((a, b) => a - b)[i])
  );

  return (
    <div className="fade-in">
      <h2 className="step-title">Chip Setup</h2>
      <p className="step-desc text-muted">
        Optional — tell us which chip denominations you have and we'll recommend a per-player distribution
        for your {formatChips(structure.startingChips)}-chip starting stack.
      </p>

      {/* Preset selector */}
      <div className="card mt-4">
        <h3 className="section-heading">Chip Presets</h3>
        <div className="preset-row mt-4">
          {CHIP_PRESETS.map((preset, i) => (
            <button
              key={i}
              className={`preset-btn ${activePreset === i ? 'preset-active' : ''}`}
              onClick={() => applyPreset(preset)}
            >
              <div className="preset-name">{preset.name}</div>
              <div className="preset-denoms">{preset.denominations.join(', ')}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Denomination manager */}
      <div className="card mt-4">
        <h3 className="section-heading">Your Chip Denominations</h3>
        <div className="denom-tags mt-4">
          {denoms.length === 0 && (
            <span className="text-muted" style={{ fontSize: '0.88rem' }}>No denominations added.</span>
          )}
          {denoms.map((d) => (
            <span key={d} className="denom-tag">
              {d.toLocaleString()}
              <button
                className="denom-remove"
                onClick={() => removeDenom(d)}
                title={`Remove ${d}`}
                aria-label={`Remove ${d}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="denom-add-row mt-4">
          <input
            type="number"
            min="1"
            placeholder="Add denomination…"
            value={customInput}
            onChange={(e) => { setCustomInput(e.target.value); setInputError(''); }}
            onKeyDown={handleCustomKey}
            className="denom-input"
          />
          <button className="btn-primary btn-sm denom-add-btn" onClick={addDenom}>
            Add
          </button>
        </div>
        {inputError && <p className="input-error mt-2">{inputError}</p>}
      </div>

      {/* Distribution table */}
      {distribution.length > 0 && (
        <div className="card mt-4">
          <h3 className="section-heading">
            Recommended Distribution
            <span className="section-sub"> — {formatChips(structure.startingChips)} chips per player</span>
          </h3>

          {coverageNote && (
            <div className={`coverage-note mt-4 coverage-${coverageNote.type}`}>
              {coverageNote.type === 'warning' ? '⚠️' : '✓'} {coverageNote.text}
            </div>
          )}

          <div className="dist-table-wrap mt-4">
            <table className="dist-table">
              <thead>
                <tr>
                  <th>Chip</th>
                  <th className="text-right">Per Player</th>
                  <th className="text-right">Subtotal</th>
                  <th className="text-right">
                    Total Needed
                    {rebuyBuffer > 0 && <span className="th-sub"> (+{rebuyBuffer} rebuy)</span>}
                  </th>
                </tr>
              </thead>
              <tbody>
                {distribution.map((row, i) => {
                  const tot = totals[i];
                  return (
                    <tr key={row.denomination}>
                      <td className="denom-cell">{row.denomination.toLocaleString()}</td>
                      <td className="text-right">{row.count}</td>
                      <td className="text-right text-gold">{row.subtotal.toLocaleString()}</td>
                      <td className="text-right">{tot.totalCount.toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="dist-total-row">
                  <td colSpan={2} className="dist-total-label">Total per player</td>
                  <td className={`text-right dist-total-val ${Math.abs(perPlayerTotal - structure.startingChips) > 5 ? 'text-red' : 'text-green'}`}>
                    {perPlayerTotal.toLocaleString()}
                  </td>
                  <td></td>
                </tr>
                {Math.abs(perPlayerTotal - structure.startingChips) > 5 && (
                  <tr>
                    <td colSpan={4} className="dist-approx-note">
                      Approximate distribution — adjust chip counts to reach exactly {structure.startingChips.toLocaleString()}.
                    </td>
                  </tr>
                )}
              </tfoot>
            </table>
          </div>

          <div className="dist-summary mt-4">
            <span className="text-muted" style={{ fontSize: '0.82rem' }}>
              Based on {players.length || 1} player{players.length !== 1 ? 's' : ''}
              {rebuyBuffer > 0 ? ` + ${rebuyBuffer} rebuy stacks` : ''}.
              Adjust counts as needed for your actual chip set.
            </span>
          </div>
        </div>
      )}

      {denoms.length > 0 && distribution.length === 0 && (
        <div className="card mt-4 text-muted" style={{ fontSize: '0.88rem', textAlign: 'center', padding: '24px' }}>
          No denominations are ≤ {formatChips(Math.floor(structure.startingChips / 4))} (¼ of starting stack).
          Add smaller denominations to get a recommendation.
        </div>
      )}

      <div className="step-actions mt-6">
        <button className="btn-ghost" onClick={onPrev}>← Back</button>
        <button className="btn-ghost" onClick={onNext}>Skip</button>
        <button className="btn-primary btn-lg" onClick={onNext}>
          Next: Payouts →
        </button>
      </div>

      <style>{`
        .step-title { font-size: 1.8rem; color: var(--gold); margin-bottom: 4px; }
        .step-desc  { font-size: 0.95rem; }
        .section-heading { font-size: 1rem; font-weight: 700; }
        .section-sub { font-size: 0.8rem; font-weight: 400; color: var(--muted); }

        .preset-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 10px;
        }
        .preset-btn {
          background: var(--card);
          border: 2px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 12px 14px;
          text-align: left;
          cursor: pointer;
          color: var(--text);
          transition: border-color 0.15s;
          min-height: 44px;
        }
        .preset-btn:hover { border-color: var(--muted); }
        .preset-active { border-color: var(--gold) !important; background: rgba(245,158,11,0.08) !important; }
        .preset-name { font-size: 0.88rem; font-weight: 700; color: var(--gold); margin-bottom: 4px; }
        .preset-denoms { font-size: 0.78rem; color: var(--muted); }

        .denom-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          min-height: 32px;
        }
        .denom-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(245,158,11,0.15);
          border: 1px solid rgba(245,158,11,0.4);
          color: var(--gold);
          border-radius: 999px;
          padding: 4px 12px;
          font-size: 0.85rem;
          font-weight: 700;
        }
        .denom-remove {
          background: transparent;
          border: none;
          color: var(--gold);
          font-size: 1.1rem;
          line-height: 1;
          padding: 0 2px;
          cursor: pointer;
          min-height: unset;
          opacity: 0.7;
        }
        .denom-remove:hover { opacity: 1; }
        .denom-add-row {
          display: flex;
          gap: 8px;
        }
        .denom-input { flex: 1; max-width: 200px; }
        .denom-add-btn { flex-shrink: 0; }
        .input-error { color: var(--red-light); font-size: 0.82rem; }

        .coverage-note {
          padding: 10px 14px;
          border-radius: var(--radius);
          font-size: 0.85rem;
          font-weight: 600;
        }
        .coverage-ok {
          background: rgba(22,163,74,0.12);
          border: 1px solid rgba(22,163,74,0.4);
          color: var(--green-light);
        }
        .coverage-warning {
          background: rgba(245,158,11,0.12);
          border: 1px solid rgba(245,158,11,0.4);
          color: var(--gold);
        }

        .dist-table-wrap { overflow-x: auto; }
        .dist-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.88rem;
        }
        .dist-table th {
          padding: 8px 12px;
          text-align: left;
          color: var(--muted);
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 1px solid var(--border);
          white-space: nowrap;
        }
        .dist-table td {
          padding: 8px 12px;
          border-bottom: 1px solid rgba(55,65,81,0.4);
        }
        .dist-table tbody tr:last-child td { border-bottom: none; }
        .denom-cell { font-weight: 700; color: var(--gold); }
        .th-sub { font-size: 0.7rem; color: var(--muted); font-weight: 400; }

        .dist-total-row td { border-top: 2px solid var(--border); padding-top: 12px; }
        .dist-total-label { font-weight: 700; color: var(--muted); font-size: 0.82rem; text-transform: uppercase; letter-spacing: 0.05em; }
        .dist-total-val { font-size: 1rem; font-weight: 800; }
        .dist-approx-note {
          font-size: 0.78rem;
          color: var(--muted);
          padding: 6px 12px 8px;
          font-style: italic;
        }
        .dist-summary { }

        .step-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          flex-wrap: wrap;
        }
        @media (max-width: 480px) {
          .step-actions { justify-content: stretch; }
          .step-actions button { flex: 1; }
        }
      `}</style>
    </div>
  );
}
