import api from './axios';

export const maintenanceAPI = {
  getAll: (params) => api.get('/maintenance', { params }),
  create: (data) => api.post('/maintenance', data),
  complete: (id) => api.patch(`/maintenance/${id}/complete`),
};
