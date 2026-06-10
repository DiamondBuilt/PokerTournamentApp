/**
 * Season points engine — pure functions over a season's `pointsRules`.
 *
 * Points are computed at read time (standingsService) from archived results,
 * not stored on the records, so editing a season's rules retroactively
 * recalculates the whole leaderboard — the right behavior for a home league.
 *
 * Two scoring systems:
 *  - 'formula': position points = round(base * decay^(position-1))
 *  - 'table':   explicit position -> points lookup (positions beyond the
 *               table earn 0 position points but still get participation)
 *
 * Both add flat participation points and a final-table bonus. A per-missed-
 * event penalty is applied during standings aggregation (it depends on the
 * season's total event count, which individual results don't know).
 */
export const DEFAULT_POINTS_RULES = {
  system: 'formula',
  participation: 25,
  formula: { base: 100, decay: 0.75 },
  table: { 1: 100, 2: 75, 3: 60, 4: 50, 5: 40, 6: 30, 7: 25, 8: 20, 9: 15 },
  finalTableBonus: 10,
  finalTableSize: 9,
  missPenalty: 5,
  finaleQualifiers: 6,
  cash: { pointsPerProfitHour: 1, attendance: 10 },
};

/** Merge stored rules over defaults so older seasons pick up new fields. */
export function normalizeRules(rules) {
  return {
    ...DEFAULT_POINTS_RULES,
    ...(rules || {}),
    formula: { ...DEFAULT_POINTS_RULES.formula, ...(rules?.formula || {}) },
    table: rules?.table && Object.keys(rules.table).length ? rules.table : DEFAULT_POINTS_RULES.table,
    cash: { ...DEFAULT_POINTS_RULES.cash, ...(rules?.cash || {}) },
  };
}

export function positionPoints(rules, finishPosition) {
  if (!finishPosition || finishPosition < 1) return 0;
  if (rules.system === 'table') {
    return Number(rules.table[finishPosition]) || 0;
  }
  const { base, decay } = rules.formula;
  return Math.round(base * Math.pow(decay, finishPosition - 1));
}

/** Points one archived tournament result row earns under these rules. */
export function scoreTournamentResult(rules, result) {
  let points = rules.participation + positionPoints(rules, result.finishPosition);
  if (result.finishPosition && result.finishPosition <= rules.finalTableSize) {
    points += rules.finalTableBonus;
  }
  return points;
}

/**
 * Points one cash-session player row earns: flat attendance plus profit per
 * hour played (used by Phase 3; sessions without a duration only earn
 * attendance).
 */
export function scoreCashResult(rules, row, durationMs) {
  let points = rules.cash.attendance;
  const hours = durationMs > 0 ? durationMs / 3_600_000 : 0;
  if (hours > 0 && row.netProfit > 0) {
    // Floor the effective duration so a very short session (e.g. someone who
    // bought in and cashed out in minutes) can't explode profit-per-hour into
    // an absurd point total.
    const effectiveHours = Math.max(hours, MIN_CASH_HOURS);
    points += Math.round((row.netProfit / effectiveHours) * rules.cash.pointsPerProfitHour);
  }
  return points;
}

/** Sessions shorter than this are scored as if they ran this long. */
const MIN_CASH_HOURS = 0.5;
