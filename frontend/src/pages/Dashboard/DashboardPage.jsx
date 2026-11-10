import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  CalendarClock,
  Clock3,
  DollarSign,
  Users,
  Stethoscope,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import StatCard from '../../components/ui/StatCard';
import StatusBadge from '../../components/ui/StatusBadge';
import { localAppointments, localPatients, localVisits } from '../../services/localStore';
import QuickPatientSearch from './components/QuickPatientSearch';
import FollowUpRemindersWidget from './components/FollowUpRemindersWidget';

const statusToVariant = {
  waiting: 'warning',
  completed: 'success',
  cancelled: 'danger',
};

const formatDoctorName = (u) => {
  if (!u) return 'Dr. Doctor';
  const raw = u.displayName || (u.email ? u.email.split('@')[0] : 'Doctor');
  const parts = raw.split(/[._\-\s]+/).filter(Boolean);
  if (!parts.length) return 'Dr. Doctor';

  if (parts[0].toLowerCase() === 'dr') {
    const rest = parts
      .slice(1)
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
      .join(' ');
    return rest ? `Dr. ${rest}` : 'Dr. Doctor';
  }
  const full = parts
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
    .join(' ');
  return `Dr. ${full}`;
};

function DashboardPage() {
  const { user } = useAuth();
  const doctorTitle = formatDoctorName(user);
  const [queue, setQueue] = useState([]);
  const [stats, setStats] = useState({
    totalPatients: 0,
    pendingConsultations: 0,
    completedToday: 0,
    followUpsDue: 0,
  });

  useEffect(() => {
    // Seed demo data
    localPatients.seed();

    // Load queue
    const queueData = localAppointments.getQueue();
    setQueue(queueData);

    // Calculate visits completed today
    const todayStr = new Date().toISOString().split('T')[0];
    const allVisits = localVisits.getAll() || [];
    const visitsToday = allVisits.filter((v) => {
      if (!v.date) return false;
      return v.date.startsWith(todayStr);
    });

    // Calculate active follow-ups due within 2 days or overdue
    const calculateDaysDiff = (dateStr) => {
      if (!dateStr) return null;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const target = new Date(dateStr.includes('T') ? dateStr : `${dateStr}T00:00:00`);
      target.setHours(0, 0, 0, 0);
      if (isNaN(target.getTime())) return null;
      const diffMs = target.getTime() - today.getTime();
      return Math.round(diffMs / (1000 * 60 * 60 * 24));
    };

    const allPatients = localPatients.getAll() || [];
    const upcomingVisits = localVisits.getUpcomingFollowUps(2) || [];
    const followUpKeys = new Set();

    allPatients.forEach((p) => {
      if (p.nextFollowUp) {
        const diff = calculateDaysDiff(p.nextFollowUp);
        if (diff !== null && diff <= 2) {
          followUpKeys.add(`${p.id}-${p.nextFollowUp}`);
        }
      }
    });

    upcomingVisits.forEach((v) => {
      const fDate = v.followUpDate || v.nextFollowUp;
      if (fDate) {
        const diff = calculateDaysDiff(fDate);
        if (diff !== null && diff <= 2) {
          followUpKeys.add(`${v.patientId || v.id}-${fDate}`);
        }
      }
    });

    setStats({
      totalPatients: allPatients.length,
      pendingConsultations: queueData.length,
      completedToday: visitsToday.length,
      followUpsDue: followUpKeys.size,
    });
  }, []);

  // Nivara 3-Stage Outpatient Lifecycle + System Status
  const statCards = [
    {
      label: 'Entry / Waiting Queue',
      value: String(stats.pendingConsultations),
      icon: Clock3,
      tone: 'warning',
      trend: { label: 'Patients Checked-in', positive: true },
    },
    {
      label: "Consultation / Today's Visits",
      value: String(stats.completedToday),
      icon: Activity,
      tone: 'success',
      trend: { label: 'Consultations Completed', positive: true },
    },
    {
      label: 'Closure / Follow-ups Due',
      value: String(stats.followUpsDue),
      icon: CalendarClock,
      tone: 'info',
      trend: { label: '1-2 Days Ahead & Overdue', positive: true },
    },
    {
      label: 'Offline Mode',
      value: 'Active',
      icon: DollarSign,
      tone: 'secondary',
      trend: { label: 'No backend required', positive: true },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header & Prominent Patient Search */}
      <section className="relative overflow-hidden rounded-2xl border border-[#D9E6E2] bg-white p-6 shadow-nivara-xs">
        {/* Subtle decorative background glow / flow curve */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-gradient-to-br from-teal-50/80 to-[#287C75]/5 blur-2xl" />
        <svg
          className="pointer-events-none absolute right-0 top-0 h-full w-1/3 opacity-[0.03] text-[#123A3A]"
          viewBox="0 0 400 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0 100 C 150 20, 250 180, 400 100"
            stroke="currentColor"
            strokeWidth="3"
            strokeDasharray="6 6"
          />
        </svg>

        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#287C75]">
              Doctor Dashboard
            </p>
            <h1 className="mt-1 font-heading text-2xl font-bold text-[#10201F] tracking-tight sm:text-3xl">
              Welcome back, {doctorTitle}
            </h1>
            <p className="mt-1 text-sm text-[#4E6460]">
              Offline mode active - All clinical data stored locally in browser.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-[#2E7D5B] shrink-0 self-start md:self-auto">
            <span className="h-2 w-2 rounded-full bg-[#2E7D5B] animate-pulse" />
            <span>Local Clinical Engine Online</span>
          </div>
        </div>

        {/* Prominent Quick Search Spotlight */}
        <div className="relative mt-6 pt-5 border-t border-[#D9E6E2]/70">
          <QuickPatientSearch />
        </div>
      </section>

      {/* Nivara 3-Stage Outpatient Lifecycle Metrics */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((stat) => (
          <StatCard
            key={stat.label}
            icon={stat.icon}
            label={stat.label}
            value={stat.value}
            tone={stat.tone}
            trend={stat.trend}
          />
        ))}
      </section>

      {/* Main Operations: Follow-up Reminders & Waiting Queue */}
      <section className="grid gap-6 xl:grid-cols-2 items-start">
        {/* Follow-Up Reminders (1-2 Days Ahead & Overdue) */}
        <FollowUpRemindersWidget />

        {/* Patient Waiting Queue */}
        <article className="app-card p-6 border border-[#D9E6E2] bg-white rounded-2xl shadow-nivara-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-heading font-bold text-[#10201F]">Patient Waiting Queue</h2>
                <p className="text-xs text-[#4E6460]">Patients checked-in for consultation</p>
              </div>
              <StatusBadge label={`${queue.length} Patients`} variant="info" />
            </div>

            {queue.length === 0 ? (
              <div className="mt-5 rounded-2xl border border-dashed border-[#D9E6E2] bg-[#F7FAF8] p-8 text-center">
                <p className="text-sm font-semibold text-[#10201F]">No patients in queue</p>
                <p className="mt-1 text-sm text-[#4E6460]">
                  Add patients from the Patients page to start consultations.
                </p>
                <Link to="/patients" className="btn-primary mt-4 inline-flex">
                  Go to Patients
                </Link>
              </div>
            ) : (
              <ul className="mt-4 space-y-3">
                {queue.map((patient) => (
                  <li
                    key={patient.id}
                    className="rounded-2xl border border-[#D9E6E2] bg-[#F7FAF8]/70 p-4 transition hover:-translate-y-0.5 hover:bg-white hover:border-[#287C75]/40 hover:shadow-nivara-xs"
                  >
                    <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-heading font-bold text-[#10201F]">{patient.patientName}</p>
                          <StatusBadge label={patient.status} variant={statusToVariant[patient.status] || 'warning'} />
                        </div>
                        <p className="mt-1 text-sm text-[#4E6460]">{patient.reason}</p>
                        <div className="mt-2 flex flex-wrap gap-4 text-xs font-semibold uppercase tracking-[0.08em] text-[#7D908C]">
                          <span>Time {patient.startTime}</span>
                        </div>
                      </div>

                      <Link to="/doctor/consultation" className="btn-primary">
                        Start Consultation
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </article>
      </section>

      {/* Quick Actions Footer Strip */}
      <section className="app-card p-6 border border-[#D9E6E2] bg-white rounded-2xl shadow-nivara-xs">
        <div>
          <h2 className="text-lg font-heading font-bold text-[#10201F]">Quick Clinical Shortcuts</h2>
          <p className="mt-1 text-sm text-[#4E6460]">Direct navigation to key clinic workflows</p>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Link
            to="/patients?action=new"
            className="group block rounded-2xl border border-[#D9E6E2] bg-[#F7FAF8] p-4 transition duration-200 hover:-translate-y-0.5 hover:bg-white hover:border-[#287C75]/40 hover:shadow-nivara-xs"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-heading font-bold text-[#10201F] group-hover:text-[#287C75] transition">
                + Add New Patient
              </p>
              <span className="text-[#287C75] opacity-0 group-hover:opacity-100 transition">→</span>
            </div>
            <p className="mt-1 text-xs text-[#4E6460]">Register demographic info & allergies</p>
          </Link>

          <Link
            to="/prescription/new"
            className="group block rounded-2xl border border-[#D9E6E2] bg-[#F7FAF8] p-4 transition duration-200 hover:-translate-y-0.5 hover:bg-white hover:border-[#287C75]/40 hover:shadow-nivara-xs"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-heading font-bold text-[#10201F] group-hover:text-[#287C75] transition">
                Write Prescription
              </p>
              <span className="text-[#287C75] opacity-0 group-hover:opacity-100 transition">→</span>
            </div>
            <p className="mt-1 text-xs text-[#4E6460]">Fast medicine autocomplete & Rx print</p>
          </Link>

          <Link
            to="/medicines"
            className="group block rounded-2xl border border-[#D9E6E2] bg-[#F7FAF8] p-4 transition duration-200 hover:-translate-y-0.5 hover:bg-white hover:border-[#287C75]/40 hover:shadow-nivara-xs"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-heading font-bold text-[#10201F] group-hover:text-[#287C75] transition">
                Medicine Master Catalog
              </p>
              <span className="text-[#287C75] opacity-0 group-hover:opacity-100 transition">→</span>
            </div>
            <p className="mt-1 text-xs text-[#4E6460]">Manage standard dosages & formulations</p>
          </Link>
        </div>
      </section>
    </div>
  );
}

export default DashboardPage;
