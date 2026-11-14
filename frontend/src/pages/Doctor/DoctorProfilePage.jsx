import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  User,
  Building2,
  Stethoscope,
  Award,
  Phone,
  Mail,
  Clock,
  MapPin,
  FileText,
  Printer,
  CheckCircle2,
  Sliders,
  ShieldCheck,
  Save,
  RotateCcw,
  PenTool,
  Upload,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { localSettings, localPatients, localVisits } from '../../services/localStore';
import { applyPrintSettings, DEFAULT_PRINT_SETTINGS, sanitizePrintSettings } from '../../utils/printStyles';

export default function DoctorProfilePage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState(() => localSettings.get());
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('credentials'); // 'credentials' | 'clinic' | 'letterhead'

  const patientsCount = (localPatients.getAll() || []).length;
  const visitsCount = (localVisits.getAll() || []).length;

  const role = user?.role || 'DOCTOR';
  const roleLabel = role.replace(/_/g, ' ');

  const handleFieldChange = (field, value) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
    setSavedSuccess(false);
  };

  const handlePrintChange = (field, value) => {
    setSettings((prev) => {
      const currentPrint = prev.print || {};
      const updatedPrint = {
        ...currentPrint,
        [field]: value,
        ...(field === 'bottomOffsetMm' ? { bottomMarginMm: value } : {}),
        ...(field === 'bottomMarginMm' ? { bottomOffsetMm: value } : {}),
      };
      applyPrintSettings(updatedPrint);
      return {
        ...prev,
        print: updatedPrint,
      };
    });
    setSavedSuccess(false);
  };

  const handleSignatureUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      handleFieldChange('signatureUrl', dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveSignature = () => {
    handleFieldChange('signatureUrl', '');
  };

  const handleSave = (e) => {
    if (e) e.preventDefault();
    const sanitizedPrint = sanitizePrintSettings(settings.print);
    const updated = localSettings.update({
      clinicName: settings.clinicName,
      doctorName: settings.doctorName,
      qualification: settings.qualification,
      regNumber: settings.regNumber,
      phone: settings.phone,
      address: settings.address,
      timing: settings.timing,
      specialization: settings.specialization || 'Gastroenterologist & Hepatologist',
      signatureUrl: settings.signatureUrl || '',
      print: sanitizedPrint,
    });

    applyPrintSettings(sanitizedPrint);
    setSettings(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3500);
  };

  const doctorInitials = (settings.doctorName || 'Dr. Doctor')
    .replace(/^dr\.?\s+/i, '')
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'DR';

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Top Banner Card */}
      <div className="rounded-3xl border border-[#D9E6E2] bg-white p-6 shadow-nivara-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-[#123A3A] text-2xl font-heading font-bold text-white shadow-md ring-4 ring-teal-50">
              {doctorInitials}
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-heading text-2xl font-bold text-[#10201F]">
                  {settings.doctorName || 'Dr. Snehal Makwana'}
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-semibold text-[#287C75] border border-teal-200">
                  <ShieldCheck size={13} />
                  {roleLabel}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 border border-emerald-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active Clinical Profile
                </span>
              </div>
              <p className="text-sm text-[#4E6460] font-medium">
                {settings.qualification || 'MBBS, MD (Medicine), DM (Gastroenterology)'}
              </p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#7D908C]">
                <span className="flex items-center gap-1">
                  <Award size={13} className="text-[#287C75]" />
                  Reg. No: <strong className="text-[#10201F] font-mono">{settings.regNumber || 'MMC 2012/05/1234'}</strong>
                </span>
                <span className="flex items-center gap-1">
                  <Building2 size={13} className="text-[#287C75]" />
                  {settings.clinicName || 'Gastro Cure Clinic'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3 border-t sm:border-t-0 sm:border-l border-[#D9E6E2] pt-4 sm:pt-0 sm:pl-6 shrink-0">
            <div className="text-center px-3">
              <p className="text-xl font-heading font-bold text-[#10201F]">{patientsCount}</p>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#7D908C]">Patients</p>
            </div>
            <div className="h-8 w-[1px] bg-[#D9E6E2]" />
            <div className="text-center px-3">
              <p className="text-xl font-heading font-bold text-[#10201F]">{visitsCount}</p>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#7D908C]">Prescriptions</p>
            </div>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="mt-6 flex border-b border-[#D9E6E2] gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('credentials')}
            className={`pb-3 pt-2 px-4 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-all rounded-t-xl cursor-pointer ${
              activeTab === 'credentials'
                ? 'border-[#287C75] text-[#123A3A] bg-teal-50/40'
                : 'border-transparent text-[#7D908C] hover:text-[#10201F] hover:bg-slate-50'
            }`}
          >
            <User size={15} className={activeTab === 'credentials' ? 'text-[#287C75]' : ''} />
            Doctor Credentials
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('clinic')}
            className={`pb-3 pt-2 px-4 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-all rounded-t-xl cursor-pointer ${
              activeTab === 'clinic'
                ? 'border-[#287C75] text-[#123A3A] bg-teal-50/40'
                : 'border-transparent text-[#7D908C] hover:text-[#10201F] hover:bg-slate-50'
            }`}
          >
            <Building2 size={15} className={activeTab === 'clinic' ? 'text-[#287C75]' : ''} />
            Clinic Demographics
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('letterhead')}
            className={`pb-3 pt-2 px-4 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-all rounded-t-xl cursor-pointer ${
              activeTab === 'letterhead'
                ? 'border-[#287C75] text-[#123A3A] bg-teal-50/40'
                : 'border-transparent text-[#7D908C] hover:text-[#10201F] hover:bg-slate-50'
            }`}
          >
            <Printer size={15} className={activeTab === 'letterhead' ? 'text-[#287C75]' : ''} />
            Letterhead & Print Calibration
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {savedSuccess && (
        <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4 flex items-center gap-3 text-emerald-900 shadow-sm animate-in fade-in duration-200">
          <CheckCircle2 size={18} className="text-emerald-700 shrink-0" />
          <div>
            <p className="text-sm font-bold text-emerald-950">Profile Changes Saved Successfully!</p>
            <p className="text-xs text-emerald-800">
              Doctor credentials, clinic demographics, and print margins have been updated across Nivara.
            </p>
          </div>
        </div>
      )}

      {/* Main Profile Form Card */}
      <form onSubmit={handleSave} className="rounded-3xl border border-[#D9E6E2] bg-white p-6 shadow-nivara-xs space-y-6">
        {activeTab === 'credentials' && (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-heading font-bold text-[#10201F]">Doctor Professional Identity</h2>
              <p className="text-xs text-[#4E6460]">
                These details are printed on all patient prescriptions, referral summaries, and follow-up templates.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-[#10201F] mb-1.5">
                  Full Doctor Name (with Title)
                </label>
                <input
                  type="text"
                  value={settings.doctorName || ''}
                  onChange={(e) => handleFieldChange('doctorName', e.target.value)}
                  placeholder="e.g. Dr. Snehal Makwana"
                  className="w-full rounded-xl border border-[#D9E6E2] bg-[#F7FAF8] px-3.5 py-2 text-sm text-[#10201F] focus:border-[#287C75] focus:bg-white focus:outline-none transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#10201F] mb-1.5">
                  Medical Council Registration No.
                </label>
                <input
                  type="text"
                  value={settings.regNumber || ''}
                  onChange={(e) => handleFieldChange('regNumber', e.target.value)}
                  placeholder="e.g. MMC 2012/05/1234"
                  className="w-full rounded-xl border border-[#D9E6E2] bg-[#F7FAF8] px-3.5 py-2 text-sm font-mono text-[#10201F] focus:border-[#287C75] focus:bg-white focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#10201F] mb-1.5">
                  Medical Qualifications & Degrees
                </label>
                <input
                  type="text"
                  value={settings.qualification || ''}
                  onChange={(e) => handleFieldChange('qualification', e.target.value)}
                  placeholder="e.g. MBBS, MD (Medicine), DM (Gastroenterology)"
                  className="w-full rounded-xl border border-[#D9E6E2] bg-[#F7FAF8] px-3.5 py-2 text-sm text-[#10201F] focus:border-[#287C75] focus:bg-white focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#10201F] mb-1.5">
                  Clinical Specialization
                </label>
                <input
                  type="text"
                  value={settings.specialization || 'Gastroenterologist & Hepatologist'}
                  onChange={(e) => handleFieldChange('specialization', e.target.value)}
                  placeholder="e.g. Consultant Gastroenterologist & Hepatologist"
                  className="w-full rounded-xl border border-[#D9E6E2] bg-[#F7FAF8] px-3.5 py-2 text-sm text-[#10201F] focus:border-[#287C75] focus:bg-white focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#10201F] mb-1.5">
                  Doctor Direct Contact / Mobile
                </label>
                <input
                  type="text"
                  value={settings.phone || ''}
                  onChange={(e) => handleFieldChange('phone', e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full rounded-xl border border-[#D9E6E2] bg-[#F7FAF8] px-3.5 py-2 text-sm font-mono text-[#10201F] focus:border-[#287C75] focus:bg-white focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#10201F] mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={user?.email || 'doctor@gastrocure.com'}
                  disabled
                  className="w-full rounded-xl border border-[#D9E6E2] bg-slate-100/80 px-3.5 py-2 text-sm text-[#7D908C] cursor-not-allowed"
                />
              </div>
            </div>

            {/* Doctor Digital Signature Section */}
            <div className="mt-6 pt-6 border-t border-[#D9E6E2]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-heading font-bold text-[#10201F] flex items-center gap-2">
                    <PenTool size={16} className="text-[#287C75]" />
                    Doctor Digital Signature
                  </h3>
                  <p className="text-xs text-[#4E6460] mt-0.5">
                    Upload your digital signature to sign printed prescriptions and WhatsApp prescription summaries automatically.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <label
                    htmlFor="profile-signature-upload"
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[#287C75] bg-teal-50 text-[#287C75] text-xs font-semibold hover:bg-[#287C75] hover:text-white transition cursor-pointer"
                  >
                    <Upload size={14} />
                    <span>Upload Signature Image</span>
                  </label>
                  <input
                    id="profile-signature-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleSignatureUpload}
                    className="hidden"
                  />
                  {settings.signatureUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveSignature}
                      className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline inline-flex items-center gap-1"
                    >
                      <Trash2 size={13} />
                      <span>Remove</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Signature Preview Area */}
              <div className="mt-4 p-5 rounded-2xl border border-dashed border-[#CFE2DC] bg-[#FAFDFB] flex flex-col items-center justify-center min-h-[110px]">
                {settings.signatureUrl ? (
                  <div className="text-center space-y-2">
                    <div className="bg-white p-3 rounded-xl border border-[#D9E6E2] inline-block shadow-xs">
                      <img
                        src={settings.signatureUrl}
                        alt="Doctor Digital Signature Preview"
                        className="h-14 max-w-[240px] object-contain mx-auto"
                      />
                    </div>
                    <p className="text-[11px] font-mono font-medium text-[#287C75]">
                      ✓ Active Doctor Signature for Prescriptions
                    </p>
                  </div>
                ) : (
                  <div className="text-center text-[#7D908C] space-y-1.5 py-2">
                    <PenTool size={22} className="mx-auto text-[#7D908C]/60" />
                    <p className="text-xs font-semibold text-[#10201F]">No digital signature uploaded yet</p>
                    <p className="text-[11px] text-[#7D908C]">
                      Click 'Upload Signature Image' above to attach your official signature (PNG, JPG, SVG)
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'clinic' && (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-heading font-bold text-[#10201F]">Clinic Center Demographics</h2>
              <p className="text-xs text-[#4E6460]">
                Clinic location, contact details, and OPD consultation hours.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-[#10201F] mb-1.5">
                  Clinic / Hospital Name
                </label>
                <input
                  type="text"
                  value={settings.clinicName || ''}
                  onChange={(e) => handleFieldChange('clinicName', e.target.value)}
                  placeholder="e.g. Gastro Cure Clinic"
                  className="w-full rounded-xl border border-[#D9E6E2] bg-[#F7FAF8] px-3.5 py-2 text-sm text-[#10201F] focus:border-[#287C75] focus:bg-white focus:outline-none transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#10201F] mb-1.5">
                  OPD Consultation Timings
                </label>
                <input
                  type="text"
                  value={settings.timing || ''}
                  onChange={(e) => handleFieldChange('timing', e.target.value)}
                  placeholder="e.g. Mon-Sat: 10:00 AM - 02:00 PM, 05:00 PM - 09:00 PM"
                  className="w-full rounded-xl border border-[#D9E6E2] bg-[#F7FAF8] px-3.5 py-2 text-sm text-[#10201F] focus:border-[#287C75] focus:bg-white focus:outline-none transition"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#10201F] mb-1.5">
                  Clinic Physical Address
                </label>
                <textarea
                  value={settings.address || ''}
                  onChange={(e) => handleFieldChange('address', e.target.value)}
                  placeholder="e.g. Shop No. 4, Ground Floor, Gastro Cure Medical Centre, Unchehra, MP - 485661"
                  rows={2}
                  className="w-full rounded-xl border border-[#D9E6E2] bg-[#F7FAF8] px-3.5 py-2 text-sm text-[#10201F] focus:border-[#287C75] focus:bg-white focus:outline-none transition resize-none"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'letterhead' && (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-heading font-bold text-[#10201F]">Prescription & Print Calibration</h2>
              <p className="text-xs text-[#4E6460]">
                Configure physical stationery pad mode, top margin offset, and paper size.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-[#D9E6E2] bg-[#F7FAF8] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-[#10201F]">Pre-Printed Pad Mode</p>
                    <p className="text-[11px] text-[#4E6460]">
                      Leave blank top margin for physical clinic letterhead paper.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={Boolean(settings.print?.padMode)}
                    onChange={(e) => handlePrintChange('padMode', e.target.checked)}
                    className="h-4 w-4 rounded text-[#287C75] focus:ring-[#287C75]"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-[#D9E6E2] bg-[#F7FAF8] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-[#10201F]">Digital Header on Plain Paper</p>
                    <p className="text-[11px] text-[#4E6460]">
                      Print clinic logo and doctor credentials on blank A4 sheets.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={Boolean(settings.print?.digitalHeader)}
                    onChange={(e) => handlePrintChange('digitalHeader', e.target.checked)}
                    className="h-4 w-4 rounded text-[#287C75] focus:ring-[#287C75]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#10201F] mb-1.5">
                  Top Offset Margin (mm)
                </label>
                <input
                  type="number"
                  min="0"
                  max="120"
                  value={settings.print?.topOffsetMm ?? 60}
                  onChange={(e) => handlePrintChange('topOffsetMm', Number(e.target.value))}
                  className="w-full rounded-xl border border-[#D9E6E2] bg-[#F7FAF8] px-3.5 py-2 text-sm font-mono text-[#10201F] focus:border-[#287C75] focus:bg-white focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#10201F] mb-1.5">
                  Paper Format
                </label>
                <select
                  value={settings.print?.paperSize || 'A4'}
                  onChange={(e) => handlePrintChange('paperSize', e.target.value)}
                  className="w-full rounded-xl border border-[#D9E6E2] bg-[#F7FAF8] px-3.5 py-2 text-sm text-[#10201F] focus:border-[#287C75] focus:bg-white focus:outline-none transition"
                >
                  <option value="A4">A4 (Standard 210 x 297 mm)</option>
                  <option value="A5">A5 (Compact 148 x 210 mm)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-[#D9E6E2] pt-4">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#D9E6E2] bg-white px-4 py-2 text-xs font-semibold text-[#4E6460] hover:bg-[#F7FAF8] hover:text-[#10201F] transition"
          >
            ← Back to Dashboard
          </Link>

          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-xl bg-[#287C75] px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#20635e] transition active:scale-95 cursor-pointer"
          >
            <Save size={14} />
            Save Profile Changes
          </button>
        </div>
      </form>
    </div>
  );
}
