import { playersRepo } from '../repositories/playersRepo';
import { openDb } from '../db';

/**
 * Resolve each ephemeral tournament player to a persistent player record,
 * creating records on first participation. Returns `[{ id, persistentId }]`
 * pairs keyed by the ephemeral player's id so the caller can stamp the
 * persistentId back onto the live tournament state.
 *
 * Note: two players with the same name in one event collapse to a single
 * persistent record (acceptable for now); the per-event id is preserved
 * elsewhere so identity is never lost.
 */
export async function linkPlayers(players) {
  const ok = await openDb();
  if (!ok) return [];
  const links = [];
  for (const p of players) {
    if (!p?.name) continue;
    const record = await playersRepo.ensureByName(p.name);
    links.push({ id: p.id, persistentId: record.id });
  }
  return links;
}
