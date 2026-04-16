import client from './client';

export const getDashboardStats = () => client.get('/dashboard/stats');
