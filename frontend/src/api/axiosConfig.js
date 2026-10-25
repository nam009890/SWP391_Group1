import { apiError } from '../i18n/index.js';
import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
});

// Tự động đính kèm JWT token vào header của mọi request gửi đi
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Bắt lỗi 401 (Unauthorized) hoặc 403 (Forbidden) khi token hết hạn để tự động logout
api.interceptors.response.use((response) => {
    return response;
}, (error) => {
    if (error.response?.data && typeof error.response.data === 'object') {
        error.response.data.message = apiError(error.response.data.code);
    }
    const isAuthRequest = ['/auth/login', '/auth/register'].includes(error.config?.url);
    if (!isAuthRequest && error.response?.status === 401 && localStorage.getItem('token')) {
        // Token hết hạn hoặc không hợp lệ -> Xóa token và chuyển hướng về /login
        sessionStorage.setItem('authNotice', error.response.data?.code === 'ACCOUNT_LOCKED'
            ? 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.'
            : 'Phiên đăng nhập đã hết hạn hoặc bị thu hồi. Vui lòng đăng nhập lại.');
        localStorage.removeItem('token');
        window.dispatchEvent(new Event('auth-expired'));
    }
    return Promise.reject(error);
});

export default api;
