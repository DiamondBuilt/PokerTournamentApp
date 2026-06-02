import React from 'react';
import { useTournament } from '../../context/TournamentContext';
import { BLIND_TEMPLATES, getStructure, formatChips } from '../../utils/blindStructures';

const TEMPLATE_KEYS = ['deep', 'standard', 'turbo', 'superturbo'];

function fmtTime(seconds) {
  const m = Math.floor(seconds / 60);
  return `${m} min`;
}

export default function BlindStructureSetup({ onNext, onPrev }) {
  const { state, dispatch } = useTournament();
  const { structure } = state;

  const setTemplate = (key) => {
    const tpl = getStructure(key);
    dispatch({
      type: 'UPDATE_STRUCTURE',
      payload: {
        template: key,
        startingChips: tpl.startingChips,
        levelDuration: tpl.levelDuration,
        breakDuration: tpl.breakDuration,
        levels: tpl.levels,
        breakLevels: tpl.breakLevels,
      },
    });
  };

  const updateField = (field, value) =>
    dispatch({ type: 'UPDATE_STRUCTURE', payload: { [field]: value } });

  return (
    <div className="fade-in">
      <h2 className="step-title">Blind Structure</h2>
      <p className="step-desc text-muted">
        Choose a preset structure or adjust level duration and breaks.
      </p>

      {/* Template selector */}
      <div className="tpl-grid mt-4">
        {TEMPLATE_KEYS.map((key) => {
          const tpl = BLIND_TEMPLATES[key];
          const active = structure.template === key;
          return (
            <button
              key={key}
              className={`tpl-card ${active ? 'tpl-active' : ''}`}
              onClick={() => setTemplate(key)}
            >
              <div className="tpl-name">{tpl.name}</div>
              <div className="tpl-meta">
                <span>{fmtTime(tpl.levelDuration)} levels</span>
                <span>{formatChips(tpl.startingChips)} chips</span>
                <span>{tpl.levels.length} levels</span>
              </div>
              <div className="tpl-breaks">
                Breaks after levels: {tpl.breakLevels.join(', ')}
              </div>
            </button>
          );
        })}
      </div>

      {/* Customization */}
      <div className="card mt-4">
        <h3 className="section-heading">Customize</h3>
        <div className="form-row mt-4">
          <div className="form-group">
            <label>Level Duration (minutes)</label>
            <input
              type="number"
              min="1"
              max="60"
              value={Math.floor(structure.levelDuration / 60)}
              onChange={(e) =>
                updateField('levelDuration', Number(e.target.value) * 60)
              }
            />
          </div>
          <div className="form-group">
            <label>Break Duration (minutes)</label>
            <input
              type="number"
              min="1"
              max="30"
              value={Math.floor(structure.breakDuration / 60)}
              onChange={(e) =>
                updateField('breakDuration', Number(e.target.value) * 60)
              }
            />
          </div>
          <div className="form-group">
            <label>Starting Chips</label>
            <input
              type="number"
              min="1000"
              step="1000"
              value={structure.startingChips}
              onChange={(e) => updateField('startingChips', Number(e.target.value))}
            />
          </div>
        </div>
      </div>

      {/* Blind levels preview table */}
      <div className="card mt-4">
        <h3 className="section-heading">Level Schedule Preview</h3>
        <div className="levels-table-wrap mt-4">
          <table className="levels-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Small Blind</th>
                <th>Big Blind</th>
                <th>Ante</th>
                <th>Duration</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {structure.levels.map((lvl, idx) => {
                const isBreakAfter = structure.breakLevels && structure.breakLevels.includes(lvl.level);
                return (
                  <React.Fragment key={lvl.level}>
                    <tr className={`level-row ${isBreakAfter ? 'pre-break' : ''}`}>
                      <td className="level-num">{lvl.level}</td>
                      <td>{formatChips(lvl.sb)}</td>
                      <td>{formatChips(lvl.bb)}</td>
                      <td>{lvl.ante > 0 ? formatChips(lvl.ante) : '—'}</td>
                      <td>{fmtTime(structure.levelDuration)}</td>
                      <td>
                        {isBreakAfter && (
                          <span className="badge badge-blue">Break ↓</span>
                        )}
                      </td>
                    </tr>
                    {isBreakAfter && idx < structure.levels.length - 1 && (
                      <tr className="break-row">
                        <td colSpan={6}>
                          ☕ BREAK — {fmtTime(structure.breakDuration)}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="step-actions mt-6">
        <button className="btn-ghost" onClick={onPrev}>← Back</button>
        <button className="btn-primary btn-lg" onClick={onNext}>
          Next: Chip Setup →
        </button>
      </div>

      <style>{`
        .step-title { font-size: 1.8rem; color: var(--gold); margin-bottom: 4px; }
        .step-desc  { font-size: 0.95rem; }
        .section-heading { font-size: 1rem; font-weight: 700; }
        .tpl-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 12px;
        }
        .tpl-card {
          background: var(--card);
          border: 2px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 16px;
          text-align: left;
          cursor: pointer;
          transition: border-color 0.15s, background 0.15s;
          color: var(--text);
        }
        .tpl-card:hover { border-color: var(--muted); }
        .tpl-active {
          border-color: var(--gold) !important;
          background: rgba(245,158,11,0.08) !important;
        }
        .tpl-name {
          font-size: 1.05rem;
          font-weight: 800;
          color: var(--gold);
          margin-bottom: 8px;
        }
        .tpl-meta {
          display: flex;
          flex-direction: column;
          gap: 2px;
          font-size: 0.82rem;
          color: var(--muted);
          margin-bottom: 8px;
        }
        .tpl-breaks {
          font-size: 0.78rem;
          color: var(--blue-light);
        }
        .levels-table-wrap {
          overflow-x: auto;
          max-height: 360px;
          overflow-y: auto;
        }
        .levels-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.88rem;
        }
        .levels-table th {
          padding: 8px 12px;
          text-align: left;
          color: var(--muted);
          font-size: 0.78rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 1px solid var(--border);
          position: sticky;
          top: 0;
          background: var(--card);
        }
        .levels-table td {
          padding: 8px 12px;
          border-bottom: 1px solid rgba(55,65,81,0.5);
          color: var(--text);
        }
        .level-num {
          color: var(--muted);
          font-weight: 700;
          width: 32px;
        }
        .pre-break td { background: rgba(245,158,11,0.05); }
        .break-row td {
          text-align: center;
          color: var(--blue-light);
          font-weight: 700;
          font-size: 0.82rem;
          background: rgba(59,130,246,0.08);
          padding: 10px;
          border-bottom: 2px solid var(--blue);
        }
        .step-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }
      `}</style>
    </div>
  );
}
