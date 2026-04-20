import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'X-Tenant-Id': 'tenant_1',
  },
});

export default api;
