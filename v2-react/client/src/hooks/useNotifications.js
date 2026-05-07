/**
 * useNotifications Hook
 * Handles polling for real-time notifications
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../api/axios';

const POLL_INTERVAL = 15000; // Poll every 15 seconds

export default function useNotifications(userId) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await api.get('/notifications', {
        params: { limit: 20 },
      });
      if (response.data?.data) {
        setNotifications(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err.message);
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await api.get('/notifications/unread-count');
      if (response.data?.data?.count !== undefined) {
        setUnreadCount(response.data.data.count);
      }
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  }, []);

  const markAsRead = useCallback(async (notificationId) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  }, []);

  const refresh = useCallback(async () => {
    await Promise.all([fetchNotifications(), fetchUnreadCount()]);
  }, [fetchNotifications, fetchUnreadCount]);

  // Initial fetch and polling setup
  useEffect(() => {
    if (!userId) return;

    const init = async () => {
      setLoading(true);
      await refresh();
      setLoading(false);
    };

    init();

    // Start polling
    intervalRef.current = setInterval(() => {
      fetchUnreadCount();
    }, POLL_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [userId, fetchUnreadCount, refresh]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    refresh,
  };
}