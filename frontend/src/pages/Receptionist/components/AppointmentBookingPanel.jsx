import React from 'react';
import { CalendarDays, Clock3, Stethoscope, UserRound } from 'lucide-react';

function AppointmentBookingPanel({ form, setForm, onSubmit, loading, patients = [], doctors = [] }) {
  return (
    <section className="panel">
      <h3 className="panel-title">Appointment Booking</h3>
      <form
        className="form-grid"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        <div className="field-stack">
          <label className="field-label" htmlFor="book-patient-id">
            <UserRound size={14} />
            Patient ID / Select Patient
          </label>
          <div className="input-wrap">
            <UserRound size={14} className="input-icon" />
            <input
              id="book-patient-id"
              accessKey="a"
              list="registered-patients-datalist"
              placeholder="Patient ID or Name (Alt+A)"
              value={form.patientId}
              onChange={(e) => setForm((prev) => ({ ...prev, patientId: e.target.value }))}
            />
            {patients.length > 0 && (
              <datalist id="registered-patients-datalist">
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.phone || p.contact || 'No phone'}) - {p.mrn || p.id}
                  </option>
                ))}
              </datalist>
            )}
          </div>
        </div>
        <div className="field-stack">
          <label className="field-label" htmlFor="book-doctor-id">
            <Stethoscope size={14} />
            Doctor ID / Select Doctor
          </label>
          <div className="input-wrap">
            <Stethoscope size={14} className="input-icon" />
            <input
              id="book-doctor-id"
              list="clinic-doctors-datalist"
              placeholder="Doctor ID or Name"
              value={form.doctorId}
              onChange={(e) => setForm((prev) => ({ ...prev, doctorId: e.target.value }))}
            />
            {doctors.length > 0 && (
              <datalist id="clinic-doctors-datalist">
                {doctors.map((d) => (
                  <option key={d.doctorId || d.id} value={d.doctorId || d.id}>
                    {d.name || d.fullName} ({d.specialization || 'Physician'})
                  </option>
                ))}
              </datalist>
            )}
          </div>
        </div>
        <div className="field-stack">
          <label className="field-label" htmlFor="book-appointment-date">
            <CalendarDays size={14} />
            Appointment Date
          </label>
          <input
            id="book-appointment-date"
            type="date"
            value={form.appointmentDate}
            onChange={(e) => setForm((prev) => ({ ...prev, appointmentDate: e.target.value }))}
          />
        </div>
        <div className="field-stack">
          <label className="field-label" htmlFor="book-start-time">
            <Clock3 size={14} />
            Start Time
          </label>
          <input
            id="book-start-time"
            placeholder="Start HH:MM"
            value={form.startTime}
            onChange={(e) => setForm((prev) => ({ ...prev, startTime: e.target.value }))}
          />
        </div>
        <div className="field-stack">
          <label className="field-label" htmlFor="book-end-time">
            <Clock3 size={14} />
            End Time
          </label>
          <input
            id="book-end-time"
            placeholder="End HH:MM"
            value={form.endTime}
            onChange={(e) => setForm((prev) => ({ ...prev, endTime: e.target.value }))}
          />
        </div>
        <button accessKey="b" type="submit" disabled={loading}>
          {loading ? 'Booking...' : 'Book (Alt+B)'}
        </button>
      </form>
    </section>
  );
}

export default AppointmentBookingPanel;
