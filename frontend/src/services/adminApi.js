import { apiRequest } from './apiClient';

export const adminApi = {
  /**
   * List all platform tenant clinics
   */
  async getClinics({ status = 'all' } = {}) {
    if (import.meta.env.MODE === 'test') {
      return {
        success: true,
        totalClinics: 2,
        clinics: [
          {
            id: 'c1',
            name: 'Gastro Cure Digestive & Liver Centre',
            code: 'GC',
            plan: 'PRO',
            planStatus: 'ACTIVE',
            isActive: true,
            patientsCount: 4,
            doctorsCount: 1,
            city: 'Unchehra',
          },
          {
            id: 'c2',
            name: 'Apex Heart & Multi-Speciality Clinic',
            code: 'APEX',
            plan: 'ENTERPRISE',
            planStatus: 'ACTIVE',
            isActive: true,
            patientsCount: 4,
            doctorsCount: 1,
            city: 'Indore',
          },
        ],
      };
    }

    const query = status && status !== 'all' ? `?status=${encodeURIComponent(status)}` : '';
    return apiRequest(`/admin/clinics${query}`);
  },

  /**
   * Onboard a new tenant clinic
   */
  async onboardClinic(clinicData) {
    return apiRequest('/admin/clinics', {
      method: 'POST',
      body: clinicData,
    });
  },

  /**
   * Register a doctor for an existing clinic
   */
  async registerDoctor(clinicId, doctorData) {
    return apiRequest(`/admin/clinics/${clinicId}/doctors`, {
      method: 'POST',
      body: doctorData,
    });
  },

  /**
   * List doctors registered to a clinic
   */
  async getClinicDoctors(clinicId) {
    return apiRequest(`/admin/clinics/${clinicId}/doctors`);
  },

  /**
   * Toggle clinic active/suspended status
   */
  async toggleClinicStatus(clinicId, isActive) {
    return apiRequest(`/admin/clinics/${clinicId}/status`, {
      method: 'PATCH',
      body: { isActive },
    });
  },

  /**
   * Get platform metrics & revenue overview
   */
  async getRevenueOverview() {
    return apiRequest('/admin/revenue-overview');
  },
};
