import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Filter,
  Layers,
  Pencil,
  Pill,
  Plus,
  Power,
  Search,
  Trash2,
  XCircle,
} from 'lucide-react';
import StatCard from '../../components/ui/StatCard';
import StatusBadge from '../../components/ui/StatusBadge';
import usePagination from '../../hooks/usePagination';
import { localMedicines } from '../../services/localStore';
import AddEditMedicineModal from './components/AddEditMedicineModal';

const formFilterOptions = [
  'All',
  'Tablet',
  'Capsule',
  'Syrup',
  'Injection',
  'Drops',
  'Ointment',
  'Sachet',
];

function MedicinesPage() {
  const [medicines, setMedicines] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedForm, setSelectedForm] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState(null);
  const [notification, setNotification] = useState('');

  const refreshList = () => {
    localMedicines.seed();
    setMedicines(localMedicines.getAll());
  };

  useEffect(() => {
    refreshList();
  }, []);

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => {
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
      showNotification(`Updated ${data.name}`);
    } else {
      localMedicines.add(data);
      showNotification(`Added ${data.name} to catalog`);
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
    showNotification(`Deleted ${med.name}`);
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-50 text-sky-700 shadow-sm">
              <Pill size={22} />
            </span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Medicine Catalog
              </h1>
              <p className="text-sm text-slate-500">
                Master drug formulary, dosage defaults, timing, and clinic prescribing rules
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleOpenAdd}
            className="btn-primary inline-flex items-center gap-2 shadow-sm"
          >
            <Plus size={18} />
            <span>Add Medicine</span>
          </button>
        </div>
      </div>

      {notification ? (
        <div className="flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-medium text-sky-800 transition">
          <CheckCircle2 size={16} className="text-sky-600" />
          <span>{notification}</span>
        </div>
      ) : null}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Pill}
          label="Total Formulations"
          value={totalCount}
          tone="primary"
          trend={{ label: 'Standard Catalog', positive: true }}
        />
        <StatCard
          icon={CheckCircle2}
          label="Active Medicines"
          value={activeCount}
          tone="success"
          trend={{ label: 'Available in Rx', positive: true }}
        />
        <StatCard
          icon={XCircle}
          label="Inactive / Archived"
          value={inactiveCount}
          tone="warning"
          trend={{ label: 'Hidden from quick search', positive: false }}
        />
        <StatCard
          icon={Layers}
          label="Dosage Forms"
          value={formsCount}
          tone="secondary"
          trend={{ label: 'Tabs, Syrups, etc.', positive: true }}
        />
      </div>

      {/* Search and Filters Section */}
      <section className="app-card rounded-2xl p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search medicine by name, strength, category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-medical-border bg-white pl-10 pr-4 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-sky-500 focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label htmlFor="form-filter" className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Filter by form:
              </label>
              <select
                id="form-filter"
                aria-label="Filter by form"
                data-testid="form-filter"
                value={selectedForm}
                onChange={(e) => setSelectedForm(e.target.value)}
                className="rounded-xl border border-medical-border bg-white px-3 py-2 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
              >
                {formFilterOptions.map((form) => (
                  <option key={form} value={form}>
                    {form === 'All' ? 'All Forms' : form}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="status-filter" className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Status:
              </label>
              <select
                id="status-filter"
                aria-label="Filter by status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-medical-border bg-white px-3 py-2 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active Only</option>
                <option value="Inactive">Inactive Only</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Medicines Table */}
      <section className="app-card overflow-hidden rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
              <tr>
                <th className="px-4 py-3.5">Medicine & Strength</th>
                <th className="px-4 py-3.5">Form / Category</th>
                <th className="px-4 py-3.5">Default Dosage</th>
                <th className="px-4 py-3.5">Timing & Duration</th>
                <th className="px-4 py-3.5">Instructions</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((med) => (
                <tr
                  key={med.id}
                  className={`border-t border-medical-border transition hover:bg-slate-50/70 ${
                    !med.isActive ? 'bg-slate-50/40 text-slate-400' : 'bg-white'
                  }`}
                >
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`inline-flex h-8 w-8 items-center justify-center rounded-xl text-xs font-bold ${
                          med.form === 'Syrup'
                            ? 'bg-amber-50 text-amber-700'
                            : med.form === 'Capsule'
                            ? 'bg-purple-50 text-purple-700'
                            : med.form === 'Injection'
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-sky-50 text-sky-700'
                        }`}
                      >
                        {med.form ? med.form.slice(0, 3) : 'Tab'}
                      </span>
                      <div>
                        <p className="font-semibold text-slate-900">{med.name}</p>
                        {med.strength ? (
                          <p className="text-xs text-slate-500">Strength: {med.strength}</p>
                        ) : null}
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3.5">
                    <div className="flex flex-col">
                      <span className="font-medium text-slate-700">{med.form || 'Tablet'}</span>
                      <span className="text-xs text-slate-400">{med.category || 'General'}</span>
                    </div>
                  </td>

                  <td className="px-4 py-3.5">
                    <span className="inline-block rounded-lg bg-slate-100 px-2 py-1 font-mono text-xs font-semibold text-slate-700">
                      {med.defaultDosage || '1-0-1'}
                    </span>
                  </td>

                  <td className="px-4 py-3.5">
                    <div>
                      <p className="font-medium text-slate-800">{med.defaultTiming || 'After Food'}</p>
                      <p className="text-xs text-slate-500">{med.defaultDuration || '5 Days'}</p>
                    </div>
                  </td>

                  <td className="max-w-[200px] truncate px-4 py-3.5 text-xs text-slate-600" title={med.defaultInstruction || med.instructions || '-'}>
                    {med.defaultInstruction || med.instructions || '-'}
                  </td>

                  <td className="px-4 py-3.5">
                    <StatusBadge
                      label={med.isActive ? 'Active' : 'Inactive'}
                      variant={med.isActive ? 'success' : 'neutral'}
                    />
                  </td>

                  <td className="px-4 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        aria-label="Edit"
                        onClick={() => handleOpenEdit(med)}
                        className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 hover:text-sky-700"
                        title="Edit Formulation"
                      >
                        <Pencil size={13} />
                        <span>Edit</span>
                      </button>

                      <button
                        type="button"
                        aria-label="Toggle Status"
                        onClick={() => handleToggleStatus(med)}
                        className={`inline-flex h-8 items-center gap-1 rounded-lg border px-2.5 text-xs font-medium transition ${
                          med.isActive
                            ? 'border-amber-200 bg-amber-50/50 text-amber-700 hover:bg-amber-100/60'
                            : 'border-emerald-200 bg-emerald-50/50 text-emerald-700 hover:bg-emerald-100/60'
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
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 bg-rose-50/50 text-rose-600 transition hover:bg-rose-100"
                        title="Delete Formulation"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-500">
                    <div className="mx-auto flex max-w-sm flex-col items-center gap-2">
                      <AlertCircle size={28} className="text-slate-400" />
                      <p className="font-semibold text-slate-700">No medicines found</p>
                      <p className="text-xs text-slate-500">
                        Try clearing filters or search query, or add a new medicine to the master catalog.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-medical-border bg-slate-50 px-4 py-3">
          <p className="text-sm text-slate-500">
            Showing <span className="font-semibold text-slate-700">{paginated.length}</span> of{' '}
            <span className="font-semibold text-slate-700">{filteredMedicines.length}</span> medicines
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn-secondary"
              onClick={prevPage}
              disabled={page === 1}
            >
              <ChevronLeft size={16} />
              Prev
            </button>
            <span className="rounded-xl border border-medical-border bg-white px-3 py-2 text-sm font-semibold text-slate-700">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              className="btn-secondary"
              onClick={nextPage}
              disabled={page === totalPages}
            >
              Next
              <ChevronRight size={16} />
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
