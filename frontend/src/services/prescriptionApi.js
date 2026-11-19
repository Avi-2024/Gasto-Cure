import { apiRequest } from './apiClient';
import { localVisits, localAppointments } from './localStore';
import { generatePrescriptionPdf } from './pdfGenerator';

export const prescriptionApi = {
  /**
   * Create Prescription with Immutable Legal Branding Snapshot in Supabase
   */
  async createPrescription(payload) {
    if (import.meta.env.MODE === 'test') {
      const local = localVisits.save({
        patientId: payload.patientId,
        patientName: payload.patientName || 'Test Patient',
        medicines: payload.medicines,
        diagnosis: payload.diagnosis,
        symptoms: payload.symptoms,
        vitals: payload.vitals,
        advice: payload.advice,
        followUpDate: payload.followUpDate,
        appointmentId: payload.appointmentId,
      });
      if (payload.appointmentId) {
        localAppointments.markCompleted(payload.appointmentId);
      }
      return { success: true, data: local, isOfflineFallback: true };
    }

    try {
      const requestBody = {
        patientId: payload.patientId,
        appointmentId: payload.appointmentId || null,
        symptoms: Array.isArray(payload.symptoms)
          ? payload.symptoms
          : typeof payload.symptoms === 'string'
          ? payload.symptoms.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
        diagnosis: Array.isArray(payload.diagnosis)
          ? payload.diagnosis
          : typeof payload.diagnosis === 'string'
          ? payload.diagnosis.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
        vitals: payload.vitals || null,
        medicines: payload.medicines || [],
        advice: Array.isArray(payload.advice)
          ? payload.advice
          : typeof payload.advice === 'string'
          ? [payload.advice]
          : [],
        investigations: Array.isArray(payload.investigations)
          ? payload.investigations
          : [],
        followUpDate: payload.followUpDate || null,
        followUpNotes: payload.followUpNotes || null,
      };

      const res = await apiRequest('/prescriptions', {
        method: 'POST',
        body: requestBody,
      });

      if (res?.success && res?.data) {
        // Sync localStore and mark appointment completed locally
        localVisits.save({
          id: res.data.id,
          rxNumber: res.data.rxNumber,
          patientId: payload.patientId,
          patientName: res.data.patient?.name || payload.patientName,
          medicines: payload.medicines,
          diagnosis: requestBody.diagnosis,
          symptoms: requestBody.symptoms,
          vitals: payload.vitals,
          advice: requestBody.advice,
          followUpDate: payload.followUpDate,
          brandingSnapshot: res.data.brandingSnapshot,
        });

        if (payload.appointmentId) {
          localAppointments.markCompleted(payload.appointmentId);
        }

        return {
          success: true,
          data: res.data,
          isOfflineFallback: false,
        };
      }
      throw new Error(res?.message || 'Failed to create prescription');
    } catch (err) {
      console.warn('Backend createPrescription failed, using localStore fallback:', err.message);
      const local = localVisits.save({
        patientId: payload.patientId,
        patientName: payload.patientName,
        medicines: payload.medicines,
        diagnosis: payload.diagnosis,
        symptoms: payload.symptoms,
        vitals: payload.vitals,
        advice: payload.advice,
        followUpDate: payload.followUpDate,
      });
      if (payload.appointmentId) {
        localAppointments.markCompleted(payload.appointmentId);
      }
      return { success: true, data: local, isOfflineFallback: true };
    }
  },

  /**
   * Fetch Prescriptions for Active Clinic
   */
  async getPrescriptions({ patientId, page = 1, limit = 20 } = {}) {
    if (import.meta.env.MODE === 'test') {
      const all = patientId ? localVisits.getByPatient(patientId) : localVisits.getAll();
      return { prescriptions: all, total: all.length, isOfflineFallback: true };
    }

    try {
      const queryParams = new URLSearchParams();
      if (patientId) queryParams.set('patientId', patientId);
      if (page) queryParams.set('page', String(page));
      if (limit) queryParams.set('limit', String(limit));

      const res = await apiRequest(`/prescriptions?${queryParams.toString()}`);
      if (res?.success && res?.data?.prescriptions) {
        return {
          prescriptions: res.data.prescriptions,
          total: res.data.pagination?.total || res.data.prescriptions.length,
          pagination: res.data.pagination,
          isOfflineFallback: false,
        };
      }
      throw new Error(res?.message || 'Failed to fetch prescriptions');
    } catch (err) {
      console.warn('Backend getPrescriptions failed, using localStore fallback:', err.message);
      const all = patientId ? localVisits.getByPatient(patientId) : localVisits.getAll();
      return { prescriptions: all, total: all.length, isOfflineFallback: true };
    }
  },

  /**
   * Print / Download Prescription PDF
   */
  exportPdf(visitOrRx) {
    return generatePrescriptionPdf(visitOrRx);
  },
};
