import client from './client';

export const getInvoices = (params) => client.get('/invoices', { params });
export const getInvoice = (id) => client.get(`/invoices/${id}`);
export const createInvoice = (data) => client.post('/invoices', data);
export const updateInvoice = (id, data) => client.put(`/invoices/${id}`, data);
export const reconcileInvoice = (id) => client.post(`/invoices/${id}/reconcile`);
