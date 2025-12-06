import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle responses
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

// API functions
export const api = {
  // Auth
  auth: {
    login: (data: { email: string; password: string }) =>
      apiClient.post('/auth/login', data),
    register: (data: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
    }) => apiClient.post('/auth/register', data),
  },

  // Products
  products: {
    getAll: (params?: any) => apiClient.get('/products', { params }),
    getById: (id: string) => apiClient.get(`/products/${id}`),
    create: (data: any) => apiClient.post('/products', data),
    update: (id: string, data: any) => apiClient.put(`/products/${id}`, data),
    delete: (id: string) => apiClient.delete(`/products/${id}`),
  },

  // Vendors
  vendors: {
    getAll: (params?: any) => apiClient.get('/vendors', { params }),
    getById: (id: string) => apiClient.get(`/vendors/${id}`),
    create: (data: any) => apiClient.post('/vendors', data),
    update: (id: string, data: any) => apiClient.put(`/vendors/${id}`, data),
  },

  // Orders
  orders: {
    getAll: (params?: any) => apiClient.get('/orders', { params }),
    getById: (id: string) => apiClient.get(`/orders/${id}`),
    create: (data: any) => apiClient.post('/orders', data),
    updateStatus: (id: string, status: string) =>
      apiClient.put(`/orders/${id}/status`, { status }),
  },

  // Users
  users: {
    getProfile: () => apiClient.get('/users/profile'),
    updateProfile: (data: any) => apiClient.put('/users/profile', data),
  },
};
