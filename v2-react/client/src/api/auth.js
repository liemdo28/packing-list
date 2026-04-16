import client from './client';

export const login = (credentials) => client.post('/auth/login', credentials);
export const logout = () => client.post('/auth/logout');
export const getMe = () => client.get('/auth/me');
