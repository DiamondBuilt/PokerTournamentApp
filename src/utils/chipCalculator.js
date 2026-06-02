export const CHIP_PRESETS = [
  { name: 'Common Home Game',  denominations: [1, 5, 25, 100, 500] },
  { name: 'Larger Stakes',     denominations: [25, 100, 500, 1000, 5000] },
  { name: 'Tournament Grade',  denominations: [5, 10, 25, 100, 500, 1000] },
];

// Returns [{denomination, count, subtotal}] whose subtotals sum to ~startingChips.
// Assigns decreasing counts per denomination (more small chips, fewer large),
// then adjusts the largest denomination's count to hit startingChips exactly.
export function recommendDistribution(startingChips, denominations) {
  const usable = [...denominations]
    .filter((d) => Number.isFinite(d) && d >= 1 && d <= startingChips / 4)
    .sort((a, b) => a - b);
  if (!usable.length) return [];

  const baseCount = 10;
  const step = usable.length > 1 ? (baseCount - 2) / (usable.length - 1) : 0;
  const counts = usable.map((_, i) => Math.round(baseCount - i * step));

  const subtotal = usable
    .slice(0, -1)
    .reduce((s, d, i) => s + d * counts[i], 0);
  const lastDenom = usable[usable.length - 1];
  const lastCount = Math.max(0, Math.round((startingChips - subtotal) / lastDenom));

  return usable.map((d, i) => {
    const count = i === usable.length - 1 ? lastCount : counts[i];
    return { denomination: d, count, subtotal: d * count };
  });
}

// Returns per-denomination totals needed for all players including a rebuy buffer.
export function totalChipsNeeded(distribution, playerCount, extraStacks = 0) {
  return distribution.map(({ denomination, count }) => ({
    denomination,
    totalCount: count * (playerCount + extraStacks),
  }));
}

// Returns a human-readable coverage note about whether the denomination set
// covers early blind levels adequately.
export function getCoverageNote(distribution, levels) {
  if (!distribution.length || !levels?.length) return null;
  const smallest = distribution[0].denomination;
  const firstSB = levels[0].sb;
  if (smallest > firstSB) {
    return {
      type: 'warning',
      text: `Level 1 small blind is ${firstSB.toLocaleString()} but your smallest chip is ${smallest.toLocaleString()}. Players may have trouble making change for antes and small bets.`,
    };
  }
  return {
    type: 'ok',
    text: `Level 1 small blind is ${firstSB.toLocaleString()} — your ${smallest.toLocaleString()} chip covers it well.`,
  };
}
