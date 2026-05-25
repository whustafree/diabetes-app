import { useState, useEffect } from 'react';
import { getPendingCount } from './offlineQueue';

// ─── Network Status Hook ───

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(getPendingCount());

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setPendingCount(getPendingCount());
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    // Listen for storage events (changes from other tabs)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'diabetes-app-offline-queue') {
        setPendingCount(getPendingCount());
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('storage', handleStorage);

    // Poll for queue changes every 2s (catches local changes)
    const interval = setInterval(() => {
      setPendingCount(getPendingCount());
    }, 2000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('storage', handleStorage);
      clearInterval(interval);
    };
  }, []);

  return { isOnline, pendingCount };
}

// ─── Simple status helpers ───

export function isNavigatorOnline(): boolean {
  return navigator.onLine;
}
