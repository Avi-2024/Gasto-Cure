import { apiRequest, API_BASE_URL } from './apiClient';
import { authStorage } from './authStorage';

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

  uploadLogo: async (file, clinicId) => {
    const token = authStorage.getAccessToken();
    const activeId = clinicId || localStorage.getItem('clinixpulse_active_clinic_id');
    const formData = new FormData();
    formData.append('logo', file);

    const response = await fetch(`${API_BASE_URL}/clinic/current/logo`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(activeId ? { 'X-Clinic-Id': activeId } : {}),
      },
      body: formData,
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || 'Logo upload failed');
    }
    return data;
  },
};
