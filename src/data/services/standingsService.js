import { seasonsRepo } from '../repositories/seasonsRepo';
import { tournamentsRepo } from '../repositories/tournamentsRepo';
import { cashSessionsRepo } from '../repositories/cashSessionsRepo';
import {
  normalizeRules,
  scoreTournamentResult,
  scoreCashResult,
} from '../../utils/pointsCalculator';

function emptyStanding(persistentId, name) {
  return {
    persistentId,
    name,
    points: 0,
    eventsPlayed: 0,
    missed: 0,
    wins: 0,
    finalTables: 0,
    bestFinish: null,
    netProfit: 0,
  };
}

/**
 * Compute a season's live leaderboard from its archived events.
 *
 * Points are derived on read with the season's current rules (see
 * pointsCalculator). The miss penalty is applied here: players are docked
 * `missPenalty` per season event they didn't attend, which rewards the
 * spec's "show up" emphasis. Ties break by events played, then wins, then
 * net profit.
 */
export async function computeStandings(seasonId) {
  const season = await seasonsRepo.getById(seasonId);
  if (!season) return null;

  const rules = normalizeRules(season.pointsRules);
  const [tournaments, cashSessions] = await Promise.all([
    tournamentsRepo.getBySeason(seasonId),
    cashSessionsRepo.getBySeason(seasonId),
  ]);

  const events = [
    ...tournaments.map((t) => ({ kind: 'tournament', when: t.completedAt || 0, record: t })),
    ...cashSessions.map((c) => ({ kind: 'cash', when: c.startedAt || 0, record: c })),
  ].sort((a, b) => b.when - a.when);

  const totalEvents = events.length;
  const map = new Map();
  const get = (persistentId, name) => {
    if (!map.has(persistentId)) map.set(persistentId, emptyStanding(persistentId, name));
    const s = map.get(persistentId);
    s.name = name || s.name;
    return s;
  };

  for (const t of tournaments) {
    for (const r of t.results || []) {
      if (!r.persistentId) continue;
      const s = get(r.persistentId, r.name);
      s.points += scoreTournamentResult(rules, r);
      s.eventsPlayed += 1;
      s.netProfit += r.netProfit || 0;
      if (r.finishPosition === 1) s.wins += 1;
      if (r.finishPosition && r.finishPosition <= rules.finalTableSize) s.finalTables += 1;
      if (r.finishPosition && (s.bestFinish == null || r.finishPosition < s.bestFinish)) {
        s.bestFinish = r.finishPosition;
      }
    }
  }

  for (const c of cashSessions) {
    const durationMs = c.endedAt && c.startedAt ? c.endedAt - c.startedAt : 0;
    for (const row of c.players || []) {
      if (!row.persistentId) continue;
      const s = get(row.persistentId, row.name);
      s.points += scoreCashResult(rules, row, durationMs);
      s.eventsPlayed += 1;
      s.netProfit += row.netProfit || 0;
    }
  }

  const standings = [...map.values()].map((s) => {
    const missed = Math.max(0, totalEvents - s.eventsPlayed);
    return { ...s, missed, points: s.points - missed * rules.missPenalty };
  });

  standings.sort(
    (a, b) =>
      b.points - a.points ||
      b.eventsPlayed - a.eventsPlayed ||
      b.wins - a.wins ||
      b.netProfit - a.netProfit
  );

  return { season, rules, standings, totalEvents, events };
}
