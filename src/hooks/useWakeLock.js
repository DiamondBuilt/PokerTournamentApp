import { useEffect, useRef } from 'react';

/**
 * Keeps the screen awake while `active` is true using the Screen Wake Lock API.
 * Essential for a tournament clock that sits on a table for long levels.
 * Silently no-ops on browsers without support (e.g. older iOS Safari).
 * Re-acquires the lock when the tab becomes visible again, since the browser
 * releases it automatically when the page is hidden.
 */
export function useWakeLock(active) {
  const lockRef = useRef(null);

  useEffect(() => {
    if (!('wakeLock' in navigator)) return undefined;

    let cancelled = false;

    const request = async () => {
      if (!active || document.visibilityState !== 'visible') return;
      try {
        lockRef.current = await navigator.wakeLock.request('screen');
      } catch {
        /* user agent may reject (low battery, permissions) — ignore */
      }
    };

    const release = async () => {
      try {
        await lockRef.current?.release();
      } catch {
        /* ignore */
      }
      lockRef.current = null;
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible' && active && !cancelled) request();
    };

    if (active) request();
    else release();

    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibility);
      release();
    };
  }, [active]);
}
