import { useState, useEffect } from 'react';

/**
 * Like useState but synced to localStorage.
 * Reading is synchronous (initialised on first render from storage).
 * Writing is batched by useEffect so React state stays the source of truth.
 */
export function useStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const raw = window.localStorage.getItem(key);
      return raw !== null ? JSON.parse(raw) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch {
      // Ignore quota / private-mode errors
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}
