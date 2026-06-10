import { db } from '../db';
import { makeRepo } from './baseRepo';

const base = makeRepo(db.seasons);

/**
 * Declared in Phase 1 so the schema is stable; standings/points logic lands
 * in Phase 2. `getActive` reads the season flagged active in settings.
 */
export const seasonsRepo = {
  ...base,

  async getAllRecent() {
    const all = await base.getAll();
    return all.sort((a, b) => (b.startDate || '').localeCompare(a.startDate || ''));
  },

  getById(id) {
    return id ? db.seasons.get(id) : Promise.resolve(null);
  },
};
