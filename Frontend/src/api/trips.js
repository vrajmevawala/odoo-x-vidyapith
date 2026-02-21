import api from './axios';

export const tripsAPI = {
  getAll: (params) => api.get('/trips', { params }),
  getOne: (id) => api.get(`/trips/${id}`),
  create: (data) => api.post('/trips', data),
  dispatch: (id) => api.patch(`/trips/${id}/dispatch`),
  complete: (id) => api.patch(`/trips/${id}/complete`),
  cancel: (id) => api.patch(`/trips/${id}/cancel`),
};
