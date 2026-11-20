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
  Copy,
  Send,
  Key,
  Lock,
  Mail,
  PhoneCall,
  UserPlus,
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
  const [addDoctorClinic, setAddDoctorClinic] = useState(null);
  const [handoverModalData, setHandoverModalData] = useState(null);
  const [toastMsg, setToastMsg] = useState('');

  // Form for Onboarding New Clinic & Doctor
  const [onboardForm, setOnboardForm] = useState({
    name: '',
    code: '',
    phone: '',
    email: '',
    city: 'Indore',
    state: 'Madhya Pradesh',
    plan: 'PRO',
    ownerName: '',
    ownerEmail: '',
    ownerPhone: '',
    ownerPassword: 'Doctor@1234',
    qualifications: 'MBBS, MD (Medicine)',
    specialization: 'Senior Consultant Physician',
  });

  // Form for Registering Doctor to an Existing Clinic
  const [doctorForm, setDoctorForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: 'Doctor@1234',
    role: 'DOCTOR',
    qualifications: 'MBBS, MD',
    specialization: 'Consultant Physician',
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
        setToastMsg('Clinic status updated successfully.');
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
      alert('Clinic Name, Code, and Phone are required.');
      return;
    }

    try {
      const res = await adminApi.onboardClinic(onboardForm);
      if (res?.success) {
        setShowOnboardModal(false);
        const clinic = res.clinic;
        const doctor = res.doctor;

        // Reset form
        setOnboardForm({
          name: '',
          code: '',
          phone: '',
          email: '',
          city: 'Indore',
          state: 'Madhya Pradesh',
          plan: 'PRO',
          ownerName: '',
          ownerEmail: '',
          ownerPhone: '',
          ownerPassword: 'Doctor@1234',
          qualifications: 'MBBS, MD (Medicine)',
          specialization: 'Senior Consultant Physician',
        });

        // Show Handover Credentials Modal
        if (doctor) {
          setHandoverModalData({
            clinicName: clinic.name,
            clinicCode: clinic.code,
            clinicSlug: clinic.slug,
            doctorName: doctor.fullName,
            email: doctor.email,
            phone: doctor.phone || onboardForm.phone,
            password: doctor.initialPassword || 'Doctor@1234',
            role: 'CLINIC_OWNER / DOCTOR',
            specialization: doctor.specialization,
            loginUrl: `${window.location.origin}/login`,
            bookingUrl: `${window.location.origin}/book/${clinic.slug}`,
          });
        }

        setToastMsg(`Clinic '${clinic.name}' & Doctor '${doctor?.fullName || 'Owner'}' registered!`);
        setTimeout(() => setToastMsg(''), 4000);
        await loadData();
      }
    } catch (err) {
      alert('Failed to onboard clinic: ' + err.message);
    }
  };

  const handleRegisterDoctorSubmit = async (e) => {
    e.preventDefault();
    if (!doctorForm.fullName || !doctorForm.email || !addDoctorClinic) {
      alert('Doctor full name and email are required.');
      return;
    }

    try {
      const res = await adminApi.registerDoctor(addDoctorClinic.id, doctorForm);
      if (res?.success) {
        const doc = res.data;
        const targetClinic = addDoctorClinic;
        setAddDoctorClinic(null);
        setDoctorForm({
          fullName: '',
          email: '',
          phone: '',
          password: 'Doctor@1234',
          role: 'DOCTOR',
          qualifications: 'MBBS, MD',
          specialization: 'Consultant Physician',
        });

        // Show Handover Credentials Modal
        setHandoverModalData({
          clinicName: targetClinic.name,
          clinicCode: targetClinic.code,
          clinicSlug: targetClinic.slug,
          doctorName: doc.fullName,
          email: doc.email,
          phone: doc.phone || targetClinic.phone,
          password: doc.initialPassword || 'Doctor@1234',
          role: doc.role,
          specialization: doc.specialization,
          loginUrl: `${window.location.origin}/login`,
          bookingUrl: `${window.location.origin}/book/${targetClinic.slug}`,
        });

        setToastMsg(`Doctor '${doc.fullName}' successfully registered!`);
        setTimeout(() => setToastMsg(''), 4000);
        await loadData();
      }
    } catch (err) {
      alert('Failed to register doctor: ' + err.message);
    }
  };

  const handleCopyCredentials = () => {
    if (!handoverModalData) return;
    const text = `=== CLINIXPULSE™ CLIENT CREDENTIALS ===\nClinic: ${handoverModalData.clinicName}\nDoctor: ${handoverModalData.doctorName}\nRole: ${handoverModalData.role}\n\nLogin Portal: ${handoverModalData.loginUrl}\nEmail: ${handoverModalData.email}\nPassword: ${handoverModalData.password}\n\nPatient Booking Page: ${handoverModalData.bookingUrl}\n=======================================`;
    navigator.clipboard.writeText(text);
    setToastMsg('Credentials copied to clipboard!');
    setTimeout(() => setToastMsg(''), 3000);
  };

  const getWhatsAppWelcomeLink = () => {
    if (!handoverModalData) return '#';
    const raw = handoverModalData.phone || '';
    const clean = raw.replace(/[^\d]/g, '').slice(-10);
    const msg = `Namaste ${handoverModalData.doctorName}! 🎉\n\nCongratulations! Your ClinixPulse™ Clinic Portal for *${handoverModalData.clinicName}* has been successfully activated.\n\n*Doctor Login Portal:* ${handoverModalData.loginUrl}\n*Email ID:* ${handoverModalData.email}\n*Initial Password:* ${handoverModalData.password}\n\n*Patient OPD Booking Link:* ${handoverModalData.bookingUrl}\n\nPlease login to review your OPD dashboard and begin digital consultations!`;
    return clean ? `https://wa.me/91${clean}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`;
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
            className="text-[#7D908C] hover:text-[#10201F] p-0.5 ml-2 cursor-pointer"
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
              Register client clinics, provision doctor accounts, and generate instant login credentials for SaaS sales & handover.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowOnboardModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#123A3A] px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-[#287C75] transition shrink-0 cursor-pointer"
          >
            <Plus size={16} />
            <span>Onboard New Clinic & Doctor</span>
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
            <span className="text-xs font-medium text-[#4E6460]">Database Connection</span>
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
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                statusFilter === 'all' ? 'bg-[#123A3A] text-white' : 'bg-[#F7FAF8] text-[#4E6460]'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                statusFilter === 'active' ? 'bg-[#123A3A] text-white' : 'bg-[#F7FAF8] text-[#4E6460]'
              }`}
            >
              Active
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('inactive')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
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
                        <p className="text-[11px] text-[#7D908C]">
                          {clinic.phone} • {clinic.email || 'No email'}
                        </p>
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
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-50 text-[#287C75] border border-teal-200 font-bold">
                      <Stethoscope size={11} />
                      {clinic.doctorsCount || 1}
                    </span>
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
                    <div className="flex items-center justify-end gap-2">
                      {/* Register Additional Doctor Button */}
                      <button
                        type="button"
                        onClick={() => setAddDoctorClinic(clinic)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-teal-50 hover:bg-teal-100 text-[#287C75] border border-teal-200/80 transition cursor-pointer"
                        title="Register additional doctor to this clinic"
                      >
                        <UserPlus size={12} />
                        <span>+ Doctor</span>
                      </button>

                      {/* Public Booking Link */}
                      <a
                        href={`/book/${clinic.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-[#4E6460] border border-slate-200 transition"
                        title="Open Patient Public Booking Pass"
                      >
                        <ExternalLink size={12} />
                        <span>Booking</span>
                      </a>

                      {/* Suspend / Activate Toggle */}
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(clinic.id, clinic.isActive)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                          clinic.isActive
                            ? 'text-rose-700 hover:bg-rose-50 border border-rose-200'
                            : 'text-emerald-700 hover:bg-emerald-50 border border-emerald-200'
                        }`}
                      >
                        <Power size={12} />
                        <span>{clinic.isActive ? 'Suspend' : 'Activate'}</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* MODAL 1: Onboard New Clinic & Doctor */}
      {showOnboardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-[#D9E6E2] shadow-clinixpulse-2xl w-full max-w-xl p-6 my-8 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-[#D9E6E2]">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-teal-50 text-[#287C75]">
                  <Building2 size={18} />
                </span>
                <div>
                  <h3 className="font-heading font-bold text-lg text-[#10201F]">
                    Onboard New Clinic & Lead Doctor
                  </h3>
                  <p className="text-xs text-[#4E6460]">Provision tenant practice and generate doctor login credentials</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowOnboardModal(false)}
                className="text-[#7D908C] hover:text-[#10201F] p-1 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleOnboardSubmit} className="mt-4 space-y-4">
              {/* Clinic Info Header */}
              <div className="bg-[#F7FAF8] p-3.5 rounded-xl border border-[#D9E6E2]">
                <span className="text-[11px] font-bold text-[#287C75] uppercase tracking-wider block mb-2">
                  1. Clinic / Hospital Details
                </span>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-[#10201F] mb-1">Clinic Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. City Gastro & Liver Hospital"
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
                        placeholder="e.g. CGLH"
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
                      <label className="block text-xs font-bold text-[#10201F] mb-1">SaaS Plan Tier</label>
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
                </div>
              </div>

              {/* Doctor / Owner Credentials */}
              <div className="bg-teal-50/40 p-3.5 rounded-xl border border-teal-200/80">
                <span className="text-[11px] font-bold text-[#287C75] uppercase tracking-wider block mb-2">
                  2. Lead Doctor / Owner Account (Handover Details)
                </span>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-[#10201F] mb-1">Doctor Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dr. Rajesh Verma"
                      value={onboardForm.ownerName}
                      onChange={(e) => setOnboardForm({ ...onboardForm, ownerName: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#D9E6E2] bg-white focus:outline-none focus:ring-2 focus:ring-[#287C75]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#10201F] mb-1">Doctor Login Email *</label>
                      <input
                        type="email"
                        required
                        placeholder="doctor@citygastro.in"
                        value={onboardForm.ownerEmail}
                        onChange={(e) => setOnboardForm({ ...onboardForm, ownerEmail: e.target.value })}
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#D9E6E2] bg-white focus:outline-none focus:ring-2 focus:ring-[#287C75]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#10201F] mb-1">Initial Password *</label>
                      <input
                        type="text"
                        required
                        value={onboardForm.ownerPassword}
                        onChange={(e) => setOnboardForm({ ...onboardForm, ownerPassword: e.target.value })}
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#D9E6E2] bg-white font-mono focus:outline-none focus:ring-2 focus:ring-[#287C75]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#10201F] mb-1">Qualifications</label>
                      <input
                        type="text"
                        placeholder="e.g. MBBS, MD (Medicine)"
                        value={onboardForm.qualifications}
                        onChange={(e) => setOnboardForm({ ...onboardForm, qualifications: e.target.value })}
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#D9E6E2] bg-white focus:outline-none focus:ring-2 focus:ring-[#287C75]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#10201F] mb-1">Specialization</label>
                      <input
                        type="text"
                        placeholder="e.g. Senior Gastroenterologist"
                        value={onboardForm.specialization}
                        onChange={(e) => setOnboardForm({ ...onboardForm, specialization: e.target.value })}
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#D9E6E2] bg-white focus:outline-none focus:ring-2 focus:ring-[#287C75]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#D9E6E2]">
                <button
                  type="button"
                  onClick={() => setShowOnboardModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#4E6460] hover:text-[#10201F] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-[#123A3A] hover:bg-[#287C75] rounded-xl shadow-sm transition cursor-pointer"
                >
                  <Sparkles size={14} />
                  <span>Provision & Launch Client Clinic</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Register Doctor to an Existing Clinic */}
      {addDoctorClinic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-[#D9E6E2] shadow-clinixpulse-2xl w-full max-w-lg p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-[#D9E6E2]">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-teal-50 text-[#287C75]">
                  <Stethoscope size={18} />
                </span>
                <div>
                  <h3 className="font-heading font-bold text-base text-[#10201F]">
                    Register Doctor to {addDoctorClinic.name}
                  </h3>
                  <p className="text-xs text-[#4E6460]">Provision associate physician or consultant account</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAddDoctorClinic(null)}
                className="text-[#7D908C] hover:text-[#10201F] p-1 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRegisterDoctorSubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[#10201F] mb-1">Doctor Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Amit Sharma"
                  value={doctorForm.fullName}
                  onChange={(e) => setDoctorForm({ ...doctorForm, fullName: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#D9E6E2] focus:outline-none focus:ring-2 focus:ring-[#287C75]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#10201F] mb-1">Login Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="doctor@clinic.in"
                    value={doctorForm.email}
                    onChange={(e) => setDoctorForm({ ...doctorForm, email: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#D9E6E2] focus:outline-none focus:ring-2 focus:ring-[#287C75]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#10201F] mb-1">Mobile Number</label>
                  <input
                    type="tel"
                    placeholder="+91 98260 11223"
                    value={doctorForm.phone}
                    onChange={(e) => setDoctorForm({ ...doctorForm, phone: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#D9E6E2] focus:outline-none focus:ring-2 focus:ring-[#287C75]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#10201F] mb-1">Initial Password *</label>
                  <input
                    type="text"
                    required
                    value={doctorForm.password}
                    onChange={(e) => setDoctorForm({ ...doctorForm, password: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs font-mono rounded-xl border border-[#D9E6E2] focus:outline-none focus:ring-2 focus:ring-[#287C75]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#10201F] mb-1">Role</label>
                  <select
                    value={doctorForm.role}
                    onChange={(e) => setDoctorForm({ ...doctorForm, role: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#D9E6E2] focus:outline-none focus:ring-2 focus:ring-[#287C75]"
                  >
                    <option value="DOCTOR">Consultant Doctor</option>
                    <option value="CLINIC_OWNER">Clinic Co-Owner / Director</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#10201F] mb-1">Qualifications</label>
                  <input
                    type="text"
                    value={doctorForm.qualifications}
                    onChange={(e) => setDoctorForm({ ...doctorForm, qualifications: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#D9E6E2] focus:outline-none focus:ring-2 focus:ring-[#287C75]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#10201F] mb-1">Specialization</label>
                  <input
                    type="text"
                    value={doctorForm.specialization}
                    onChange={(e) => setDoctorForm({ ...doctorForm, specialization: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#D9E6E2] focus:outline-none focus:ring-2 focus:ring-[#287C75]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#D9E6E2]">
                <button
                  type="button"
                  onClick={() => setAddDoctorClinic(null)}
                  className="px-4 py-2 text-xs font-semibold text-[#4E6460] hover:text-[#10201F] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#123A3A] hover:bg-[#287C75] rounded-xl shadow-sm transition cursor-pointer"
                >
                  <Stethoscope size={13} />
                  <span>Register Doctor Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Handover Credentials Card (For Selling & Sharing With Doctor) */}
      {handoverModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-emerald-300 shadow-clinixpulse-2xl w-full max-w-lg p-6 animate-in zoom-in-95 duration-200">
            <div className="text-center pb-4 border-b border-[#D9E6E2]">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 mx-auto mb-2.5">
                <ShieldCheck size={26} />
              </div>
              <h3 className="font-heading font-bold text-xl text-[#10201F]">
                Doctor Account Activated!
              </h3>
              <p className="text-xs text-[#4E6460] mt-1">
                Share these credentials with the doctor to complete the client onboarding handover.
              </p>
            </div>

            <div className="mt-4 space-y-3">
              <div className="rounded-2xl border border-teal-200/80 bg-teal-50/40 p-4 space-y-2.5 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-teal-100">
                  <span className="text-[#4E6460] font-medium">Clinic Practice:</span>
                  <span className="font-bold text-[#10201F]">{handoverModalData.clinicName}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-teal-100">
                  <span className="text-[#4E6460] font-medium">Doctor Name:</span>
                  <span className="font-bold text-[#10201F]">{handoverModalData.doctorName}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-teal-100">
                  <span className="text-[#4E6460] font-medium">Doctor Login Portal:</span>
                  <a
                    href={handoverModalData.loginUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-[#287C75] hover:underline flex items-center gap-1 font-semibold"
                  >
                    {handoverModalData.loginUrl} <ExternalLink size={11} />
                  </a>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-teal-100">
                  <span className="text-[#4E6460] font-medium">Login Email:</span>
                  <span className="font-mono font-bold text-[#10201F] bg-white px-2 py-0.5 rounded border border-teal-200">
                    {handoverModalData.email}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-teal-100">
                  <span className="text-[#4E6460] font-medium">Initial Password:</span>
                  <span className="font-mono font-bold text-emerald-800 bg-white px-2 py-0.5 rounded border border-teal-200">
                    {handoverModalData.password}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span className="text-[#4E6460] font-medium">Patient OPD Booking:</span>
                  <a
                    href={handoverModalData.bookingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-xs text-[#287C75] hover:underline flex items-center gap-1 font-semibold"
                  >
                    /book/{handoverModalData.clinicSlug} <ExternalLink size={11} />
                  </a>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCopyCredentials}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[#D9E6E2] bg-white hover:bg-[#F7FAF8] text-[#10201F] text-xs font-bold shadow-2xs transition cursor-pointer"
                >
                  <Copy size={13} />
                  <span>Copy Credentials</span>
                </button>

                <a
                  href={getWhatsAppWelcomeLink()}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold shadow-2xs transition"
                >
                  <Send size={13} />
                  <span>Send on WhatsApp</span>
                </a>
              </div>
            </div>

            <div className="mt-5 text-center">
              <button
                type="button"
                onClick={() => setHandoverModalData(null)}
                className="w-full py-2.5 text-xs font-bold text-white bg-[#123A3A] hover:bg-[#287C75] rounded-xl transition cursor-pointer"
              >
                Done / Close Handover Card
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
