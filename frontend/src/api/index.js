import api from './axios';

export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  generateInvite: () => api.post('/auth/generate-invite'),
  linkPartner: (inviteCode) => api.post('/auth/link-partner', { inviteCode }),
  unlinkPartner: () => api.post('/auth/unlink-partner'),
};

export const incomeApi = {
  getAll: (params) => api.get('/income', { params }),
  create: (data) => api.post('/income', data),
  update: (id, data) => api.put(`/income/${id}`, data),
  remove: (id) => api.delete(`/income/${id}`),
};

export const expenseApi = {
  getAll: (params) => api.get('/expenses', { params }),
  create: (data) => api.post('/expenses', data),
  update: (id, data) => api.put(`/expenses/${id}`, data),
  remove: (id) => api.delete(`/expenses/${id}`),
};

export const budgetApi = {
  get: () => api.get('/budget'),
  update: (data) => api.put('/budget', data),
};

export const debtApi = {
  getAll: (params) => api.get('/debts', { params }),
  create: (data) => api.post('/debts', data),
  update: (id, data) => api.put(`/debts/${id}`, data),
  remove: (id) => api.delete(`/debts/${id}`),
  addPayment: (id, data) => api.post(`/debts/${id}/payments`, data),
  removePayment: (id, paymentId) => api.delete(`/debts/${id}/payments/${paymentId}`),
};

export const todoApi = {
  getAll: (params) => api.get('/todos', { params }),
  create: (data) => api.post('/todos', data),
  update: (id, data) => api.put(`/todos/${id}`, data),
  remove: (id) => api.delete(`/todos/${id}`),
};
