import React, { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  FileText,
  Activity,
  Plus,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Search,
  ExternalLink,
  Power,
  X,
  Stethoscope,
  Sparkles,
} from 'lucide-react';
import { adminApi } from '../../services/adminApi';

export default function SuperAdminPage() {
  const [clinics, setClinics] = useState([]);
  const [metrics, setMetrics] = useState({
    totalClinics: 0,
    activeClinics: 0,
    totalPatients: 0,
    totalPrescriptions: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const [onboardForm, setOnboardForm] = useState({
    name: '',
    code: '',
    phone: '',
    email: '',
    city: 'Indore',
    state: 'Madhya Pradesh',
    plan: 'PRO',
    ownerEmail: '',
    ownerName: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [clinicsRes, metricsRes] = await Promise.all([
        adminApi.getClinics({ status: statusFilter }),
        adminApi.getRevenueOverview(),
      ]);

      if (clinicsRes?.clinics) {
        setClinics(clinicsRes.clinics);
      }
      if (metricsRes?.metrics) {
        setMetrics(metricsRes.metrics);
      }
    } catch (err) {
      console.warn('Super Admin load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleToggleStatus = async (clinicId, currentStatus) => {
    try {
      const res = await adminApi.toggleClinicStatus(clinicId, !currentStatus);
      if (res?.success) {
        setToastMsg(`Clinic status updated successfully.`);
        setTimeout(() => setToastMsg(''), 4000);
        await loadData();
      }
    } catch (err) {
      alert('Failed to update clinic status: ' + err.message);
    }
  };

  const handleOnboardSubmit = async (e) => {
    e.preventDefault();
    if (!onboardForm.name || !onboardForm.code || !onboardForm.phone) {
      alert('Name, Code, and Phone are required.');
      return;
    }

    try {
      const res = await adminApi.onboardClinic(onboardForm);
      if (res?.success) {
        setShowOnboardModal(false);
        setOnboardForm({
          name: '',
          code: '',
          phone: '',
          email: '',
          city: 'Indore',
          state: 'Madhya Pradesh',
          plan: 'PRO',
          ownerEmail: '',
          ownerName: '',
        });
        setToastMsg(`Clinic '${res.clinic?.name}' onboarded successfully!`);
        setTimeout(() => setToastMsg(''), 4000);
        await loadData();
      }
    } catch (err) {
      alert('Failed to onboard clinic: ' + err.message);
    }
  };

  const filteredClinics = clinics.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.name?.toLowerCase().includes(q) ||
      c.code?.toLowerCase().includes(q) ||
      c.city?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2.5 bg-white border border-[#D9E6E2] border-l-4 border-l-[#2E7D5B] rounded-xl px-4 py-3 shadow-clinixpulse-lg">
          <CheckCircle2 size={16} className="text-[#2E7D5B] shrink-0" />
          <span className="text-xs font-semibold text-[#10201F]">{toastMsg}</span>
          <button
            type="button"
            onClick={() => setToastMsg('')}
            className="text-[#7D908C] hover:text-[#10201F] p-0.5 ml-2"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <section className="rounded-3xl border border-[#D9E6E2] bg-gradient-to-br from-white via-[#F7FAF8] to-[#E9F3F0] p-6 shadow-clinixpulse-xs sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#287C75]/25 bg-[#287C75]/10 px-3 py-1 text-xs font-semibold text-[#287C75]">
                <ShieldCheck size={13} />
                Platform Owner Control Plane
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Multitenancy Active
              </span>
            </div>
            <h1 className="mt-3 font-heading text-2xl font-bold tracking-tight text-[#10201F] sm:text-3xl">
              ClinixPulse™ Platform Administration
            </h1>
            <p className="mt-1.5 text-sm text-[#4E6460]">
              Oversee multi-tenant practices, monitor platform volume, and provision new medical centres.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowOnboardModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#123A3A] px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#287C75] transition shrink-0"
          >
            <Plus size={16} />
            <span>Onboard New Clinic</span>
          </button>
        </div>
      </section>

      {/* KPI Cards */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#D9E6E2] shadow-clinixpulse-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#4E6460]">Total Clinics</span>
            <span className="p-2 rounded-xl bg-teal-50 text-[#287C75]">
              <Building2 size={16} />
            </span>
          </div>
          <p className="font-heading text-3xl font-bold text-[#10201F] mt-3">
            {metrics.totalClinics || clinics.length}
          </p>
          <span className="text-[11px] font-medium text-[#2E7D5B] mt-1 inline-block">
            {metrics.activeClinics || clinics.filter((c) => c.isActive).length} active practices
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#D9E6E2] shadow-clinixpulse-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#4E6460]">Platform Patients</span>
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Users size={16} />
            </span>
          </div>
          <p className="font-heading text-3xl font-bold text-[#10201F] mt-3">
            {metrics.totalPatients || clinics.reduce((acc, c) => acc + (c.patientsCount || 0), 0)}
          </p>
          <span className="text-[11px] font-medium text-[#4E6460] mt-1 inline-block">
            Across all tenant clinics
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#D9E6E2] shadow-clinixpulse-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#4E6460]">Prescriptions Generated</span>
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <FileText size={16} />
            </span>
          </div>
          <p className="font-heading text-3xl font-bold text-[#10201F] mt-3">
            {metrics.totalPrescriptions || clinics.reduce((acc, c) => acc + (c.prescriptionsCount || 0), 0)}
          </p>
          <span className="text-[11px] font-medium text-[#4E6460] mt-1 inline-block">
            Digitally authenticated
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#D9E6E2] shadow-clinixpulse-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#4E6460]">System Health</span>
            <span className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Activity size={16} />
            </span>
          </div>
          <p className="font-heading text-3xl font-bold text-[#10201F] mt-3">99.98%</p>
          <span className="text-[11px] font-medium text-[#2E7D5B] mt-1 inline-block">
            PostgreSQL Pooler Online
          </span>
        </div>
      </section>

      {/* Clinics Table Section */}
      <section className="bg-white rounded-3xl border border-[#D9E6E2] shadow-clinixpulse-xs overflow-hidden">
        <div className="p-5 border-b border-[#D9E6E2] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7D908C]" />
            <input
              type="text"
              placeholder="Search clinic by name, code, or city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-[#D9E6E2] focus:outline-none focus:ring-2 focus:ring-[#287C75]"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                statusFilter === 'all' ? 'bg-[#123A3A] text-white' : 'bg-[#F7FAF8] text-[#4E6460]'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                statusFilter === 'active' ? 'bg-[#123A3A] text-white' : 'bg-[#F7FAF8] text-[#4E6460]'
              }`}
            >
              Active
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('inactive')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                statusFilter === 'inactive' ? 'bg-[#123A3A] text-white' : 'bg-[#F7FAF8] text-[#4E6460]'
              }`}
            >
              Suspended
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#D9E6E2] bg-[#F7FAF8] text-[11px] font-bold text-[#4E6460] uppercase tracking-wider">
                <th className="py-3.5 px-5">Clinic Details</th>
                <th className="py-3.5 px-4">Code / Slug</th>
                <th className="py-3.5 px-4">Location</th>
                <th className="py-3.5 px-4">Plan / Tier</th>
                <th className="py-3.5 px-4 text-center">Patients</th>
                <th className="py-3.5 px-4 text-center">Doctors</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D9E6E2] text-xs">
              {filteredClinics.map((clinic) => (
                <tr key={clinic.id} className="hover:bg-[#F7FAF8]/70 transition">
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center font-bold text-[#287C75] text-xs">
                        {clinic.code || 'CL'}
                      </div>
                      <div>
                        <p className="font-semibold text-[#10201F] text-sm">{clinic.name}</p>
                        <p className="text-[11px] text-[#7D908C]">{clinic.phone} • {clinic.email || 'No email'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 font-mono text-[11px] text-[#4E6460]">
                    <span className="px-2 py-0.5 rounded bg-slate-100 font-semibold">{clinic.code}</span>
                  </td>
                  <td className="py-4 px-4 text-[#4E6460]">
                    {clinic.city || 'India'}
                  </td>
                  <td className="py-4 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {clinic.plan || 'PRO'}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center font-semibold text-[#10201F]">
                    {clinic.patientsCount || 0}
                  </td>
                  <td className="py-4 px-4 text-center font-semibold text-[#10201F]">
                    {clinic.doctorsCount || 1}
                  </td>
                  <td className="py-4 px-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                        clinic.isActive
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          clinic.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                        }`}
                      />
                      {clinic.isActive ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td className="py-4 px-5 text-right">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(clinic.id, clinic.isActive)}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                        clinic.isActive
                          ? 'text-rose-700 hover:bg-rose-50 border border-rose-200'
                          : 'text-emerald-700 hover:bg-emerald-50 border border-emerald-200'
                      }`}
                    >
                      <Power size={13} />
                      <span>{clinic.isActive ? 'Suspend' : 'Activate'}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Onboard New Clinic Modal */}
      {showOnboardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl border border-[#D9E6E2] shadow-clinixpulse-2xl w-full max-w-lg p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-[#D9E6E2]">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-teal-50 text-[#287C75]">
                  <Building2 size={18} />
                </span>
                <h3 className="font-heading font-bold text-lg text-[#10201F]">Onboard Tenant Clinic</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowOnboardModal(false)}
                className="text-[#7D908C] hover:text-[#10201F] p-1"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleOnboardSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#10201F] mb-1">Clinic Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Metro Digestive & Liver Institute"
                  value={onboardForm.name}
                  onChange={(e) => setOnboardForm({ ...onboardForm, name: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#D9E6E2] focus:outline-none focus:ring-2 focus:ring-[#287C75]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#10201F] mb-1">Code (Short ID) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. METRO"
                    value={onboardForm.code}
                    onChange={(e) => setOnboardForm({ ...onboardForm, code: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2 text-xs font-mono uppercase rounded-xl border border-[#D9E6E2] focus:outline-none focus:ring-2 focus:ring-[#287C75]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#10201F] mb-1">Contact Phone *</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +91 98260 11223"
                    value={onboardForm.phone}
                    onChange={(e) => setOnboardForm({ ...onboardForm, phone: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#D9E6E2] focus:outline-none focus:ring-2 focus:ring-[#287C75]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#10201F] mb-1">City</label>
                  <input
                    type="text"
                    value={onboardForm.city}
                    onChange={(e) => setOnboardForm({ ...onboardForm, city: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#D9E6E2] focus:outline-none focus:ring-2 focus:ring-[#287C75]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#10201F] mb-1">Plan Tier</label>
                  <select
                    value={onboardForm.plan}
                    onChange={(e) => setOnboardForm({ ...onboardForm, plan: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#D9E6E2] focus:outline-none focus:ring-2 focus:ring-[#287C75]"
                  >
                    <option value="PRO">PRO Tier (₹1,999/mo)</option>
                    <option value="ENTERPRISE">ENTERPRISE Tier (₹4,999/mo)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#10201F] mb-1">Owner / Lead Doctor Email</label>
                <input
                  type="email"
                  placeholder="doctor@newclinic.in"
                  value={onboardForm.ownerEmail}
                  onChange={(e) => setOnboardForm({ ...onboardForm, ownerEmail: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#D9E6E2] focus:outline-none focus:ring-2 focus:ring-[#287C75]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#D9E6E2]">
                <button
                  type="button"
                  onClick={() => setShowOnboardModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#4E6460] hover:text-[#10201F]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary px-4 py-2 text-xs font-bold rounded-xl shadow-sm"
                >
                  Provision & Launch Clinic
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
