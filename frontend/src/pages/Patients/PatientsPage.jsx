import React, { useEffect, useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Plus,
  Search,
  UserRound,
  Users,
  UserCheck,
  CalendarClock,
  MessageCircle,
  Edit,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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

function PatientsPage() {
  const navigate = useNavigate();
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

  useEffect(() => {
    localPatients.seed();
    setPatients(localPatients.getAll());
  }, []);

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
          (patient.name || '').toLowerCase().includes(search.toLowerCase()) ||
          (patient.id || '').toLowerCase().includes(search.toLowerCase()) ||
          (patient.contact || patient.mobile || '').toLowerCase().includes(search.toLowerCase());

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

  const { page, totalPages, paginated, prevPage, nextPage, goToPage } = usePagination(filteredPatients, 6);

  useEffect(() => {
    goToPage(1);
  }, [search, ageFilter, statusFilter, goToPage]);

  const handleAddPatient = () => {
    if (!form.name.trim() || !form.age || !form.contact.trim()) {
      setFormError('Name, Age and Contact are required.');
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
        <div className="app-card p-5 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
            <Users size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Patients</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">{stats.total}</p>
          </div>
        </div>

        <div className="app-card p-5 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
            <UserCheck size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Active</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">{stats.active}</p>
          </div>
        </div>

        <div className="app-card p-5 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
            <CalendarClock size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Scheduled Follow-ups</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">{stats.scheduledFollowUps}</p>
          </div>
        </div>
      </section>

      {/* Header and Filters Section */}
      <section className="app-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="page-title">Patients</h1>
            <p className="page-subtitle">Search records, filter cohorts, and review patient status at a glance.</p>
          </div>
          <button type="button" className="btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={15} />
            Add Patient
          </button>
        </div>

        {queueMsg ? (
          <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
            {queueMsg}
          </div>
        ) : null}

        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_220px_220px]">
          <label htmlFor="patient-search" className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              id="patient-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, ID, or contact"
              className="pl-10"
            />
          </label>

          <select value={ageFilter} onChange={(event) => setAgeFilter(event.target.value)} aria-label="Filter patients by age group">
            <option value="all">All age groups</option>
            <option value="child">Children (&lt;18)</option>
            <option value="adult">Adults (18-59)</option>
            <option value="senior">Seniors (60+)</option>
          </select>

          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter patients by status">
            <option value="all">All statuses</option>
            <option value="Active">Active</option>
            <option value="Follow-up">Follow-up</option>
            <option value="Stable">Stable</option>
            <option value="Critical">Critical</option>
          </select>
        </div>
      </section>

      {/* Patients Table */}
      <section className="app-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Age</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Contact</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Last Visit</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Next Follow-Up</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((patient) => {
                const cleanPhone = cleanPhoneNumber(patient.contact || patient.mobile);
                return (
                  <tr key={patient.id} className="border-t border-medical-border bg-white hover:bg-slate-50/60 transition">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                          <UserRound size={16} />
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{patient.name}</p>
                          <p className="text-xs uppercase tracking-[0.08em] text-slate-400">{patient.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-700">{patient.age}</td>
                    <td className="px-4 py-4 text-sm text-slate-700">{patient.contact || patient.mobile || '-'}</td>
                    <td className="px-4 py-4 text-sm text-slate-700">
                      {formatDisplayDate(patient.lastVisit) || '-'}
                    </td>
                    <td className="px-4 py-4 text-sm">
                      {patient.nextFollowUp ? (
                        <span className="font-semibold text-emerald-700">
                          {formatDisplayDate(patient.nextFollowUp)}
                        </span>
                      ) : (
                        <span className="text-slate-400">None</span>
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
                            className="p-1.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition"
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
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-500">
                    No patients found for the selected filters.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-medical-border bg-slate-50 px-4 py-3">
          <p className="text-sm text-slate-500">
            Showing <span className="font-semibold text-slate-700">{paginated.length}</span> of{' '}
            <span className="font-semibold text-slate-700">{filteredPatients.length}</span> patients
          </p>

          <div className="flex items-center gap-2">
            <button type="button" className="btn-secondary" onClick={prevPage} disabled={page === 1}>
              <ChevronLeft size={16} />
              Prev
            </button>
            <span className="rounded-xl border border-medical-border bg-white px-3 py-2 text-sm font-semibold text-slate-700">
              Page {page} of {totalPages}
            </span>
            <button type="button" className="btn-secondary" onClick={nextPage} disabled={page === totalPages}>
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* Add Patient Modal */}
      {showModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Add New Patient</h2>
              <button type="button" onClick={() => { setShowModal(false); setFormError(''); setForm(emptyForm); }}>
                <X size={18} className="text-slate-500" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="field-label" htmlFor="pt-name">Patient Name *</label>
                <input id="pt-name" placeholder="Full name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="field-label" htmlFor="pt-age">Age *</label>
                  <input id="pt-age" type="number" placeholder="Age in years" value={form.age} onChange={(e) => setForm((p) => ({ ...p, age: e.target.value }))} />
                </div>
                <div>
                  <label className="field-label" htmlFor="pt-gender">Gender *</label>
                  <select id="pt-gender" value={form.gender} onChange={(e) => setForm((p) => ({ ...p, gender: e.target.value }))}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="field-label" htmlFor="pt-contact">Mobile Number *</label>
                <input id="pt-contact" placeholder="10 digit number" value={form.contact} onChange={(e) => setForm((p) => ({ ...p, contact: e.target.value }))} />
              </div>
              <div>
                <label className="field-label" htmlFor="pt-address">Address</label>
                <input id="pt-address" placeholder="Home address (optional)" value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} />
              </div>

              {formError ? (
                <p className="text-sm text-rose-600">{formError}</p>
              ) : null}
            </div>

            <div className="mt-5 flex gap-3">
              <button type="button" className="btn-primary flex-1" onClick={handleAddPatient}>
                Save & Add to Queue
              </button>
              <button type="button" className="btn-secondary" onClick={() => { setShowModal(false); setFormError(''); setForm(emptyForm); }}>
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
