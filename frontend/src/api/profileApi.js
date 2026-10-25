import api from './axiosConfig';
export const getProfile = () => api.get('/profile/me');
export const updateProfile = body => api.put('/profile/me', body);
export const changePassword = body => api.put('/profile/me/password', body);
