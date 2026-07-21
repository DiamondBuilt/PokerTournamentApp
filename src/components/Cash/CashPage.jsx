import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useLiveQuery } from '../../hooks/useLiveQuery';
import { cashSessionsRepo } from '../../data/repositories/cashSessionsRepo';
import { sessionTotals, deleteSession } from '../../data/services/cashService';
import { formatMoney } from '../../utils/payoutCalculator';
import CashSessionForm from './CashSessionForm';
import CashSessionView from './CashSessionView';

export default function CashPage() {
  const { dbAvailable } = useData();
  const [creating, setCreating] = useState(false);
  const [openId, setOpenId] = useState(null);

  const sessions = useLiveQuery(() => cashSessionsRepo.getAllRecent(), [], undefined);

  if (dbAvailable === false) {
    return (
      <div className="cash-page fade-in">
        <h1 className="cash-page-title">Cash Games</h1>
        <p className="text-muted">
          Offline storage is unavailable in this browser, so cash sessions can't
          be tracked here. Tournaments still run normally.
        </p>
        {styleTag}
      </div>
    );
  }

  if (openId) {
    return <CashSessionView sessionId={openId} onBack={() => setOpenId(null)} />;
  }

  const active = (sessions || []).filter((s) => s.status === 'active');
  const ended = (sessions || []).filter((s) => s.status === 'ended');

  return (
    <div className="cash-page fade-in">
      <header className="cash-page-head">
        <h1 className="cash-page-title">Cash Games</h1>
        <button className="btn-green btn-sm" onClick={() => setCreating(true)}>+ New Session</button>
      </header>

      {active.length > 0 && (
        <section className="cash-page-section">
          <h2 className="cash-page-sub">In Progress</h2>
          <div className="cash-page-list">
            {active.map((s) => (
              <SessionCard key={s.id} session={s} live onOpen={() => setOpenId(s.id)} />
            ))}
          </div>
        </section>
      )}

      {(!sessions || sessions.length === 0) && (
        <section className="cash-page-section">
          <p className="text-muted" style={{ fontSize: '0.92rem' }}>
            No cash sessions yet. Start one to track buy-ins, cash-outs, and net
            results — they roll into player stats and the active season automatically.
          </p>
        </section>
      )}

      {ended.length > 0 && (
        <section className="cash-page-section">
          <h2 className="cash-page-sub">Past Sessions</h2>
          <div className="cash-page-list">
            {ended.map((s) => (
              <SessionCard
                key={s.id}
                session={s}
                onOpen={() => setOpenId(s.id)}
                onDelete={() => deleteSession(s.id)}
              />
            ))}
          </div>
        </section>
      )}

      {creating && (
        <CashSessionForm onClose={() => setCreating(false)} onCreated={(s) => setOpenId(s.id)} />
      )}

      {styleTag}
    </div>
  );
}

function SessionCard({ session, live, onOpen, onDelete }) {
  const totals = sessionTotals(session);
  return (
    <div className={`cash-card card${live ? ' live' : ''}`}>
      <button className="cash-card-main" onClick={onOpen}>
        <div>
          <div className="cash-card-name">
            {session.name}
            {live && <span className="cash-card-live">LIVE</span>}
          </div>
          <div className="text-muted cash-card-meta">
            {session.date} · {session.gameType}{session.stakes ? ` · ${session.stakes}` : ''} ·{' '}
            {session.players.length} player{session.players.length === 1 ? '' : 's'}
          </div>
        </div>
        <div className="cash-card-right">
          <div className="cash-card-amt">{formatMoney(totals.totalBuyIn)}</div>
          <div className="cash-card-amt-label">{live ? 'on table' : 'total buy-in'}</div>
        </div>
      </button>
      {onDelete && (
        <button
          className="cash-card-del"
          title="Delete session"
          onClick={() => { if (confirm('Delete this session? This cannot be undone.')) onDelete(); }}
        >
          🗑
        </button>
      )}
    </div>
  );
}

const styleTag = (
  <style>{`
    .cash-page { max-width: 680px; margin: 0 auto; padding: 24px 16px 48px; width: 100%; }
    .cash-page-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
    .cash-page-title { color: var(--gold); font-size: 1.8rem; }
    .cash-page-section { margin-bottom: 24px; }
    .cash-page-sub { font-size: 1rem; font-weight: 800; color: var(--gold); margin-bottom: 12px; }
    .cash-page-list { display: flex; flex-direction: column; gap: 8px; }
    .cash-card { display: flex; align-items: stretch; gap: 8px; padding: 0; overflow: hidden; }
    .cash-card.live { border-color: var(--gold); }
    .cash-card-main { flex: 1; display: flex; align-items: center; justify-content: space-between; gap: 12px; background: none; border: none; text-align: left; padding: 14px 16px; color: var(--text); }
    .cash-card-name { font-weight: 800; display: flex; align-items: center; gap: 8px; }
    .cash-card-live { font-size: 0.58rem; font-weight: 900; letter-spacing: 0.08em; background: var(--gold); color: #000; border-radius: 4px; padding: 2px 6px; }
    .cash-card-meta { font-size: 0.8rem; margin-top: 2px; }
    .cash-card-right { text-align: right; flex-shrink: 0; }
    .cash-card-amt { font-weight: 900; font-size: 1.1rem; color: var(--gold); }
    .cash-card-amt-label { font-size: 0.66rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--muted); }
    .cash-card-del { background: none; border: none; border-left: 1px solid var(--border); color: var(--muted); padding: 0 14px; font-size: 0.95rem; }
  `}</style>
);
