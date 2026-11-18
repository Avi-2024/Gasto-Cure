import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Layers,
  Pencil,
  Pill,
  Plus,
  Power,
  RotateCcw,
  Search,
  Trash2,
  X,
  XCircle,
} from 'lucide-react';
import StatCard from '../../components/ui/StatCard';
import StatusBadge from '../../components/ui/StatusBadge';
import usePagination from '../../hooks/usePagination';
import { localMedicines } from '../../services/localStore';
import AddEditMedicineModal from './components/AddEditMedicineModal';
import DosageFormIcon, { getDosageFormIconSrc } from '../../components/common/DosageFormIcon';

const formFilterOptions = [
  'All',
  'Tablet',
  'Capsule',
  'Syrup',
  'Injection',
  'Drops',
  'Cream',
  'Gel',
  'Inhaler',
  'Ointment',
  'Sachet',
];

const getFormBadgeStyle = (form = '') => {
  const f = form.toLowerCase();
  if (f.includes('tab')) {
    return 'border-teal-200 bg-teal-50 text-[#287C75]';
  }
  if (f.includes('syrup') || f.includes('susp')) {
    return 'border-amber-200 bg-amber-50 text-[#B7791F]';
  }
  if (f.includes('cap')) {
    return 'border-indigo-200 bg-indigo-50 text-[#4F46E5]';
  }
  if (f.includes('inj')) {
    return 'border-rose-200 bg-rose-50 text-[#B94A48]';
  }
  if (f.includes('drop')) {
    return 'border-sky-200 bg-sky-50 text-sky-700';
  }
  if (f.includes('cream') || f.includes('gel') || f.includes('oint')) {
    return 'border-emerald-200 bg-emerald-50 text-[#2E7D5B]';
  }
  if (f.includes('inhaler')) {
    return 'border-purple-200 bg-purple-50 text-purple-700';
  }
  return 'border-[#D9E6E2] bg-[#F7FAF8] text-[#4E6460]';
};

