import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Search,
  Plus,
  Printer,
  Calendar,
  User,
  MessageCircle,
  Eye,
  ChevronLeft,
  ChevronRight,
  Pill,
  Clock,
  Sparkles,
} from 'lucide-react';
import { localVisits, localPatients, localSettings } from '../../services/localStore';
import { generatePrescriptionWhatsAppLink } from '../../utils/whatsappHelper';
import usePagination from '../../hooks/usePagination';

export default function PrescriptionsPage() {
  const navigate = useNavigate();
  const [prescriptions, setPrescriptions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all'); // all, today, thisWeek, thisMonth
  const [clinicSettings, setClinicSettings] = useState(() => localSettings.get());

  useEffect(() => {
    // Seed sample patients/visits if needed
    localPatients.seed();
    setPrescriptions(localVisits.getAll());
    setClinicSettings(localSettings.get());
  }, []);

  // Filtered prescriptions
  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate()
    ).padStart(2, '0')}`;

    return prescriptions.filter((rx) => {
      // Text match
      const rxId = String(rx.id || '').toLowerCase();
      const patientName = String(rx.patientName || '').toLowerCase();
      const patientMobile = String(rx.patientMobile || '').toLowerCase();
      const diagnosis = String(rx.diagnosis || '').toLowerCase();
      const symptoms = String(rx.symptoms || '').toLowerCase();

      const matchesSearch =
        !q ||
        rxId.includes(q) ||
        patientName.includes(q) ||
        patientMobile.includes(q) ||
        diagnosis.includes(q) ||
        symptoms.includes(q);

      if (!matchesSearch) return false;

      // Date filter
      if (dateFilter === 'all') return true;

      const rxDateStr = rx.date ? rx.date.split('T')[0] : '';
      if (dateFilter === 'today') {
        return rxDateStr === todayStr;
      }
      if (dateFilter === 'thisWeek') {
        const rxDate = new Date(rx.date || rx.createdAt);
        const diffTime = Math.abs(now - rxDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 7;
      }
      if (dateFilter === 'thisMonth') {
        const rxDate = new Date(rx.date || rx.createdAt);
        return (
          rxDate.getFullYear() === now.getFullYear() && rxDate.getMonth() === now.getMonth()
        );
      }

      return true;
    });
  }, [prescriptions, searchQuery, dateFilter]);

  const { page, totalPages, paginated, prevPage, nextPage, goToPage } = usePagination(filtered, 8);

  useEffect(() => {
    goToPage(1);
  }, [searchQuery, dateFilter, goToPage]);

  // Quick stats
  const stats = useMemo(() => {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate()
    ).padStart(2, '0')}`;

    const todayCount = prescriptions.filter(
      (rx) => rx.date && rx.date.split('T')[0] === todayStr
    ).length;

    const followUpCount = prescriptions.filter(
      (rx) => rx.followUpDate || rx.nextFollowUp
    ).length;

    return {
      total: prescriptions.length,
      today: todayCount,
      withFollowUp: followUpCount,
    };
  }, [prescriptions]);

  const handleShareWhatsApp = (rx) => {
    const patientObj = localPatients.getById(rx.patientId) || {
      name: rx.patientName,
      contact: rx.patientMobile,
    };
    const link = generatePrescriptionWhatsAppLink(patientObj, rx, clinicSettings);
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <section className="app-card p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-50 text-sky-700 shadow-sm">
                <FileText size={22} />
              </span>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  Prescription Records
                </h1>
                <p className="text-sm text-slate-500">
                  Search, review past prescriptions, reprint on pre-printed pad, or send via WhatsApp
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="btn-primary inline-flex items-center gap-2 shadow-sm"
              onClick={() => navigate('/prescription/new')}
            >
              <Plus size={18} />
              <span>Create Prescription</span>
            </button>
          </div>
        </div>

        {/* Stats strip */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-medical-border bg-slate-50/60 p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Total Prescriptions
              </p>
              <FileText size={16} className="text-sky-600" />
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900">{stats.total}</p>
          </div>

          <div className="rounded-2xl border border-medical-border bg-slate-50/60 p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Created Today
              </p>
              <Clock size={16} className="text-emerald-600" />
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900">{stats.today}</p>
          </div>

          <div className="rounded-2xl border border-medical-border bg-slate-50/60 p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                With Scheduled Follow-Up
              </p>
              <Calendar size={16} className="text-amber-600" />
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900">{stats.withFollowUp}</p>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-[1fr_200px]">
          <div className="relative">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              className="w-full rounded-xl border border-medical-border bg-white py-2 pl-9 pr-4 text-sm focus:border-medical-primary focus:outline-none focus:ring-2 focus:ring-medical-primary/20"
              placeholder="Search by RX ID, patient name, contact, or diagnosis..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <select
            className="rounded-xl border border-medical-border bg-white px-3 py-2 text-sm focus:border-medical-primary focus:outline-none focus:ring-2 focus:ring-medical-primary/20"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          >
            <option value="all">All Dates</option>
            <option value="today">Today Only</option>
            <option value="thisWeek">Past 7 Days</option>
            <option value="thisMonth">This Month</option>
          </select>
        </div>
      </section>

      {/* Table section */}
      <section className="app-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-medical-border">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Prescription
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Patient
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Diagnosis / Complaints
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Medicines (Rx)
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Follow-Up
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-medical-border bg-white">
              {paginated.map((rx) => {
                const rxDate = rx.date
                  ? new Date(rx.date).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })
                  : 'N/A';

                const medCount = Array.isArray(rx.medicines) ? rx.medicines.length : 0;

                return (
                  <tr key={rx.id} className="transition hover:bg-slate-50/60">
                    {/* RX ID & Date */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
                          <FileText size={16} />
                        </span>
                        <div>
                          <p className="font-mono text-xs font-bold text-slate-900">{rx.id}</p>
                          <p className="text-xs text-slate-400">{rxDate}</p>
                        </div>
                      </div>
                    </td>

                    {/* Patient Details */}
                    <td className="px-4 py-3.5">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{rx.patientName}</p>
                        <p className="text-xs text-slate-500">
                          {rx.patientAge ? `${rx.patientAge}y` : ''}
                          {rx.patientGender ? ` • ${rx.patientGender}` : ''}
                          {rx.patientMobile ? ` • ${rx.patientMobile}` : ''}
                        </p>
                      </div>
                    </td>

                    {/* Diagnosis / Complaints */}
                    <td className="px-4 py-3.5">
                      <div className="max-w-[220px]">
                        <p className="truncate text-sm font-medium text-slate-800">
                          {rx.diagnosis || 'No formal diagnosis'}
                        </p>
                        {rx.symptoms ? (
                          <p className="truncate text-xs text-slate-400">{rx.symptoms}</p>
                        ) : null}
                      </div>
                    </td>

                    {/* Medicines count and preview */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-0.5 text-xs font-semibold text-sky-700">
                          <Pill size={12} />
                          {medCount} {medCount === 1 ? 'med' : 'meds'}
                        </span>
                      </div>
                    </td>

                    {/* Follow-up date */}
                    <td className="px-4 py-3.5">
                      {rx.followUpDate || rx.nextFollowUp ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700">
                          <Calendar size={13} className="text-amber-500" />
                          {rx.followUpDate || rx.nextFollowUp}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">None scheduled</span>
                      )}
                    </td>

                    {/* Action buttons */}
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* View / Print button */}
                        <button
                          type="button"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-medical-border bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-medical-primary"
                          onClick={() => navigate(`/prescription/new?visitId=${rx.id}`)}
                          title="View / Print Prescription"
                        >
                          <Printer size={13} />
                          <span>Print</span>
                        </button>

                        {/* WhatsApp button */}
                        <button
                          type="button"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                          onClick={() => handleShareWhatsApp(rx)}
                          title="Share Prescription via WhatsApp"
                        >
                          <MessageCircle size={13} />
                          <span>WhatsApp</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FileText size={32} className="text-slate-300" />
                      <p className="font-semibold text-slate-700">No prescriptions found</p>
                      <p className="text-xs text-slate-400">
                        {searchQuery
                          ? 'Try adjusting your search criteria.'
                          : 'Create your first prescription by clicking the button above.'}
                      </p>
                      <button
                        type="button"
                        className="btn-primary mt-2 inline-flex items-center gap-1.5 text-xs"
                        onClick={() => navigate('/prescription/new')}
                      >
                        <Plus size={14} />
                        <span>Create Prescription</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {filtered.length > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-medical-border bg-slate-50 px-4 py-3">
            <p className="text-xs text-slate-500">
              Showing <span className="font-semibold text-slate-700">{paginated.length}</span> of{' '}
              <span className="font-semibold text-slate-700">{filtered.length}</span> prescriptions
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className="btn-secondary py-1 text-xs"
                onClick={prevPage}
                disabled={page === 1}
              >
                <ChevronLeft size={14} />
                <span>Prev</span>
              </button>
              <span className="rounded-lg border border-medical-border bg-white px-2.5 py-1 text-xs font-semibold text-slate-700">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                className="btn-secondary py-1 text-xs"
                onClick={nextPage}
                disabled={page === totalPages}
              >
                <span>Next</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
