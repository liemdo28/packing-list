import client from './client';

export const getMonthlySummary = (params) => client.get('/summary/monthly', { params });
export const getYearlySummary = (params) => client.get('/summary/yearly', { params });
export const getPairSummary = (from, to, params) => client.get(`/summary/pair/${from}/${to}`, { params });
export const exportExcel = (params) => client.get('/export/excel', { params, responseType: 'blob' });
export const exportPdf = (params) => client.get('/export/pdf', { params, responseType: 'blob' });
