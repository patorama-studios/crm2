import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  logout: () => api.post('/auth/logout'),
  getCurrentUser: () => api.get('/auth/me'),
};

export const jobService = {
  getJobs: (params) => api.get('/jobs', { params }),
  getJobById: (id) => api.get(`/jobs/${id}`),
  createJob: (data) => api.post('/jobs', data),
  updateJob: (id, data) => api.patch(`/jobs/${id}`, data),
  deleteJob: (id) => api.delete(`/jobs/${id}`),
};

export const customerService = {
  getCustomers: (params) => api.get('/customers', { params }),
  getCustomerById: (id) => api.get(`/customers/${id}`),
  createCustomer: (data) => api.post('/customers', data),
  updateCustomer: (id, data) => api.patch(`/customers/${id}`, data),
  deleteCustomer: (id) => api.delete(`/customers/${id}`),
};

export const uploadService = {
  uploadFiles: (jobId, files) => {
    const formData = new FormData();
    formData.append('job_id', jobId);
    files.forEach(file => {
      formData.append('files', file);
    });
    return api.post('/uploads', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  getUploads: (jobId) => api.get(`/uploads/job/${jobId}`),
  markAsFinal: (uploadId, isFinal) => api.patch(`/uploads/${uploadId}`, { is_final: isFinal }),
  deleteUpload: (uploadId) => api.delete(`/uploads/${uploadId}`),
};

export const invoiceService = {
  getInvoices: (params) => api.get('/invoices', { params }),
  getInvoiceById: (id) => api.get(`/invoices/${id}`),
  createInvoice: (jobId) => api.post('/invoices', { job_id: jobId }),
  syncWithXero: (invoiceId) => api.post(`/invoices/${invoiceId}/sync-xero`),
  checkPaymentStatus: (invoiceId) => api.get(`/invoices/${invoiceId}/payment-status`),
};

export const notificationService = {
  getNotifications: () => api.get('/notifications'),
  markAsRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.post('/notifications/mark-all-read'),
};

export default api;