export const PAYOUT_TIERS = [
  { maxPlayers: 6,  positions: 1, splits: [100] },
  { maxPlayers: 9,  positions: 2, splits: [65, 35] },
  { maxPlayers: 18, positions: 3, splits: [50, 30, 20] },
  { maxPlayers: 27, positions: 4, splits: [45, 28, 18, 9] },
  { maxPlayers: 36, positions: 5, splits: [40, 25, 18, 11, 6] },
  { maxPlayers: Infinity, positions: null, splits: null }, // custom handled below
];

export function getAutoPayoutTier(playerCount) {
  for (const tier of PAYOUT_TIERS) {
    if (playerCount <= tier.maxPlayers) return tier;
  }
  return PAYOUT_TIERS[PAYOUT_TIERS.length - 1];
}

export function calculatePayouts(totalPrizePool, playerCount, customSplit = null) {
  let splits;
  let positions;

  if (customSplit && customSplit.length > 0) {
    splits = customSplit;
    positions = customSplit.length;
  } else {
    const tier = getAutoPayoutTier(playerCount);
    if (tier.splits) {
      splits = tier.splits;
      positions = tier.positions;
    } else {
      // 37+ players: top ~15% of field
      positions = Math.max(6, Math.round(playerCount * 0.15));
      splits = generateLargeTournamentSplits(positions);
    }
  }

  return splits.map((pct, idx) => ({
    position: idx + 1,
    percentage: pct,
    amount: Math.round((totalPrizePool * pct) / 100),
  }));
}

function generateLargeTournamentSplits(positions) {
  // Reasonable split for large fields
  const presets = {
    6:  [35, 22, 15, 12, 9, 7],
    7:  [33, 21, 15, 11, 9, 7, 4],
    8:  [31, 20, 14, 11, 9, 7, 5, 3],
    9:  [30, 19, 13, 10, 8, 7, 5, 4, 4],
    10: [28, 18, 13, 10, 8, 6, 5, 4, 4, 4],
  };

  if (presets[positions]) return presets[positions];

  // Generic fallback: geometric decay
  const splits = [];
  let remaining = 100;
  for (let i = 0; i < positions; i++) {
    const share = i === positions - 1
      ? remaining
      : Math.max(2, Math.round(remaining * 0.25));
    splits.push(share);
    remaining -= share;
  }
  return splits;
}

export function calculateTotalPrizePool(config, playerCount) {
  const entries = playerCount * (config.buyIn || 0);
  return entries;
}

export function formatMoney(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
