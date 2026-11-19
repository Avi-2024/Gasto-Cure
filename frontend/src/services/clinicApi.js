import { apiRequest } from './apiClient';

export const clinicApi = {
  getCurrentBranding: async (clinicId) => {
    return apiRequest('/clinic/current/branding', {
      method: 'GET',
      activeClinicId: clinicId,
    });
  },

  updateCurrentBranding: async (brandingData, clinicId) => {
    return apiRequest('/clinic/current/branding', {
      method: 'PUT',
      body: brandingData,
      activeClinicId: clinicId,
    });
  },
};
