import { db } from '../db';
import { makeRepo } from './baseRepo';

const base = makeRepo(db.players);

/** Normalize a display name into the stable dedup/match key. */
export function toNameKey(name) {
  return String(name || '').trim().toLowerCase();
}

function emptyStats() {
  return {
    tournamentsPlayed: 0,
    cashSessionsPlayed: 0,
    totalBuyIns: 0,
    totalCashes: 0,
    firstPlaces: 0,
    finalTables: 0,
    netProfit: 0,
  };
}

/** Build a fresh persistent player record from a display name (+ extras). */
export function makePlayer(name, extra = {}) {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    name: String(name || '').trim(),
    nameKey: toNameKey(name),
    nickname: '',
    email: '',
    phone: '',
    notes: '',
    createdAt: now,
    updatedAt: now,
    stats: emptyStats(),
    archived: false,
    ...extra,
  };
}

export const playersRepo = {
  ...base,

  getByNameKey(nameKey) {
    return db.players.where('nameKey').equals(nameKey).first();
  },

  async search(term) {
    const t = toNameKey(term);
    if (!t) return base.getAll();
    const all = await base.getAll();
    return all.filter(
      (p) =>
        p.nameKey.includes(t) ||
        toNameKey(p.nickname).includes(t)
    );
  },

  /**
   * Find a persistent player by name, creating one if absent. This is the
   * single source of player identity — used both at tournament start (to
   * link ephemeral players) and at archive time (to guarantee first
   * participation lands a record).
   */
  async ensureByName(name, extra = {}) {
    const nameKey = toNameKey(name);
    if (nameKey) {
      const existing = await db.players.where('nameKey').equals(nameKey).first();
      if (existing) return existing;
    }
    const player = makePlayer(name, extra);
    await db.players.put(player);
    return player;
  },

  /**
   * Apply a result delta to a player's lifetime stats. `delta` is a partial
   * stats object; numeric fields are added to the existing rollups.
   */
  async applyResultStats(persistentId, delta) {
    const player = await db.players.get(persistentId);
    if (!player) return;
    const stats = { ...emptyStats(), ...player.stats };
    for (const [key, value] of Object.entries(delta)) {
      stats[key] = (stats[key] || 0) + value;
    }
    await db.players.put({ ...player, stats, updatedAt: Date.now() });
  },
};
