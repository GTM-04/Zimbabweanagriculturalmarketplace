// ============================================================================
// Reactive Online/Offline Status Hook
// ============================================================================

import { useEffect, useState } from 'react';

/**
 * Returns a reactive boolean indicating whether the browser is currently online.
 * Subscribes to the browser's native `online` and `offline` events so the
 * value updates immediately whenever connectivity changes — unlike the
 * one-shot `navigator.onLine` snapshot.
 */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
