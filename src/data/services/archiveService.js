import { openDb } from '../db';
import { playersRepo } from '../repositories/playersRepo';
import { tournamentsRepo } from '../repositories/tournamentsRepo';
import { settingsRepo } from '../repositories/settingsRepo';

/** Deterministic key so re-archiving the same completed event is a no-op. */
function buildDedupKey(state) {
  const { config, tournament, players } = state;
  const winner = players.find((p) => p.finishPosition === 1);
  return [
    config.name,
    config.date,
    tournament.startTime || 0,
    winner?.id || 'none',
  ].join('|');
}

const FINAL_TABLE_SIZE = 9;

// Guards concurrent calls within a session (e.g. React StrictMode's
// double-mount) so two effects racing on the same event can't both write
// before either commits. The persisted dedupKey covers cross-session reloads.
const inFlight = new Map();

/**
 * Write a completed tournament to the persistent archive exactly once.
 *
 * Idempotent: a deterministic dedupKey guards against React StrictMode's
 * double-mount and reload-while-complete. Also guarantees every participant
 * has a persistent player record (first-participation safety net) and rolls
 * their result into lifetime stats.
 *
 * `computed` carries values WinnerScreen already derives: prizePool,
 * payoutList, ranked. Returns the archive record, or null if skipped.
 */
export async function archiveCurrentTournament(state, computed) {
  const ok = await openDb();
  if (!ok) return null;

  const dedupKey = buildDedupKey(state);
  if (inFlight.has(dedupKey)) return inFlight.get(dedupKey);

  const promise = doArchive(state, computed, dedupKey).finally(() => {
    inFlight.delete(dedupKey);
  });
  inFlight.set(dedupKey, promise);
  return promise;
}

async function doArchive(state, computed, dedupKey) {
  const existing = await tournamentsRepo.findByDedupKey(dedupKey);
  if (existing) return existing;

  const { config, structure, payouts } = state;
  const { prizePool = 0, payoutList = [], ranked = [] } = computed || {};

  const payoutFor = (position) =>
    payoutList.find((p) => p.position === position)?.amount || 0;

  const settings = await settingsRepo.get();
  const seasonId = settings.activeSeasonId || null;

  // Resolve persistent ids for every player (covers players added mid-event
  // who were never linked at start), then build the immutable result rows.
  const results = [];
  for (const p of ranked) {
    const record = await playersRepo.ensureByName(p.name);
    const buyInTotal =
      (config.buyIn || 0) +
      (p.rebuys || 0) * (config.rebuyAmount || 0) +
      (p.addOns || 0) * (config.addOnAmount || 0);
    const payout = payoutFor(p.finishPosition);
    results.push({
      persistentId: record.id,
      tournamentPlayerId: p.id,
      name: p.name,
      finishPosition: p.finishPosition ?? null,
      rebuys: p.rebuys || 0,
      addOns: p.addOns || 0,
      eliminatedLevel: p.eliminatedLevel ?? null,
      buyInTotal,
      payout,
      netProfit: payout - buyInTotal,
      points: null, // reserved for Phase 2 season scoring
    });
  }

  const record = {
    id: crypto.randomUUID(),
    name: config.name,
    date: config.date,
    completedAt: Date.now(),
    config: { ...config },
    structureSummary: {
      template: structure.template,
      startingChips: structure.startingChips,
      levelDuration: structure.levelDuration,
      totalLevels: structure.levels?.length || 0,
    },
    prizePool,
    payoutMode: payouts.mode,
    seasonId,
    dedupKey,
    results,
    schemaVersion: 1,
  };

  await tournamentsRepo.add(record);

  // Roll results into lifetime player stats.
  for (const r of results) {
    await playersRepo.applyResultStats(r.persistentId, {
      tournamentsPlayed: 1,
      totalBuyIns: r.buyInTotal,
      totalCashes: r.payout,
      firstPlaces: r.finishPosition === 1 ? 1 : 0,
      finalTables: r.finishPosition && r.finishPosition <= FINAL_TABLE_SIZE ? 1 : 0,
      netProfit: r.netProfit,
    });
  }

  return record;
}
