import client from './client';

// Packing Jobs
export const getPackingJobs = (params) => client.get('/packing', { params });
export const getPackingJob  = (id)        => client.get(`/packing/${id}`);
export const createPackingJob = (data)    => client.post('/packing', data);
export const updatePackingJob = (id, data) => client.put(`/packing/${id}`, data);
export const addPackingItem   = (jobId, itemId, data) =>
  client.post(`/packing/${jobId}/items`, { item_id: itemId, ...data });
export const updatePackingItem = (jobId, itemId, data) =>
  client.put(`/packing/${jobId}/items/${itemId}`, data);
export const removePackingItem = (jobId, itemId) =>
  client.delete(`/packing/${jobId}/items/${itemId}`);
export const markAllPacked    = (id) => client.post(`/packing/${id}/mark-all-packed`);
export const shipPackingJob  = (id) => client.post(`/packing/${id}/ship`);

// Packing Templates
export const getPackingTemplates   = ()     => client.get('/packing/templates/list');
export const getPackingTemplate    = (id)   => client.get(`/packing/templates/${id}`);
export const createPackingTemplate = (data) => client.post('/packing/templates', data);
export const updatePackingTemplate = (id, data) => client.put(`/packing/templates/${id}`, data);
export const deletePackingTemplate = (id)   => client.delete(`/packing/templates/${id}`);
