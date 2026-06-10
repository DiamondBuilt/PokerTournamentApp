import React from 'react';
import { useTournament } from '../../context/TournamentContext';
import NavBar from './NavBar';

/**
 * App chrome wrapper. Renders the nav and the routed content — but hides the
 * nav while a tournament is actively running so the live clock keeps the
 * full-screen, undistracting experience the core was built around.
 */
export default function AppShell({ children }) {
  const { state } = useTournament();
  const { phase } = state.tournament;
  const fullscreen = phase === 'running';

  return (
    <div className="app-shell">
      {!fullscreen && <NavBar />}
      <div className="app-shell-content">{children}</div>

      <style>{`
        .app-shell {
          display: flex;
          flex-direction: column;
          flex: 1;
          min-height: 100vh;
          min-height: 100dvh;
        }
        .app-shell-content {
          flex: 1;
          display: flex;
          flex-direction: column;
        }
      `}</style>
    </div>
  );
}
