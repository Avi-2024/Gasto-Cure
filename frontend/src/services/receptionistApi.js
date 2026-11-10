import { localAppointments, localPatients } from './localStore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

async function request(path, { method = 'GET', token, body } = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }

  return data;
}

async function tryOrOffline(apiFn, offlineFn) {
  try {
    return await apiFn();
  } catch {
    return offlineFn();
  }
}

export const receptionistApi = {
  quickRegisterPatient: ({ clinicId, token, payload }) =>
    tryOrOffline(
      () => request('/patients', { method: 'POST', token, body: { clinicId, ...payload } }),
      () => {
        const newPatient = localPatients.create({
          name: payload.fullName || payload.name || 'Walk-in Patient',
          phone: payload.phone || '',
          gender: payload.gender || 'other',
          age: payload.age || 30,
        });
        return { patient: newPatient };
      }
    ),

  quickBookAppointment: ({ clinicId, token, payload }) =>
    tryOrOffline(
      () => request('/appointments/book', { method: 'POST', token, body: { clinicId, ...payload } }),
      () => {
        const patient = payload.patientId ? localPatients.getById(payload.patientId) : null;
        const patientName = patient?.name || payload.patientName || 'Patient';
        const appointment = localAppointments.addToQueue(
          payload.patientId || `PT-${Date.now().toString().slice(-6)}`,
          patientName,
          patient?.age || null,
          payload.reason || 'Front Desk Appointment'
        );
        return { appointment };
      }
    ),

  saveVitals: ({ clinicId, token, payload }) =>
    tryOrOffline(
      () => request('/visits/vitals', { method: 'POST', token, body: { clinicId, ...payload } }),
      () => {
        // Record vitals in localStorage
        const vitalsKey = `vitals_${payload.appointmentId || 'default'}`;
        localStorage.setItem(vitalsKey, JSON.stringify(payload.vitals || {}));
        return { success: true };
      }
    ),

  updateAppointmentStatus: ({ clinicId, token, appointmentId, status }) =>
    tryOrOffline(
      () => request(`/appointments/${appointmentId}/status`, { method: 'PATCH', token, body: { clinicId, status } }),
      () => {
        if (status === 'completed') {
          localAppointments.markCompleted(appointmentId);
        } else {
          const stored = JSON.parse(localStorage.getItem('ds_appointments') || '[]');
          const updated = stored.map((app) =>
            app.id === appointmentId || app._id === appointmentId ? { ...app, status } : app
          );
          localStorage.setItem('ds_appointments', JSON.stringify(updated));
        }
        return { success: true, status };
      }
    ),

  enterPayment: ({ clinicId, token, billingId, payload }) =>
    tryOrOffline(
      () => request(`/billing/${billingId}/payments`, { method: 'POST', token, body: { clinicId, ...payload } }),
      () => {
        const stored = JSON.parse(localStorage.getItem('ds_billing') || '[]');
        const paymentRecord = {
          id: `INV-${Date.now().toString().slice(-4)}`,
          billingId,
          amount: payload.amount,
          mode: payload.mode || 'cash',
          status: 'Paid',
          date: new Date().toISOString(),
        };
        stored.push(paymentRecord);
        localStorage.setItem('ds_billing', JSON.stringify(stored));
        return { payment: paymentRecord };
      }
    ),
};
