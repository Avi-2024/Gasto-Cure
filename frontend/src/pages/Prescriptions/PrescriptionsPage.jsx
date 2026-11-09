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
      <section className="app-card p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-600">
            Medical Records
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Prescription Repository</h1>
          <p className="mt-1 text-sm text-slate-500">
            Search, review, reprint, or share past patient prescriptions.
          </p>
        </div>

        <button
          type="button"
          className="btn-primary inline-flex items-center gap-2"
          onClick={() => navigate('/prescription')}
        >
          <Plus size={16} />
          New Prescription
        </button>
      </section>

      {/* KPI Cards */}
      <section className="grid gap-4 sm:grid-cols-3">
        <article className="app-card p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <FileText size={22} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Total Prescriptions</p>
            <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
          </div>
        </article>

        <article className="app-card p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Calendar size={22} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Issued Today</p>
            <p className="text-2xl font-bold text-emerald-700">{stats.todayCount}</p>
          </div>
        </article>

        <article className="app-card p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <User size={22} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Unique Patients</p>
            <p className="text-2xl font-bold text-slate-900">{stats.uniquePatients}</p>
          </div>
        </article>
      </section>

      {/* Filter and Search Bar */}
      <section className="app-card p-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by patient name, phone, RX number, or diagnosis..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
            <Filter size={13} />
            Date:
          </span>
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
            <button
              type="button"
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                dateFilter === 'all'
                  ? 'bg-white text-blue-600 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              onClick={() => setDateFilter('all')}
            >
              All Time
            </button>
            <button
              type="button"
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                dateFilter === 'today'
                  ? 'bg-white text-blue-600 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              onClick={() => setDateFilter('today')}
            >
              Today
            </button>
            <button
              type="button"
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                dateFilter === 'week'
                  ? 'bg-white text-blue-600 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              onClick={() => setDateFilter('week')}
            >
              Past 7 Days
            </button>
          </div>
        </div>
      </section>

      {/* Prescriptions Table */}
      <section className="app-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500 border-b border-slate-200">
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
                      <td className="py-3.5 px-4 font-mono font-semibold text-xs text-blue-700">
                        {rx.id}
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                        {formatDisplayDate(rx.date || rx.createdAt)}
                      </td>

                      {/* Patient */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">
                          {rx.patientName || 'Walk-in'}
                        </div>
                        <div className="text-xs text-slate-400">
                          {rx.patientAge ? `${rx.patientAge} Yrs • ` : ''}
                          {rx.patientMobile || 'No contact'}
                        </div>
                      </td>

                      {/* Diagnosis */}
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-slate-800 line-clamp-1 max-w-[220px]">
                          {rx.diagnosis || 'General Consultation'}
                        </span>
                      </td>

                      {/* Medicines Count */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          <Pill size={12} className="text-blue-500" />
                          {medCount} {medCount === 1 ? 'med' : 'meds'}
                        </span>
                      </td>

                      {/* Follow-up */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-600">
                        {rx.followUpDate || rx.nextFollowUp ? (
                          <span className="font-medium text-emerald-700">
                            {formatDisplayDate(rx.followUpDate || rx.nextFollowUp)}
                          </span>
                        ) : (
                          <span className="text-slate-400">None</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <button
                            type="button"
                            onClick={() => handleShareWhatsApp(rx)}
                            className="p-1.5 rounded-md hover:bg-emerald-50 text-emerald-600 border border-emerald-200 transition-colors"
                            title="Share prescription via WhatsApp"
                          >
                            <MessageCircle size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleViewPrescription(rx.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition-colors"
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
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <FileText size={36} className="mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">No prescriptions found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {searchQuery
                        ? 'Try adjusting your search criteria.'
                        : 'Create your first prescription to see it listed here.'}
                    </p>
                    {!searchQuery && (
                      <button
                        type="button"
                        className="btn-primary text-xs mt-3 inline-flex items-center gap-1.5"
                        onClick={() => navigate('/prescription')}
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
