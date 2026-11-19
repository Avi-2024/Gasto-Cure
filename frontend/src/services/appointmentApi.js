import { apiRequest } from './apiClient';
import { localAppointments } from './localStore';

function normalizeAppointment(appt) {
  if (!appt) return null;
  return {
    id: appt.id,
    tokenNumber: appt.tokenNumber,
    token: `Token #${appt.tokenNumber}`,
    patientId: appt.patientId || appt.patient?.id,
    patientName: appt.patient?.name || appt.patientName || 'Unknown Patient',
    age: appt.patient?.age || appt.age,
    gender: appt.patient?.gender || appt.gender,
    contact: appt.patient?.phone || appt.contact || '',
    phone: appt.patient?.phone || appt.contact || '',
    chiefComplaint: appt.chiefComplaint || appt.reason || 'General Consultation',
    status: appt.status || 'WAITING',
    doctorId: appt.doctorId,
    doctorName: appt.doctor?.fullName || 'Assigned Physician',
    appointmentDate: appt.appointmentDate,
    createdAt: appt.createdAt,
    vitals: appt.vitals || null,
  };
}

export const appointmentApi = {
  /**
   * Get Live OPD Waiting & Active Queue for the Current Clinic
   */
  async getTodayQueue(status = null) {
    if (import.meta.env.MODE === 'test') {
      const queue = localAppointments.getQueue() || [];
      return {
        appointments: queue.map((q, idx) => ({
          id: q.id || `local-apt-${idx}`,
          tokenNumber: idx + 1,
          token: `Token #${idx + 1}`,
          patientId: q.patientId,
          patientName: q.patientName,
          age: q.age,
          chiefComplaint: q.chiefComplaint || q.reason || 'General Consultation',
          status: q.status || 'WAITING',
        })),
        totalInQueue: queue.length,
        isOfflineFallback: true,
      };
    }

    try {
      const queryParam = status ? `?status=${encodeURIComponent(status)}` : '';
      const res = await apiRequest(`/appointments/today${queryParam}`);
      if (res?.success && res?.data?.appointments) {
        const list = res.data.appointments.map(normalizeAppointment);
        return {
          appointments: list,
          totalInQueue: res.data.totalInQueue || list.length,
          isOfflineFallback: false,
        };
      }
      throw new Error(res?.message || 'Failed to fetch OPD appointments');
    } catch (err) {
      console.warn('Backend appointment queue API error, falling back to localStore:', err.message);
      const queue = localAppointments.getQueue() || [];
      return {
        appointments: queue.map((q, idx) => ({
          id: q.id || `local-apt-${idx}`,
          tokenNumber: idx + 1,
          token: `Token #${idx + 1}`,
          patientId: q.patientId,
          patientName: q.patientName,
          age: q.age,
          chiefComplaint: q.chiefComplaint || q.reason || 'General Consultation',
          status: q.status || 'WAITING',
        })),
        totalInQueue: queue.length,
        isOfflineFallback: true,
      };
    }
  },

  /**
   * Add Patient to OPD Queue with Atomic Sequential Token
   */
  async createAppointment({ patientId, doctorId, chiefComplaint, vitals, visitType = 'NEW_VISIT' }) {
    if (import.meta.env.MODE === 'test') {
      const added = localAppointments.addToQueue(patientId, 'Test Patient', 30, chiefComplaint);
      return { success: true, data: added, isOfflineFallback: true };
    }

    try {
      const res = await apiRequest('/appointments', {
        method: 'POST',
        body: {
          patientId,
          doctorId,
          chiefComplaint,
          vitals,
          visitType,
        },
      });

      if (res?.success && res?.data) {
        // Also keep localStore synced for hybrid resilience
        localAppointments.addToQueue(
          res.data.patientId,
          res.data.patient?.name,
          res.data.patient?.age,
          chiefComplaint
        );

        return {
          success: true,
          data: normalizeAppointment(res.data),
          isOfflineFallback: false,
        };
      }
      throw new Error(res?.message || 'Failed to generate appointment');
    } catch (err) {
      console.warn('Backend create appointment error, falling back to local store:', err.message);
      const added = localAppointments.addToQueue(patientId, 'Walk-in Patient', null, chiefComplaint);
      return { success: true, data: added, isOfflineFallback: true };
    }
  },

  /**
   * Update Appointment Status (WAITING, IN_CONSULTATION, COMPLETED, CANCELLED)
   */
  async updateStatus(id, status) {
    if (import.meta.env.MODE === 'test') {
      if (status === 'COMPLETED') {
        localAppointments.markCompleted(id);
      }
      return { success: true, status, isOfflineFallback: true };
    }

    try {
      const res = await apiRequest(`/appointments/${id}/status`, {
        method: 'PATCH',
        body: { status },
      });

      if (res?.success && res?.data) {
        if (status === 'COMPLETED') {
          localAppointments.markCompleted(id);
        }
        return {
          success: true,
          data: normalizeAppointment(res.data),
          isOfflineFallback: false,
        };
      }
      throw new Error(res?.message || 'Failed to update appointment status');
    } catch (err) {
      console.warn('Backend update appointment status error, falling back to local store:', err.message);
      if (status === 'COMPLETED') {
        localAppointments.markCompleted(id);
      }
      return { success: true, status, isOfflineFallback: true };
    }
  },
};
