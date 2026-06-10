import { useLiveQuery as useDexieLiveQuery } from 'dexie-react-hooks';

/**
 * Thin wrapper around dexie-react-hooks so the rest of the app has a single
 * dependency point on Dexie's live-query mechanism. A future cloud backend
 * swap replaces this one file (e.g. with a realtime subscription) instead of
 * every component.
 *
 * `querier` is an async function returning the data; it re-runs whenever the
 * underlying Dexie tables it touches change.
 */
export function useLiveQuery(querier, deps = [], defaultValue) {
  return useDexieLiveQuery(querier, deps, defaultValue);
}
