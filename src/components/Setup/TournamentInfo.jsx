import React from 'react';
import { useTournament } from '../../context/TournamentContext';

export default function TournamentInfo({ onNext }) {
  const { state, dispatch } = useTournament();
  const { config } = state;

  const update = (field, value) =>
    dispatch({ type: 'UPDATE_CONFIG', payload: { [field]: value } });

  const handleSubmit = (e) => {
    e.preventDefault();
    onNext();
  };

  return (
    <div className="fade-in">
      <h2 className="step-title">Tournament Info</h2>
      <p className="step-desc text-muted">Set up the basic details for your tournament.</p>

      <form onSubmit={handleSubmit} className="setup-form">
        {/* Name & Date */}
        <div className="card mt-4">
          <h3 className="section-heading">Basic Info</h3>
          <div className="form-row mt-4">
            <div className="form-group">
              <label>Tournament Name</label>
              <input
                type="text"
                value={config.name}
                onChange={(e) => update('name', e.target.value)}
                placeholder="Friday Night Poker"
                required
              />
            </div>
            <div className="form-group">
              <label>Date</label>
              <input
                type="date"
                value={config.date}
                onChange={(e) => update('date', e.target.value)}
              />
            </div>
          </div>
          <div className="form-row mt-4">
            <div className="form-group">
              <label>Buy-in Amount ($)</label>
              <input
                type="number"
                min="0"
                value={config.buyIn}
                onChange={(e) => update('buyIn', Number(e.target.value))}
              />
            </div>
          </div>
        </div>

        {/* Rebuys */}
        <div className="card mt-4">
          <div className="section-toggle">
            <div>
              <h3 className="section-heading">Rebuys</h3>
              <p className="text-muted" style={{ fontSize: '0.85rem' }}>
                Allow players to rebuy chips after busting.
              </p>
            </div>
            <label className="toggle">
              <input
                type="checkbox"
                checked={config.rebuyEnabled}
                onChange={(e) => update('rebuyEnabled', e.target.checked)}
              />
              <span className="toggle-slider" />
            </label>
          </div>

          {config.rebuyEnabled && (
            <div className="mt-4">
              <div className="form-row">
                <div className="form-group">
                  <label>Rebuy Cost ($)</label>
                  <input
                    type="number"
                    min="0"
                    value={config.rebuyAmount}
                    onChange={(e) => update('rebuyAmount', Number(e.target.value))}
                  />
                </div>
                <div className="form-group">
                  <label>Rebuy Chips</label>
                  <input
                    type="number"
                    min="1000"
                    value={config.rebuyChips}
                    onChange={(e) => update('rebuyChips', Number(e.target.value))}
                  />
                </div>
              </div>
              <div className="form-row mt-4">
                <div className="form-group">
                  <label>Max Rebuys per Player</label>
                  <input
                    type="number"
                    min="1"
                    value={config.maxRebuys}
                    onChange={(e) => update('maxRebuys', Number(e.target.value))}
                  />
                </div>
                <div className="form-group">
                  <label>Rebuys Allowed Until Level #</label>
                  <input
                    type="number"
                    min="1"
                    value={config.rebuyLevelLimit}
                    onChange={(e) => update('rebuyLevelLimit', Number(e.target.value))}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Add-ons */}
        <div className="card mt-4">
          <div className="section-toggle">
            <div>
              <h3 className="section-heading">Add-ons</h3>
              <p className="text-muted" style={{ fontSize: '0.85rem' }}>
                Allow a one-time add-on at a specific level break.
              </p>
            </div>
            <label className="toggle">
              <input
                type="checkbox"
                checked={config.addOnEnabled}
                onChange={(e) => update('addOnEnabled', e.target.checked)}
              />
              <span className="toggle-slider" />
            </label>
          </div>

          {config.addOnEnabled && (
            <div className="mt-4">
              <div className="form-row">
                <div className="form-group">
                  <label>Add-on Cost ($)</label>
                  <input
                    type="number"
                    min="0"
                    value={config.addOnAmount}
                    onChange={(e) => update('addOnAmount', Number(e.target.value))}
                  />
                </div>
                <div className="form-group">
                  <label>Add-on Chips</label>
                  <input
                    type="number"
                    min="1000"
                    value={config.addOnChips}
                    onChange={(e) => update('addOnChips', Number(e.target.value))}
                  />
                </div>
                <div className="form-group">
                  <label>Available at Level Break After #</label>
                  <input
                    type="number"
                    min="1"
                    value={config.addOnLevel}
                    onChange={(e) => update('addOnLevel', Number(e.target.value))}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="step-actions mt-6">
          <button type="submit" className="btn-primary btn-lg">
            Next: Players →
          </button>
        </div>
      </form>

      <style>{`
        .step-title {
          font-size: 1.8rem;
          color: var(--gold);
          margin-bottom: 4px;
        }
        .step-desc {
          font-size: 0.95rem;
          margin-bottom: 0;
        }
        .setup-form {}
        .section-heading {
          font-size: 1rem;
          font-weight: 700;
          color: var(--text);
        }
        .section-toggle {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }
        /* Toggle switch */
        .toggle {
          position: relative;
          display: inline-block;
          width: 48px;
          height: 26px;
          cursor: pointer;
          flex-shrink: 0;
        }
        .toggle input { opacity: 0; width: 0; height: 0; }
        .toggle-slider {
          position: absolute;
          inset: 0;
          background: var(--border);
          border-radius: 999px;
          transition: background 0.2s;
        }
        .toggle-slider::before {
          content: '';
          position: absolute;
          width: 18px; height: 18px;
          left: 4px; top: 4px;
          background: #fff;
          border-radius: 50%;
          transition: transform 0.2s;
        }
        .toggle input:checked + .toggle-slider { background: var(--gold); }
        .toggle input:checked + .toggle-slider::before { transform: translateX(22px); }
        .step-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }
      `}</style>
    </div>
  );
}
