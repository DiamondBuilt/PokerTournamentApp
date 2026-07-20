import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useLiveQuery } from '../../hooks/useLiveQuery';
import { seasonsRepo } from '../../data/repositories/seasonsRepo';
import { computeStandings } from '../../data/services/standingsService';
import SeasonForm from './SeasonForm';
import SeasonLeaderboard from './SeasonLeaderboard';

export default function SeasonsPage() {
  const { dbAvailable, settings, updateSettings } = useData();
  const [formSeason, setFormSeason] = useState(null); // null = closed, 'new' = create, object = edit
  const activeSeasonId = settings?.activeSeasonId || null;

  const seasons = useLiveQuery(() => seasonsRepo.getAllRecent(), [], undefined);
  const active = useLiveQuery(
    () => (activeSeasonId ? computeStandings(activeSeasonId) : Promise.resolve(null)),
    [activeSeasonId],
    undefined
  );

  if (dbAvailable === false) {
    return (
      <div className="seasons-wrap fade-in">
        <h1 className="seasons-title">Seasons</h1>
        <p className="text-muted">
          Offline storage is unavailable in this browser, so seasons can't be
          tracked here. Tournaments still run normally.
        </p>
        {styleTag}
      </div>
    );
  }

  const setActive = (id) => updateSettings({ activeSeasonId: id });

  return (
    <div className="seasons-wrap fade-in">
      <header className="seasons-head">
        <h1 className="seasons-title">Seasons</h1>
        <button className="btn-green btn-sm" onClick={() => setFormSeason('new')}>
          + New Season
        </button>
      </header>

      {active?.season ? (
        <section className="seasons-active card">
          <div className="seasons-active-head">
            <div>
              <div className="seasons-active-label">Active season</div>
              <h2 className="seasons-active-name">{active.season.name}</h2>
              <div className="text-muted seasons-active-meta">
                {active.season.startDate} → {active.season.endDate} · {active.totalEvents} events
                · top {active.rules.finaleQualifiers} qualify for the finale
              </div>
            </div>
            <button className="btn-ghost btn-sm" onClick={() => setFormSeason(active.season)}>
              ✎ Edit
            </button>
          </div>
          <SeasonLeaderboard
            standings={active.standings}
            rules={active.rules}
            totalEvents={active.totalEvents}
          />
        </section>
      ) : (
        <section className="seasons-none card">
          <p className="text-muted" style={{ fontSize: '0.92rem' }}>
            No active season. Create one (or activate one below) and every
            tournament you finish will count toward its leaderboard automatically.
          </p>
        </section>
      )}

      {seasons && seasons.length > 0 && (
        <section className="seasons-list-section">
          <h2 className="seasons-sub">All Seasons</h2>
          <div className="seasons-list">
            {seasons.map((s) => {
              const isActive = s.id === activeSeasonId;
              return (
                <div key={s.id} className={`seasons-row card${isActive ? ' is-active' : ''}`}>
                  <div className="seasons-row-main">
                    <div className="seasons-row-name">
                      {s.name}
                      {isActive && <span className="seasons-badge">ACTIVE</span>}
                    </div>
                    <div className="text-muted seasons-row-meta">
                      {s.startDate} → {s.endDate} · {(s.eventIds || []).length} events
                    </div>
                  </div>
                  <div className="seasons-row-actions">
                    {isActive ? (
                      <button className="btn-ghost btn-sm" onClick={() => setActive(null)}>
                        Deactivate
                      </button>
                    ) : (
                      <button className="btn-blue btn-sm" onClick={() => setActive(s.id)}>
                        Set active
                      </button>
                    )}
                    <button className="btn-ghost btn-sm" onClick={() => setFormSeason(s)}>✎</button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {formSeason && (
        <SeasonForm
          season={formSeason === 'new' ? null : formSeason}
          onClose={() => setFormSeason(null)}
          onSaved={(record) => {
            // Creating your first/new season usually means it's the one being
            // played — activate it automatically if nothing else is active.
            if (!activeSeasonId) setActive(record.id);
          }}
        />
      )}

      {styleTag}
    </div>
  );
}

const styleTag = (
  <style>{`
    .seasons-wrap { max-width: 760px; margin: 0 auto; padding: 24px 16px 48px; width: 100%; }
    .seasons-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
    .seasons-title { color: var(--gold); font-size: 1.8rem; }
    .seasons-active { margin-bottom: 28px; }
    .seasons-active-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 18px; }
    .seasons-active-label { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--gold); font-weight: 700; }
    .seasons-active-name { font-size: 1.3rem; }
    .seasons-active-meta { font-size: 0.82rem; }
    .seasons-none { margin-bottom: 28px; }
    .seasons-sub { font-size: 1rem; font-weight: 800; color: var(--gold); margin-bottom: 12px; }
    .seasons-list { display: flex; flex-direction: column; gap: 8px; }
    .seasons-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
    .seasons-row.is-active { border-color: var(--gold); }
    .seasons-row-name { font-weight: 800; display: flex; align-items: center; gap: 8px; }
    .seasons-badge {
      font-size: 0.62rem; font-weight: 900; letter-spacing: 0.08em;
      background: var(--gold); color: #000; border-radius: 4px; padding: 2px 6px;
    }
    .seasons-row-meta { font-size: 0.8rem; }
    .seasons-row-actions { display: flex; gap: 6px; flex-shrink: 0; }
  `}</style>
);
