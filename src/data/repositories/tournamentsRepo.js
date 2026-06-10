import { db } from '../db';
import { makeRepo } from './baseRepo';

const base = makeRepo(db.tournaments);

export const tournamentsRepo = {
  ...base,

  /** Most-recent-first list of completed-tournament archives. */
  async getAllRecent() {
    const all = await base.getAll();
    return all.sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));
  },

  /** Idempotency guard for archiving (see archiveService). */
  findByDedupKey(dedupKey) {
    return db.tournaments.where('dedupKey').equals(dedupKey).first();
  },

  /** Add a new archive record (archives are immutable once written). */
  add(record) {
    return db.tournaments.put(record);
  },

  getBySeason(seasonId) {
    return db.tournaments.where('seasonId').equals(seasonId).toArray();
  },

  /**
   * Every archived result row that references a persistent player — drives
   * the player profile / history view.
   */
  async getResultsForPlayer(persistentId) {
    const all = await base.getAll();
    const rows = [];
    for (const t of all) {
      for (const r of t.results || []) {
        if (r.persistentId === persistentId) {
          rows.push({
            tournamentId: t.id,
            tournamentName: t.name,
            date: t.date,
            completedAt: t.completedAt,
            ...r,
          });
        }
      }
    }
    return rows.sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));
  },
};
