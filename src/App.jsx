import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { TournamentProvider, useTournament } from './context/TournamentContext';
import { DataProvider } from './context/DataContext';
import { applyTheme } from './utils/themes';
import AppShell from './components/Shell/AppShell';
import HomeDashboard from './components/Home/HomeDashboard';
import TournamentRoute from './routes/TournamentRoute';
import PlayersPage from './components/Players/PlayersPage';
import SeasonsPage from './components/Seasons/SeasonsPage';
import SettingsPage from './components/Settings/SettingsPage';

function AppRoutes() {
  const { state } = useTournament();
  const location = useLocation();

  // Apply the theme on every route (not just inside the tournament view).
  useEffect(() => {
    applyTheme(state.theme);
  }, [state.theme]);

  // If an event is already underway, never hide it behind the new home screen.
  const liveTournament = state.tournament.phase !== 'setup';
  if (liveTournament && location.pathname === '/') {
    return <Navigate to="/tournament" replace />;
  }

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<HomeDashboard />} />
        <Route path="/tournament" element={<TournamentRoute />} />
        <Route path="/players" element={<PlayersPage />} />
        <Route path="/seasons" element={<SeasonsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}

export default function App() {
  return (
    <TournamentProvider>
      <DataProvider>
        <HashRouter>
          <AppRoutes />
        </HashRouter>
      </DataProvider>
    </TournamentProvider>
  );
}
