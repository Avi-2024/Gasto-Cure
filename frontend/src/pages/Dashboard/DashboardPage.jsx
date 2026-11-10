import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Clock3, DollarSign, Users } from 'lucide-react';
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

function DashboardPage() {
  const { user } = useAuth();
  const doctorName = user?.email ? user.email.split('@')[0].replace('.', ' ') : 'Doctor';
  const [queue, setQueue] = useState([]);
  const [stats, setStats] = useState({
    totalPatients: 0,
    pendingConsultations: 0,
    completedToday: 0,
  });

  useEffect(() => {
    // Seed demo data
    localPatients.seed();
    
    // Load queue
    const queueData = localAppointments.getQueue();
    setQueue(queueData);

    // Calculate stats
    const allPatients = localPatients.getAll();

    setStats({
      totalPatients: allPatients.length,
      pendingConsultations: queueData.length,
      completedToday: 0,
    });
  }, []);

  const statCards = [
    { label: 'Total Patients', value: String(stats.totalPatients), icon: Users, tone: 'primary', trend: { label: 'Registered', positive: true } },
    { label: 'Waiting Queue', value: String(stats.pendingConsultations), icon: Clock3, tone: 'warning', trend: { label: 'Pending', positive: false } },
    { label: 'Completed Today', value: String(stats.completedToday), icon: Activity, tone: 'success', trend: { label: 'Consultations', positive: true } },
    { label: 'Offline Mode', value: 'Active', icon: DollarSign, tone: 'secondary', trend: { label: 'No backend', positive: true } },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header & Prominent Patient Search */}
      <section className="app-card p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-medical-primary">Doctor Dashboard</p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-900">Welcome back, Dr. {doctorName}</h1>
            <p className="mt-1 text-sm text-slate-500">Offline mode active - All clinical data stored locally in browser.</p>
          </div>
        </div>

        {/* Prominent Quick Search Input Bar */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <QuickPatientSearch />
        </div>
      </section>

      {/* Quick Metrics */}
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
        <article className="app-card p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Patient Waiting Queue</h2>
              <p className="text-xs text-slate-500">Patients checked-in for consultation</p>
            </div>
            <StatusBadge label={`${queue.length} Patients`} variant="info" />
          </div>

          {queue.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-medical-border bg-slate-50 p-8 text-center">
              <p className="text-sm font-semibold text-slate-700">No patients in queue</p>
              <p className="mt-1 text-sm text-slate-500">Add patients from the Patients page to start consultations.</p>
              <Link to="/patients" className="btn-primary mt-4 inline-flex">
                Go to Patients
              </Link>
            </div>
          ) : (
            <ul className="mt-4 space-y-3">
              {queue.map((patient) => (
                <li key={patient.id} className="rounded-2xl border border-medical-border bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:bg-white">
                  <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-slate-900">{patient.patientName}</p>
                        <StatusBadge label={patient.status} variant={statusToVariant[patient.status] || 'warning'} />
                      </div>
                      <p className="mt-1 text-sm text-slate-500">{patient.reason}</p>
                      <div className="mt-2 flex flex-wrap gap-4 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
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
        </article>
      </section>

      {/* Quick Actions Footer Strip */}
      <section className="app-card p-6">
        <h2 className="text-lg font-semibold text-slate-900">Quick Clinical Shortcuts</h2>
        <p className="mt-1 text-sm text-slate-500">Direct navigation to key clinic workflows</p>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Link to="/patients?action=new" className="block rounded-2xl border border-medical-border bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:bg-white hover:border-slate-300">
            <p className="text-sm font-semibold text-slate-900">+ Add New Patient</p>
            <p className="mt-1 text-xs text-slate-500">Register demographic info & allergies</p>
          </Link>

          <Link to="/prescription/new" className="block rounded-2xl border border-medical-border bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:bg-white hover:border-slate-300">
            <p className="text-sm font-semibold text-slate-900">Write Prescription</p>
            <p className="mt-1 text-xs text-slate-500">Fast medicine autocomplete & Rx print</p>
          </Link>

          <Link to="/medicines" className="block rounded-2xl border border-medical-border bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:bg-white hover:border-slate-300">
            <p className="text-sm font-semibold text-slate-900">Medicine Master Catalog</p>
            <p className="mt-1 text-xs text-slate-500">Manage standard dosages & formulations</p>
          </Link>
        </div>
      </section>
    </div>
  );
}

export default DashboardPage;
