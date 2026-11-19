import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  Calendar,
  CalendarClock,
  CalendarRange,
  CheckCircle2,
  Clock3,
  Filter,
  Plus,
  Search,
  Stethoscope,
  User,
} from 'lucide-react';
import StatusBadge from '../../components/ui/StatusBadge';
import { useAuth } from '../../contexts/AuthContext';
import { appointmentApi } from '../../services/appointmentApi';
import { localAppointments, localPatients } from '../../services/localStore';

const statusVariantMap = {
  waiting: 'warning',
  completed: 'success',
  cancelled: 'danger',
};

export default function AppointmentsPage() {
  const { activeClinicId } = useAuth();
  const [appointments, setAppointments] = useState(() => {
    return JSON.parse(localStorage.getItem('ds_appointments') || '[]');
  });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [notification, setNotification] = useState('');

  const reloadAppointments = async () => {
    if (import.meta.env.MODE !== 'test') {
      try {
        const res = await appointmentApi.getTodayQueue('all');
        if (res?.appointments && res.appointments.length > 0) {
          setAppointments(res.appointments);
          return;
        }
      } catch (err) {
        console.warn('Failed to fetch live appointments:', err);
      }
    }
    const stored = JSON.parse(localStorage.getItem('ds_appointments') || '[]');
    setAppointments(stored);
  };

  useEffect(() => {
    reloadAppointments();
  }, [activeClinicId]);

  const filteredAppointments = useMemo(
    () =>
      appointments.filter((appointment) => {
        const matchesSearch =
          (appointment.patientName || '').toLowerCase().includes(search.toLowerCase()) ||
          (appointment.reason || '').toLowerCase().includes(search.toLowerCase()) ||
          (appointment.id || '').toLowerCase().includes(search.toLowerCase());

        const matchesStatus = statusFilter === 'all' || appointment.status === statusFilter;

        const appointmentDate = appointment.createdAt ? appointment.createdAt.split('T')[0] : '';
        const matchesDate = !dateFilter || appointmentDate === dateFilter;

        return matchesSearch && matchesStatus && matchesDate;
      }),
    [appointments, search, statusFilter, dateFilter]
  );

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const monthStart = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const offset = (monthStart.getDay() + 6) % 7;

  const appointmentCountByDay = filteredAppointments.reduce((acc, appointment) => {
    if (!appointment.createdAt) return acc;
    const date = new Date(appointment.createdAt);
    if (date.getMonth() === month && date.getFullYear() === year) {
      const day = date.getDate();
      acc[day] = (acc[day] || 0) + 1;
    }
    return acc;
  }, {});

  const calendarCells = [
    ...Array(offset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, idx) => idx + 1),
  ];
  const monthLabel = monthStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const handleAddDemoAppointment = async () => {
    const patients = localPatients.getAll();
    if (patients.length === 0) {
      setNotification('Please register at least one patient first before scheduling an appointment.');
      setTimeout(() => setNotification(''), 4000);
      return;
    }
    const randomPatient = patients[Math.floor(Math.random() * patients.length)];

    if (import.meta.env.MODE !== 'test') {
      try {
        await appointmentApi.createAppointment({
          patientId: randomPatient.id,
          chiefComplaint: 'General Outpatient Follow-up',
        });
      } catch (err) {
        console.warn('Backend appointment add failed, using local queue:', err);
      }
    }

    localAppointments.addToQueue(
      randomPatient.id,
      randomPatient.name,
      randomPatient.age,
      'General Outpatient Follow-up'
    );
    await reloadAppointments();
    setNotification(`New appointment added to queue for ${randomPatient.name}.`);
    setTimeout(() => setNotification(''), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Search Header */}
      <section className="rounded-3xl border border-[#D9E6E2] bg-white p-6 shadow-clinixpulse-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#287C75]/25 bg-[#287C75]/10 px-2.5 py-0.5 text-xs font-semibold text-[#287C75]">
                <Calendar size={13} />
                Outpatient Scheduling
              </span>
              <span className="text-xs font-semibold text-[#7D908C]">
                {appointments.length} total scheduled
              </span>
            </div>
            <h1 className="mt-2 font-heading text-2xl font-bold tracking-tight text-[#10201F] sm:text-3xl">
              Appointments Timeline
            </h1>
            <p className="mt-1 text-sm text-[#4E6460]">
              Filter consultation bookings, monitor queue statuses, and review monthly attendance.
            </p>
          </div>

          <button
            type="button"
            onClick={handleAddDemoAppointment}
            className="inline-flex items-center gap-2 rounded-xl bg-[#123A3A] px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#287C75] transition shrink-0"
          >
            <Plus size={16} />
            <span>Add Demo Appointment</span>
          </button>
        </div>

        {notification && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-3.5 py-2.5 text-xs font-semibold text-[#123A3A]">
            <CheckCircle2 size={15} className="text-[#287C75] shrink-0" />
            <span>{notification}</span>
          </div>
        )}

        {/* Filter Toolbar */}
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_200px_200px]">
          <label htmlFor="appointment-search" className="relative block">
            <Search
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7D908C]"
            />
            <input
              id="appointment-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by patient name, reason, or token ID..."
              className="w-full rounded-xl border border-[#D9E6E2] bg-[#F7FAF8] py-2.5 pl-10 pr-4 text-xs font-medium text-[#10201F] placeholder-[#7D908C] focus:border-[#287C75] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#287C75]/15 transition sm:text-sm"
            />
          </label>

          <label htmlFor="appointment-date" className="relative block">
            <CalendarRange
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7D908C]"
            />
            <input
              id="appointment-date"
              type="date"
              value={dateFilter}
              onChange={(event) => setDateFilter(event.target.value)}
              className="w-full rounded-xl border border-[#D9E6E2] bg-[#F7FAF8] py-2.5 pl-10 pr-4 text-xs font-medium text-[#10201F] focus:border-[#287C75] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#287C75]/15 transition sm:text-sm"
            />
          </label>

          <label htmlFor="appointment-status" className="relative block">
            <Filter
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7D908C]"
            />
            <select
              id="appointment-status"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="w-full rounded-xl border border-[#D9E6E2] bg-[#F7FAF8] py-2.5 pl-10 pr-4 text-xs font-semibold text-[#10201F] focus:border-[#287C75] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#287C75]/15 transition sm:text-sm"
            >
              <option value="all">All statuses</option>
              <option value="waiting">Waiting in Queue</option>
              <option value="completed">Completed Visits</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </label>
        </div>
      </section>

      {/* Grid: Appointments List & Calendar */}
      <section className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        {/* Left Column: Appointments List */}
        <article className="rounded-3xl border border-[#D9E6E2] bg-white p-6 shadow-clinixpulse-xs">
          <div className="flex items-center justify-between border-b border-[#D9E6E2]/60 pb-3">
            <h2 className="font-heading text-base font-bold text-[#10201F]">
              Appointment Register
            </h2>
            <StatusBadge label={`${filteredAppointments.length} Appointments`} variant="info" />
          </div>

          <ul className="mt-4 space-y-3">
            {filteredAppointments.map((appointment) => (
              <li
                key={appointment.id}
                className="group rounded-2xl border border-[#D9E6E2] bg-white p-4 transition hover:border-[#287C75] hover:bg-[#F7FAF8]/70 hover:shadow-xs"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-heading text-sm font-bold text-[#10201F]">
                        {appointment.patientName || 'Patient'}
                      </span>
                      <span className="rounded-md border border-[#D9E6E2] bg-[#F7FAF8] px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[#7D908C]">
                        {appointment.id}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[#4E6460]">
                      {appointment.reason || 'General Outpatient Consultation'}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 sm:text-right">
                    <div>
                      <p className="text-xs font-semibold text-[#10201F] flex items-center sm:justify-end gap-1">
                        <Clock3 size={12} className="text-[#287C75]" />
                        {appointment.startTime || '10:00 AM'}
                      </p>
                      <p className="text-[11px] text-[#7D908C]">
                        {appointment.createdAt
                          ? new Date(appointment.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : 'Today'}
                      </p>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      <StatusBadge
                        label={appointment.status || 'waiting'}
                        variant={statusVariantMap[appointment.status] || 'warning'}
                        className="capitalize"
                      />
                      {appointment.status === 'waiting' && (
                        <Link
                          to={`/prescription/new?patientId=${encodeURIComponent(
                            appointment.patientId || appointment.id
                          )}`}
                          className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#287C75]/10 text-[#287C75] hover:bg-[#123A3A] hover:text-white transition"
                          title="Open Prescription Studio"
                        >
                          <Stethoscope size={14} />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))}

            {filteredAppointments.length === 0 && (
              <li className="rounded-2xl border border-dashed border-[#D9E6E2] bg-[#F7FAF8] p-8 text-center text-xs text-[#7D908C]">
                No appointments matched your search filters. Click "Add Demo Appointment" to create one.
              </li>
            )}
          </ul>
        </article>

        {/* Right Column: Month Calendar View */}
        <article className="rounded-3xl border border-[#D9E6E2] bg-white p-6 shadow-clinixpulse-xs">
          <div className="flex items-center justify-between border-b border-[#D9E6E2]/60 pb-3">
            <h2 className="font-heading text-base font-bold text-[#10201F]">
              Monthly Schedule
            </h2>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-[#D9E6E2] bg-[#F7FAF8] px-3 py-1 text-xs font-semibold text-[#10201F]">
              <CalendarClock size={13} className="text-[#287C75]" />
              <span>{monthLabel}</span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-7 gap-1.5 text-center text-[11px] font-bold uppercase tracking-wider text-[#7D908C]">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <div key={day} className="py-1">
                {day}
              </div>
            ))}
          </div>

          <div className="mt-2 grid grid-cols-7 gap-1.5">
            {calendarCells.map((day, index) => {
              if (!day) {
                return (
                  <div
                    key={`empty-${index}`}
                    className="h-14 rounded-xl border border-dashed border-[#D9E6E2]/40 bg-[#F7FAF8]/30"
                  />
                );
              }

              const count = appointmentCountByDay[day] || 0;
              const isToday = day === today.getDate();

              return (
                <div
                  key={day}
                  className={`h-14 rounded-xl border p-1.5 text-left transition flex flex-col justify-between ${
                    isToday
                      ? 'border-[#287C75] bg-teal-50/50 ring-1 ring-[#287C75]/30'
                      : count > 0
                      ? 'border-emerald-200 bg-emerald-50/40'
                      : 'border-[#D9E6E2] bg-white'
                  }`}
                >
                  <span
                    className={`text-xs font-bold ${
                      isToday ? 'text-[#123A3A]' : 'text-[#4E6460]'
                    }`}
                  >
                    {day}
                  </span>
                  {count > 0 && (
                    <span className="self-end rounded-md bg-[#287C75] px-1 py-0.2 text-[9px] font-bold text-white">
                      {count} {count === 1 ? 'appt' : 'appts'}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-5 rounded-2xl border border-[#D9E6E2] bg-[#F7FAF8] p-3 text-xs text-[#4E6460]">
            <p className="font-bold text-[#10201F] flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Offline Practice Synchronized
            </p>
            <p className="mt-0.5 text-[11px]">
              Appointment data is persisted locally and synchronizes automatically upon network reconnect.
            </p>
          </div>
        </article>
      </section>
    </div>
  );
}
