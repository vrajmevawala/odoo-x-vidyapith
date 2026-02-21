import api from './axios';

export const analyticsAPI = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getVehicleROI: (vehicleId) => api.get(`/analytics/vehicle-roi/${vehicleId}`),
  getFuelEfficiency: (vehicleId) =>
    api.get(`/analytics/fuel-efficiency/${vehicleId}`),
};
