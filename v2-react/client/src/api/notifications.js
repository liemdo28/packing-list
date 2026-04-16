import client from './client';

export const getNotifications = (params) => client.get('/notifications', { params });
export const getUnreadCount = () => client.get('/notifications/unread-count');
export const markAsRead = (id) => client.put(`/notifications/${id}/read`);
export const markAllAsRead = () => client.put('/notifications/read-all');
