import client from './client';

export const getOrders = (params) => client.get('/orders', { params });
export const getOrder = (id) => client.get(`/orders/${id}`);
export const createOrder = (data) => client.post('/orders', data);
export const updateOrder = (id, data) => client.put(`/orders/${id}`, data);
export const submitOrder = (id) => client.post(`/orders/${id}/submit`);
export const acceptOrder = (id, data) => client.post(`/orders/${id}/accept`, data);
export const rejectOrder = (id, data) => client.post(`/orders/${id}/reject`, data);
export const prepareOrder = (id) => client.post(`/orders/${id}/prepare`);
export const shipOrder = (id) => client.post(`/orders/${id}/ship`);
export const receiveOrder = (id, data) => client.post(`/orders/${id}/receive`, data);
export const completeOrder = (id) => client.post(`/orders/${id}/complete`);
export const cancelOrder = (id, data) => client.post(`/orders/${id}/cancel`, data);
