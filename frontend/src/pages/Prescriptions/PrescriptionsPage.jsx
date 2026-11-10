import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Search,
  Plus,
  Printer,
  MessageCircle,
  Calendar,
  User,
  Pill,
  Filter,
  CheckCircle,
} from 'lucide-react';
import { localVisits, localPatients, localSettings } from '../../services/localStore';
import { generatePrescriptionWhatsAppLink } from '../../utils/whatsappHelper';

/**
 * Convert any date input into a local YYYY-MM-DD string,
 * avoiding UTC timezone boundary mismatches.
 */
const toLocalDateStr = (dateInput) => {
  if (!dateInput) return '';
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) {
      return String(dateInput).split('T')[0];
    }
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  } catch {
    return String(dateInput).split('T')[0];
  }
};

const formatDisplayDate = (dateInput) => {
  if (!dateInput) return '-';
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return String(dateInput);
  }
};

/**
 * PrescriptionsPage Component
 *
 * Active prescriptions repository and history management.
 * - Displays all past prescriptions chronologically
 * - Search by patient name, phone, or RX ID
 * - Filters: All, Today, Past 7 Days
 * - Quick Actions: View / Reprint, Share via WhatsApp
 */
function PrescriptionsPage() {
  const navigate = useNavigate();

  const [prescriptions, setPrescriptions] = useState([]);
  const [clinicSettings, setClinicSettings] = useState(() => localSettings.get());
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all'); // 'all' | 'today' | 'week'
  const [copiedId, setCopiedId] = useState(null);

  // Load visits
  useEffect(() => {
    const visits = localVisits.getAll();
    setPrescriptions(visits);
    setClinicSettings(localSettings.get());
  }, []);

  const todayStr = useMemo(() => toLocalDateStr(new Date()), []);

  const sevenDaysAgoStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return toLocalDateStr(d);
  }, []);

  // Filtered Prescriptions
  const filteredPrescriptions = useMemo(() => {
    return prescriptions.filter((rx) => {
      // Search filter
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        (rx.id && rx.id.toLowerCase().includes(q)) ||
        (rx.patientName && rx.patientName.toLowerCase().includes(q)) ||
        (rx.patientMobile && rx.patientMobile.includes(q)) ||
        (rx.diagnosis && rx.diagnosis.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      // Date filter with timezone-safe conversion
      if (dateFilter === 'today') {
        const rxDateStr = toLocalDateStr(rx.date || rx.createdAt);
        return rxDateStr === todayStr;
      }

      if (dateFilter === 'week') {
        const rxDateStr = toLocalDateStr(rx.date || rx.createdAt);
        return rxDateStr >= sevenDaysAgoStr && rxDateStr <= todayStr;
      }

      return true;
    });
  }, [prescriptions, searchQuery, dateFilter, todayStr, sevenDaysAgoStr]);

  // Statistics
  const stats = useMemo(() => {
    const total = prescriptions.length;
    const todayCount = prescriptions.filter(
      (rx) => toLocalDateStr(rx.date || rx.createdAt) === todayStr
    ).length;
    const uniquePatients = new Set(prescriptions.map((rx) => rx.patientId || rx.patientName)).size;

    return { total, todayCount, uniquePatients };
  }, [prescriptions, todayStr]);

  const handleShareWhatsApp = (rx) => {
    let patient = null;
    if (rx.patientId) {
      patient = localPatients.getById(rx.patientId);
    }
    if (!patient) {
      patient = {
        name: rx.patientName,
        contact: rx.patientMobile,
        age: rx.patientAge,
        gender: rx.patientGender,
      };
    }
    const waUrl = generatePrescriptionWhatsAppLink(patient, rx, clinicSettings);
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const handleViewPrescription = (rxId) => {
    navigate(`/prescription?visitId=${encodeURIComponent(rxId)}`);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <section className="rounded-3xl border border-[#D9E6E2] bg-white p-6 shadow-nivara-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#287C75]/25 bg-[#287C75]/10 px-2.5 py-0.5 text-xs font-semibold text-[#287C75]">
              <FileText size={13} />
              Medical Records & Repository
            </span>
          </div>
          <h1 className="mt-2 font-heading text-2xl font-bold tracking-tight text-[#10201F] sm:text-3xl">Prescription Repository</h1>
          <p className="mt-1 text-sm text-[#4E6460]">
            Search, review, reprint, or share past patient prescriptions with calibrated letterheads.
          </p>
        </div>

        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-xl bg-[#123A3A] px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#287C75] transition shrink-0"
          onClick={() => navigate('/prescription/new')}
        >
          <Plus size={16} />
          <span>New Prescription</span>
        </button>
      </section>

      {/* KPI Cards */}
      <section className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-2xl border border-[#D9E6E2] bg-white p-5 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#287C75]/10 text-[#287C75] flex items-center justify-center font-bold">
            <FileText size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#7D908C]">Total Prescriptions</p>
            <p className="font-heading text-2xl font-bold text-[#10201F] tabular-nums">{stats.total}</p>
          </div>
        </article>

        <article className="rounded-2xl border border-[#D9E6E2] bg-white p-5 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <Calendar size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#7D908C]">Issued Today</p>
            <p className="font-heading text-2xl font-bold text-emerald-700 tabular-nums">{stats.todayCount}</p>
          </div>
        </article>

        <article className="rounded-2xl border border-[#D9E6E2] bg-white p-5 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
            <User size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#7D908C]">Unique Patients</p>
            <p className="font-heading text-2xl font-bold text-[#10201F] tabular-nums">{stats.uniquePatients}</p>
          </div>
        </article>
      </section>

      {/* Filter and Search Bar */}
      <section className="rounded-2xl border border-[#D9E6E2] bg-white p-4 shadow-2xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7D908C]" />
          <input
            type="text"
            placeholder="Search by patient name, phone, RX number, or diagnosis..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-[#D9E6E2] rounded-xl text-xs sm:text-sm font-medium text-[#10201F] placeholder-[#7D908C] focus:outline-none focus:ring-2 focus:ring-[#287C75]/20 focus:border-[#287C75] bg-[#F7FAF8] focus:bg-white transition"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#7D908C] flex items-center gap-1">
            <Filter size={13} />
            Date:
          </span>
          <div className="inline-flex rounded-xl border border-[#D9E6E2] p-0.5 bg-[#F7FAF8]">
            <button
              type="button"
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                dateFilter === 'all'
                  ? 'bg-[#123A3A] text-white shadow-xs'
                  : 'text-[#4E6460] hover:text-[#10201F]'
              }`}
              onClick={() => setDateFilter('all')}
            >
              All Time
            </button>
            <button
              type="button"
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                dateFilter === 'today'
                  ? 'bg-[#123A3A] text-white shadow-xs'
                  : 'text-[#4E6460] hover:text-[#10201F]'
              }`}
              onClick={() => setDateFilter('today')}
            >
              Today
            </button>
            <button
              type="button"
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                dateFilter === 'week'
                  ? 'bg-[#123A3A] text-white shadow-xs'
                  : 'text-[#4E6460] hover:text-[#10201F]'
              }`}
              onClick={() => setDateFilter('week')}
            >
              Past 7 Days
            </button>
          </div>
        </div>
      </section>

      {/* Prescriptions Table */}
      <section className="rounded-3xl border border-[#D9E6E2] bg-white overflow-hidden shadow-nivara-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F7FAF8] text-[11px] font-bold uppercase tracking-wider text-[#7D908C] border-b border-[#D9E6E2]">
              <tr>
                <th className="py-3 px-4">Rx Number</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Patient</th>
                <th className="py-3 px-4">Diagnosis</th>
                <th className="py-3 px-4">Medicines</th>
                <th className="py-3 px-4">Follow-up</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPrescriptions.length > 0 ? (
                filteredPrescriptions.map((rx) => {
                  const medCount = Array.isArray(rx.medicines) ? rx.medicines.length : 0;
                  return (
                    <tr key={rx.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Rx ID */}
                      <td className="py-3.5 px-4 font-mono font-bold text-xs text-[#123A3A]">
                        {rx.id}
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-[#4E6460] whitespace-nowrap font-mono text-xs">
                        {formatDisplayDate(rx.date || rx.createdAt)}
                      </td>

                      {/* Patient */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#10201F]">
                          {rx.patientName || 'Walk-in'}
                        </div>
                        <div className="text-[11px] text-[#7D908C]">
                          {rx.patientAge ? `${rx.patientAge} Yrs • ` : ''}
                          {rx.patientMobile || 'No contact'}
                        </div>
                      </td>

                      {/* Diagnosis */}
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-[#10201F] line-clamp-1 max-w-[220px]">
                          {rx.diagnosis || 'General Consultation'}
                        </span>
                      </td>

                      {/* Medicines Count */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F7FAF8] text-[#123A3A] border border-[#D9E6E2]">
                          <Pill size={12} className="text-[#287C75]" />
                          {medCount} {medCount === 1 ? 'med' : 'meds'}
                        </span>
                      </td>

                      {/* Follow-up */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-xs text-[#4E6460]">
                        {rx.followUpDate || rx.nextFollowUp ? (
                          <span className="font-semibold text-emerald-700">
                            {formatDisplayDate(rx.followUpDate || rx.nextFollowUp)}
                          </span>
                        ) : (
                          <span className="text-[#7D908C]">None</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <button
                            type="button"
                            onClick={() => handleShareWhatsApp(rx)}
                            className="p-1.5 rounded-xl hover:bg-emerald-50 text-emerald-700 border border-emerald-200 transition-colors"
                            title="Share prescription via WhatsApp"
                          >
                            <MessageCircle size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleViewPrescription(rx.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#287C75] hover:bg-[#123A3A] text-white font-semibold text-xs transition-colors shadow-2xs"
                            title="View or print prescription"
                          >
                            <Printer size={13} />
                            View / Print
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#7D908C]">
                    <FileText size={36} className="mx-auto mb-2 text-[#7D908C]/50" />
                    <p className="font-bold text-[#10201F]">No prescriptions found</p>
                    <p className="text-xs text-[#7D908C] mt-1">
                      {searchQuery
                        ? 'Try adjusting your search criteria.'
                        : 'Create your first prescription to see it listed here.'}
                    </p>
                    {!searchQuery && (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#123A3A] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#287C75] mt-3 transition"
                        onClick={() => navigate('/prescription/new')}
                      >
                        <Plus size={14} />
                        New Prescription
                      </button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default PrescriptionsPage;
