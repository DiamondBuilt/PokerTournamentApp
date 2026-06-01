import React from 'react';
import { TournamentProvider, useTournament } from './context/TournamentContext';
import SetupWizard from './components/Setup/SetupWizard';
import Dashboard from './components/Dashboard/Dashboard';
import WinnerScreen from './components/Winner/WinnerScreen';

function AppInner() {
  const { state } = useTournament();
  const { phase } = state.tournament;

  if (phase === 'setup') return <SetupWizard />;
  if (phase === 'complete') return <WinnerScreen />;
  return <Dashboard />;
}

export default function App() {
  return (
    <TournamentProvider>
      <AppInner />
    </TournamentProvider>
  );
}
