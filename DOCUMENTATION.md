# Poker Director — Full Documentation

A lightweight, installable Progressive Web App for running home poker games —
tournaments and cash — across a season, with persistent players and a league
leaderboard. It runs **entirely in your browser**: no accounts, no server, no
internet required after the first load. All data lives on your device and can be
exported to a file for backup or transfer.

---

## 1. What it does at a glance

| Area | Capability |
|------|-----------|
| **Tournaments** | Guided setup, blind-level clock with breaks, audio alerts, rebuys/add-ons, eliminations → finishing positions, automatic payouts |
| **Cash games** | Track buy-ins (multiple per player), cash-outs, net results, session duration, table-balance check |
| **Players** | Persistent directory; profiles with lifetime stats and full tournament + cash history; type-ahead picker everywhere |
| **Seasons / league** | Create seasons, customizable points rules, live leaderboard with podium and finale qualifiers |
| **Spectator view** | Read-only TV/projector display of the live clock, blinds, players, and season top-3 |
| **Backup** | One-file JSON export/import of everything; auto-filled message templates |
| **PWA** | Installable, offline-capable, keeps the screen awake during play |

---

## 2. Architecture

```
React 18 + Vite (plain JavaScript, plain CSS with a CSS-variable theme system)
├── Tournament core .......... React Context + useReducer, persisted to localStorage
│                              (the live, in-progress event — high-frequency timer state)
├── Persistent layer ......... Dexie.js (IndexedDB) behind a repository data-access layer
│                              (players, completed tournaments, cash sessions, seasons, settings)
├── Routing .................. react-router-dom (HashRouter — works on GitHub Pages / any static host)
└── PWA ...................... service worker (offline cache) + web manifest + Screen Wake Lock
```

**Why two storage layers?** The tournament clock writes state on every tick — that
belongs in fast, synchronous `localStorage`. Everything that needs to be queried
across events (player history, season standings) lives in IndexedDB, which is
structured and queryable. The split keeps the original tournament engine fast and
untouched while the league features build alongside it.

**Data-access layer (DAL).** All reads/writes go through repository modules
(`src/data/repositories/*`) and services (`src/data/services/*`) — components never
touch Dexie directly. This means a future cloud backend (e.g. Supabase) could be
swapped in by reimplementing the repositories, with no UI changes.

### Directory map

```
src/
├── App.jsx                       # Router + providers; mounts the app shell
├── context/
│   ├── TournamentContext.jsx     # Live tournament state (reducer + localStorage)
│   └── DataContext.jsx           # Loads settings + DB availability on startup
├── routes/TournamentRoute.jsx    # Phase switch: setup → dashboard → winner
├── data/
│   ├── db.js                     # Dexie instance, 5 stores, graceful-open guard
│   ├── repositories/             # players, tournaments, cashSessions, seasons, settings
│   └── services/                 # archive, standings, cash, backup, link
├── utils/
│   ├── blindStructures.js        # 4 blind templates
│   ├── payoutCalculator.js       # field-size → paid places & split
│   ├── pointsCalculator.js       # season scoring (see §6)
│   ├── chipCalculator.js, audioManager.js, themes.js
├── hooks/                        # useTimer, useWakeLock, useLiveQuery
└── components/
    ├── Shell/                    # NavBar, AppShell (hides chrome during play/spectator)
    ├── Home/                     # Dashboard landing
    ├── Setup/ Dashboard/ Winner/ # Tournament flow (the original core)
    ├── Players/                  # Directory, cards, profile
    ├── Seasons/                  # Season form, leaderboard, page
    ├── Cash/                     # Session list, form, live view
    ├── Spectator/                # Read-only TV display
    ├── Settings/                 # Backup, sound, templates, danger zone
    └── Shared/PlayerPicker.jsx   # Type-ahead directory picker
```

---

## 3. Data model

All persistent records live in IndexedDB (`pokerDirectorDB`). Live tournament state
lives in `localStorage` under `pokerTournamentState`.

**Player** — `{ id, name, nameKey (lowercased match key), nickname, email, phone,
notes, createdAt, updatedAt, stats:{ tournamentsPlayed, cashSessionsPlayed,
totalBuyIns, totalCashes, firstPlaces, finalTables, netProfit }, archived }`

