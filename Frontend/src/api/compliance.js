import api from './axios';

export const complianceAPI = {
  getReport: () => api.get('/compliance/report'),
  getExpiredLicenses: () => api.get('/compliance/expired-licenses'),
  getExpiringLicenses: (days = 30) =>
    api.get('/compliance/expiring-licenses', { params: { days } }),
  getLowSafetyScores: (threshold = 50) =>
    api.get('/compliance/low-safety-scores', { params: { threshold } }),
};
