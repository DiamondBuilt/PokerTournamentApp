import React from 'react';
import { useTournament } from '../context/TournamentContext';
import SetupWizard from '../components/Setup/SetupWizard';
import Dashboard from '../components/Dashboard/Dashboard';
import WinnerScreen from '../components/Winner/WinnerScreen';

/**
 * The original phase-based tournament flow, unchanged in logic — just mounted
 * under the `/tournament` route now. Setup → running Dashboard → complete
 * WinnerScreen.
 */
export default function TournamentRoute() {
  const { state } = useTournament();
  const { phase } = state.tournament;

  if (phase === 'setup') return <SetupWizard />;
  if (phase === 'complete') return <WinnerScreen />;
  return <Dashboard />;
}
