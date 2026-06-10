import { db } from '../db';
import { makeRepo } from './baseRepo';

const base = makeRepo(db.cashSessions);

/**
 * Declared in Phase 1 so the schema is stable; actively used in Phase 3
 * (cash games). Mirrors the tournaments repo shape.
 */
export const cashSessionsRepo = {
  ...base,

  async getAllRecent() {
    const all = await base.getAll();
    return all.sort((a, b) => (b.startedAt || 0) - (a.startedAt || 0));
  },

  getBySeason(seasonId) {
    return db.cashSessions.where('seasonId').equals(seasonId).toArray();
  },
};