function MedicinesPage() {
  const [medicines, setMedicines] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedForm, setSelectedForm] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState(null);
  const [notification, setNotification] = useState('');
  const notificationTimerRef = useRef(null);

  const refreshList = () => {
    setMedicines(localMedicines.getAll());
  };

  useEffect(() => {
    localMedicines.seed();
    setMedicines(localMedicines.getAll());
    return () => {
      if (notificationTimerRef.current) {
        clearTimeout(notificationTimerRef.current);
      }
    };
  }, []);

  const showNotification = (msg) => {
    if (notificationTimerRef.current) {
      clearTimeout(notificationTimerRef.current);
    }
    setNotification(msg);
    notificationTimerRef.current = setTimeout(() => {
      setNotification('');
    }, 3500);
  };

  const filteredMedicines = useMemo(() => {
    return medicines.filter((med) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        (med.name && med.name.toLowerCase().includes(q)) ||
        (med.strength && med.strength.toLowerCase().includes(q)) ||
        (med.category && med.category.toLowerCase().includes(q)) ||
        (med.form && med.form.toLowerCase().includes(q));

      const matchesForm =
        selectedForm === 'All' ||
        (med.form && med.form.toLowerCase() === selectedForm.toLowerCase());

      const matchesStatus =
        statusFilter === 'All' ||
        (statusFilter === 'Active' && med.isActive) ||
        (statusFilter === 'Inactive' && !med.isActive);

      return matchesSearch && matchesForm && matchesStatus;
    });
  }, [medicines, search, selectedForm, statusFilter]);

  const { page, totalPages, paginated, prevPage, nextPage, goToPage } = usePagination(
    filteredMedicines,
    12
  );

  useEffect(() => {
    goToPage(1);
  }, [search, selectedForm, statusFilter, goToPage]);

  // Statistics
  const totalCount = medicines.length;
  const activeCount = useMemo(() => medicines.filter((m) => m.isActive).length, [medicines]);
  const inactiveCount = totalCount - activeCount;
  const formsCount = useMemo(
    () => new Set(medicines.map((m) => m.form).filter(Boolean)).size,
    [medicines]
  );

  const isFiltered = Boolean(search || selectedForm !== 'All' || statusFilter !== 'All');

  const handleClearFilters = () => {
    setSearch('');
    setSelectedForm('All');
    setStatusFilter('All');
  };

  const handleOpenAdd = () => {
    setEditingMedicine(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (med) => {
    setEditingMedicine(med);
    setModalOpen(true);
  };

  const handleSaveMedicine = (data) => {
    if (editingMedicine && editingMedicine.id) {
      localMedicines.update(editingMedicine.id, data);
      showNotification(`Updated formulation: ${data.name}`);
    } else {
      localMedicines.add(data);
      showNotification(`Added ${data.name} to clinic formulary`);
    }
    setModalOpen(false);
    setEditingMedicine(null);
    refreshList();
  };

  const handleToggleStatus = (med) => {
    const nextStatus = !med.isActive;
    localMedicines.update(med.id, { isActive: nextStatus });
    refreshList();
    showNotification(
      `${med.name} marked ${nextStatus ? 'Active' : 'Inactive'}`
    );
  };

  const handleDelete = (med) => {
    let confirmed = true;
    if (typeof window !== 'undefined' && typeof window.confirm === 'function') {
      try {
        confirmed = window.confirm(`Delete ${med.name} from master catalog?`);
      } catch {
        confirmed = true;
      }
    }
    if (!confirmed) return;

    localMedicines.delete(med.id);
    refreshList();
    showNotification(`Deleted formulation: ${med.name}`);
  };

  return (
    <div className="space-y-6">
      {/* Header section with ClinixPulse branding */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-50 text-[#287C75] border border-teal-100 shadow-clinixpulse-xs">
              <Pill size={22} />
            </span>
            <div>
              <h1 className="font-heading text-2xl font-bold tracking-tight text-[#10201F]">
                Medicine Catalog & Master Formulary
              </h1>
              <p className="mt-0.5 text-xs text-[#4E6460]">
                Standard formulations, clinical strengths, dosage schedules, and timing instructions
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleOpenAdd}
            className="btn-primary inline-flex items-center gap-2 shadow-clinixpulse-xs"
          >
            <Plus size={18} />
            <span>Add Medicine</span>
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {notification ? (
        <div role="status" aria-live="polite" className="flex items-center justify-between rounded-xl border border-teal-200 bg-teal-50/80 px-4 py-3 text-sm font-medium text-[#123A3A] shadow-clinixpulse-xs transition animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 size={18} className="text-[#2E7D5B]" />
            <span>{notification}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification('')}
            className="rounded-lg p-1 text-[#4E6460] hover:bg-teal-100/60 hover:text-[#10201F] transition"
            aria-label="Dismiss notification"
          >
            <X size={16} />
          </button>
        </div>
      ) : null}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Pill}
          label="Total Formulations"
          value={totalCount}
          tone="primary"
          trend={{ label: 'Formulary Master', positive: true }}
        />
        <StatCard
          icon={CheckCircle2}
          label="Active Medicines"
          value={activeCount}
          tone="success"
          trend={{ label: 'Available in Rx', positive: true }}
        />
        <StatCard
          icon={Layers}
          label="Dosage Forms"
          value={formsCount}
          tone="secondary"
          trend={{ label: 'Tabs, Syrups, etc.', positive: true }}
        />
        <StatCard
          icon={XCircle}
          label="Inactive / Archived"
          value={inactiveCount}
          tone="warning"
          trend={{ label: 'Hidden from Rx', positive: false }}
        />
      </div>

      {/* Search and Filters Section */}
      <section className="app-card rounded-2xl p-4 border border-[#D9E6E2] bg-white shadow-clinixpulse-xs">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7D908C]"
            />
            <input
              type="text"
              placeholder="Search medicine by name, strength, category..."
              aria-label="Search medicines"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-[#D9E6E2] bg-white pl-10 pr-10 py-2.5 text-sm text-[#10201F] placeholder-[#7D908C] focus:border-[#287C75] focus:ring-2 focus:ring-[#287C75]/20 focus:outline-none transition"
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7D908C] hover:text-[#10201F]"
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label
                htmlFor="form-filter"
                className="text-xs font-semibold uppercase tracking-[0.08em] text-[#4E6460]"
              >
                Filter by form:
              </label>
              <select
                id="form-filter"
                aria-label="Filter by form"
                data-testid="form-filter"
                value={selectedForm}
                onChange={(e) => setSelectedForm(e.target.value)}
                className="rounded-xl border border-[#D9E6E2] bg-white px-3 py-2 text-sm text-[#10201F] focus:border-[#287C75] focus:ring-2 focus:ring-[#287C75]/20 focus:outline-none transition"
              >
                {formFilterOptions.map((form) => (
                  <option key={form} value={form}>
                    {form === 'All' ? 'All Forms' : form}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label
                htmlFor="status-filter"
                className="text-xs font-semibold uppercase tracking-[0.08em] text-[#4E6460]"
              >
                Status:
              </label>
              <select
                id="status-filter"
                aria-label="Filter by status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-[#D9E6E2] bg-white px-3 py-2 text-sm text-[#10201F] focus:border-[#287C75] focus:ring-2 focus:ring-[#287C75]/20 focus:outline-none transition"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active Only</option>
                <option value="Inactive">Inactive Only</option>
              </select>
            </div>

            {isFiltered ? (
              <button
                type="button"
                onClick={handleClearFilters}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#D9E6E2] bg-[#F7FAF8] px-3 py-2 text-xs font-semibold text-[#4E6460] hover:bg-slate-100 hover:text-[#10201F] transition"
              >
                <RotateCcw size={13} />
                <span>Reset</span>
              </button>
            ) : null}
          </div>
        </div>
      </section>

      {/* Formulary Master Table */}
      <section className="app-card overflow-hidden rounded-2xl border border-[#D9E6E2] bg-white shadow-clinixpulse-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[#4E6460]">
            <thead className="bg-[#F7FAF8] text-xs font-bold uppercase tracking-[0.08em] text-[#4E6460] border-b border-[#D9E6E2]">
              <tr>
                <th className="px-4 py-3.5">Medicine Name & Composition</th>
                <th className="px-4 py-3.5">Default Dosage</th>
                <th className="px-4 py-3.5">Timing & Duration</th>
                <th className="px-4 py-3.5">Instructions</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D9E6E2]">
              {paginated.map((med) => {
                return (
                  <tr
                    key={med.id}
                    className={`transition duration-150 hover:bg-[#F7FAF8]/80 ${
                      !med.isActive ? 'bg-[#F7FAF8]/40 opacity-75' : 'bg-white'
                    }`}
                  >
                    {/* Medicine Name & Category */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <DosageFormIcon
                          form={med.form}
                          className="h-9 w-9 rounded-xl border border-[#D9E6E2] bg-white shadow-2xs group-hover:scale-105 transition-transform"
                          imgClassName="h-6 w-6 object-contain"
                        />
                        <div>
                          <p className="font-semibold text-[#10201F]">{med.name}</p>
                          <p className="text-xs text-[#7D908C]">
                            {med.category || 'General'}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Default Dosage (monospace chip) */}
                    <td className="px-4 py-3.5">
                      <span className="inline-block rounded-lg border border-[#D9E6E2] bg-[#F7FAF8] px-2.5 py-1 font-mono text-xs font-semibold text-[#123A3A] shadow-clinixpulse-xs">
                        {med.defaultDosage || '1-0-1'}
                      </span>
                    </td>

                    {/* Timing & Duration */}
                    <td className="px-4 py-3.5">
                      <div>
                        <p className="font-medium text-[#10201F]">
                          {med.defaultTiming || 'After Food'}
                        </p>
                        <p className="text-xs text-[#7D908C]">
                          {med.defaultDuration || '5 Days'}
                        </p>
                      </div>
                    </td>

                    {/* Instructions */}
                    <td
                      className="max-w-[200px] truncate px-4 py-3.5 text-xs text-[#4E6460]"
                      title={med.defaultInstruction || med.instructions || '-'}
                    >
                      {med.defaultInstruction || med.instructions || '-'}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5">
                      <StatusBadge
                        label={med.isActive ? 'Active' : 'Inactive'}
                        variant={med.isActive ? 'success' : 'neutral'}
                      />
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          aria-label="Edit"
                          onClick={() => handleOpenEdit(med)}
                          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#D9E6E2] bg-white px-2.5 text-xs font-semibold text-[#10201F] transition hover:border-[#287C75] hover:bg-teal-50 hover:text-[#287C75] shadow-clinixpulse-xs"
                          title="Edit Formulation"
                        >
                          <Pencil size={13} />
                          <span>Edit</span>
                        </button>

                        <button
                          type="button"
                          aria-label="Toggle Status"
                          onClick={() => handleToggleStatus(med)}
                          className={`inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-semibold transition shadow-clinixpulse-xs ${
                            med.isActive
                              ? 'border-amber-200 bg-amber-50/70 text-[#B7791F] hover:bg-amber-100 hover:border-amber-300'
                              : 'border-emerald-200 bg-emerald-50/70 text-[#2E7D5B] hover:bg-emerald-100 hover:border-emerald-300'
                          }`}
                          title={med.isActive ? 'Deactivate' : 'Activate'}
                        >
                          <Power size={13} />
                          <span>{med.isActive ? 'Deactivate' : 'Activate'}</span>
                        </button>

                        <button
                          type="button"
                          aria-label="Delete"
                          onClick={() => handleDelete(med)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 bg-rose-50/60 text-[#B94A48] transition hover:bg-rose-100 hover:border-rose-300 shadow-clinixpulse-xs"
                          title="Delete Formulation"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-[#4E6460]">
                    <div className="mx-auto flex max-w-sm flex-col items-center gap-3">
                      <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F7FAF8] text-[#7D908C] border border-[#D9E6E2]">
                        <AlertCircle size={24} />
                      </span>
                      <div>
                        <p className="font-heading font-semibold text-base text-[#10201F]">
                          No medicines found
                        </p>
                        <p className="mt-1 text-xs text-[#7D908C]">
                          Try adjusting search query, clearing filters, or adding a new formulation to the master catalog.
                        </p>
                      </div>
                      {isFiltered ? (
                        <button
                          type="button"
                          onClick={handleClearFilters}
                          className="btn-secondary mt-1 text-xs py-2 px-3"
                        >
                          Clear Filters
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#D9E6E2] bg-[#F7FAF8] px-4 py-3">
          <p className="text-xs text-[#4E6460]">
            Showing <span className="font-semibold text-[#10201F]">{paginated.length}</span> of{' '}
            <span className="font-semibold text-[#10201F]">{filteredMedicines.length}</span> formulations
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn-secondary py-1.5 px-3 text-xs"
              onClick={prevPage}
              disabled={page === 1}
            >
              <ChevronLeft size={15} />
              Prev
            </button>
            <span className="rounded-xl border border-[#D9E6E2] bg-white px-3 py-1.5 text-xs font-semibold text-[#10201F] shadow-clinixpulse-xs">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              className="btn-secondary py-1.5 px-3 text-xs"
              onClick={nextPage}
              disabled={page === totalPages}
            >
              Next
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </section>

      {/* Add / Edit Modal */}
      <AddEditMedicineModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingMedicine(null);
        }}
        onSave={handleSaveMedicine}
        initialData={editingMedicine}
      />
    </div>
  );
}

export default MedicinesPage;
