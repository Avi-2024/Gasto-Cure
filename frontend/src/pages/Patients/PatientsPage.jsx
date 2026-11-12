import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
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
  Clock3,
  RotateCcw,
  MoreVertical,
  User,
  Edit3,
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
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(() => searchParams.get('search') || '');
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
  const [openActionMenuId, setOpenActionMenuId] = useState(null);
  const [lockedActionMenuId, setLockedActionMenuId] = useState(null);
  const [menuCoords, setMenuCoords] = useState({ top: 0, left: 0, openUpward: false });
  const activeTriggerRef = useRef(null);
  const closeTimerRef = useRef(null);

  const activePatient = useMemo(() => {
    if (!openActionMenuId) return null;
    return patients.find((p) => p.id === openActionMenuId) || null;
  }, [openActionMenuId, patients]);

  const updateMenuPosition = useCallback((buttonEl) => {
    if (!buttonEl) return;
    const rect = buttonEl.getBoundingClientRect();
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const MENU_WIDTH = 224; // w-56
    const MENU_HEIGHT = 240; // approx height of menu

    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;

    // Flip upwards if not enough room below and more room above
    const openUpward = spaceBelow < MENU_HEIGHT + 16 && spaceAbove > spaceBelow;

    const top = openUpward
      ? Math.max(10, rect.top - MENU_HEIGHT - 4)
      : Math.min(viewportHeight - MENU_HEIGHT - 10, rect.bottom + 4);

    // Align right edge of menu with right edge of button
    const left = Math.max(10, Math.min(rect.right - MENU_WIDTH, viewportWidth - MENU_WIDTH - 12));

    setMenuCoords({ top, left, openUpward });
  }, []);

  const handleMenuMouseEnter = (e, patientId) => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    activeTriggerRef.current = e.currentTarget;
    updateMenuPosition(e.currentTarget);
    setOpenActionMenuId(patientId);
  };

  const handleMenuMouseLeave = (patientId) => {
    // If the menu was locked open by clicking the 3-dots button, do not close on mouse leave
    if (lockedActionMenuId === patientId) return;

    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
    }
    closeTimerRef.current = setTimeout(() => {
      setOpenActionMenuId((prev) => (prev === patientId ? null : prev));
    }, 200);
  };

  const handlePortalMouseEnter = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const handlePortalMouseLeave = () => {
    if (lockedActionMenuId) return;

    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
    }
    closeTimerRef.current = setTimeout(() => {
      setOpenActionMenuId(null);
    }, 200);
  };

  const handleMenuTriggerClick = (e, patientId) => {
    e.stopPropagation();
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }

    if (openActionMenuId === patientId && lockedActionMenuId === patientId) {
      // Toggle closed if already locked open
      setOpenActionMenuId(null);
      setLockedActionMenuId(null);
      activeTriggerRef.current = null;
    } else {
      // Open and lock firmly open
      activeTriggerRef.current = e.currentTarget;
      updateMenuPosition(e.currentTarget);
      setOpenActionMenuId(patientId);
      setLockedActionMenuId(patientId);
    }
  };

  const handleMenuActionClick = (callback) => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setOpenActionMenuId(null);
    setLockedActionMenuId(null);
    activeTriggerRef.current = null;
    if (typeof callback === 'function') {
      callback();
    }
  };

  // Keep menu position synced on window resize or scroll
  useEffect(() => {
    if (!openActionMenuId || !activeTriggerRef.current) return;

    const handleScrollOrResize = () => {
      if (activeTriggerRef.current) {
        updateMenuPosition(activeTriggerRef.current);
      }
    };

    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);
    return () => {
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
    };
  }, [openActionMenuId, updateMenuPosition]);

  // Close action menus when clicking outside
  useEffect(() => {
    const handleDocumentClick = (e) => {
      if (
        !e.target.closest?.('.action-menu-container') &&
        !e.target.closest?.('.action-menu-portal')
      ) {
        setOpenActionMenuId(null);
        setLockedActionMenuId(null);
        activeTriggerRef.current = null;
      }
    };
    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, []);

  const closeModal = () => {
    setShowModal(false);
    setFormError('');
    setForm(emptyForm);
    if (searchParams.get('action') || searchParams.get('name')) {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete('action');
        next.delete('name');
        return next;
      }, { replace: true });
    }
  };

  // Initialize and handle query parameters
  useEffect(() => {
    localPatients.seed();
    const all = localPatients.getAll();
    setPatients(all);

    const searchQuery = searchParams.get('search');
    if (searchQuery !== null) {
      setSearch(searchQuery);
    }

    const action = searchParams.get('action');
    const patientId = searchParams.get('patientId');
    const initialName = searchParams.get('name');

    if (action === 'new') {
      setShowModal(true);
      if (initialName) {
        setForm((prev) => ({ ...prev, name: initialName }));
      }
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
        closeModal();
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
    closeModal();
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

  const queueLength = localAppointments.getQueue()?.length || 0;

  return (
    <div className="space-y-4">
      {/* Toast Notification (Floating, zero layout shift) */}
      {queueMsg ? (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2.5 bg-white border border-[#D9E6E2] border-l-4 border-l-[#2E7D5B] rounded-xl px-4 py-3 shadow-nivara-lg animate-in slide-in-from-top-2 duration-200">
          <CheckCircle2 size={16} className="text-[#2E7D5B] shrink-0" />
          <span className="text-xs font-semibold text-[#10201F]">{queueMsg}</span>
          <button
            type="button"
            onClick={() => setQueueMsg('')}
            className="text-[#7D908C] hover:text-[#10201F] p-0.5 ml-2 cursor-pointer"
            aria-label="Dismiss notification"
          >
            <X size={14} />
          </button>
        </div>
      ) : null}

      {/* Quick Stats Strip (Compact 4-column layout) */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
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
        <div className="app-card rounded-2xl p-5 border border-[#D9E6E2] bg-white shadow-nivara-xs hover:shadow-nivara-sm transition duration-200 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-[#4E6460]">Waiting in Queue</p>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-[#B7791F] border border-amber-100">
              <Clock3 size={18} />
            </span>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <p className="font-heading font-bold text-3xl text-[#10201F] tracking-tight tabular-nums">
              {queueLength}
            </p>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2E7D5B]">
              <span className="w-2 h-2 rounded-full bg-[#2E7D5B] animate-pulse"></span>
              Live Queue
            </span>
          </div>
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-[#D9E6E2] bg-[#F7FAF8] px-2.5 py-1 text-xs font-semibold text-[#4E6460]">
            <span>Checked-in today</span>
          </div>
        </div>
      </section>

      {/* Header and Filters Section */}
      <section className="app-card p-5 border border-[#D9E6E2]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="page-title text-xl font-heading font-bold text-[#10201F]">Patients</h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-[#287C75] border border-teal-200 tabular-nums">
                {filteredPatients.length} {filteredPatients.length === 1 ? 'Patient' : 'Patients'}
              </span>
            </div>
            <p className="page-subtitle text-xs text-[#4E6460] mt-0.5">
              Search records, filter cohorts, and review patient status at a glance.
            </p>
          </div>
          <button type="button" className="btn-primary shrink-0" onClick={() => setShowModal(true)}>
            <Plus size={16} />
            <span>Add Patient</span>
          </button>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_200px_200px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7D908C]" size={16} />
            <input
              id="patient-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, ID, or contact"
              className="pl-10 pr-9 w-full h-10 text-sm rounded-xl border border-[#D9E6E2] bg-white focus:border-[#287C75] focus:outline-none transition"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7D908C] hover:text-[#10201F] p-0.5 cursor-pointer"
                title="Clear search"
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <select
            value={ageFilter}
            onChange={(event) => setAgeFilter(event.target.value)}
            aria-label="Filter patients by age group"
            className="h-10 px-3 text-sm rounded-xl border border-[#D9E6E2] bg-white focus:border-[#287C75] focus:outline-none transition cursor-pointer text-[#10201F]"
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
            className="h-10 px-3 text-sm rounded-xl border border-[#D9E6E2] bg-white focus:border-[#287C75] focus:outline-none transition cursor-pointer text-[#10201F]"
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
      <section className="app-card overflow-hidden border border-[#D9E6E2] shadow-nivara-xs">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead className="sticky top-0 z-10 bg-[#F7FAF8] border-b border-[#D9E6E2]">
              <tr>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.08em] text-[#4E6460] min-w-[240px] whitespace-nowrap">
                  Patient Details
                </th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.08em] text-[#4E6460] min-w-[170px] whitespace-nowrap">
                  Contact
                </th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.08em] text-[#4E6460] min-w-[110px] whitespace-nowrap">
                  Blood Group
                </th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.08em] text-[#4E6460] min-w-[120px] whitespace-nowrap">
                  Last Visit
                </th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.08em] text-[#4E6460] min-w-[150px] whitespace-nowrap">
                  Next Follow-Up
                </th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.08em] text-[#4E6460] min-w-[110px] whitespace-nowrap">
                  Status
                </th>
                <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-[0.08em] text-[#4E6460] min-w-[120px] whitespace-nowrap">
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
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-[#287C75] font-heading font-semibold text-xs border border-teal-100 shadow-nivara-xs">
                          {getInitials(patient.name)}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <p
                              onClick={() => setProfilePatient(patient)}
                              className="font-heading font-bold text-sm text-[#10201F] hover:text-[#287C75] cursor-pointer transition whitespace-nowrap"
                              title="View patient profile"
                            >
                              {patient.name}
                            </p>
                            <span className="font-mono text-xs text-[#287C75] bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100 shrink-0 whitespace-nowrap tabular-nums font-semibold">
                              {patient.id}
                            </span>
                          </div>
                          <p className="text-xs text-[#4E6460] mt-0.5 whitespace-nowrap">
                            {patient.age} Yrs • {patient.gender}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-sm text-[#10201F] tabular-nums whitespace-nowrap">
                      <div>
                        <span className="font-semibold text-xs">{patient.contact || patient.mobile || '-'}</span>
                        {patient.address && (
                          <p className="text-xs text-[#7D908C] truncate max-w-[170px]" title={patient.address}>
                            {patient.address}
                          </p>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-sm whitespace-nowrap">
                      {patient.bloodGroup ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold text-[#B94A48] bg-rose-50 border border-rose-100 tabular-nums">
                          {patient.bloodGroup}
                        </span>
                      ) : (
                        <span className="text-[#7D908C] text-xs font-mono">-</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-sm text-[#4E6460] whitespace-nowrap">
                      {formatDisplayDate(patient.lastVisit) || '-'}
                    </td>

                    <td className="px-4 py-3.5 text-sm whitespace-nowrap">
                      {patient.nextFollowUp ? (
                        <span className="inline-flex items-center gap-1.5 font-semibold text-xs text-[#2E7D5B] bg-emerald-50/80 px-2.5 py-1 rounded-lg border border-emerald-100 tabular-nums">
                          <CalendarClock size={13} className="text-[#2E7D5B]" />
                          {formatDisplayDate(patient.nextFollowUp)}
                        </span>
                      ) : (
                        <span className="text-[#7D908C] text-xs">None</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <StatusBadge label={patient.status} variant={statusVariantMap[patient.status] || 'info'} />
                    </td>

                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <div
                        className="relative inline-block text-left action-menu-container"
                        onMouseEnter={(e) => handleMenuMouseEnter(e, patient.id)}
                        onMouseLeave={() => handleMenuMouseLeave(patient.id)}
                      >
                        {/* 3-Dot Action Trigger Button */}
                        <button
                          type="button"
                          onClick={(e) => handleMenuTriggerClick(e, patient.id)}
                          className={`h-8 w-8 rounded-xl border transition shadow-2xs inline-flex items-center justify-center cursor-pointer ${
                            openActionMenuId === patient.id
                              ? 'bg-teal-50 border-teal-300 text-[#287C75] ring-2 ring-teal-100/70'
                              : 'text-[#4E6460] hover:text-[#10201F] hover:bg-teal-50 hover:border-teal-200 border-[#D9E6E2]'
                          }`}
                          title="Actions"
                          aria-label="Actions"
                          aria-expanded={openActionMenuId === patient.id}
                        >
                          <MoreVertical size={16} />
                        </button>

                        {/* Screen reader & test accessibility fallback when menu is closed */}
                        {openActionMenuId !== patient.id && (
                          <div className="sr-only">
                            <button
                              type="button"
                              onClick={() => setProfilePatient(patient)}
                            >
                              Profile
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingPatient(patient)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => navigate(`/prescription/new?patientId=${patient.id}`)}
                            >
                              Prescription
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                localAppointments.addToQueue(patient.id, patient.name, patient.age, 'Follow-up visit');
                                setQueueMsg(`${patient.name} added to waiting queue.`);
                                setTimeout(() => setQueueMsg(''), 4000);
                              }}
                            >
                              + Queue
                            </button>
                            {cleanPhone && (
                              <button
                                type="button"
                                title="Chat on WhatsApp"
                                onClick={() => handleOpenWhatsApp(patient)}
                              >
                                WhatsApp
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-[#7D908C]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Users size={28} className="text-[#A2B3B0]" />
                      <p className="font-semibold text-[#10201F]">No patients found</p>
                      <p className="text-xs">No records matched your search or filters.</p>
                      {(search || ageFilter !== 'all' || statusFilter !== 'all') && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearch('');
                            setAgeFilter('all');
                            setStatusFilter('all');
                          }}
                          className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#D9E6E2] text-xs font-semibold text-[#287C75] hover:bg-[#F2F7F5] transition cursor-pointer"
                        >
                          <RotateCcw size={13} />
                          <span>Reset Filters</span>
                        </button>
                      )}
                    </div>
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

      {/* Floating Action Menu Portal (rendered directly to body to eliminate table overflow clipping and scrollbars) */}
      {activePatient && typeof document !== 'undefined' &&
        createPortal(
          <div
            className="action-menu-portal"
            style={{
              position: 'fixed',
              top: `${menuCoords.top}px`,
              left: `${menuCoords.left}px`,
              width: '224px',
              zIndex: 99999,
            }}
            onMouseEnter={handlePortalMouseEnter}
            onMouseLeave={handlePortalMouseLeave}
          >
            <div
              className={`rounded-2xl bg-white border border-[#D9E6E2] shadow-nivara-lg p-2 text-left relative transition-all duration-150 ${
                menuCoords.openUpward
                  ? "before:content-[''] before:absolute before:-bottom-4 before:left-0 before:right-0 before:h-4"
                  : "before:content-[''] before:absolute before:-top-4 before:left-0 before:right-0 before:h-4"
              }`}
            >
              <div className="px-2.5 py-1.5 border-b border-[#EBF1EE] mb-1 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#7D908C]">
                  Actions • {activePatient.name.split(' ')[0]}
                </span>
                <span className="text-[10px] font-mono font-semibold text-[#287C75]">
                  {activePatient.id}
                </span>
              </div>

              {/* 1. Start Prescription */}
              <button
                type="button"
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#10201F] hover:text-[#287C75] hover:bg-teal-50/80 transition text-left cursor-pointer group"
                onClick={() =>
                  handleMenuActionClick(() => navigate(`/prescription/new?patientId=${activePatient.id}`))
                }
                title="Start Prescription"
              >
                <FileText size={15} className="text-[#287C75] shrink-0" />
                <span className="flex-1 font-heading">Prescription</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-teal-50 text-[#287C75] border border-teal-200">
                  Start Rx
                </span>
              </button>

              {/* 2. Patient Profile */}
              <button
                type="button"
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#10201F] hover:text-[#287C75] hover:bg-[#F7FAF8] transition text-left cursor-pointer"
                onClick={() => handleMenuActionClick(() => setProfilePatient(activePatient))}
                title="View Profile"
              >
                <User size={15} className="text-[#4E6460] shrink-0" />
                <span className="flex-1">Profile</span>
              </button>

              {/* 3. Edit Details */}
              <button
                type="button"
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#10201F] hover:text-[#287C75] hover:bg-[#F7FAF8] transition text-left cursor-pointer"
                onClick={() => handleMenuActionClick(() => setEditingPatient(activePatient))}
                title="Edit Details"
              >
                <Edit3 size={15} className="text-[#4E6460] shrink-0" />
                <span className="flex-1">Edit</span>
              </button>

              {/* 4. Add to Reception Queue */}
              <button
                type="button"
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#10201F] hover:text-[#287C75] hover:bg-[#F7FAF8] transition text-left cursor-pointer"
                onClick={() =>
                  handleMenuActionClick(() => {
                    localAppointments.addToQueue(
                      activePatient.id,
                      activePatient.name,
                      activePatient.age,
                      'Follow-up visit'
                    );
                    setQueueMsg(`${activePatient.name} added to waiting queue.`);
                    setTimeout(() => setQueueMsg(''), 4000);
                  })
                }
                title="Add to Reception Queue"
              >
                <Clock3 size={15} className="text-[#B7791F] shrink-0" />
                <span className="flex-1">+ Queue</span>
              </button>

              {/* 5. WhatsApp Chat */}
              {cleanPhoneNumber(activePatient.contact || activePatient.mobile) && (
                <button
                  type="button"
                  onClick={() => handleMenuActionClick(() => handleOpenWhatsApp(activePatient))}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#25D366] hover:bg-emerald-50 transition text-left cursor-pointer border-t border-[#EBF1EE] mt-1 pt-2"
                  title="Chat on WhatsApp"
                >
                  <MessageCircle size={15} className="text-[#25D366] shrink-0" />
                  <span className="flex-1 text-[#10201F]">WhatsApp</span>
                  <span className="text-[10px] text-[#25D366] font-mono">Chat</span>
                </button>
              )}
            </div>
          </div>,
          document.body
        )}

      {/* Add Patient Modal */}
      {showModal ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 transition-opacity"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeModal();
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
                onClick={closeModal}
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
                onClick={closeModal}
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