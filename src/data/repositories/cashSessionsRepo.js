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

  /** The single in-progress session, if any (home games run one table). */
  getActive() {
    return db.cashSessions.filter((s) => s.status === 'active').first();
  },

  /**
   * Every ended-session row that references a persistent player — feeds the
   * player profile history alongside tournament results.
   */
  async getResultsForPlayer(persistentId) {
    const all = await base.getAll();
    const rows = [];
    for (const s of all) {
      if (s.status !== 'ended') continue;
      for (const p of s.players || []) {
        if (p.persistentId === persistentId) {
          rows.push({
            sessionId: s.id,
            sessionName: s.name,
            date: s.date,
            endedAt: s.endedAt,
            stakes: s.stakes,
            ...p,
          });
        }
      }
    }
    return rows.sort((a, b) => (b.endedAt || 0) - (a.endedAt || 0));
  },
};
