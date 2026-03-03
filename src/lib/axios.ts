import axios from 'axios';

// API URL: runtime (Docker -e), then Vite .env (VITE_API_URL), then fallback
declare global {
  interface Window {
    __RUNTIME_CONFIG__?: { API_URL?: string };
  }
}
const getApiBaseUrl = (): string => {
  if (typeof window !== 'undefined' && window.__RUNTIME_CONFIG__?.API_URL) {
    return window.__RUNTIME_CONFIG__.API_URL;
  }
  return import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api';
};

const api = axios.create({
    baseURL: getApiBaseUrl(),
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response && error.response.status === 401) {
            // Redirect to login or clear token
            localStorage.removeItem('access_token');
            localStorage.removeItem('user_data');
            localStorage.removeItem('tenant_data');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
