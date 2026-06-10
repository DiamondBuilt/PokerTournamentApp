import React, { useState } from 'react';
import { cashSessionsRepo } from '../../data/repositories/cashSessionsRepo';
import { createSession } from '../../data/services/cashService';

const GAME_TYPES = ['NLH', 'PLO', 'PLO5', 'Mixed', 'Other'];
const STAKE_PRESETS = ['0.25/0.50', '0.50/1', '1/2', '1/3', '2/5', '5/10'];

export default function CashSessionForm({ onClose, onCreated }) {
  const [form, setForm] = useState({
    name: `Cash Game · ${new Date().toLocaleDateString()}`,
    gameType: 'NLH',
    stakes: '1/2',
    notes: '',
  });

  const create = async () => {
    const session = createSession(form);
    await cashSessionsRepo.upsert(session);
    onCreated?.(session);
    onClose();
  };

  return (
    <div className="cform-overlay" onClick={onClose}>
      <div className="cform-modal card" onClick={(e) => e.stopPropagation()}>
        <div className="cform-head">
          <h2 className="cform-title">New Cash Session</h2>
          <button className="btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>

        <label className="cform-label">Session name</label>
        <input className="cform-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />

        <label className="cform-label">Game type</label>
        <div className="cform-chips">
          {GAME_TYPES.map((g) => (
            <button
              key={g}
              className={`cform-chip${form.gameType === g ? ' on' : ''}`}
              onClick={() => setForm({ ...form, gameType: g })}
            >
              {g}
            </button>
          ))}
        </div>

        <label className="cform-label">Stakes</label>
        <input
          className="cform-input"
          placeholder="e.g. 1/2"
          value={form.stakes}
          onChange={(e) => setForm({ ...form, stakes: e.target.value })}
        />
        <div className="cform-chips">
          {STAKE_PRESETS.map((s) => (
            <button
              key={s}
              className={`cform-chip${form.stakes === s ? ' on' : ''}`}
              onClick={() => setForm({ ...form, stakes: s })}
            >
              {s}
            </button>
          ))}
        </div>

        <label className="cform-label">Notes (optional)</label>
        <textarea
          className="cform-input"
          rows={2}
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
        />

        <div className="cform-actions">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-green" onClick={create}>Start Session</button>
        </div>
      </div>

      <style>{`
        .cform-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; padding: 16px; z-index: 100; }
        .cform-modal { width: 100%; max-width: 480px; max-height: 90vh; overflow-y: auto; }
        .cform-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
        .cform-title { color: var(--gold); font-size: 1.3rem; }
        .cform-label { display: block; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--muted); margin: 14px 0 5px; font-weight: 600; }
        .cform-input { width: 100%; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 10px 12px; color: var(--text); font-family: inherit; font-size: 0.95rem; }
        .cform-input:focus { outline: none; border-color: var(--gold); }
        .cform-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
        .cform-chip { padding: 6px 12px; background: var(--surface); border: 1px solid var(--border); color: var(--muted); border-radius: var(--radius); font-size: 0.85rem; }
        .cform-chip.on { background: var(--gold); color: #000; border-color: var(--gold); }
        .cform-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; }
      `}</style>
    </div>
  );
}
