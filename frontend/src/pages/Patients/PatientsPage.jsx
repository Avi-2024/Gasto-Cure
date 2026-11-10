import React, { useEffect, useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Plus,
  Search,
  Users,
  UserCheck,
  CalendarClock,
  MessageCircle,
  X,
  CheckCircle2,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import StatCard from '../../components/ui/StatCard';
import StatusBadge from '../../components/ui/StatusBadge';
import usePagination from '../../hooks/usePagination';
import { localAppointments, localPatients } from '../../services/localStore';
import { cleanPhoneNumber } from '../../utils/whatsappHelper';
import EditPatientModal from './components/EditPatientModal';
import PatientProfileDrawer from './components/PatientProfileDrawer';

const statusVariantMap = {
  Active: 'success',
  'Follow-up': 'warning',
  Stable: 'info',
  Critical: 'danger',
};

const emptyForm = { name: '', age: '', gender: 'Male', contact: '', address: '' };

const formatDisplayDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr.includes('T') ? dateStr : `${dateStr}T00:00:00`);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

const getInitials = (name) => {
  if (!name) return 'PT';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

function PatientsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [ageFilter, setAgeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [patients, setPatients] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [queueMsg, setQueueMsg] = useState('');

  // Selected patient states for Profile Drawer & Edit Modal
  const [profilePatient, setProfilePatient] = useState(null);
  const [editingPatient, setEditingPatient] = useState(null);

  // Initialize and handle query parameters
  useEffect(() => {
    localPatients.seed();
    const all = localPatients.getAll();
    setPatients(all);

    const action = searchParams.get('action');
    const patientId = searchParams.get('patientId');

    if (action === 'new') {
      setShowModal(true);
    }

    if (patientId) {
      const found = all.find((p) => p.id === patientId);
      if (found) {
        setProfilePatient(found);
      }
    }
  }, [searchParams]);

  // Handle ESC key for Add Patient modal
  useEffect(() => {
    if (!showModal) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowModal(false);
        setFormError('');
        setForm(emptyForm);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showModal]);

  // Quick Stats
  const stats = useMemo(() => {
    const total = patients.length;
    const active = patients.filter((p) => p.status === 'Active').length;
    const scheduledFollowUps = patients.filter(
      (p) => Boolean(p.nextFollowUp) || p.status === 'Follow-up'
    ).length;
    return { total, active, scheduledFollowUps };
  }, [patients]);

  const filteredPatients = useMemo(
    () =>
      patients.filter((patient) => {
        const matchesSearch =
          String(patient.name || '').toLowerCase().includes(search.toLowerCase()) ||
          String(patient.id || '').toLowerCase().includes(search.toLowerCase()) ||
          String(patient.contact || patient.mobile || '').toLowerCase().includes(search.toLowerCase());

        const age = Number(patient.age);
        const matchesAge =
          ageFilter === 'all' ||
          (ageFilter === 'child' && age < 18) ||
          (ageFilter === 'adult' && age >= 18 && age < 60) ||
          (ageFilter === 'senior' && age >= 60);

        const matchesStatus = statusFilter === 'all' || patient.status === statusFilter;

        return matchesSearch && matchesAge && matchesStatus;
      }),
    [patients, search, ageFilter, statusFilter]
  );

  const { page, totalPages, paginated, prevPage, nextPage, goToPage } = usePagination(filteredPatients, 8);

  useEffect(() => {
    goToPage(1);
  }, [search, ageFilter, statusFilter, goToPage]);

  const handleAddPatient = () => {
    if (!form.name.trim() || !form.age || !form.contact.trim()) {
      setFormError('Name, Age, and Contact are required.');
      return;
    }
    const patient = localPatients.add({ ...form, age: Number(form.age) });
    setPatients(localPatients.getAll());
    setShowModal(false);
    setForm(emptyForm);
    setFormError('');
    // Automatically add to waiting queue
    localAppointments.addToQueue(patient.id, patient.name, patient.age, 'New patient visit');
    setQueueMsg(`${patient.name} added to waiting queue successfully.`);
    setTimeout(() => setQueueMsg(''), 4000);
  };

  const handlePatientSaved = (updated) => {
    const all = localPatients.getAll();
    setPatients(all);
    if (profilePatient && profilePatient.id === updated.id) {
      setProfilePatient(updated);
    }
  };

  const handleOpenWhatsApp = (patient) => {
    const clean = cleanPhoneNumber(patient.contact || patient.mobile);
    if (!clean) return;
    const waUrl = `https://wa.me/91${clean}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-6">
      {/* Quick Stats Strip */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={Users}
          label="Total Patients"
          value={stats.total}
          tone="primary"
          trend={{ label: 'Registered', positive: true }}
        />
        <StatCard
          icon={UserCheck}
          label="Active"
          value={stats.active}
          tone="success"
          trend={{
            label: `${Math.round((stats.active / (stats.total || 1)) * 100)}% of cohort`,
            positive: true,
          }}
        />
        <StatCard
          icon={CalendarClock}
          label="Scheduled Follow-ups"
          value={stats.scheduledFollowUps}
          tone="warning"
          trend={{ label: 'Upcoming', positive: true }}
        />
      </section>

      {/* Header and Filters Section */}
      <section className="app-card p-6 border border-[#D9E6E2]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="page-title">Patients</h1>
            <p className="page-subtitle">Search records, filter cohorts, and review patient status at a glance.</p>
          </div>
          <button type="button" className="btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} />
            Add Patient
          </button>
        </div>

        {queueMsg ? (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-[#2E7D5B] flex items-center gap-2 shadow-xs">
            <CheckCircle2 size={16} className="shrink-0 text-[#2E7D5B]" />
            <span>{queueMsg}</span>
          </div>
        ) : null}

        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_220px_220px]">
          <label htmlFor="patient-search" className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7D908C]" size={16} />
            <input
              id="patient-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, ID, or contact"
              className="pl-10"
            />
          </label>

          <select
            value={ageFilter}
            onChange={(event) => setAgeFilter(event.target.value)}
            aria-label="Filter patients by age group"
          >
            <option value="all">All age groups</option>
            <option value="child">Children (&lt;18)</option>
            <option value="adult">Adults (18-59)</option>
            <option value="senior">Seniors (60+)</option>
          </select>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Filter patients by status"
          >
            <option value="all">All statuses</option>
            <option value="Active">Active</option>
            <option value="Follow-up">Follow-up</option>
            <option value="Stable">Stable</option>
            <option value="Critical">Critical</option>
          </select>
        </div>
      </section>

      {/* Patients Table */}
      <section className="app-card overflow-hidden border border-[#D9E6E2]">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead className="sticky top-0 z-10 bg-[#F7FAF8] border-b border-[#D9E6E2]">
              <tr>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.08em] text-[#4E6460]">
                  Patient Details
                </th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.08em] text-[#4E6460]">
                  Contact
                </th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.08em] text-[#4E6460]">
                  Blood Group
                </th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.08em] text-[#4E6460]">
                  Last Visit
                </th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.08em] text-[#4E6460]">
                  Next Follow-Up
                </th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.08em] text-[#4E6460]">
                  Status
                </th>
                <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-[0.08em] text-[#4E6460]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D9E6E2]/70">
              {paginated.map((patient) => {
                const cleanPhone = cleanPhoneNumber(patient.contact || patient.mobile);
                return (
                  <tr
                    key={patient.id}
                    className="bg-white hover:bg-[#F7FAF8]/80 transition duration-150"
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-[#287C75] font-heading font-semibold text-xs border border-teal-100 shadow-nivara-xs">
                          {getInitials(patient.name)}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-heading font-bold text-sm text-[#10201F]">{patient.name}</p>
                            <span className="font-mono text-xs text-[#287C75] bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100">
                              {patient.id}
                            </span>
                          </div>
                          <p className="text-xs text-[#4E6460] mt-0.5">
                            {patient.age} Yrs • {patient.gender}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4 text-sm text-[#10201F] tabular-nums">
                      <div>
                        <span>{patient.contact || patient.mobile || '-'}</span>
                        {patient.address && (
                          <p className="text-xs text-[#7D908C] truncate max-w-[160px]">{patient.address}</p>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-4 text-sm">
                      {patient.bloodGroup ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold text-[#B94A48] bg-rose-50 border border-rose-100">
                          {patient.bloodGroup}
                        </span>
                      ) : (
                        <span className="text-[#7D908C] text-xs">-</span>
                      )}
                    </td>

                    <td className="px-4 py-4 text-sm text-[#4E6460]">
                      {formatDisplayDate(patient.lastVisit) || '-'}
                    </td>

                    <td className="px-4 py-4 text-sm">
                      {patient.nextFollowUp ? (
                        <span className="font-semibold text-[#2E7D5B] tabular-nums">
                          {formatDisplayDate(patient.nextFollowUp)}
                        </span>
                      ) : (
                        <span className="text-[#7D908C]">None</span>
                      )}
                    </td>

                    <td className="px-4 py-4">
                      <StatusBadge label={patient.status} variant={statusVariantMap[patient.status] || 'info'} />
                    </td>

                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        {cleanPhone ? (
                          <button
                            type="button"
                            onClick={() => handleOpenWhatsApp(patient)}
                            className="p-1.5 rounded-xl border border-emerald-200 bg-emerald-50 text-[#2E7D5B] hover:bg-emerald-100 transition shadow-xs"
                            title="Chat on WhatsApp"
                          >
                            <MessageCircle size={15} />
                          </button>
                        ) : null}

                        <button
                          type="button"
                          className="btn-secondary text-xs py-1.5 px-3"
                          onClick={() => setProfilePatient(patient)}
                        >
                          Profile
                        </button>

                        <button
                          type="button"
                          className="btn-secondary text-xs py-1.5 px-3"
                          onClick={() => setEditingPatient(patient)}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="btn-primary text-xs py-1.5 px-3"
                          onClick={() => navigate(`/prescription/new?patientId=${patient.id}`)}
                          title="Start Prescription"
                        >
                          <FileText size={14} />
                          Prescription
                        </button>

                        <button
                          type="button"
                          className="btn-secondary text-xs py-1.5 px-2.5"
                          onClick={() => {
                            localAppointments.addToQueue(patient.id, patient.name, patient.age, 'Follow-up visit');
                            setQueueMsg(`${patient.name} added to waiting queue.`);
                            setTimeout(() => setQueueMsg(''), 4000);
                          }}
                          title="Add to Reception Queue"
                        >
                          Queue
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-[#7D908C]">
                    No patients found for the selected filters.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        {/* Table Pagination */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#D9E6E2] bg-[#F7FAF8] px-4 py-3">
          <p className="text-sm text-[#4E6460]">
            Showing <span className="font-semibold text-[#10201F] tabular-nums">{paginated.length}</span> of{' '}
            <span className="font-semibold text-[#10201F] tabular-nums">{filteredPatients.length}</span> patients
          </p>

          <div className="flex items-center gap-2">
            <button type="button" className="btn-secondary text-xs py-1.5 px-3" onClick={prevPage} disabled={page === 1}>
              <ChevronLeft size={15} />
              Prev
            </button>
            <span className="rounded-xl border border-[#D9E6E2] bg-white px-3 py-1.5 text-xs font-semibold text-[#10201F] tabular-nums shadow-nivara-xs">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              className="btn-secondary text-xs py-1.5 px-3"
              onClick={nextPage}
              disabled={page === totalPages || totalPages === 0}
            >
              Next
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </section>

      {/* Add Patient Modal */}
      {showModal ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 transition-opacity"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowModal(false);
              setFormError('');
              setForm(emptyForm);
            }
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-patient-title"
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white border border-[#D9E6E2] shadow-nivara-lg p-6 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#D9E6E2] pb-3.5">
              <h2 id="add-patient-title" className="font-heading text-lg font-bold text-[#10201F]">
                Add New Patient
              </h2>
              <button
                type="button"
                className="rounded-xl p-1.5 text-[#7D908C] hover:bg-slate-100 hover:text-[#10201F] transition"
                onClick={() => {
                  setShowModal(false);
                  setFormError('');
                  setForm(emptyForm);
                }}
                aria-label="Close add patient modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-3.5">
              <div>
                <label className="field-label" htmlFor="pt-name">
                  Patient Name *
                </label>
                <input
                  id="pt-name"
                  placeholder="Full name"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="field-label" htmlFor="pt-age">
                    Age *
                  </label>
                  <input
                    id="pt-age"
                    type="number"
                    min="0"
                    max="130"
                    placeholder="Age in years"
                    value={form.age}
                    onChange={(e) => setForm((p) => ({ ...p, age: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor="pt-gender">
                    Gender *
                  </label>
                  <select
                    id="pt-gender"
                    value={form.gender}
                    onChange={(e) => setForm((p) => ({ ...p, gender: e.target.value }))}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="field-label" htmlFor="pt-contact">
                  Mobile Number *
                </label>
                <input
                  id="pt-contact"
                  type="tel"
                  placeholder="10 digit number"
                  value={form.contact}
                  onChange={(e) => setForm((p) => ({ ...p, contact: e.target.value }))}
                />
              </div>

              <div>
                <label className="field-label" htmlFor="pt-address">
                  Address
                </label>
                <input
                  id="pt-address"
                  placeholder="Home address (optional)"
                  value={form.address}
                  onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                />
              </div>

              {formError ? (
                <p className="text-xs font-semibold text-[#B94A48] bg-rose-50 border border-rose-200 px-3 py-2 rounded-xl">
                  {formError}
                </p>
              ) : null}
            </div>

            <div className="mt-6 flex gap-3 pt-3 border-t border-[#D9E6E2]">
              <button type="button" className="btn-primary flex-1" onClick={handleAddPatient}>
                Save & Add to Queue
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setShowModal(false);
                  setFormError('');
                  setForm(emptyForm);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Patient Profile Drawer */}
      <PatientProfileDrawer
        isOpen={Boolean(profilePatient)}
        patient={profilePatient}
        onClose={() => setProfilePatient(null)}
        onEdit={(pt) => {
          setEditingPatient(pt);
        }}
      />

      {/* Edit Patient Modal */}
      <EditPatientModal
        isOpen={Boolean(editingPatient)}
        patient={editingPatient}
        onClose={() => setEditingPatient(null)}
        onSave={handlePatientSaved}
      />
    </div>
  );
}

export default PatientsPage;