import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTournament } from '../../context/TournamentContext';
import { useData } from '../../context/DataContext';
import { useLiveQuery } from '../../hooks/useLiveQuery';
import { tournamentsRepo } from '../../data/repositories/tournamentsRepo';
import { playersRepo } from '../../data/repositories/playersRepo';
import { formatMoney } from '../../utils/payoutCalculator';

export default function HomeDashboard() {
  const navigate = useNavigate();
  const { state } = useTournament();
  const { dbAvailable } = useData();

  const recent = useLiveQuery(() => tournamentsRepo.getAllRecent(), [], undefined);
  const playerCount = useLiveQuery(() => playersRepo.count(), [], undefined);

  const phase = state.tournament.phase;
  const hasLiveTournament = phase !== 'setup';

  return (
    <div className="home-wrap fade-in">
      <header className="home-header">
        <h1 className="home-title">♠ Poker Director</h1>
        <p className="text-muted">Run your home games — tournaments, players & seasons.</p>
      </header>

      {hasLiveTournament && (
        <div className="home-resume card" onClick={() => navigate('/tournament')}>
          <div>
            <div className="home-resume-label">Tournament in progress</div>
            <div className="home-resume-name">{state.config.name}</div>
          </div>
          <button className="btn-primary">Resume →</button>
        </div>
      )}

      <div className="home-actions">
        <button className="home-action btn-green" onClick={() => navigate('/tournament')}>
          🃏 New Tournament
        </button>
        <button className="home-action btn-ghost" onClick={() => navigate('/players')}>
          👥 Players{playerCount != null ? ` (${playerCount})` : ''}
        </button>
      </div>

      <section className="home-section">
        <h2 className="home-section-title">Recent Events</h2>
        {!dbAvailable && dbAvailable !== null && (
          <p className="text-muted home-empty">
            Offline storage is unavailable in this browser, so event history can't be saved.
          </p>
        )}
        {dbAvailable && recent && recent.length === 0 && (
          <p className="text-muted home-empty">
            No completed tournaments yet. Finish one and it'll be archived here.
          </p>
        )}
        {recent && recent.length > 0 && (
          <div className="home-events">
            {recent.slice(0, 8).map((t) => {
              const winner = (t.results || []).find((r) => r.finishPosition === 1);
              return (
                <div key={t.id} className="home-event card">
                  <div className="home-event-main">
                    <div className="home-event-name">{t.name}</div>
                    <div className="home-event-meta text-muted">
                      {t.date} · {(t.results || []).length} players
                    </div>
                  </div>
                  <div className="home-event-side">
                    {winner && <div className="home-event-winner">🏆 {winner.name}</div>}
                    {t.prizePool > 0 && (
                      <div className="home-event-prize text-gold">{formatMoney(t.prizePool)}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <style>{`
        .home-wrap { max-width: 720px; margin: 0 auto; padding: 24px 16px 48px; width: 100%; }
        .home-header { text-align: center; margin-bottom: 24px; }
        .home-title { font-size: 2rem; color: var(--gold); margin-bottom: 4px; }
        .home-resume {
          display: flex; align-items: center; justify-content: space-between;
          gap: 16px; margin-bottom: 16px; cursor: pointer;
          border: 1px solid var(--gold);
        }
        .home-resume-label {
          font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.08em;
          color: var(--muted);
        }
        .home-resume-name { font-weight: 800; font-size: 1.1rem; }
        .home-actions { display: flex; gap: 12px; margin-bottom: 32px; flex-wrap: wrap; }
        .home-action { flex: 1; min-width: 160px; padding: 18px; font-size: 1.05rem; }
        .home-section-title {
          font-size: 1rem; font-weight: 800; color: var(--gold); margin-bottom: 12px;
        }
        .home-empty { font-size: 0.9rem; padding: 8px 0; }
        .home-events { display: flex; flex-direction: column; gap: 8px; }
        .home-event { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
        .home-event-name { font-weight: 700; }
        .home-event-meta { font-size: 0.82rem; }
        .home-event-side { text-align: right; }
        .home-event-winner { font-weight: 700; font-size: 0.9rem; }
        .home-event-prize { font-weight: 800; font-size: 0.9rem; }
      `}</style>
    </div>
  );
}
