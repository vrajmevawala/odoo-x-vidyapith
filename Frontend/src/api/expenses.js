import api from './axios';

export const expensesAPI = {
  getAll: (params) => api.get('/expenses', { params }),
  create: (data) => api.post('/expenses', data),
  getByVehicle: (vehicleId, params) =>
    api.get(`/expenses/vehicle/${vehicleId}`, { params }),
};
