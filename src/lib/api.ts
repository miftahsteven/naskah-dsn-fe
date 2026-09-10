import axios from 'axios';
import { useAuthStore } from '@/stores/auth.store';

export const getApiUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== 'undefined') {
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      return `${window.location.origin}/api`;
    }
  }
  return 'http://localhost:4002/api';
};

export const getBaseUrl = () => {
  return getApiUrl().replace(/\/api\/?$/, '');
};

const API_URL = getApiUrl();

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add the access token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and not a retry, try to refresh token (exclude auth endpoints)
    if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url && !originalRequest.url.includes('/auth/')) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');

      if (refreshToken) {
        try {
          const res = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
          const { accessToken, refreshToken: newRefreshToken } = res.data.data;

          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', newRefreshToken);

          api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh failed, logout user
          useAuthStore.getState().logout();
          
          // Force redirect to login immediately
          if (typeof window !== 'undefined') {
            const loginPath = window.location.pathname.startsWith('/office') ? '/office/login' : '/login';
            window.location.href = loginPath;
          }
          
          // Return a pending promise to prevent throwing an error to the caller while navigating away
          return new Promise(() => {});
        }
      } else {
        useAuthStore.getState().logout();
        if (typeof window !== 'undefined') {
          const loginPath = window.location.pathname.startsWith('/office') ? '/office/login' : '/login';
          window.location.href = loginPath;
        }
        return new Promise(() => {});
      }
    }

    return Promise.reject(error);
  }
);

export default api;