**Tournament (archived, completed only)** — `{ id, name, date, completedAt, config,
structureSummary, prizePool, payoutMode, seasonId, dedupKey, results:[{ persistentId,
tournamentPlayerId, name, finishPosition, rebuys, addOns, eliminatedLevel, buyInTotal,
payout, netProfit }] }`

**Cash session** — `{ id, name, date, gameType, stakes, notes, status('active'|'ended'),
startedAt, endedAt, seasonId, finalized, players:[{ persistentId, name, buyIns:[...],
buyInTotal, cashOut, netProfit }] }`

**Season** — `{ id, name, startDate, endDate, status, pointsRules (see §6), eventIds:[] }`

**Settings** (single row) — `{ defaultBuyIn, defaultTheme, soundEnabled, activeSeasonId,
lastBackupAt }`

### Player identity & linking
Players are identified by **nameKey** = the name lowercased and trimmed. When a
tournament starts, each entrant is resolved to a persistent record via
`playersRepo.ensureByName` (find-or-create) and the `persistentId` is stamped onto the
live player. At completion, the archive does the same for every result as a safety net,
so **anyone who plays an event automatically gets a directory entry**. The
PlayerPicker means you only ever type a name once — afterward you select them.

*Known limitation:* two different people with the same exact name collapse to one
directory entry. Use nicknames or a middle initial to disambiguate.

---

## 4. Tournament flow

1. **Setup wizard** — tournament info (name, date, buy-in, optional rebuys/add-ons) →
   players (pick from directory or add new; optional random seating) → blind structure
   (4 templates, all durations customizable) → chips → payouts (auto or custom) → review.
   The review screen shows which season the results will count toward.
2. **Live dashboard** — large level clock (color-coded; green → amber under 5 min → red
   under 1 min → blue on break), current/next blinds, automatic breaks, audio alerts,
   and Web Wake Lock so the screen stays on. Controls: pause/resume, advance/previous
   level, eliminate player, rebuy, add-on, quick-add player, blind schedule, payouts,
   sound toggle, spectator launch.
3. **Eliminations** assign finishing positions automatically in reverse order. When one
   player remains, the tournament auto-completes.
4. **Winner screen** — final standings, payouts, confetti. On completion the event is
   **archived to IndexedDB exactly once** (guarded by a deterministic dedup key), every
   participant's lifetime stats are updated, and if a season is active the event is added
   to it.

**Blind templates:** Deep Stack (20-min levels, 20k chips), Standard (15-min, 10k),
Turbo (10-min, 10k), Super Turbo (7-min, 5k). Antes are introduced in later levels.

**Payouts** scale with field size: 1–6 players pay 1 place, 7–9 pay 2, 10–18 pay 3,
19–27 pay 4, 28–36 pay 5, 37+ pay roughly the top 15%. Custom splits are also supported.
Prize pool = entries + rebuys + add-ons.

---

## 5. Cash game flow

1. **New session** — name, game type (NLH/PLO/…), stakes preset, notes. The session is
   saved to IndexedDB immediately, so it survives a refresh.
2. **Live tracking** — add players from the directory; record buy-ins (quick +20/+50/+100
   or custom; multiple allowed); enter cash-outs. Each player's running net and the table
   totals update live.
3. **End session** — freezes results, warns if cash-outs don't balance against buy-ins or
   if someone hasn't cashed out, then rolls results into player stats and (if a season is
   active) into the season. A session is finalized exactly once.

Net for a player = total cash-out − total buy-ins. A session left "active" simply stays
in the *In Progress* list until you end it.

---

## 6. Season / league scoring (default rules)

Points are computed **live from the archived events** using the season's current rules,
so adjusting the rules retroactively rescores the whole leaderboard. The defaults below
ship with every new season and are fully editable per season.

### Tournament points
For each tournament a player enters:

```
points = 25 (participation)
       + position points
       + 10 (final-table bonus, if they finish in the top 9)
```

**Position points** use a decay formula: `round(100 × 0.75^(place − 1))`. That yields:

