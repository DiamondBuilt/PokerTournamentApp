# ♠ Poker Tournament Director

A complete poker tournament director for home games and clubs. It walks you
from planning through the final payout: pick a blind structure, register
players, run a level timer you can pause and resume, knock players out, and
crown the winner with the prize automatically calculated.

Runs entirely in the browser. No account, no server, no data leaves the
device — tournament state is saved to local storage and the app works
**offline** once loaded, so a tablet on the table keeps the clock running
even if Wi‑Fi drops.

---

## Features

- **Guided setup wizard** — tournament info, players, blind structure,
  payouts, and a final review before you start.
- **Best‑practice blind structures**, ready to use:
  | Structure | Level length | Starting stack | Starting BB | Levels |
  |-----------|:------------:|:--------------:|:-----------:|:------:|
  | Deep Stack   | 20 min | 20,000 | 200 BB | 20 |
  | Standard     | 15 min | 10,000 | 200 BB | 16 |
  | Turbo        | 10 min | 10,000 | 100 BB | 14 |
  | Super Turbo  |  7 min |  5,000 |  25 BB | 12 |

  Antes are introduced mid‑tournament and blinds escalate on a smooth curve.
  Level length, break length, and starting chips are all adjustable.
- **Level timer** with start / pause / resume, jump to next or previous level,
  and **scheduled breaks** with their own countdown. The clock is anchored to
  real (wall‑clock) time, so it stays accurate even if the tab is backgrounded.
- **Audio alerts** — warning beeps at 60s / 30s / 10s and a final 5‑second
  countdown, plus a chime when the level changes or a break starts. Mutable
  from the dashboard.
- **Screen stays awake** while the clock runs (Screen Wake Lock API), so the
  display doesn't sleep mid‑level.
- **Player management** — add players up front or on the fly, random seat
  draw, eliminate with one tap (finishing position is assigned automatically),
  and optional **rebuys** and **add‑ons** with configurable limits.
- **Smart payouts** — the paid places and split are derived from the field
  size using standard structures, or define your own custom split (validated
  to total 100%). The live prize pool includes buy‑ins, rebuys, and add‑ons.
- **Printable blind schedule** showing every level, blinds, antes, breaks, and
  elapsed time.
- **Winner screen** with final standings, payouts per place, and a prize‑pool
  breakdown.
- **Installable PWA** — add it to a phone, tablet, or desktop home screen and
  launch it full‑screen like a native app.

---

## Quick start

Requires [Node.js](https://nodejs.org/) 18 or newer.

```bash
npm install      # install dependencies
npm run dev      # start the dev server (http://localhost:5173)
```

### Build for production

```bash
npm run build    # outputs a static site to dist/
npm run preview  # serve the built site locally to check it
```

The contents of `dist/` are a fully static site — host them anywhere.

---

## Deploying

The build uses **relative asset paths**, so it works from a domain root or any
sub‑path without configuration.

- **Netlify / Vercel / Cloudflare Pages** — point the project at this repo,
  set the build command to `npm run build` and the publish directory to
  `dist`.
- **GitHub Pages** — the included workflow at
  [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) builds and
  publishes `dist` automatically. Enable Pages for the repo
  (Settings → Pages → Source: **GitHub Actions**) and push to `main`.
- **Any static host / file share** — copy the `dist/` folder.

> Offline support (the service worker) requires the site to be served over
> **HTTPS** or `localhost`, per browser rules. To bump the offline cache after
> a deploy, increment `CACHE_VERSION` in [`public/sw.js`](public/sw.js).

---

## How to run a tournament

1. **Tournament Info** — name, date, buy‑in, and optionally enable rebuys and
   add‑ons (with their cost, chips, and limits).
2. **Players** — type names one at a time or paste a list in bulk, then draw
   random seats. You can also add players after the tournament starts.
3. **Blind Structure** — choose a template; tweak level/break length and
   starting chips if you like. The full level preview updates live.
4. **Payouts** — keep the recommended auto split or enter a custom one.
5. **Review & Start** — confirm everything and start the clock.

During play, use the dashboard to pause/resume, advance levels, eliminate
players (with optional rebuy), and open the blind schedule or payout sheet.
When one player remains, the winner screen appears with the final results.

State is saved automatically. If you reload, the tournament reloads **paused**
so the clock never advances without you.

---

## Chip & blind guidance

Good structures keep play deep enough to reward skill without dragging on:

- **Starting stack of 100–200 big blinds** is the sweet spot for a home game.
  The Standard and Deep Stack templates start at 200 BB; Turbo at 100 BB.
- **Blinds roughly 1.3×–1.5× per level** so stacks shorten gradually rather
  than in cliffs.
- **Introduce antes** around the point the average stack drops under ~40 BB to
  build pots and encourage action — the templates do this automatically.
- **Match the structure to your time budget:** Deep/Standard for an evening,
  Turbo/Super Turbo when you need a result fast.

---

## Tech

[React 18](https://react.dev/) + [Vite](https://vitejs.dev/), plain CSS, and a
small amount of the Web Audio, Screen Wake Lock, and Service Worker APIs. No
runtime dependencies beyond React. State lives in a single reducer
(`src/context/TournamentContext.jsx`) and is persisted to local storage.

```
src/
├── context/TournamentContext.jsx   # global state + reducer + persistence
├── hooks/
│   ├── useTimer.js                 # wall‑clock level/break timer + audio
│   └── useWakeLock.js              # keep the screen awake while running
├── utils/
│   ├── blindStructures.js          # the four blind templates
│   ├── payoutCalculator.js         # field‑size → paid places & split
│   └── audioManager.js             # Web Audio beeps and chimes
└── components/                     # Setup wizard, Dashboard, Winner, etc.
```

---

## License

[MIT](LICENSE) © 2026 DiamondBuilt
