import axios from 'axios';

const apiBaseURL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV && typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.hostname}:4000/api`
    : '/api');

const api = axios.create({
  baseURL: apiBaseURL,
  withCredentials: true,
  headers: {
    'X-Tenant-Id': import.meta.env.VITE_PUBLIC_TENANT_ID || 'tenant_1',
  },
});

export default api;
