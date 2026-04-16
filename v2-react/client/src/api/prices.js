import client from './client';

export const getPrices = (params) => client.get('/prices', { params });
export const getPrice = (id) => client.get(`/prices/${id}`);
export const createPrice = (data) => client.post('/prices', data);
export const getPriceHistory = (itemId) => client.get(`/prices/history/${itemId}`);
