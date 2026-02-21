import api from './axios';

export const vehiclesAPI = {
  getAll: (params) => api.get('/vehicles', { params }),
  getOne: (id) => api.get(`/vehicles/${id}`),
  create: (data) => api.post('/vehicles', data),
  update: (id, data) => api.put(`/vehicles/${id}`, data),
  remove: (id) => api.delete(`/vehicles/${id}`),
  retire: (id) => api.patch(`/vehicles/${id}/retire`),
  updateStatus: (id, data) => api.patch(`/vehicles/${id}/status`, data),
};
