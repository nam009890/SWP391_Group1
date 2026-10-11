import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8080/api',
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
    const isAuthRequest = error.config?.url?.includes('/auth/');
    if (!isAuthRequest && error.response && (error.response.status === 401 || error.response.status === 403)) {
        // Token hết hạn hoặc không hợp lệ -> Xóa token và chuyển hướng về /login
        localStorage.removeItem('token');
        if (window.location.pathname !== '/login') {
            window.location.href = '/login';
        }
    }
    return Promise.reject(error);
});

export default api;
