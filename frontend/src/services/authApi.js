import { apiRequest } from './apiClient';

export const authApi = {
  login: async ({ email, password }) => {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
  },

  switchClinic: async ({ clinicId }) => {
    return apiRequest('/auth/switch-clinic', {
      method: 'POST',
      body: { clinicId },
    });
  },

  getMe: async () => {
    return apiRequest('/auth/me');
  },
};
