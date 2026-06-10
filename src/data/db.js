import Dexie from 'dexie';

/**
 * Single IndexedDB database for all persistent (cross-event) data.
 *
 * The live, in-progress tournament keeps living in localStorage (see
 * TournamentContext) — this database only holds the persistent layer:
 * the player directory, completed-tournament archives, cash sessions,
 * seasons and app settings.
 *
 * The store strings below list INDEXES only (the first token is the
 * primary key); records may carry any additional fields. All five stores
 * are declared up front so later phases (cash games, seasons) add logic,
 * not schema migrations.
 *
 * Opening can fail where IndexedDB is unavailable (e.g. Safari private
 * browsing). Callers use `openDb()` and degrade gracefully — the
 * tournament core never depends on this database.
 */
export const db = new Dexie('pokerDirectorDB');

db.version(1).stores({
  players: 'id, name, nameKey, createdAt',
  tournaments: 'id, name, completedAt, seasonId, date, dedupKey',
  cashSessions: 'id, startedAt, seasonId, date',
  seasons: 'id, name, startDate, endDate',
  settings: 'key',
});

let openPromise = null;
let available = null;

/**
 * Open the database once, memoized. Resolves to `true` when IndexedDB is
 * usable and `false` when it isn't (private mode, blocked storage, etc.).
 * Never throws — persistent features check the result and degrade.
 */
export function openDb() {
  if (openPromise) return openPromise;
  openPromise = db
    .open()
    .then(() => {
      available = true;
      return true;
    })
    .catch((err) => {
      available = false;
      // eslint-disable-next-line no-console
      console.warn('[pokerDirectorDB] IndexedDB unavailable — persistent features disabled.', err);
      return false;
    });
  return openPromise;
}

/** Synchronous best-effort check (null until openDb() has resolved). */
export function isDbAvailable() {
  return available;
}
