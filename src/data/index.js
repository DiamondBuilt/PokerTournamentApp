// Data-access layer barrel. Import repositories/services from here; never
// reach into Dexie (`db`) directly from UI code so a future cloud backend can
// swap the internals behind these same async signatures.
export { db, openDb, isDbAvailable } from './db';
export { playersRepo, toNameKey, makePlayer } from './repositories/playersRepo';
export { tournamentsRepo } from './repositories/tournamentsRepo';
export { cashSessionsRepo } from './repositories/cashSessionsRepo';
export { seasonsRepo } from './repositories/seasonsRepo';
export { settingsRepo, DEFAULT_SETTINGS } from './repositories/settingsRepo';
export { linkPlayers } from './services/linkService';
export { archiveCurrentTournament } from './services/archiveService';
export { exportAll, importFile, buildBackup } from './services/backupService';
