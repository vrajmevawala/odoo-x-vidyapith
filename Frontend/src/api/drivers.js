import api from './axios';

export const driversAPI = {
  getAll: (params) => api.get('/drivers', { params }),
  getOne: (id) => api.get(`/drivers/${id}`),
  create: (data) => api.post('/drivers', data),
  update: (id, data) => api.put(`/drivers/${id}`, data),
  updateStatus: (id, data) => api.patch(`/drivers/${id}/status`, data),
  getPerformance: (id) => api.get(`/drivers/${id}/performance`),
};
