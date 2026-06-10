import React, { createContext, useContext, useEffect, useState } from 'react';
import { openDb, isDbAvailable } from '../data/db';
import { settingsRepo } from '../data/repositories/settingsRepo';
import { applyTheme } from '../utils/themes';
import { setMuted } from '../utils/audioManager';

const DataContext = createContext(null);

/**
 * Loads the persistent layer (settings; the player directory is read live via
 * useLiveQuery where needed) and exposes its availability to the app.
 *
 * If IndexedDB can't open (e.g. Safari private browsing) `dbAvailable` is
 * false and the persistent features degrade gracefully — the tournament core,
 * which runs entirely on localStorage, is never affected.
 */
export function DataProvider({ children }) {
  const [loading, setLoading] = useState(true);
  const [dbAvailable, setDbAvailable] = useState(null);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const ok = await openDb();
      if (cancelled) return;
      setDbAvailable(ok);
      if (ok) {
        try {
          const s = await settingsRepo.get();
          if (!cancelled) {
            setSettings(s);
            // Honor the persisted sound preference from the first tick.
            setMuted(s.soundEnabled === false);
          }
        } catch {
          /* ignore */
        }
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const updateSettings = async (partial) => {
    if (!isDbAvailable()) return;
    const next = await settingsRepo.patch(partial);
    setSettings(next);
    if (partial.defaultTheme) applyTheme(partial.defaultTheme);
    return next;
  };

  return (
    <DataContext.Provider
      value={{ loading, dbAvailable, settings, setSettings, updateSettings }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used inside DataProvider');
  return ctx;
}
