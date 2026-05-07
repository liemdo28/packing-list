import { useState, useEffect, useCallback } from 'react';
import { getUnreadCount } from '../api/notifications';
import { useAuth } from './useAuth';

export function useNotifications(pollInterval = 10000) {
  const [unreadCount, setUnreadCount] = useState(0);
  const { isAuthenticated } = useAuth();

  const fetchCount = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await getUnreadCount();
      setUnreadCount(res.data.data.count);
    } catch (err) {
      // Silently fail for polling
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, pollInterval);
    return () => clearInterval(interval);
  }, [fetchCount, pollInterval]);

  return { unreadCount, refetch: fetchCount };
}
