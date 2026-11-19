import { apiRequest } from './apiClient';
import { localPatients } from './localStore';

/**
 * Normalizes backend Patient record for UI components
 */
function normalizePatient(p) {
  if (!p) return null;
  return {
    id: p.id,
    mrn: p.mrn || p.id,
    name: p.name,
    age: p.age,
    gender:
      p.gender === 'MALE'
        ? 'Male'
        : p.gender === 'FEMALE'
        ? 'Female'
        : p.gender || 'Other',
    contact: p.phone || p.contact || '',
    phone: p.phone || p.contact || '',
    email: p.email || '',
    bloodGroup: p.bloodGroup || '',
    allergies: Array.isArray(p.allergies)
      ? p.allergies.join(', ')
      : p.allergies || '',
    chronicConditions: Array.isArray(p.chronicConditions)
      ? p.chronicConditions
      : [],
    address: p.address || '',
    lastVisit: p.lastVisitDate
      ? new Date(p.lastVisitDate).toISOString().split('T')[0]
      : p.lastVisit || '',
    nextFollowUp: p.nextFollowUp || '',
    status: p.status || 'Active',
    notes: p.notes || '',
    prescriptions: p.prescriptions || [],
    appointments: p.appointments || [],
  };
}

export const patientApi = {
  /**
   * List / Search Patients (Tenant-Scoped)
   */
  async getPatients({ search = '', page = 1, limit = 50 } = {}) {
    // In test mode, use local storage immediately
    if (import.meta.env.MODE === 'test') {
      localPatients.seed();
      let all = localPatients.getAll();
      if (search) {
        const q = search.toLowerCase();
        all = all.filter(
          (p) =>
            p.name?.toLowerCase().includes(q) ||
            p.contact?.includes(q) ||
            p.id?.toLowerCase().includes(q)
        );
      }
      return {
        patients: all,
        total: all.length,
        isOfflineFallback: true,
      };
    }

    try {
      const queryParams = new URLSearchParams();
      if (search) queryParams.set('search', search);
      if (page) queryParams.set('page', String(page));
      if (limit) queryParams.set('limit', String(limit));

      const res = await apiRequest(`/patients?${queryParams.toString()}`);
      if (res?.success && res?.data?.patients) {
        return {
          patients: res.data.patients.map(normalizePatient),
          total: res.data.pagination?.total || res.data.patients.length,
          pagination: res.data.pagination,
          isOfflineFallback: false,
        };
      }
      throw new Error(res?.message || 'Failed to parse patients response');
    } catch (err) {
      console.warn('Backend patients API offline/failed, falling back to localStore:', err.message);
      localPatients.seed();
      let all = localPatients.getAll();
      if (search) {
        const q = search.toLowerCase();
        all = all.filter(
          (p) =>
            p.name?.toLowerCase().includes(q) ||
            p.contact?.includes(q) ||
            p.id?.toLowerCase().includes(q)
        );
      }
      return {
        patients: all,
        total: all.length,
        isOfflineFallback: true,
      };
    }
  },

  /**
   * Register New Patient with Sequential Atomic MRN
   */
  async createPatient(payload) {
    const formattedGender =
      payload.gender?.toUpperCase() === 'MALE'
        ? 'MALE'
        : payload.gender?.toUpperCase() === 'FEMALE'
        ? 'FEMALE'
        : 'OTHER';

    const allergyArray =
      typeof payload.allergies === 'string'
        ? payload.allergies
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : Array.isArray(payload.allergies)
        ? payload.allergies
        : [];

    const requestBody = {
      name: payload.name?.trim(),
      phone: (payload.phone || payload.contact || '').trim(),
      age: payload.age ? parseInt(payload.age, 10) : null,
      gender: formattedGender,
      bloodGroup: payload.bloodGroup || null,
      allergies: allergyArray,
      address: payload.address || null,
      notes: payload.notes || null,
    };

    if (import.meta.env.MODE === 'test') {
      const local = localPatients.add({
        name: payload.name,
        age: payload.age,
        gender: payload.gender || 'Male',
        contact: payload.contact || payload.phone,
        bloodGroup: payload.bloodGroup,
        allergies: payload.allergies,
        address: payload.address,
        notes: payload.notes,
        status: payload.status || 'Active',
      });
      return { success: true, data: local, isOfflineFallback: true };
    }

    try {
      const res = await apiRequest('/patients', {
        method: 'POST',
        body: requestBody,
      });

      if (res?.success && res?.data) {
        // Also keep localStore synced for offline resilience
        localPatients.add({
          id: res.data.id,
          name: res.data.name,
          age: res.data.age,
          gender: payload.gender || 'Male',
          contact: res.data.phone,
          bloodGroup: res.data.bloodGroup,
          allergies: payload.allergies,
          address: res.data.address,
          status: 'Active',
        });

        return {
          success: true,
          data: normalizePatient(res.data),
          isOfflineFallback: false,
        };
      }
      throw new Error(res?.message || 'Failed to create patient');
    } catch (err) {
      console.warn('Backend createPatient error, falling back to local store:', err.message);
      const local = localPatients.add({
        name: payload.name,
        age: payload.age,
        gender: payload.gender || 'Male',
        contact: payload.contact || payload.phone,
        bloodGroup: payload.bloodGroup,
        allergies: payload.allergies,
        address: payload.address,
        notes: payload.notes,
        status: payload.status || 'Active',
      });
      return { success: true, data: local, isOfflineFallback: true };
    }
  },

  /**
   * Update Patient Profile
   */
  async updatePatient(id, payload) {
    if (import.meta.env.MODE === 'test') {
      const updated = localPatients.update(id, payload);
      return { success: true, data: updated, isOfflineFallback: true };
    }

    try {
      const allergyArray =
        typeof payload.allergies === 'string'
          ? payload.allergies
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
          : Array.isArray(payload.allergies)
          ? payload.allergies
          : undefined;

      const requestBody = {
        ...(payload.name && { name: payload.name.trim() }),
        ...((payload.phone || payload.contact) && {
          phone: (payload.phone || payload.contact).trim(),
        }),
        ...(payload.age && { age: parseInt(payload.age, 10) }),
        ...(payload.gender && {
          gender:
            payload.gender.toUpperCase() === 'MALE'
              ? 'MALE'
              : payload.gender.toUpperCase() === 'FEMALE'
              ? 'FEMALE'
              : 'OTHER',
        }),
        ...(payload.bloodGroup !== undefined && { bloodGroup: payload.bloodGroup }),
        ...(allergyArray !== undefined && { allergies: allergyArray }),
        ...(payload.address !== undefined && { address: payload.address }),
      };

      const res = await apiRequest(`/patients/${id}`, {
        method: 'PUT',
        body: requestBody,
      });

      if (res?.success && res?.data) {
        localPatients.update(id, payload);
        return {
          success: true,
          data: normalizePatient(res.data),
          isOfflineFallback: false,
        };
      }
      throw new Error(res?.message || 'Failed to update patient');
    } catch (err) {
      console.warn('Backend updatePatient error, falling back to localStore:', err.message);
      const updated = localPatients.update(id, payload);
      return { success: true, data: updated, isOfflineFallback: true };
    }
  },

  /**
   * Get Patient Details & Medical History by ID
   */
  async getPatientById(id) {
    if (import.meta.env.MODE === 'test') {
      const local = localPatients.getById(id);
      return { success: true, data: local, isOfflineFallback: true };
    }

    try {
      const res = await apiRequest(`/patients/${id}`);
      if (res?.success && res?.data) {
        return {
          success: true,
          data: normalizePatient(res.data),
          isOfflineFallback: false,
        };
      }
      throw new Error(res?.message || 'Failed to fetch patient profile');
    } catch (err) {
      console.warn('Backend getPatientById error, falling back to localStore:', err.message);
      const local = localPatients.getById(id);
      return { success: true, data: local, isOfflineFallback: true };
    }
  },
};
