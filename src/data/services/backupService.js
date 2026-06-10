import { db, openDb } from '../db';
import { playersRepo, toNameKey } from '../repositories/playersRepo';
import { settingsRepo } from '../repositories/settingsRepo';

const BACKUP_FORMAT = 'poker-director-backup';
const BACKUP_VERSION = 1;

/** Gather every persistent record into one backup object. */
export async function buildBackup() {
  await openDb();
  const [players, tournaments, cashSessions, seasons, settings] = await Promise.all([
    db.players.toArray(),
    db.tournaments.toArray(),
    db.cashSessions.toArray(),
    db.seasons.toArray(),
    settingsRepo.get(),
  ]);
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: Date.now(),
    app: { name: 'Poker Director' },
    data: { players, tournaments, cashSessions, seasons, settings },
  };
}

/**
 * Export all data to a single timestamped JSON file. Uses the File System
 * Access API where available, falling back to an anchor download.
 */
export async function exportAll() {
  const backup = await buildBackup();
  const json = JSON.stringify(backup, null, 2);
  const stamp = new Date().toISOString().slice(0, 10);
  const filename = `poker-director-backup-${stamp}.json`;

  if (window.showSaveFilePicker) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: filename,
        types: [{ description: 'JSON backup', accept: { 'application/json': ['.json'] } }],
      });
      const writable = await handle.createWritable();
      await writable.write(json);
      await writable.close();
      await settingsRepo.patch({ lastBackupAt: Date.now() });
      return { saved: true, filename };
    } catch (err) {
      if (err?.name === 'AbortError') return { saved: false, cancelled: true };
      // fall through to anchor download
    }
  }

  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  await settingsRepo.patch({ lastBackupAt: Date.now() });
  return { saved: true, filename };
}

/**
 * Restore from a backup file, merging by primary id (Dexie `put` upserts).
 * Players are additionally de-duplicated by nameKey: an incoming player whose
 * nameKey already exists under a different id is skipped to avoid duplicates.
 * Runs in a single transaction. Returns a per-table summary.
 */
export async function importFile(file) {
  await openDb();
  const text = await file.text();
  let backup;
  try {
    backup = JSON.parse(text);
  } catch {
    throw new Error('Not a valid JSON file.');
  }
  if (backup?.format !== BACKUP_FORMAT) {
    throw new Error('Unrecognized backup file.');
  }
  if (typeof backup.version === 'number' && backup.version > BACKUP_VERSION) {
    throw new Error('Backup was created by a newer version of the app.');
  }

  const data = backup.data || {};
  const summary = {
    players: { added: 0, updated: 0, skipped: 0 },
    tournaments: { added: 0, updated: 0 },
    cashSessions: { added: 0, updated: 0 },
    seasons: { added: 0, updated: 0 },
    settings: false,
  };

  await db.transaction(
    'rw',
    db.players,
    db.tournaments,
    db.cashSessions,
    db.seasons,
    db.settings,
    async () => {
      // Players: merge by id, guard against nameKey collisions. Build a map
      // from each incoming player id to the local id we'll actually use, so
      // event records that reference a skipped player get remapped to the
      // existing local record instead of pointing at a missing id.
      const existingPlayers = await db.players.toArray();
      const byId = new Map(existingPlayers.map((p) => [p.id, p]));
      const byNameKey = new Map(existingPlayers.map((p) => [p.nameKey, p]));
      const idMap = new Map();
      for (const incoming of data.players || []) {
        const nameKey = incoming.nameKey || toNameKey(incoming.name);
        const sameId = byId.get(incoming.id);
        const sameName = byNameKey.get(nameKey);
        if (sameId) {
          await db.players.put({ ...incoming, nameKey });
          idMap.set(incoming.id, incoming.id);
          summary.players.updated += 1;
        } else if (sameName) {
          // A different id but a name we already have — keep existing, and
          // remap this incoming id onto it.
          idMap.set(incoming.id, sameName.id);
          summary.players.skipped += 1;
        } else {
          await db.players.put({ ...incoming, nameKey });
          byNameKey.set(nameKey, { ...incoming, nameKey });
          idMap.set(incoming.id, incoming.id);
          summary.players.added += 1;
        }
      }

      const remapId = (pid) => idMap.get(pid) || pid;
      await mergeTable(db.tournaments, data.tournaments, summary.tournaments, (t) => ({
        ...t,
        results: (t.results || []).map((r) => ({ ...r, persistentId: remapId(r.persistentId) })),
      }));
      await mergeTable(db.cashSessions, data.cashSessions, summary.cashSessions, (c) => ({
        ...c,
        players: (c.players || []).map((p) => ({ ...p, persistentId: remapId(p.persistentId) })),
      }));
      await mergeTable(db.seasons, data.seasons, summary.seasons);

      if (data.settings) {
        await settingsRepo.replace(data.settings);
        summary.settings = true;
      }
    }
  );

  return summary;
}

async function mergeTable(table, records, counter, transform) {
  for (const rec of records || []) {
    const out = transform ? transform(rec) : rec;
    const existing = await table.get(out.id);
    await table.put(out);
    if (existing) counter.updated += 1;
    else counter.added += 1;
  }
}
