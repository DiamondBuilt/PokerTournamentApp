/**
 * Generic CRUD factory over a Dexie table. Repositories build on this and
 * add their own domain queries. Components and services import repositories,
 * never the Dexie `db` directly — so a future cloud backend can replace the
 * repository internals while keeping these async signatures.
 */
export function makeRepo(table) {
  return {
    table,
    getAll: () => table.toArray(),
    getById: (id) => table.get(id),
    upsert: (record) => table.put({ ...record, updatedAt: Date.now() }),
    bulkUpsert: (records) => table.bulkPut(records),
    remove: (id) => table.delete(id),
    count: () => table.count(),
  };
}