| Place | Position pts | + Participation | + Final-table | **Total** |
|------:|-------------:|----------------:|--------------:|----------:|
| 1st | 100 | 25 | 10 | **135** |
| 2nd | 75 | 25 | 10 | **110** |
| 3rd | 56 | 25 | 10 | **91** |
| 4th | 42 | 25 | 10 | **77** |
| 5th | 32 | 25 | 10 | **67** |
| 6th | 24 | 25 | 10 | **59** |
| 7th | 18 | 25 | 10 | **53** |
| 8th | 13 | 25 | 10 | **48** |
| 9th | 10 | 25 | 10 | **45** |
| 10th | 8 | 25 | — | **33** |
| 11th+ | (continues to decay) | 25 | — | ~31 ↓ |

The big idea: **showing up is worth a guaranteed 25+**, finishing deep is worth a lot
more, and the gap between 1st and 10th (135 vs 33) rewards winning without making a
single bad night fatal to your season.

### Cash-game points
For each cash session a player attends:

```
points = 10 (attendance)
       + round(net profit ÷ hours played)   ← only when they finish ahead
```

A losing or break-even session still earns the 10 attendance points. (Cash points use a
multiplier of 1 point per $/hour by default.)

### Missing events
For every season event a player **did not** attend, they lose **5 points**. This is the
"come out and play" incentive — consistent attendance is rewarded in the standings.

### Leaderboard & ties
Standings are sorted by total points. Ties break by: **events played → wins → net
profit**. The top **6** players qualify for the season finale (configurable). The
leaderboard shows a podium for the top 3 and flags qualifiers with a ★.

### Editable knobs (per season)
Scoring system (decay formula **or** an explicit points-per-place table), participation
points, the decay rate / first-place value, final-table bonus & size, miss penalty,
number of finale qualifiers, and cash multipliers.

---

## 7. Spectator view

A clean, read-only display at `#/spectator` (the 📺 buttons on the dashboard and home
screen open it in a new tab — drag that tab to a TV or projector). It shows the big
clock, current and next blinds, players remaining with average stack, the eliminated
list with finishing places, and the season top-3.

It updates **within ~1 second** of the director's clock with **no server**: the director
tab saves state on every tick, and the browser broadcasts a `storage` event to the
spectator tab (a 1-second poll covers same-tab cases). Because it reads the local
tournament state, it works across tabs/windows on the same device.

---

## 8. Backup, restore & templates

- **Export** (Settings → Backup): writes a timestamped `poker-director-backup-YYYY-MM-DD.json`
  containing players, all archived tournaments, cash sessions, seasons, and settings. Uses
  the File System Access API where available, otherwise a normal download.
- **Import**: merges by record id; players additionally de-dupe by nameKey, so importing a
  friend's season won't create duplicate people. Runs in a single transaction and reports
  what was added/updated/skipped.
- **Message templates**: copy-paste blurbs for a group chat — a game invite, the current
  season standings (auto-filled), and the latest tournament's podium with payouts.
- **Danger zone**: clear-all-data, with a double confirmation and an export-first reminder.

**Moving to a new device:** export on the old device, open the app on the new one, import
the file. (Data is tied to the browser, so this is also how you'd recover after clearing
your cache.)

---

## 9. Limitations (by design — client-only)

- No real-time multi-device sync. Sharing is via the local spectator view or by exporting
  a backup. The data layer is structured so a cloud sync could be added later without a
  UI rewrite.
- Data lives in one browser. Use export/import to move or back up.
- No automated SMS/email — templates only.
- Tuned for home games: up to ~18 players / 2 tables and a season of ~10–24 events.
- If IndexedDB is unavailable (e.g. Safari Private Browsing), the tournament clock still
  runs fully on localStorage, but persistent features (players, seasons, cash, backup)
  are disabled and the app tells you so.

---

## 10. Running & deploying

- **Develop:** `npm install` then `npm run dev`.
- **Build:** `npm run build` → static files in `dist/` (works from any static host or a
  plain folder; `base: './'`).
- **Deploy:** pushing to `main` publishes to GitHub Pages via `.github/workflows/deploy.yml`.
- **Install as an app:** open the site, then "Add to Home Screen" / install from the
  browser. It works offline after the first load. When a new version ships, the service
  worker cache version bumps so devices pick up the update on next launch.
