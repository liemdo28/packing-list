import { useState, useRef, useCallback } from 'react';

/**
 * Wraps any async action with:
 * - disable-after-click (prevents double-fire)
 * - error capture
 * - loading state for UI feedback
 *
 * Usage:
 *   const { execute, loading, error } = useAction(api.orders.complete)
 *   <button onClick={() => execute(orderId)} disabled={loading}>Complete</button>
 */
export function useAction(actionFn) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const inFlightRef = useRef(false);

  const execute = useCallback(async (...args) => {
    if (inFlightRef.current) return; // hard block — no double fire
    inFlightRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const result = await actionFn(...args);
      return result;
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || 'Action failed');
      throw err;
    } finally {
      inFlightRef.current = false;
      setLoading(false);
    }
  }, [actionFn]);

  const reset = useCallback(() => {
    setError(null);
    setLoading(false);
    inFlightRef.current = false;
  }, []);

  return { execute, loading, error, reset };
}
