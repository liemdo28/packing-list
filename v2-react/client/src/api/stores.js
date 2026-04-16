import client from './client';

export const getStores = () => client.get('/stores');
export const getStore = (id) => client.get(`/stores/${id}`);
export const createStore = (data) => client.post('/stores', data);
export const updateStore = (id, data) => client.put(`/stores/${id}`, data);
export const deleteStore = (id) => client.delete(`/stores/${id}`);
