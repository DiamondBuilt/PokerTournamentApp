import React, { useState } from 'react';
import { useLiveQuery } from '../../hooks/useLiveQuery';
import { cashSessionsRepo } from '../../data/repositories/cashSessionsRepo';
import { playersRepo } from '../../data/repositories/playersRepo';
import {
  sessionTotals,
  addPlayer,
  addBuyIn,
  removeLastBuyIn,
  setCashOut,
  removePlayer,
  finalizeSession,
} from '../../data/services/cashService';
import { formatMoney } from '../../utils/payoutCalculator';

/** Live view of one cash session. Reads itself live so edits persist & reflect. */
export default function CashSessionView({ sessionId, onBack }) {
  const session = useLiveQuery(() => cashSessionsRepo.getById(sessionId), [sessionId], undefined);
  const directory = useLiveQuery(() => playersRepo.getAll(), [], []);
  const [name, setName] = useState('');
  const [buyIn, setBuyIn] = useState('');
  const [ending, setEnding] = useState(false);

  if (session === undefined) return null;
  if (!session) {
    return (
      <div className="cash-view">
        <p className="text-muted">Session not found.</p>
        <button className="btn-ghost btn-sm" onClick={onBack}>← Back</button>
      </div>
    );
  }

  const ended = session.status === 'ended';
  const totals = sessionTotals(session);

  const handleAdd = async () => {
    if (!name.trim()) return;
    await addPlayer(session, name, Number(buyIn) || 0);
    setName('');
    setBuyIn('');
  };

  const handleEnd = async () => {
    await finalizeSession(session);
    setEnding(false);
  };

  const durationLabel = () => {
    const end = ended ? session.endedAt : Date.now();
    const mins = Math.max(0, Math.round((end - session.startedAt) / 60000));
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  // Names already seated, for autocomplete filtering.
  const seated = new Set(session.players.map((p) => p.persistentId));
  const suggestions = directory.filter((p) => !seated.has(p.id));

  return (
    <div className="cash-view fade-in">
      <header className="cash-view-head">
        <button className="btn-ghost btn-sm" onClick={onBack}>← Back</button>
        <div className="cash-view-title-wrap">
          <h1 className="cash-view-title">{session.name}</h1>
          <div className="text-muted cash-view-meta">
            {session.gameType}{session.stakes ? ` · ${session.stakes}` : ''} · {durationLabel()}
            {ended && ' · ended'}
          </div>
        </div>
        {ended && <span className="cash-ended-badge">ENDED</span>}
      </header>

      {/* Table summary */}
      <div className="cash-summary card">
        <Summary label="On Table" value={formatMoney(totals.totalBuyIn)} />
        <Summary label="Cashed Out" value={formatMoney(totals.totalCashOut)} />
        <Summary
          label={ended ? 'Books' : 'Uncounted'}
          value={`${totals.balance > 0 ? '+' : ''}${formatMoney(totals.balance)}`}
          accent={totals.balance === 0 ? undefined : 'red'}
          hint={!ended ? 'chips still in play' : totals.balance === 0 ? 'balanced ✓' : 'does not balance'}
        />
      </div>

      {/* Players */}
      <div className="cash-players">
        {totals.players.length === 0 && (
          <p className="text-muted" style={{ padding: '12px 4px', fontSize: '0.9rem' }}>
            No players yet — add players below to start tracking buy-ins.
          </p>
        )}
        {totals.players.map((p) => (
          <div key={p.persistentId} className="cash-player card">
            <div className="cash-player-top">
              <div className="cash-player-name">{p.name}</div>
              <div className={`cash-player-net ${p.netProfit >= 0 ? 'text-green' : 'text-red'}`}>
                {p.netProfit >= 0 ? '+' : ''}{formatMoney(p.netProfit)}
              </div>
              {!ended && (
                <button className="cash-x" title="Remove" onClick={() => removePlayer(session, p.persistentId)}>✕</button>
              )}
            </div>
            <div className="cash-player-row">
              <span className="cash-player-label">
                Buy-ins: <strong>{formatMoney(p.buyInTotal)}</strong>
                {(p.buyIns || []).length > 1 && (
                  <span className="text-muted"> ({p.buyIns.map((b) => formatMoney(b)).join(' + ')})</span>
                )}
              </span>
              {!ended && (
                <span className="cash-player-actions">
                  <QuickBuyIn onAdd={(amt) => addBuyIn(session, p.persistentId, amt)} />
                  {(p.buyIns || []).length > 0 && (
                    <button className="btn-ghost btn-sm" onClick={() => removeLastBuyIn(session, p.persistentId)}>
                      − undo
                    </button>
                  )}
                </span>
              )}
            </div>
            <div className="cash-player-row">
              <span className="cash-player-label">Cash-out</span>
              {ended ? (
                <strong>{formatMoney(p.cashOut || 0)}</strong>
              ) : (
                <input
                  className="cash-cashout-input"
                  type="number"
                  inputMode="decimal"
                  placeholder="—"
                  value={p.cashOut ?? ''}
                  onChange={(e) => setCashOut(session, p.persistentId, e.target.value)}
                />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add player */}
      {!ended && (
        <div className="cash-add card">
          <input
            className="cash-add-name"
            list="cash-player-suggestions"
            placeholder="Player name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <datalist id="cash-player-suggestions">
            {suggestions.map((p) => (
              <option key={p.id} value={p.name} />
            ))}
          </datalist>
          <input
            className="cash-add-buyin"
            type="number"
            inputMode="decimal"
            placeholder="Buy-in"
            value={buyIn}
            onChange={(e) => setBuyIn(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <button className="btn-green btn-sm" onClick={handleAdd}>Add</button>
        </div>
      )}

      {/* End session */}
      {!ended && session.players.length > 0 && (
        <div className="cash-end">
          {!ending ? (
            <button className="btn-red" onClick={() => setEnding(true)}>End Session</button>
          ) : (
            <div className="cash-end-confirm card">
              {!totals.allCashedOut && (
                <p className="cash-warn">⚠ Not everyone has a cash-out — missing ones count as $0.</p>
              )}
              {totals.balance !== 0 && (
                <p className="cash-warn">
                  ⚠ Books are off by {formatMoney(Math.abs(totals.balance))} (cash-outs should equal buy-ins).
                </p>
              )}
              <p className="text-muted" style={{ fontSize: '0.88rem', marginBottom: 12 }}>
                Ending freezes results and adds them to player stats{session.seasonId ? ' and the season' : ''}.
              </p>
              <div className="cash-end-actions">
                <button className="btn-ghost btn-sm" onClick={() => setEnding(false)}>Cancel</button>
                <button className="btn-red btn-sm" onClick={handleEnd}>End &amp; Save</button>
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`
        .cash-view { max-width: 680px; margin: 0 auto; padding: 24px 16px 48px; width: 100%; }
        .cash-view-head { display: flex; align-items: center; gap: 12px; margin-bottom: 18px; }
        .cash-view-title-wrap { flex: 1; min-width: 0; }
        .cash-view-title { color: var(--gold); font-size: 1.5rem; line-height: 1.1; }
        .cash-view-meta { font-size: 0.82rem; margin-top: 2px; }
        .cash-ended-badge { font-size: 0.62rem; font-weight: 900; letter-spacing: 0.08em; background: var(--border); color: var(--muted); border-radius: 4px; padding: 3px 7px; }
        .cash-summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 20px; text-align: center; }
        .cash-sum-val { font-weight: 900; font-size: 1.15rem; }
        .cash-sum-label { font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--muted); }
        .cash-sum-hint { font-size: 0.66rem; color: var(--muted); margin-top: 2px; }
        .cash-players { display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px; }
        .cash-player { padding: 14px; }
        .cash-player-top { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
        .cash-player-name { flex: 1; font-weight: 800; font-size: 1.05rem; }
        .cash-player-net { font-weight: 900; font-size: 1.05rem; }
        .cash-x { background: none; border: none; color: var(--muted); font-size: 0.9rem; padding: 2px 4px; }
        .cash-player-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 4px 0; font-size: 0.9rem; }
        .cash-player-label { color: var(--text); }
        .cash-player-actions { display: flex; align-items: center; gap: 6px; }
        .cash-cashout-input { width: 110px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 8px 10px; color: var(--text); font-family: inherit; text-align: right; }
        .cash-cashout-input:focus { outline: none; border-color: var(--gold); }
        .cash-add { display: flex; gap: 8px; padding: 12px; align-items: center; }
        .cash-add-name { flex: 1; min-width: 0; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 10px 12px; color: var(--text); font-family: inherit; }
        .cash-add-buyin { width: 100px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 10px 12px; color: var(--text); font-family: inherit; }
        .cash-add-name:focus, .cash-add-buyin:focus { outline: none; border-color: var(--gold); }
        .cash-end { margin-top: 24px; text-align: center; }
        .cash-end > .btn-red { min-width: 200px; }
        .cash-end-confirm { text-align: left; max-width: 420px; margin: 0 auto; }
        .cash-warn { color: var(--red-light); font-size: 0.85rem; margin-bottom: 8px; }
        .cash-end-actions { display: flex; justify-content: flex-end; gap: 8px; }
        .text-green { color: var(--green-light); }
        .text-red { color: var(--red-light); }
      `}</style>
    </div>
  );
}

function Summary({ label, value, accent, hint }) {
  return (
    <div>
      <div className="cash-sum-val" style={accent ? { color: `var(--${accent}-light)` } : undefined}>{value}</div>
      <div className="cash-sum-label">{label}</div>
      {hint && <div className="cash-sum-hint">{hint}</div>}
    </div>
  );
}

const QUICK = [20, 50, 100];
function QuickBuyIn({ onAdd }) {
  const [custom, setCustom] = useState('');
  const [open, setOpen] = useState(false);
  if (open) {
    return (
      <span className="cash-player-actions">
        <input
          className="cash-cashout-input"
          style={{ width: 90 }}
          type="number"
          autoFocus
          placeholder="Amount"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && Number(custom) > 0) { onAdd(custom); setCustom(''); setOpen(false); }
            if (e.key === 'Escape') { setOpen(false); setCustom(''); }
          }}
        />
        <button
          className="btn-green btn-sm"
          onClick={() => { if (Number(custom) > 0) { onAdd(custom); setCustom(''); setOpen(false); } }}
        >✓</button>
      </span>
    );
  }
  return (
    <span className="cash-player-actions">
      {QUICK.map((amt) => (
        <button key={amt} className="btn-ghost btn-sm" onClick={() => onAdd(amt)}>+{amt}</button>
      ))}
      <button className="btn-ghost btn-sm" onClick={() => setOpen(true)}>+…</button>
    </span>
  );
}
