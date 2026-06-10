import React, { useState } from 'react';
import { useLiveQuery } from '../../hooks/useLiveQuery';
import { tournamentsRepo } from '../../data/repositories/tournamentsRepo';
import { cashSessionsRepo } from '../../data/repositories/cashSessionsRepo';
import { playersRepo, toNameKey } from '../../data/repositories/playersRepo';
import { formatMoney } from '../../utils/payoutCalculator';

const ORDINAL = (n) => {
  if (n == null) return '—';
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

export default function PlayerProfile({ player, onClose }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: player.name || '',
    nickname: player.nickname || '',
    email: player.email || '',
    phone: player.phone || '',
    notes: player.notes || '',
  });

  // Unified history: tournament finishes + cash sessions, newest first.
  const history = useLiveQuery(
    async () => {
      const [tourneys, cash] = await Promise.all([
        tournamentsRepo.getResultsForPlayer(player.id),
        cashSessionsRepo.getResultsForPlayer(player.id),
      ]);
      const rows = [
        ...tourneys.map((t) => ({ kind: 'tournament', when: t.completedAt || 0, ...t })),
        ...cash.map((c) => ({ kind: 'cash', when: c.endedAt || 0, ...c })),
      ];
      return rows.sort((a, b) => b.when - a.when);
    },
    [player.id],
    undefined
  );

  const stats = player.stats || {};

  const save = async () => {
    await playersRepo.upsert({
      ...player,
      ...form,
      name: form.name.trim() || player.name,
      nameKey: toNameKey(form.name) || player.nameKey,
    });
    setEditing(false);
  };

  return (
    <div className="profile-overlay" onClick={onClose}>
      <div className="profile-modal card" onClick={(e) => e.stopPropagation()}>
        <div className="profile-head">
          <h2 className="profile-name">{player.name}</h2>
          <button className="btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>

        {!editing ? (
          <>
            <div className="profile-stats">
              <Stat label="Tourneys" value={stats.tournamentsPlayed || 0} />
              <Stat label="Cash" value={stats.cashSessionsPlayed || 0} />
              <Stat label="Wins" value={stats.firstPlaces || 0} />
              <Stat label="Final Tables" value={stats.finalTables || 0} />
              <Stat
                label="Net"
                value={`${(stats.netProfit || 0) >= 0 ? '+' : ''}${formatMoney(stats.netProfit || 0)}`}
                accent={(stats.netProfit || 0) >= 0 ? 'green' : 'red'}
              />
            </div>

            {(player.nickname || player.email || player.phone || player.notes) && (
              <div className="profile-info">
                {player.nickname && <div><span className="text-muted">Nickname:</span> {player.nickname}</div>}
                {player.email && <div><span className="text-muted">Email:</span> {player.email}</div>}
                {player.phone && <div><span className="text-muted">Phone:</span> {player.phone}</div>}
                {player.notes && <div><span className="text-muted">Notes:</span> {player.notes}</div>}
              </div>
            )}

            <button className="btn-ghost btn-sm profile-edit-btn" onClick={() => setEditing(true)}>
              ✎ Edit details
            </button>

            <h3 className="profile-sub">History</h3>
            {history && history.length === 0 && (
              <p className="text-muted" style={{ fontSize: '0.88rem' }}>No events recorded yet.</p>
            )}
            <div className="profile-history">
              {(history || []).map((h) => {
                const isCash = h.kind === 'cash';
                return (
                  <div key={isCash ? `c-${h.sessionId}` : `t-${h.tournamentId}`} className="profile-history-row">
                    <div className="profile-history-main">
                      <div className="profile-history-name">
                        {isCash ? h.sessionName : h.tournamentName}
                        <span className="profile-history-tag">{isCash ? '💵 cash' : '🃏 tourney'}</span>
                      </div>
                      <div className="text-muted" style={{ fontSize: '0.78rem' }}>{h.date}</div>
                    </div>
                    <div className="profile-history-finish">{isCash ? '—' : ORDINAL(h.finishPosition)}</div>
                    <div className={`profile-history-net ${h.netProfit >= 0 ? 'text-green' : 'text-red'}`}>
                      {h.netProfit >= 0 ? '+' : ''}{formatMoney(h.netProfit)}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="profile-form">
            <Field label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
            <Field label="Nickname" value={form.nickname} onChange={(v) => setForm({ ...form, nickname: v })} />
            <Field label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
            <Field label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
            <Field label="Notes" value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} textarea />
            <div className="profile-form-actions">
              <button className="btn-ghost btn-sm" onClick={() => setEditing(false)}>Cancel</button>
              <button className="btn-green btn-sm" onClick={save}>Save</button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .profile-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.7);
          display: flex; align-items: center; justify-content: center;
          padding: 16px; z-index: 100;
        }
        .profile-modal { width: 100%; max-width: 520px; max-height: 88vh; overflow-y: auto; }
        .profile-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
        .profile-name { color: var(--gold); font-size: 1.4rem; }
        .profile-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(64px, 1fr)); gap: 8px; margin-bottom: 16px; }
        .profile-stat { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 10px; text-align: center; }
        .profile-stat-val { font-weight: 900; font-size: 1.1rem; }
        .profile-stat-label { font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--muted); }
        .profile-info { display: flex; flex-direction: column; gap: 4px; font-size: 0.88rem; margin-bottom: 12px; }
        .profile-edit-btn { margin-bottom: 20px; }
        .profile-sub { font-size: 1rem; color: var(--gold); margin-bottom: 10px; }
        .profile-history { display: flex; flex-direction: column; gap: 6px; }
        .profile-history-row { display: flex; align-items: center; gap: 12px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 10px 12px; }
        .profile-history-main { flex: 1; min-width: 0; }
        .profile-history-name { font-weight: 700; font-size: 0.9rem; }
        .profile-history-tag { font-size: 0.68rem; color: var(--muted); margin-left: 6px; font-weight: 500; }
        .profile-history-finish { font-weight: 800; color: var(--gold); }
        .profile-history-net { min-width: 70px; text-align: right; font-weight: 700; font-size: 0.9rem; }
        .text-green { color: var(--green-light); }
        .text-red { color: var(--red-light); }
        .profile-form { display: flex; flex-direction: column; gap: 12px; }
        .profile-field-label { font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--muted); margin-bottom: 4px; display: block; }
        .profile-field-input { width: 100%; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 10px 12px; color: var(--text); font-family: inherit; font-size: 0.95rem; }
        .profile-form-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 4px; }
      `}</style>
    </div>
  );
}

function Stat({ label, value, accent }) {
  return (
    <div className="profile-stat">
      <div className="profile-stat-val" style={accent ? { color: `var(--${accent}-light)` } : undefined}>{value}</div>
      <div className="profile-stat-label">{label}</div>
    </div>
  );
}

function Field({ label, value, onChange, textarea }) {
  return (
    <div>
      <label className="profile-field-label">{label}</label>
      {textarea ? (
        <textarea className="profile-field-input" rows={3} value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input className="profile-field-input" value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </div>
  );
}
