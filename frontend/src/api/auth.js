import { api } from './client';

export const login = (username, password) =>
  api.post('/auth/login', { username, password }).then((res) => res.data);

export const register = (username, password, role) =>
  api.post('/auth/register', { username, password, role }).then((res) => res.data);

export const logout = () => api.post('/auth/logout').then((res) => res.data);

export const me = () => api.get('/auth/me').then((res) => res.data);
