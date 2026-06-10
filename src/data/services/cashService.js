import { openDb } from '../db';
import { cashSessionsRepo } from '../repositories/cashSessionsRepo';
import { playersRepo } from '../repositories/playersRepo';
import { settingsRepo } from '../repositories/settingsRepo';
import { seasonsRepo } from '../repositories/seasonsRepo';

/**
 * Cash-game tracking. A session lives in IndexedDB from creation so it
 * survives reloads (offline-first), mutated in place as buy-ins and cash-outs
 * are recorded. Net = total cash-out − total buy-ins. Points contribution to
 * a season is computed at read time by the standings service; this module
 * only stamps the seasonId and rolls lifetime stats on finalize.
 */

/** Derive per-player and table totals from a session's buy-ins/cash-outs. */
export function sessionTotals(session) {
  const players = (session.players || []).map((p) => {
    const buyInTotal = (p.buyIns || []).reduce((a, b) => a + (Number(b) || 0), 0);
    const cashedOut = p.cashOut != null;
    const cashOut = cashedOut ? Number(p.cashOut) || 0 : 0;
    return {
      ...p,
      buyInTotal,
      cashOut: p.cashOut,
      // Provisional net only meaningful once cashed out; before that it's
      // shown as the amount currently in front of them (−buy-ins).
      netProfit: cashedOut ? cashOut - buyInTotal : -buyInTotal,
    };
  });
  const totalBuyIn = players.reduce((a, p) => a + p.buyInTotal, 0);
  const totalCashOut = players.reduce((a, p) => a + (p.cashOut != null ? Number(p.cashOut) || 0 : 0), 0);
  const allCashedOut = players.length > 0 && players.every((p) => p.cashOut != null);
  return { players, totalBuyIn, totalCashOut, balance: totalCashOut - totalBuyIn, allCashedOut };
}

export function createSession({ name, gameType, stakes, notes }) {
  return {
    id: crypto.randomUUID(),
    name: (name || '').trim() || 'Cash Game',
    date: new Date().toISOString().split('T')[0],
    gameType: gameType || 'NLH',
    stakes: stakes || '',
    notes: notes || '',
    status: 'active',
    startedAt: Date.now(),
    endedAt: null,
    seasonId: null,
    finalized: false,
    players: [],
    schemaVersion: 1,
  };
}

/** Add a player by name, resolving (or creating) their persistent record. */
export async function addPlayer(session, name, initialBuyIn) {
  const ok = await openDb();
  if (!ok) return session;
  const record = await playersRepo.ensureByName(name);
  // Don't double-add the same persistent player to one session.
  if (session.players.some((p) => p.persistentId === record.id)) return session;
  const buyIns = initialBuyIn > 0 ? [Number(initialBuyIn)] : [];
  const next = {
    ...session,
    players: [...session.players, { persistentId: record.id, name: record.name, buyIns, cashOut: null }],
  };
  await cashSessionsRepo.upsert(next);
  return next;
}

function mapPlayer(session, persistentId, fn) {
  return {
    ...session,
    players: session.players.map((p) => (p.persistentId === persistentId ? fn(p) : p)),
  };
}

export async function addBuyIn(session, persistentId, amount) {
  const amt = Number(amount);
  if (!(amt > 0)) return session;
  const next = mapPlayer(session, persistentId, (p) => ({ ...p, buyIns: [...(p.buyIns || []), amt] }));
  await cashSessionsRepo.upsert(next);
  return next;
}

export async function removeLastBuyIn(session, persistentId) {
  const next = mapPlayer(session, persistentId, (p) => ({ ...p, buyIns: (p.buyIns || []).slice(0, -1) }));
  await cashSessionsRepo.upsert(next);
  return next;
}

export async function setCashOut(session, persistentId, value) {
  const cashOut = value === '' || value == null ? null : Number(value);
  const next = mapPlayer(session, persistentId, (p) => ({ ...p, cashOut }));
  await cashSessionsRepo.upsert(next);
  return next;
}

export async function removePlayer(session, persistentId) {
  const next = { ...session, players: session.players.filter((p) => p.persistentId !== persistentId) };
  await cashSessionsRepo.upsert(next);
  return next;
}

export async function updateMeta(session, patch) {
  const next = { ...session, ...patch };
  await cashSessionsRepo.upsert(next);
  return next;
}

/**
 * End a session: freeze totals, stamp the active season, and roll results
 * into lifetime player stats — exactly once (the `finalized` flag guards
 * against ending twice).
 */
export async function finalizeSession(session) {
  const ok = await openDb();
  if (!ok) return null;
  if (session.finalized) return session;

  const { players } = sessionTotals(session);
  const settings = await settingsRepo.get();
  const seasonId = settings.activeSeasonId || null;

  const ended = {
    ...session,
    players: players.map((p) => ({
      persistentId: p.persistentId,
      name: p.name,
      buyIns: p.buyIns || [],
      buyInTotal: p.buyInTotal,
      cashOut: p.cashOut != null ? Number(p.cashOut) || 0 : 0,
      netProfit: (p.cashOut != null ? Number(p.cashOut) || 0 : 0) - p.buyInTotal,
      points: null,
    })),
    status: 'ended',
    endedAt: session.endedAt || Date.now(),
    seasonId,
    finalized: true,
  };

  await cashSessionsRepo.upsert(ended);

  if (seasonId) {
    const season = await seasonsRepo.getById(seasonId);
    if (season) {
      const eventIds = [...new Set([...(season.eventIds || []), ended.id])];
      await seasonsRepo.upsert({ ...season, eventIds });
    }
  }

  for (const p of ended.players) {
    await playersRepo.applyResultStats(p.persistentId, {
      cashSessionsPlayed: 1,
      totalBuyIns: p.buyInTotal,
      totalCashes: p.cashOut,
      netProfit: p.netProfit,
    });
  }

  return ended;
}

export async function deleteSession(id) {
  const ok = await openDb();
  if (!ok) return;
  await cashSessionsRepo.remove(id);
}
