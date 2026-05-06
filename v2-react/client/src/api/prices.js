import client from './client';

export const getPrices = (params) => client.get('/prices', { params });
export const getPrice = (id) => client.get(`/prices/${id}`);
export const createPrice = (data) => client.post('/prices', data);
export const updatePrice = (id, data) => client.put(`/prices/${id}`, data);
export const getPriceHistory = (itemId) => client.get(`/prices/history/${itemId}`);

// Admin pricing dashboard
export const getAdminPricingSyncStatus = () => client.get('/admin/pricing/sync/status');
export const getAdminPricingSyncHistory = (limit) => client.get('/admin/pricing/sync/history', { params: { limit } });
export const triggerPricingSync = () => client.post('/admin/pricing/sync');
export const getAdminMissingPrices = () => client.get('/admin/pricing/missing');
export const getAdminPriceAudit = (params) => client.get('/admin/pricing/audit', { params });
export const getAdminCurrentPrices = () => client.get('/admin/pricing/prices');
