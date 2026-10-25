import api from './axiosConfig';
export const getDashboard = config => api.get('/admin/dashboard', config);
export const getUsers = (params, signal) => api.get('/admin/users', { params, signal });
export const getUser = (id, signal) => api.get('/admin/users/' + id, { signal });
export const setUserLock = (id, locked, reason) => api.patch('/admin/users/' + id + (locked ? '/lock' : '/unlock'), locked ? { reason } : undefined);
export const getAuditLogs = (params, signal) => api.get('/admin/audit-logs', { params, signal });
