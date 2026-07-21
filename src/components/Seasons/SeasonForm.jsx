import React, { useState } from 'react';
import { seasonsRepo } from '../../data/repositories/seasonsRepo';
import { DEFAULT_POINTS_RULES, normalizeRules } from '../../utils/pointsCalculator';

const today = () => new Date().toISOString().split('T')[0];
const plusOneYear = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().split('T')[0];
};

export default function SeasonForm({ season, onClose, onSaved }) {
  const editing = Boolean(season);
  const rules = normalizeRules(season?.pointsRules);

  const [form, setForm] = useState({
    name: season?.name || `${new Date().getFullYear()} Season`,
    startDate: season?.startDate || today(),
    endDate: season?.endDate || plusOneYear(),
  });
  const [r, setR] = useState({
    system: rules.system,
    participation: rules.participation,
    base: rules.formula.base,
    decayPct: Math.round(rules.formula.decay * 100),
    table: { ...rules.table },
    finalTableBonus: rules.finalTableBonus,
    finalTableSize: rules.finalTableSize,
    missPenalty: rules.missPenalty,
    finaleQualifiers: rules.finaleQualifiers,
  });

  const num = (v, fallback = 0) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  };

  const save = async () => {
    const record = {
      id: season?.id || crypto.randomUUID(),
      name: form.name.trim() || 'Untitled Season',
      startDate: form.startDate,
      endDate: form.endDate,
      status: season?.status || 'active',
      eventIds: season?.eventIds || [],
      pointsRules: {
        ...DEFAULT_POINTS_RULES,
        system: r.system,
        participation: num(r.participation, 25),
        formula: { base: num(r.base, 100), decay: Math.min(0.99, Math.max(0.1, num(r.decayPct, 75) / 100)) },
        table: Object.fromEntries(
          Object.entries(r.table).map(([pos, pts]) => [pos, num(pts, 0)])
        ),
        finalTableBonus: num(r.finalTableBonus, 10),
        finalTableSize: num(r.finalTableSize, 9),
        missPenalty: num(r.missPenalty, 5),
        finaleQualifiers: num(r.finaleQualifiers, 6),
        cash: rules.cash,
      },
      schemaVersion: 1,
    };
    await seasonsRepo.upsert(record);
    onSaved?.(record);
    onClose();
  };

  return (
    <div className="sform-overlay" onClick={onClose}>
      <div className="sform-modal card" onClick={(e) => e.stopPropagation()}>
        <div className="sform-head">
          <h2 className="sform-title">{editing ? 'Edit Season' : 'New Season'}</h2>
          <button className="btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>

        <div className="sform-grid">
          <Field label="Name" full>
            <input className="sform-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Start date">
            <input className="sform-input" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
          </Field>
          <Field label="End date">
            <input className="sform-input" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
          </Field>
        </div>

        <h3 className="sform-sub">Points Rules</h3>
        <div className="sform-grid">
          <Field label="Scoring system" full>
            <div className="sform-toggle">
              <button
                className={`sform-toggle-btn${r.system === 'formula' ? ' on' : ''}`}
                onClick={() => setR({ ...r, system: 'formula' })}
              >
                Formula
              </button>
              <button
                className={`sform-toggle-btn${r.system === 'table' ? ' on' : ''}`}
                onClick={() => setR({ ...r, system: 'table' })}
              >
                Points table
              </button>
            </div>
          </Field>

          <Field label="Participation points" hint="Just for showing up">
            <input className="sform-input" type="number" value={r.participation} onChange={(e) => setR({ ...r, participation: e.target.value })} />
          </Field>
          <Field label="Miss penalty" hint="Per event missed">
            <input className="sform-input" type="number" value={r.missPenalty} onChange={(e) => setR({ ...r, missPenalty: e.target.value })} />
          </Field>

          {r.system === 'formula' ? (
            <>
              <Field label="1st place points">
                <input className="sform-input" type="number" value={r.base} onChange={(e) => setR({ ...r, base: e.target.value })} />
              </Field>
              <Field label="Decay %" hint="Each place earns this % of the one above">
                <input className="sform-input" type="number" value={r.decayPct} onChange={(e) => setR({ ...r, decayPct: e.target.value })} />
              </Field>
            </>
          ) : (
            <Field label="Points by finish position" full>
              <div className="sform-table">
                {Object.keys(r.table)
                  .map(Number)
                  .sort((a, b) => a - b)
                  .map((pos) => (
                    <div key={pos} className="sform-table-cell">
                      <span className="sform-table-pos">{pos}</span>
                      <input
                        className="sform-input"
                        type="number"
                        value={r.table[pos]}
                        onChange={(e) => setR({ ...r, table: { ...r.table, [pos]: e.target.value } })}
                      />
                    </div>
                  ))}
              </div>
            </Field>
          )}

          <Field label="Final table bonus">
            <input className="sform-input" type="number" value={r.finalTableBonus} onChange={(e) => setR({ ...r, finalTableBonus: e.target.value })} />
          </Field>
          <Field label="Final table size">
            <input className="sform-input" type="number" value={r.finalTableSize} onChange={(e) => setR({ ...r, finalTableSize: e.target.value })} />
          </Field>
          <Field label="Finale qualifiers" hint="Top N qualify for the season finale">
            <input className="sform-input" type="number" value={r.finaleQualifiers} onChange={(e) => setR({ ...r, finaleQualifiers: e.target.value })} />
          </Field>
        </div>

        <div className="sform-actions">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-green" onClick={save}>{editing ? 'Save' : 'Create Season'}</button>
        </div>
      </div>

      <style>{`
        .sform-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.7);
          display: flex; align-items: center; justify-content: center;
          padding: 16px; z-index: 100;
        }
        .sform-modal { width: 100%; max-width: 560px; max-height: 90vh; overflow-y: auto; }
        .sform-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
        .sform-title { color: var(--gold); font-size: 1.3rem; }
        .sform-sub { font-size: 0.95rem; color: var(--gold); margin: 20px 0 12px; }
        .sform-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .sform-field.full { grid-column: 1 / -1; }
        .sform-label {
          display: block; font-size: 0.75rem; text-transform: uppercase;
          letter-spacing: 0.05em; color: var(--muted); margin-bottom: 4px; font-weight: 600;
        }
        .sform-hint { font-size: 0.72rem; color: var(--muted); margin-top: 2px; }
        .sform-input {
          width: 100%; background: var(--surface); border: 1px solid var(--border);
          border-radius: var(--radius); padding: 10px 12px; color: var(--text);
          font-family: inherit; font-size: 0.95rem;
        }
        .sform-input:focus { outline: none; border-color: var(--gold); }
        .sform-toggle { display: flex; gap: 8px; }
        .sform-toggle-btn {
          flex: 1; padding: 10px; background: var(--surface);
          border: 1px solid var(--border); color: var(--muted); font-size: 0.9rem;
        }
        .sform-toggle-btn.on { background: var(--gold); color: #000; border-color: var(--gold); }
        .sform-table { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
        .sform-table-cell { display: flex; align-items: center; gap: 6px; }
        .sform-table-pos { font-weight: 800; color: var(--gold); min-width: 18px; text-align: right; }
        .sform-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; }
      `}</style>
    </div>
  );
}

function Field({ label, hint, full, children }) {
  return (
    <div className={`sform-field${full ? ' full' : ''}`}>
      <label className="sform-label">{label}</label>
      {children}
      {hint && <div className="sform-hint">{hint}</div>}
    </div>
  );
}
