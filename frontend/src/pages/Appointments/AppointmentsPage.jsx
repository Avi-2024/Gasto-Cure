import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  Calendar,
  CalendarClock,
  CalendarRange,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Edit3,
  Filter,
  LayoutGrid,
  Loader2,
  MapPin,
  Phone,
  Plus,
  Search,
  Stethoscope,
  Table,
  Ticket,
  User,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import StatusBadge from '../../components/ui/StatusBadge';
import PatientAvatar from '../../components/common/PatientAvatar';
import PatientSearchSelector from '../../components/common/PatientSearchSelector';
import { useAuth } from '../../contexts/AuthContext';
import { appointmentApi } from '../../services/appointmentApi';
import { patientApi } from '../../services/patientApi';
import { localAppointments, localPatients } from '../../services/localStore';

const statusVariantMap = {
  waiting: 'warning',
  in_consultation: 'info',
  completed: 'success',
  cancelled: 'danger',
};

const COMMON_REASONS = [
  'General Consultation & Follow-up',
  'Acid Peptic Disease / GERD Workup',
  'Abdominal Pain & Bloating',
  'Fatty Liver Checkup',
  'Routine Prescription Refill',
];

export default function AppointmentsPage() {
  const { activeClinicId, activeClinic } = useAuth();
  const [appointments, setAppointments] = useState(() => {
    return JSON.parse(localStorage.getItem('ds_appointments') || '[]');
  });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [notification, setNotification] = useState('');

  // View Mode: 'table' (Clinical Queue Table) or 'cards'
  const [viewMode, setViewMode] = useState('table');

  // Calendar Navigation State
  const [viewDate, setViewDate] = useState(() => new Date());

  // Quick Edit Patient Modal State
  const [editingPatientModal, setEditingPatientModal] = useState(null);
  const [editPatientName, setEditPatientName] = useState('');
  const [editPatientPhone, setEditPatientPhone] = useState('');
  const [isUpdatingPatient, setIsUpdatingPatient] = useState(false);

  // Booking Modal State
  const [showBookModal, setShowBookModal] = useState(false);
  const [patients, setPatients] = useState(() => localPatients.getAll());
  const [selectedPatientObj, setSelectedPatientObj] = useState(null);
  const [bookingError, setBookingError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isWalkIn, setIsWalkIn] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    patientId: '',
    patientName: '',
    patientPhone: '',
    patientAge: '',
    patientGender: 'MALE',
    appointmentDate: new Date().toISOString().split('T')[0],
    timeSlot: 'Morning OPD (10:00 AM - 01:00 PM)',
    chiefComplaint: 'General Outpatient Follow-up',
  });

  const reloadAppointments = async () => {
    if (import.meta.env.MODE !== 'test') {
      try {
        const res = await appointmentApi.getTodayQueue('all');
        if (res?.appointments && res.appointments.length > 0) {
          setAppointments(res.appointments);
          localStorage.setItem('ds_appointments', JSON.stringify(res.appointments));
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

    patientApi
      .getPatients({ limit: 100 })
      .then((res) => {
        if (res?.patients?.length > 0) {
          setPatients(res.patients);
        }
      })
      .catch(() => {});
  }, [activeClinicId]);

  const filteredAppointments = useMemo(
    () =>
      appointments.filter((appointment) => {
        const matchesSearch =
          (appointment.patientName || '').toLowerCase().includes(search.toLowerCase()) ||
          (appointment.reason || '').toLowerCase().includes(search.toLowerCase()) ||
          (appointment.id || '').toLowerCase().includes(search.toLowerCase()) ||
          (appointment.tokenFormatted || '').toLowerCase().includes(search.toLowerCase());

        const matchesStatus =
          statusFilter === 'all' ||
          (appointment.status || '').toLowerCase() === statusFilter.toLowerCase();

        const appointmentDate = appointment.appointmentDate || (appointment.createdAt ? appointment.createdAt.split('T')[0] : '');
        const matchesDate = !dateFilter || appointmentDate === dateFilter;

        return matchesSearch && matchesStatus && matchesDate;
      }),
    [appointments, search, statusFilter, dateFilter]
  );

  const today = new Date();
  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();
  const monthStart = new Date(viewYear, viewMonth, 1);
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const offset = (monthStart.getDay() + 6) % 7;

  // Compute daily appointment counts for the current calendar month view
  const appointmentCountByDay = useMemo(() => {
    return appointments.reduce((acc, appointment) => {
      const rawDate = appointment.appointmentDate || (appointment.createdAt ? appointment.createdAt.split('T')[0] : '');
      if (!rawDate) return acc;
      const d = new Date(rawDate);
      if (d.getFullYear() === viewYear && d.getMonth() === viewMonth) {
        const day = d.getDate();
        acc[day] = (acc[day] || 0) + 1;
      }
      return acc;
    }, {});
  }, [appointments, viewYear, viewMonth]);

  const calendarCells = [
    ...Array(offset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, idx) => idx + 1),
  ];
  const monthLabel = monthStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Handle clicking a day in the monthly schedule
  const handleCalendarDayClick = (day) => {
    if (!day) return;
    const clickedDateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (dateFilter === clickedDateStr) {
      setDateFilter(''); // Toggle off
    } else {
      setDateFilter(clickedDateStr); // Filter to this day
    }
  };

  // Handle Full Appointment Booking
  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    setBookingError('');

    if (!isWalkIn && !bookingForm.patientId) {
      setBookingError('Please search and select a registered patient, or switch to "+ New Walk-in Patient".');
      return;
    }
    if (isWalkIn && (!bookingForm.patientName.trim() || !bookingForm.patientPhone.trim())) {
      setBookingError('Please enter Walk-in Patient Name and Mobile Number.');
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    // Always include patientName, patientPhone, age, gender so patient is never created as "Walk-in Patient"
    const payload = {
      patientId: !isWalkIn ? bookingForm.patientId : undefined,
      patientName: bookingForm.patientName.trim(),
      patientPhone: bookingForm.patientPhone.trim(),
      patientAge: bookingForm.patientAge ? Number(bookingForm.patientAge) : null,
      patientGender: bookingForm.patientGender || 'OTHER',
      appointmentDate: bookingForm.appointmentDate,
      chiefComplaint: `${bookingForm.chiefComplaint} (${bookingForm.timeSlot})`,
    };

    try {
      const res = await appointmentApi.createAppointment(payload);
      setShowBookModal(false);
      await reloadAppointments();
      setNotification(`Appointment confirmed for ${bookingForm.patientName.trim()}! Token #${res?.data?.tokenNumber || 'allocated'} issued.`);
      setTimeout(() => setNotification(''), 4500);

      // Reset form
      setBookingForm({
        patientId: '',
        patientName: '',
        patientPhone: '',
        patientAge: '',
        patientGender: 'MALE',
        appointmentDate: new Date().toISOString().split('T')[0],
        timeSlot: 'Morning OPD (10:00 AM - 01:00 PM)',
        chiefComplaint: 'General Outpatient Follow-up',
      });
      setSelectedPatientObj(null);
      setIsWalkIn(false);
      setBookingError('');
    } catch (err) {
      console.warn('Booking error:', err);
      setBookingError(err.message || 'Failed to book appointment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Updating Existing Patient Name (e.g. for walk-in appointments)
  const handleSavePatientName = async (e) => {
    e.preventDefault();
    if (!editPatientName.trim() || !editingPatientModal) return;

    setIsUpdatingPatient(true);
    try {
      if (editingPatientModal.patientId) {
        await patientApi.updatePatient(editingPatientModal.patientId, {
          name: editPatientName.trim(),
          phone: editPatientPhone.trim(),
        });
      }

      // Update state immediately
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === editingPatientModal.appointmentId || a.patientId === editingPatientModal.patientId
            ? { ...a, patientName: editPatientName.trim(), patientPhone: editPatientPhone.trim() }
            : a
        )
      );

      // Sync local storage
      const stored = JSON.parse(localStorage.getItem('ds_appointments') || '[]');
      const updatedStored = stored.map((a) =>
        a.id === editingPatientModal.appointmentId || a.patientId === editingPatientModal.patientId
          ? { ...a, patientName: editPatientName.trim(), patientPhone: editPatientPhone.trim() }
          : a
      );
      localStorage.setItem('ds_appointments', JSON.stringify(updatedStored));

      setEditingPatientModal(null);
      setNotification(`Patient name updated to "${editPatientName.trim()}".`);
      setTimeout(() => setNotification(''), 4000);
      reloadAppointments();
    } catch (err) {
      console.warn('Update patient name error:', err);
      alert('Failed to update patient name: ' + err.message);
    } finally {
      setIsUpdatingPatient(false);
    }
  };

  // Status transition handler
  const handleUpdateStatus = async (appointmentId, newStatus) => {
    try {
      await appointmentApi.updateStatus(appointmentId, newStatus);
      const updated = appointments.map((a) =>
        a.id === appointmentId ? { ...a, status: newStatus.toLowerCase(), rawStatus: newStatus } : a
      );
      setAppointments(updated);
      localStorage.setItem('ds_appointments', JSON.stringify(updated));
      setNotification(`Appointment status updated to ${newStatus}.`);
      setTimeout(() => setNotification(''), 3500);
    } catch (err) {
      console.warn('Status update error:', err);
    }
  };

  // Legacy fallback function preserved for zero test regressions
  const handleAddDemoAppointment = async () => {
    const pList = localPatients.getAll();
    if (pList.length === 0) {
      setNotification('Please register at least one patient first before scheduling an appointment.');
      setTimeout(() => setNotification(''), 4000);
      return;
    }
    const randomPatient = pList[Math.floor(Math.random() * pList.length)];

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

  const clinicSlug = activeClinic?.slug || 'gastrocure';

  return (
    <div className="space-y-6">
      {/* Page Title & Booking Action Header */}
      <section className="rounded-3xl border border-[#D9E6E2] bg-white p-6 shadow-clinixpulse-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#287C75]/25 bg-[#287C75]/10 px-2.5 py-0.5 text-xs font-semibold text-[#287C75]">
                <Calendar size={13} />
                Outpatient Scheduling & Queue Control
              </span>
              <span className="text-xs font-semibold text-[#7D908C]">
                {appointments.length} total scheduled
              </span>
            </div>
            <h1 className="mt-2 font-heading text-2xl font-bold tracking-tight text-[#10201F] sm:text-3xl">
              Appointments Timeline
            </h1>
            <p className="mt-1 text-sm text-[#4E6460]">
              Filter consultation bookings, monitor queue statuses, and issue verified digital tokens.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Public Portal Link */}
            <Link
              to={`/book/${clinicSlug}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#D9E6E2] bg-[#F7FAF8] px-3 py-2 text-xs font-bold text-[#123A3A] hover:bg-white hover:border-[#287C75] transition"
              title="Open Public Online Booking Page for Patients"
            >
              <Ticket size={14} className="text-[#287C75]" />
              <span>Public Booking Portal</span>
            </Link>

            {/* Book Appointment Modal Trigger */}
            <button
              type="button"
              onClick={() => setShowBookModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-[#123A3A] px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-[#287C75] transition shrink-0"
            >
              <Plus size={16} />
              <span>Book Appointment</span>
            </button>
          </div>
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
      <section className="grid gap-6 xl:grid-cols-[1fr_340px] 2xl:grid-cols-[1fr_360px]">
        {/* Left Column: Appointments Register (Table & Card View Modes) */}
        <article className="rounded-3xl border border-[#D9E6E2] bg-white p-6 shadow-clinixpulse-xs flex flex-col">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#D9E6E2]/60 pb-3.5">
            <div className="flex items-center gap-3">
              <h2 className="font-heading text-base font-bold text-[#10201F] whitespace-nowrap">
                Appointment Register
              </h2>
              <StatusBadge label={`${filteredAppointments.length} Appointments`} variant="info" />
            </div>

            {/* View Mode Toggle Switcher */}
            <div className="flex items-center gap-1 rounded-xl border border-[#D9E6E2] bg-[#F7FAF8] p-1">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white text-[#287C75] shadow-xs'
                    : 'text-[#4E6460] hover:text-[#10201F]'
                }`}
                title="Clinical Queue Table View"
              >
                <Table size={13} />
                <span>Table</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                  viewMode === 'cards'
                    ? 'bg-white text-[#287C75] shadow-xs'
                    : 'text-[#4E6460] hover:text-[#10201F]'
                }`}
                title="Cards View"
              >
                <LayoutGrid size={13} />
                <span>Cards</span>
              </button>
            </div>
          </div>

          {/* Table View */}
          {viewMode === 'table' ? (
            <div className="mt-4 overflow-x-auto rounded-2xl border border-[#D9E6E2] bg-white shadow-2xs">
              <table className="w-full text-left border-collapse min-w-[820px]">
                <thead>
                  <tr className="border-b border-[#D9E6E2] bg-[#F7FAF8] text-[11px] font-bold uppercase tracking-wider text-[#4E6460]">
                    <th className="py-3 px-3 text-center w-20 min-w-[70px] whitespace-nowrap">Token</th>
                    <th className="py-3 px-4 min-w-[220px] whitespace-nowrap">Patient Details</th>
                    <th className="py-3 px-4 min-w-[130px] whitespace-nowrap">Contact</th>
                    <th className="py-3 px-4 min-w-[180px] whitespace-nowrap">Complaint / Shift</th>
                    <th className="py-3 px-4 min-w-[130px] whitespace-nowrap">Schedule</th>
                    <th className="py-3 px-3 text-center min-w-[100px] whitespace-nowrap">Status</th>
                    <th className="py-3 px-4 text-right min-w-[110px] whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D9E6E2]/70 text-xs">
                  {filteredAppointments.map((appointment) => {
                    const isWaiting = (appointment.status || '').toLowerCase() === 'waiting';
                    const rawDate = appointment.appointmentDate || (appointment.createdAt ? appointment.createdAt.split('T')[0] : '');
                    const formattedDate = rawDate
                      ? new Date(`${rawDate}T00:00:00`).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : 'Today';

                    return (
                      <tr
                        key={appointment.id}
                        className="group hover:bg-[#F7FAF8]/80 transition-colors"
                      >
                        {/* Token */}
                        <td className="py-3.5 px-3 text-center align-middle whitespace-nowrap">
                          <span className="inline-flex items-center justify-center rounded-lg bg-[#FDF6E2] border border-[#EBD7A9] px-2.5 py-1 text-xs font-mono font-bold text-[#8C6B1F] shadow-2xs">
                            {appointment.tokenFormatted || `#${appointment.tokenNumber || '—'}`}
                          </span>
                        </td>

                        {/* Patient Details */}
                        <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <PatientAvatar
                              gender={appointment.patientGender || appointment.gender || ''}
                              name={appointment.patientName || 'Patient'}
                              className="h-9 w-9 shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 whitespace-nowrap">
                                <span className="font-heading text-sm font-bold text-[#10201F] whitespace-nowrap">
                                  {appointment.patientName || 'Patient'}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingPatientModal({
                                      appointmentId: appointment.id,
                                      patientId: appointment.patientId,
                                      currentName: appointment.patientName === 'Walk-in Patient' ? '' : appointment.patientName,
                                      currentPhone: appointment.patientPhone || '',
                                    });
                                    setEditPatientName(appointment.patientName === 'Walk-in Patient' ? '' : (appointment.patientName || ''));
                                    setEditPatientPhone(appointment.patientPhone || '');
                                  }}
                                  className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-semibold text-[#287C75] bg-[#287C75]/10 hover:bg-[#287C75]/20 transition cursor-pointer whitespace-nowrap"
                                  title={appointment.patientName === 'Walk-in Patient' ? 'Set Patient Name' : 'Edit Name'}
                                >
                                  <Edit3 size={10} />
                                  <span>{appointment.patientName === 'Walk-in Patient' ? 'Set Name' : 'Edit'}</span>
                                </button>
                              </div>
                              <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-[#7D908C] whitespace-nowrap">
                                {appointment.patientMrn && (
                                  <span className="rounded border border-[#287C75]/20 bg-[#287C75]/10 px-1.5 py-0.2 font-mono text-[10px] font-bold text-[#123A3A] whitespace-nowrap">
                                    {appointment.patientMrn}
                                  </span>
                                )}
                                {(appointment.patientAge || appointment.age) ? (
                                  <span className="whitespace-nowrap">
                                    {appointment.patientAge || appointment.age} Yrs
                                    {appointment.patientGender || appointment.gender ? ` • ${appointment.patientGender || appointment.gender}` : ''}
                                  </span>
                                ) : (
                                  <span className="text-amber-700 bg-amber-50 px-1 rounded border border-amber-200 text-[10px] whitespace-nowrap">Walk-in</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Contact Phone */}
                        <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                          {appointment.patientPhone ? (
                            <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-[#287C75] bg-[#287C75]/5 px-2.5 py-1 rounded-md border border-[#287C75]/15 whitespace-nowrap">
                              <Phone size={10} />
                              {appointment.patientPhone}
                            </span>
                          ) : (
                            <span className="text-[11px] text-[#7D908C] italic whitespace-nowrap">No phone</span>
                          )}
                        </td>

                        {/* Complaint / Shift */}
                        <td className="py-3.5 px-4 align-middle max-w-[220px]">
                          <p className="font-semibold text-xs text-[#10201F] truncate" title={appointment.reason}>
                            {appointment.reason || 'General Outpatient Consultation'}
                          </p>
                          <p className="text-[10px] text-[#7D908C] truncate mt-0.5">
                            {appointment.chiefComplaint?.includes('(')
                              ? appointment.chiefComplaint.split('(')[1]?.replace(')', '')
                              : 'Morning OPD'}
                          </p>
                        </td>

                        {/* Schedule */}
                        <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                          <div className="flex items-center gap-1.5 font-semibold text-xs text-[#10201F] whitespace-nowrap">
                            <Clock3 size={11} className="text-[#287C75]" />
                            <span>{appointment.startTime || '10:00 AM'}</span>
                          </div>
                          <div className="text-[11px] text-[#7D908C] mt-0.5 whitespace-nowrap">
                            {formattedDate}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-3 text-center align-middle whitespace-nowrap">
                          <StatusBadge
                            label={appointment.status || 'waiting'}
                            variant={statusVariantMap[appointment.status] || 'warning'}
                            className="capitalize text-xs font-medium"
                          />
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right align-middle whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5 justify-end">
                            {isWaiting ? (
                              <>
                                <Link
                                  to={`/prescription/new?patientId=${encodeURIComponent(
                                    appointment.patientId || appointment.id
                                  )}`}
                                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#287C75]/10 text-[#287C75] hover:bg-[#123A3A] hover:text-white transition shadow-2xs"
                                  title="Start Consultation & Prescribe"
                                >
                                  <Stethoscope size={13} />
                                </Link>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateStatus(appointment.id, 'COMPLETED')}
                                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white transition cursor-pointer shadow-2xs"
                                  title="Mark Completed"
                                >
                                  <CheckCircle2 size={13} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateStatus(appointment.id, 'CANCELLED')}
                                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition cursor-pointer shadow-2xs"
                                  title="Cancel Appointment"
                                >
                                  <XCircle size={13} />
                                </button>
                              </>
                            ) : (
                              <Link
                                to={`/prescription/new?patientId=${encodeURIComponent(
                                  appointment.patientId || appointment.id
                                )}`}
                                className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#F7FAF8] text-[#4E6460] hover:bg-[#287C75] hover:text-white transition"
                                title="View Patient Record"
                              >
                                <User size={13} />
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredAppointments.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-xs text-[#7D908C]">
                        No appointments matched your search filters. Click "+ Book Appointment" to schedule a patient.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            /* Card View with Whitespace-nowrap on Schedule */
            <ul className="mt-4 space-y-3">
              {filteredAppointments.map((appointment) => {
                const isWaiting = (appointment.status || '').toLowerCase() === 'waiting';
                const rawDate = appointment.appointmentDate || (appointment.createdAt ? appointment.createdAt.split('T')[0] : '');
                const formattedDate = rawDate
                  ? new Date(`${rawDate}T00:00:00`).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : 'Today';

                return (
                  <li
                    key={appointment.id}
                    className="group rounded-2xl border border-[#D9E6E2] bg-white p-4 transition hover:border-[#287C75] hover:bg-[#F7FAF8]/70 hover:shadow-xs"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          {appointment.tokenFormatted && (
                            <span className="inline-flex items-center justify-center rounded-lg bg-[#FDF6E2] border border-[#EBD7A9] px-2 py-0.5 text-[11px] font-mono font-bold text-[#8C6B1F]">
                              {appointment.tokenFormatted}
                            </span>
                          )}
                          <span className="font-heading text-sm font-bold text-[#10201F]">
                            {appointment.patientName || 'Patient'}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingPatientModal({
                                appointmentId: appointment.id,
                                patientId: appointment.patientId,
                                currentName: appointment.patientName === 'Walk-in Patient' ? '' : appointment.patientName,
                                currentPhone: appointment.patientPhone || '',
                              });
                              setEditPatientName(appointment.patientName === 'Walk-in Patient' ? '' : (appointment.patientName || ''));
                              setEditPatientPhone(appointment.patientPhone || '');
                            }}
                            className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold text-[#287C75] hover:bg-[#287C75]/10 hover:text-[#123A3A] transition cursor-pointer"
                            title={appointment.patientName === 'Walk-in Patient' ? 'Set Real Patient Name' : 'Edit Patient Name'}
                          >
                            <Edit3 size={11} />
                            <span>{appointment.patientName === 'Walk-in Patient' ? 'Set Name' : 'Edit'}</span>
                          </button>
                          {appointment.patientMrn ? (
                            <span className="rounded-md border border-[#287C75]/20 bg-[#287C75]/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#123A3A]">
                              {appointment.patientMrn}
                            </span>
                          ) : appointment.patientPhone ? (
                            <span className="rounded-md border border-[#D9E6E2] bg-[#F7FAF8] px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[#4E6460] flex items-center gap-1">
                              <Phone size={10} className="text-[#287C75]" />
                              {appointment.patientPhone}
                            </span>
                          ) : (
                            <span className="rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                              Walk-in
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[#4E6460]">
                          <span>{appointment.reason || 'General Outpatient Consultation'}</span>
                          {(appointment.patientAge || appointment.age) && (
                            <span className="text-[11px] text-[#7D908C]">
                              • {appointment.patientAge || appointment.age} Yrs
                              {appointment.patientGender || appointment.gender ? ` (${appointment.patientGender || appointment.gender})` : ''}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 sm:text-right shrink-0">
                        <div className="whitespace-nowrap">
                          <p className="text-xs font-semibold text-[#10201F] flex items-center sm:justify-end gap-1 whitespace-nowrap">
                            <Clock3 size={12} className="text-[#287C75]" />
                            {appointment.startTime || '10:00 AM'}
                          </p>
                          <p className="text-[11px] text-[#7D908C] whitespace-nowrap">
                            {formattedDate}
                          </p>
                        </div>

                        <div className="shrink-0 flex items-center gap-2">
                          <StatusBadge
                            label={appointment.status || 'waiting'}
                            variant={statusVariantMap[appointment.status] || 'warning'}
                            className="capitalize"
                          />

                          {isWaiting && (
                            <>
                              <Link
                                to={`/prescription/new?patientId=${encodeURIComponent(
                                  appointment.patientId || appointment.id
                                )}`}
                                className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#287C75]/10 text-[#287C75] hover:bg-[#123A3A] hover:text-white transition"
                                title="Start Consultation & Prescribe"
                              >
                                <Stethoscope size={14} />
                              </Link>

                              <button
                                type="button"
                                onClick={() => handleUpdateStatus(appointment.id, 'COMPLETED')}
                                className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white transition cursor-pointer"
                                title="Mark Completed"
                              >
                                <CheckCircle2 size={14} />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleUpdateStatus(appointment.id, 'CANCELLED')}
                                className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition cursor-pointer"
                                title="Cancel Appointment"
                              >
                                <XCircle size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}

              {filteredAppointments.length === 0 && (
                <li className="rounded-2xl border border-dashed border-[#D9E6E2] bg-[#F7FAF8] p-8 text-center text-xs text-[#7D908C]">
                  No appointments matched your search filters. Click "+ Book Appointment" to schedule a patient.
                </li>
              )}
            </ul>
          )}
        </article>

        {/* Right Column: Month Calendar View */}
        <article className="rounded-3xl border border-[#D9E6E2] bg-white p-6 shadow-clinixpulse-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#D9E6E2]/60 pb-3">
            <h2 className="font-heading text-base font-bold text-[#10201F] whitespace-nowrap">
              Monthly Schedule
            </h2>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setViewDate(new Date(viewYear, viewMonth - 1, 1))}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#D9E6E2] text-[#4E6460] hover:bg-[#F7FAF8] hover:text-[#123A3A] transition cursor-pointer"
                title="Previous Month"
              >
                <ChevronLeft size={14} />
              </button>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-[#D9E6E2] bg-[#F7FAF8] px-2.5 py-1 text-xs font-semibold text-[#10201F] whitespace-nowrap">
                <CalendarClock size={12} className="text-[#287C75]" />
                <span>{monthLabel}</span>
              </div>
              <button
                type="button"
                onClick={() => setViewDate(new Date(viewYear, viewMonth + 1, 1))}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#D9E6E2] text-[#4E6460] hover:bg-[#F7FAF8] hover:text-[#123A3A] transition cursor-pointer"
                title="Next Month"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* Active Date Filter Banner */}
          {dateFilter && (
            <div className="mt-3 flex items-center justify-between rounded-xl border border-[#287C75]/30 bg-[#287C75]/10 px-3 py-1.5 text-xs text-[#123A3A] animate-fadeIn">
              <span className="font-medium flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#287C75]" />
                <span>Filtered to: <strong>{new Date(dateFilter).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</strong></span>
              </span>
              <button
                type="button"
                onClick={() => setDateFilter('')}
                className="text-[11px] font-bold text-[#287C75] hover:underline cursor-pointer"
              >
                Show All Dates ✕
              </button>
            </div>
          )}

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

              const cellDateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const count = appointmentCountByDay[day] || 0;
              const isToday = day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();
              const isSelected = dateFilter === cellDateStr;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleCalendarDayClick(day)}
                  className={`h-14 rounded-xl border p-1.5 text-left transition flex flex-col justify-between cursor-pointer group ${
                    isSelected
                      ? 'border-[#287C75] bg-[#287C75]/15 ring-2 ring-[#287C75] shadow-xs'
                      : isToday
                      ? 'border-[#287C75] bg-teal-50/50 ring-1 ring-[#287C75]/30 hover:bg-teal-50'
                      : count > 0
                      ? 'border-emerald-200 bg-emerald-50/40 hover:border-emerald-400 hover:bg-emerald-50'
                      : 'border-[#D9E6E2] bg-white hover:border-[#287C75]/60 hover:bg-[#F7FAF8]'
                  }`}
                  title={count > 0 ? `${count} appointment(s) on ${cellDateStr} - Click to filter` : `Click to filter to ${cellDateStr}`}
                >
                  <span
                    className={`text-xs font-bold ${
                      isSelected
                        ? 'text-[#123A3A]'
                        : isToday
                        ? 'text-[#123A3A]'
                        : 'text-[#4E6460]'
                    }`}
                  >
                    {day}
                  </span>
                  {count > 0 ? (
                    <span className="self-end rounded-md bg-[#287C75] px-1 py-0.2 text-[9px] font-bold text-white shadow-2xs group-hover:scale-105 transition">
                      {count} {count === 1 ? 'appt' : 'appts'}
                    </span>
                  ) : isSelected ? (
                    <span className="self-end text-[9px] font-medium text-[#287C75]">
                      Selected
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          <div className="mt-5 rounded-2xl border border-[#D9E6E2] bg-[#F7FAF8] p-3 text-xs text-[#4E6460]">
            <p className="font-bold text-[#10201F] flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Live Multi-Tenant OPD Queue
            </p>
            <p className="mt-0.5 text-[11px]">
              Tokens are dynamically allocated per operational calendar date and synced across front desk and doctor consult rooms.
            </p>
          </div>
        </article>
      </section>

      {/* Book Appointment Modal */}
      {showBookModal && typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-lg rounded-3xl border border-[#D9E6E2] bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-[#D9E6E2]/60 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#287C75]/10 text-[#287C75]">
                    <Calendar size={18} />
                  </div>
                  <div>
                    <h2 className="font-heading text-lg font-bold text-[#10201F]">
                      Book Clinic Appointment
                    </h2>
                    <p className="text-xs text-[#4E6460]">
                      Schedule consultation and allocate sequential OPD token.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowBookModal(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#D9E6E2] text-[#4E6460] hover:bg-[#F7FAF8]"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Mode Toggle: Existing vs New Walk-in */}
              <div className="mt-4 flex rounded-xl border border-[#D9E6E2] bg-[#F7FAF8] p-1 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setIsWalkIn(false)}
                  className={`flex-1 rounded-lg py-1.5 transition ${
                    !isWalkIn ? 'bg-white text-[#123A3A] shadow-xs font-bold' : 'text-[#4E6460]'
                  }`}
                >
                  Registered Patient
                </button>
                <button
                  type="button"
                  onClick={() => setIsWalkIn(true)}
                  className={`flex-1 rounded-lg py-1.5 transition ${
                    isWalkIn ? 'bg-white text-[#123A3A] shadow-xs font-bold' : 'text-[#4E6460]'
                  }`}
                >
                  + New Walk-in Patient
                </button>
              </div>

              <form onSubmit={handleConfirmBooking} className="mt-4 space-y-3.5 text-xs">
                {/* Inline Validation & API Error Banner (No native alerts!) */}
                {bookingError && (
                  <div className="flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50/90 p-3 text-xs text-rose-800 animate-fadeIn">
                    <AlertCircle size={16} className="mt-0.5 shrink-0 text-rose-600" />
                    <div>
                      <p className="font-bold">Required Information Missing</p>
                      <p className="mt-0.5 text-[11px] text-rose-700">{bookingError}</p>
                    </div>
                  </div>
                )}

                {/* Existing Patient Selector */}
                {!isWalkIn ? (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#4E6460] mb-1.5 flex items-center justify-between">
                      <span>Select Registered Patient *</span>
                      <span className="text-[10px] text-[#7D908C] font-normal lowercase">Search across clinic database</span>
                    </label>
                    <PatientSearchSelector
                      selectedPatientId={bookingForm.patientId}
                      selectedPatient={selectedPatientObj}
                      onSelectPatient={(p) => {
                        setSelectedPatientObj(p);
                        setBookingForm((prev) => ({
                          ...prev,
                          patientId: p.id,
                          patientName: p.name,
                          patientPhone: p.phone || p.contact || '',
                          patientAge: p.age || '',
                          patientGender: p.gender || 'MALE',
                        }));
                        setBookingError('');
                      }}
                      onClearPatient={() => {
                        setSelectedPatientObj(null);
                        setBookingForm((prev) => ({
                          ...prev,
                          patientId: '',
                          patientName: '',
                        }));
                      }}
                      onSwitchToWalkIn={(suggested) => {
                        setIsWalkIn(true);
                        setBookingForm((prev) => ({
                          ...prev,
                          patientName: suggested || '',
                          patientPhone: /^\d+$/.test(suggested) ? suggested : '',
                        }));
                        setBookingError('');
                      }}
                    />
                  </div>
                ) : (
                  /* Walk-in Registration Inputs */
                  <div className="space-y-3 rounded-2xl border border-[#D9E6E2] bg-[#F7FAF8]/50 p-3.5">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#4E6460] mb-1">
                        Walk-in Patient Name *
                      </label>
                      <input
                        required
                        placeholder="Full Name"
                        value={bookingForm.patientName}
                        onChange={(e) =>
                          setBookingForm({ ...bookingForm, patientName: e.target.value })
                        }
                        className="w-full rounded-xl border border-[#D9E6E2] bg-white p-2.5 text-xs font-semibold text-[#10201F]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-[#4E6460] mb-1">
                          Mobile Number *
                        </label>
                        <input
                          required
                          type="tel"
                          placeholder="Phone Number"
                          value={bookingForm.patientPhone}
                          onChange={(e) =>
                            setBookingForm({ ...bookingForm, patientPhone: e.target.value })
                          }
                          className="w-full rounded-xl border border-[#D9E6E2] bg-white p-2.5 text-xs font-semibold text-[#10201F]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-[#4E6460] mb-1">
                          Age
                        </label>
                        <input
                          type="number"
                          placeholder="Years"
                          value={bookingForm.patientAge}
                          onChange={(e) =>
                            setBookingForm({ ...bookingForm, patientAge: e.target.value })
                          }
                          className="w-full rounded-xl border border-[#D9E6E2] bg-white p-2.5 text-xs font-semibold text-[#10201F]"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Date & Shift */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#4E6460] mb-1">
                      Consultation Date *
                    </label>
                    <input
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      value={bookingForm.appointmentDate}
                      onChange={(e) =>
                        setBookingForm({ ...bookingForm, appointmentDate: e.target.value })
                      }
                      className="w-full rounded-xl border border-[#D9E6E2] bg-white p-2.5 text-xs font-semibold text-[#10201F]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#4E6460] mb-1">
                      OPD Shift *
                    </label>
                    <select
                      value={bookingForm.timeSlot}
                      onChange={(e) =>
                        setBookingForm({ ...bookingForm, timeSlot: e.target.value })
                      }
                      className="w-full rounded-xl border border-[#D9E6E2] bg-white p-2.5 text-xs font-semibold text-[#10201F]"
                    >
                      <option value="Morning OPD (10:00 AM - 01:00 PM)">Morning OPD</option>
                      <option value="Afternoon OPD (02:00 PM - 04:30 PM)">Afternoon OPD</option>
                      <option value="Evening OPD (05:00 PM - 08:00 PM)">Evening OPD</option>
                    </select>
                  </div>
                </div>

                {/* Reason for Visit */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#4E6460] mb-1">
                    Chief Complaint / Reason *
                  </label>
                  <input
                    value={bookingForm.chiefComplaint}
                    onChange={(e) =>
                      setBookingForm({ ...bookingForm, chiefComplaint: e.target.value })
                    }
                    className="w-full rounded-xl border border-[#D9E6E2] bg-white p-2.5 text-xs font-semibold text-[#10201F]"
                  />

                  {/* Quick Chips */}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {COMMON_REASONS.map((reason) => (
                      <button
                        key={reason}
                        type="button"
                        onClick={() =>
                          setBookingForm({ ...bookingForm, chiefComplaint: reason })
                        }
                        className="rounded-lg border border-[#D9E6E2] bg-[#F7FAF8] px-2 py-0.5 text-[10px] font-medium text-[#4E6460] hover:border-[#287C75] hover:text-[#123A3A] transition"
                      >
                        {reason}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#D9E6E2]">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => {
                      setBookingError('');
                      setShowBookModal(false);
                    }}
                    className="rounded-xl border border-[#D9E6E2] px-4 py-2.5 text-xs font-semibold text-[#4E6460] hover:bg-[#F7FAF8] disabled:opacity-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-xl bg-[#123A3A] px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#287C75] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[210px] cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="animate-spin" size={15} />
                        <span>Allocating Token & Booking...</span>
                      </>
                    ) : (
                      'Confirm Booking & Issue Token'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* Quick Edit Patient Name Modal */}
      {editingPatientModal && typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-3xl border border-[#D9E6E2] bg-white p-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-[#D9E6E2]/60 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#287C75]/10 text-[#287C75]">
                    <User size={18} />
                  </div>
                  <div>
                    <h2 className="font-heading text-base font-bold text-[#10201F]">
                      Set Patient Information
                    </h2>
                    <p className="text-xs text-[#4E6460]">
                      Update patient name and phone number for this appointment.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingPatientModal(null)}
                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#D9E6E2] text-[#4E6460] hover:bg-[#F7FAF8] cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSavePatientName} className="mt-4 space-y-3.5 text-xs">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#4E6460] mb-1">
                    Patient Full Name *
                  </label>
                  <input
                    required
                    placeholder="Enter patient full name (e.g. Ramesh Kumar)"
                    value={editPatientName}
                    onChange={(e) => setEditPatientName(e.target.value)}
                    className="w-full rounded-xl border border-[#D9E6E2] bg-[#F7FAF8] p-2.5 text-xs font-semibold text-[#10201F] focus:border-[#287C75] focus:bg-white focus:outline-none"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#4E6460] mb-1">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    placeholder="10-digit mobile number"
                    value={editPatientPhone}
                    onChange={(e) => setEditPatientPhone(e.target.value)}
                    className="w-full rounded-xl border border-[#D9E6E2] bg-[#F7FAF8] p-2.5 text-xs font-semibold text-[#10201F] focus:border-[#287C75] focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#D9E6E2]">
                  <button
                    type="button"
                    disabled={isUpdatingPatient}
                    onClick={() => setEditingPatientModal(null)}
                    className="rounded-xl border border-[#D9E6E2] px-4 py-2 text-xs font-semibold text-[#4E6460] hover:bg-[#F7FAF8] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdatingPatient}
                    className="rounded-xl bg-[#123A3A] px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#287C75] transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                  >
                    {isUpdatingPatient ? (
                      <>
                        <Loader2 className="animate-spin" size={14} />
                        <span>Saving...</span>
                      </>
                    ) : (
                      'Save Patient Name'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
