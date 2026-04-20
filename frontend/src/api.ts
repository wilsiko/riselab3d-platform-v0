import axios from 'axios';
import { clearSession, loadSession } from './auth';

const apiBaseUrl = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '');

const api = axios.create({
  baseURL: apiBaseUrl ? `${apiBaseUrl}/api` : '/api',
});

api.interceptors.request.use((config) => {
  const session = loadSession();

  if (session?.token) {
    config.headers.Authorization = `Bearer ${session.token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      clearSession();
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }

    return Promise.reject(error);
  },
);

export default api;
