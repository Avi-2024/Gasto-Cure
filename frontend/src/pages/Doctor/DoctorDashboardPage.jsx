import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FilePlus2,
  FileText,
  Pill,
  Plus,
  Stethoscope,
  UserCheck,
  UserRound,
  Users,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { appointmentApi } from '../../services/appointmentApi';
import { patientApi } from '../../services/patientApi';
import { localAppointments, localMedicines, localPatients, localVisits } from '../../services/localStore';

export default function DoctorDashboardPage() {
  const { user, activeClinicId, activeClinic } = useAuth();

  const [liveQueue, setLiveQueue] = useState(() => localAppointments.getQueue());
  const [livePatientCount, setLivePatientCount] = useState(() => localPatients.getAll().length);

  useEffect(() => {
    if (import.meta.env.MODE !== 'test') {
      appointmentApi.getTodayQueue().then((res) => {
        if (res?.appointments) {
          setLiveQueue(res.appointments);
        }
      }).catch(() => {});

      patientApi.getPatients().then((res) => {
        if (res?.total !== undefined) {
          setLivePatientCount(res.total);
        }
      }).catch(() => {});
    }
  }, [activeClinicId]);

  const rawName = user?.fullName || user?.name || (user?.email ? user.email.split('@')[0].replace(/[._-]/g, ' ') : 'Doctor');
  const cleanName = rawName.replace(/^dr\.?\s+/i, '');
  const doctorName = cleanName
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

  // Live operational metrics
  const metrics = useMemo(() => {
    const visits = localVisits.getAll();
    const medicines = localMedicines.getAll();

    return {
      queueCount: liveQueue.length,
      queueList: liveQueue.slice(0, 5),
      visitCount: visits.length,
      patientCount: livePatientCount,
      medicineCount: medicines.length,
    };
  }, [liveQueue, livePatientCount]);

  return (
    <div className="space-y-6">
      {/* Doctor Console Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-[#D9E6E2] bg-gradient-to-br from-white via-[#F7FAF8] to-[#E9F3F0] p-6 shadow-clinixpulse-xs sm:p-8">
        <div className="relative z-10 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#287C75]/25 bg-[#287C75]/10 px-3 py-1 text-xs font-semibold text-[#287C75]">
                <Activity size={13} />
                Doctor Console • Clinical Mission Control
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active Session
              </span>
            </div>
            <h1 className="mt-3 font-heading text-2xl font-bold tracking-tight text-[#10201F] sm:text-3xl">
              Welcome back, Dr. {doctorName || 'Practitioner'}
            </h1>
            <p className="mt-1.5 text-sm text-[#4E6460]">
              Clinic: <span className="font-semibold text-[#123A3A]">{activeClinic?.name || activeClinic?.shortName || activeClinicId || 'Default Practice'}</span> • Ready for outpatient consultations and prescription generation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/prescription/new"
              className="inline-flex items-center gap-2 rounded-xl bg-[#123A3A] px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#287C75] transition"
            >
              <FilePlus2 size={16} />
              <span>New Prescription</span>
            </Link>
            <Link
              to="/doctor/consultation"
              className="inline-flex items-center gap-2 rounded-xl border border-[#D9E6E2] bg-white px-4 py-2.5 text-sm font-semibold text-[#123A3A] hover:bg-[#F7FAF8] transition"
            >
              <Stethoscope size={16} className="text-[#287C75]" />
              <span>Open Queue ({metrics.queueCount})</span>
            </Link>
          </div>
        </div>
      </section>

      {/* KPI Overview Cards */}
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-[#D9E6E2] bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#7D908C]">Waiting Queue</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
              <Clock3 size={16} />
            </span>
          </div>
          <p className="mt-3 font-heading text-2xl font-bold text-[#10201F] sm:text-3xl tabular-nums">
            {metrics.queueCount}
          </p>
          <p className="mt-1 text-xs text-[#4E6460]">Patients in triage waiting</p>
        </div>

        <div className="rounded-2xl border border-[#D9E6E2] bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#7D908C]">Prescriptions</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-50 text-[#287C75]">
              <FileText size={16} />
            </span>
          </div>
          <p className="mt-3 font-heading text-2xl font-bold text-[#10201F] sm:text-3xl tabular-nums">
            {metrics.visitCount}
          </p>
          <p className="mt-1 text-xs text-[#4E6460]">Total digital Rx records</p>
        </div>

        <div className="rounded-2xl border border-[#D9E6E2] bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#7D908C]">Patients</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <Users size={16} />
            </span>
          </div>
          <p className="mt-3 font-heading text-2xl font-bold text-[#10201F] sm:text-3xl tabular-nums">
            {metrics.patientCount}
          </p>
          <p className="mt-1 text-xs text-[#4E6460]">Registered in system</p>
        </div>

        <div className="rounded-2xl border border-[#D9E6E2] bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#7D908C]">Formulary Drugs</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <Pill size={16} />
            </span>
          </div>
          <p className="mt-3 font-heading text-2xl font-bold text-[#10201F] sm:text-3xl tabular-nums">
            {metrics.medicineCount}
          </p>
          <p className="mt-1 text-xs text-[#4E6460]">Active master medicines</p>
        </div>
      </section>

      {/* Main Clinical Actions Grid */}
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link
          to="/doctor/consultation"
          className="group rounded-2xl border border-[#D9E6E2] bg-white p-5 shadow-2xs transition hover:-translate-y-1 hover:border-[#287C75] hover:shadow-md"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#287C75]/10 text-[#287C75] group-hover:bg-[#123A3A] group-hover:text-white transition">
            <Stethoscope size={20} />
          </div>
          <h2 className="mt-4 font-heading text-base font-bold text-[#10201F] group-hover:text-[#287C75] transition">
            Start Consultation
          </h2>
          <p className="mt-1.5 text-xs text-[#4E6460] leading-relaxed">
            Open patient queue, diagnosis panel, clinical notes, and quick Rx workflow.
          </p>
          <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-[#287C75]">
            <span>Open Studio</span>
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        <Link
          to="/prescription/new"
          className="group rounded-2xl border border-[#D9E6E2] bg-white p-5 shadow-2xs transition hover:-translate-y-1 hover:border-[#287C75] hover:shadow-md"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-700 group-hover:bg-[#C9A45C] group-hover:text-white transition">
            <FilePlus2 size={20} />
          </div>
          <h2 className="mt-4 font-heading text-base font-bold text-[#10201F] group-hover:text-[#287C75] transition">
            Prescription Studio
          </h2>
          <p className="mt-1.5 text-xs text-[#4E6460] leading-relaxed">
            Compose calibrated letterhead prescriptions with medicine autocomplete.
          </p>
          <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-[#287C75]">
            <span>Write Prescription</span>
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        <Link
          to="/appointments"
          className="group rounded-2xl border border-[#D9E6E2] bg-white p-5 shadow-2xs transition hover:-translate-y-1 hover:border-[#287C75] hover:shadow-md"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700 group-hover:bg-[#123A3A] group-hover:text-white transition">
            <CalendarDays size={20} />
          </div>
          <h2 className="mt-4 font-heading text-base font-bold text-[#10201F] group-hover:text-[#287C75] transition">
            Appointment Timeline
          </h2>
          <p className="mt-1.5 text-xs text-[#4E6460] leading-relaxed">
            Track daily appointment roster, filter by status, and manage walk-ins.
          </p>
          <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-[#287C75]">
            <span>View Calendar</span>
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        <Link
          to="/patients"
          className="group rounded-2xl border border-[#D9E6E2] bg-white p-5 shadow-2xs transition hover:-translate-y-1 hover:border-[#287C75] hover:shadow-md"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 group-hover:bg-[#123A3A] group-hover:text-white transition">
            <UserRound size={20} />
          </div>
          <h2 className="mt-4 font-heading text-base font-bold text-[#10201F] group-hover:text-[#287C75] transition">
            Patient Registry
          </h2>
          <p className="mt-1.5 text-xs text-[#4E6460] leading-relaxed">
            Search patient history, chronic allergies, vitals timeline, and profiles.
          </p>
          <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-[#287C75]">
            <span>Open Directory</span>
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </section>

      {/* Waiting Queue Live Feed */}
      <section className="rounded-3xl border border-[#D9E6E2] bg-white p-6 shadow-clinixpulse-xs">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading text-lg font-bold text-[#10201F]">
              Live Outpatient Waiting Queue
            </h2>
            <p className="text-xs text-[#4E6460] mt-0.5">
              Patients currently checked in at reception waiting for clinical consultation.
            </p>
          </div>
          <Link
            to="/appointments"
            className="text-xs font-semibold text-[#287C75] hover:text-[#123A3A] transition"
          >
            Manage Roster &rarr;
          </Link>
        </div>

        {metrics.queueList.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-[#D9E6E2] bg-[#F7FAF8] p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-[#287C75]">
              <CheckCircle2 size={24} />
            </div>
            <h3 className="mt-3 font-heading text-sm font-bold text-[#10201F]">Queue is currently clear</h3>
            <p className="mt-1 text-xs text-[#4E6460] max-w-sm mx-auto">
              No patients are waiting. Check in a patient at the Reception Desk or book a new appointment.
            </p>
            <div className="mt-4 flex justify-center gap-3">
              <Link
                to="/appointments"
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#D9E6E2] bg-white px-3 py-1.5 text-xs font-semibold text-[#10201F] hover:bg-[#F7FAF8]"
              >
                <Plus size={14} />
                <span>Add Appointment</span>
              </Link>
              <Link
                to="/reception"
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#123A3A] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#287C75]"
              >
                <span>Reception Desk</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#D9E6E2] text-[11px] font-bold uppercase tracking-wider text-[#7D908C]">
                  <th className="pb-3 font-bold">Patient</th>
                  <th className="pb-3 font-bold">Reason for Visit</th>
                  <th className="pb-3 font-bold">Waiting Status</th>
                  <th className="pb-3 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D9E6E2]/60">
                {metrics.queueList.map((item) => (
                  <tr key={item.id || item.patientId} className="hover:bg-[#F7FAF8] transition">
                    <td className="py-3.5 pr-4">
                      <div className="font-bold text-[#10201F]">{item.patientName || 'Patient'}</div>
                      <div className="text-[11px] text-[#7D908C]">
                        Age: {item.patientAge || '--'} • Token: {item.id}
                      </div>
                    </td>
                    <td className="py-3.5 pr-4 text-[#4E6460]">
                      {item.reason || 'General Outpatient Consultation'}
                    </td>
                    <td className="py-3.5 pr-4">
                      <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                        In Queue
                      </span>
                    </td>
                    <td className="py-3.5 text-right">
                      <Link
                        to={`/prescription/new?patientId=${encodeURIComponent(item.patientId || item.id)}`}
                        className="inline-flex items-center gap-1 rounded-xl bg-[#287C75] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#123A3A] transition shadow-2xs"
                      >
                        <Stethoscope size={13} />
                        <span>Prescribe</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
