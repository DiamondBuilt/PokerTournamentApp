export const THEMES = {
  dark:     { name: 'Dark Poker',    bg: '#0a1628', surface: '#111827', card: '#1f2937', border: '#374151', gold: '#f59e0b', goldDark: '#b45309' },
  casino:   { name: 'Casino Royale', bg: '#1a0a0a', surface: '#231010', card: '#2d1515', border: '#4d2020', gold: '#f59e0b', goldDark: '#b45309' },
  vegas:    { name: 'Vegas Night',   bg: '#0d0a1a', surface: '#120f26', card: '#1c1836', border: '#2d2854', gold: '#e879f9', goldDark: '#c026d3' },
  felt:     { name: 'Green Felt',    bg: '#052e16', surface: '#064e3b', card: '#065f46', border: '#0f766e', gold: '#fde047', goldDark: '#ca8a04' },
  midnight: { name: 'Midnight Blue', bg: '#0a1628', surface: '#0f2340', card: '#163354', border: '#1e4976', gold: '#38bdf8', goldDark: '#0284c7' },
};

export const THEME_KEYS = Object.keys(THEMES);

export function applyTheme(key) {
  const t = THEMES[key] ?? THEMES.dark;
  const r = document.documentElement.style;
  r.setProperty('--bg', t.bg);
  r.setProperty('--surface', t.surface);
  r.setProperty('--card', t.card);
  r.setProperty('--border', t.border);
  r.setProperty('--gold', t.gold);
  r.setProperty('--gold-dark', t.goldDark);
}
