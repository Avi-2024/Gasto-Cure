import React, { useState } from 'react';
import {
  Printer,
  Sliders,
  Building2,
  FileText,
  CheckCircle,
  RotateCcw,
  Ruler,
  Image as ImageIcon,
  Upload,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { localSettings } from '../../../services/localStore';
import {
  applyPrintSettings,
  DEFAULT_PRINT_SETTINGS,
  sanitizePrintSettings,
} from '../../../utils/printStyles';
import TestPrintSheet from '../components/TestPrintSheet';

export function PrintSettingsTab() {
  const [settings, setSettings] = useState(() => localSettings.get());
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showTestSheet, setShowTestSheet] = useState(false);
  const [logoError, setLogoError] = useState('');

  // Demographics form fields
  const handleClinicChange = (field, value) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
    setSavedSuccess(false);
  };

  // Logo upload handler (reads image file to base64 data URL)
  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setLogoError('Please select a valid image file (PNG, JPG, SVG, WebP).');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setLogoError('Image size exceeds 2MB limit for local browser storage.');
      return;
    }

    setLogoError('');
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result;
      setSettings((prev) => ({
        ...prev,
        clinicLogo: dataUrl,
      }));
      setSavedSuccess(false);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoError('');
    setSettings((prev) => ({
      ...prev,
      clinicLogo: '',
      watermarkEnabled: false,
    }));
    setSavedSuccess(false);
  };

  // Print configuration fields
  const handlePrintChange = (field, value) => {
    setSettings((prev) => {
      const currentPrint = prev.print || {};
      const updatedPrint = {
        ...currentPrint,
        [field]: value,
        ...(field === 'bottomOffsetMm' ? { bottomMarginMm: value } : {}),
        ...(field === 'bottomMarginMm' ? { bottomOffsetMm: value } : {}),
      };
      // Live apply CSS variables to the document
      applyPrintSettings(updatedPrint);
      return {
        ...prev,
        print: updatedPrint,
      };
    });
    setSavedSuccess(false);
  };

  const handleSave = () => {
    const sanitizedPrint = sanitizePrintSettings(settings.print);
    const updated = localSettings.update({
      clinicName: settings.clinicName,
      clinicTagline: settings.clinicTagline,
      clinicLogo: settings.clinicLogo,
      watermarkEnabled: Boolean(settings.watermarkEnabled),
      watermarkOpacity: Number(settings.watermarkOpacity || 0.06),
      doctorName: settings.doctorName,
      qualification: settings.qualification,
      regNumber: settings.regNumber,
      phone: settings.phone,
      email: settings.email,
      address: settings.address,
      timing: settings.timing,
      print: sanitizedPrint,
    });

    applyPrintSettings(sanitizedPrint);
    setSettings(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3500);
  };

  const handleResetDefaults = () => {
    setSettings((prev) => {
      const updatedPrint = {
        ...(prev.print || {}),
        topOffsetMm: DEFAULT_PRINT_SETTINGS.topOffsetMm,
        leftMarginMm: DEFAULT_PRINT_SETTINGS.leftMarginMm,
        rightMarginMm: DEFAULT_PRINT_SETTINGS.rightMarginMm,
        bottomOffsetMm: DEFAULT_PRINT_SETTINGS.bottomOffsetMm,
        bottomMarginMm: DEFAULT_PRINT_SETTINGS.bottomMarginMm,
        padMode: DEFAULT_PRINT_SETTINGS.padMode,
      };
      applyPrintSettings(updatedPrint);
      return {
        ...prev,
        print: updatedPrint,
      };
    });
    setSavedSuccess(false);
  };

  const handleTestPrint = () => {
    document.body.classList.add('printing-calibration');
    const cleanup = () => {
      document.body.classList.remove('printing-calibration');
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    window.print();
    setTimeout(cleanup, 60000); // 60s safety fallback
  };

  const printConfig = settings.print || DEFAULT_PRINT_SETTINGS;
  const topOffset = Number(printConfig.topOffsetMm ?? 60);
  const leftMargin = Number(printConfig.leftMarginMm ?? 15);
  const rightMargin = Number(printConfig.rightMarginMm ?? 15);
  const bottomMargin = Number(printConfig.bottomOffsetMm ?? printConfig.bottomMarginMm ?? 20);
  const isPadMode = Boolean(printConfig.padMode);

  // A4 scale calculations for visual preview (A4 is 210mm x 297mm)
  const previewScale = 1.35; // px per mm
  const a4WidthPx = 210 * previewScale; // ~283px
  const a4HeightPx = 297 * previewScale; // ~400px
  const topOffsetPx = topOffset * previewScale;
  const bottomMarginPx = bottomMargin * previewScale;
  const leftMarginPx = leftMargin * previewScale;
  const rightMarginPx = rightMargin * previewScale;

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#D9E6E2]">
        <div>
          <h2 className="font-heading text-xl font-bold tracking-tight text-[#10201F]">
            Print Alignment & Stationery Settings
          </h2>
          <p className="text-xs text-[#4E6460] mt-1">
            Configure clinic demographics, letterhead pad margins, and top alignment to print accurately on doctor stationery.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowTestSheet(true)}
            className="btn-secondary inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl shadow-nivara-xs"
          >
            <Ruler size={15} className="text-[#287C75]" />
            Test Print Alignment Sheet
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="btn-primary inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl shadow-nivara-xs"
          >
            <Printer size={15} />
            Save Settings
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="flex items-center gap-2.5 p-3.5 bg-emerald-50 border border-emerald-200 text-[#123A3A] rounded-xl text-sm font-medium animate-in fade-in">
          <CheckCircle size={18} className="text-[#2E7D5B] flex-shrink-0" />
          <span>Print configuration and clinic demographics saved successfully!</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Form Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-7">
          {/* Section 1: Print Mode Toggle */}
          <div className="bg-white p-6 rounded-2xl border border-[#D9E6E2] shadow-nivara-xs space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-teal-50 text-[#287C75] border border-teal-100/80">
                <Printer size={18} />
              </span>
              <div>
                <h3 className="font-heading text-base font-bold text-[#10201F]">Stationery Paper Mode</h3>
                <p className="text-xs text-[#4E6460]">Select physical stationery mode for prescription output</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              <button
                type="button"
                onClick={() => handlePrintChange('padMode', true)}
                className={`p-4 text-left rounded-xl border-2 transition-all flex flex-col justify-between ${
                  isPadMode
                    ? 'border-[#287C75] bg-teal-50/30 shadow-nivara-xs'
                    : 'border-[#D9E6E2] hover:border-slate-300 bg-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-heading font-bold text-[#10201F] text-sm">Pre-printed Pad Mode</span>
                    {isPadMode && <span className="w-2.5 h-2.5 rounded-full bg-[#287C75]" />}
                  </div>
                  <p className="text-xs text-[#4E6460] mt-2 leading-relaxed">
                    Leaves a blank space at the top so software content prints directly below your doctor printed header/logo.
                  </p>
                </div>
                <span className="mt-3 inline-block text-[11px] font-semibold text-[#8F702B] bg-[#C9A45C]/15 border border-[#C9A45C]/30 px-2 py-0.5 rounded-md">
                  Recommended for Clinics
                </span>
              </button>

              <button
                type="button"
                onClick={() => handlePrintChange('padMode', false)}
                className={`p-4 text-left rounded-xl border-2 transition-all flex flex-col justify-between ${
                  !isPadMode
                    ? 'border-[#287C75] bg-teal-50/30 shadow-nivara-xs'
                    : 'border-[#D9E6E2] hover:border-slate-300 bg-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-heading font-bold text-[#10201F] text-sm">Plain Paper Letterhead</span>
                    {!isPadMode && <span className="w-2.5 h-2.5 rounded-full bg-[#287C75]" />}
                  </div>
                  <p className="text-xs text-[#4E6460] mt-2 leading-relaxed">
                    Prints the digital clinic header (Name, Qualifications, Address, Reg. No.) directly on blank A4 paper.
                  </p>
                </div>
                <span className="mt-3 inline-block text-[11px] font-semibold text-[#4E6460] bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                  Plain A4 Paper
                </span>
              </button>
            </div>
          </div>

          {/* Section 2: Alignment Sliders */}
          <div className="bg-white p-6 rounded-2xl border border-[#D9E6E2] shadow-nivara-xs space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-teal-50 text-[#287C75] border border-teal-100/80">
                  <Sliders size={18} />
                </span>
                <div>
                  <h3 className="font-heading text-base font-bold text-[#10201F]">Print Margins & Padding</h3>
                  <p className="text-xs text-[#4E6460]">Calibrate physical boundaries for printer feed accuracy</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleResetDefaults}
                className="btn-secondary inline-flex items-center gap-1.5 text-xs py-1.5 px-2.5 rounded-lg text-[#4E6460] hover:text-[#10201F]"
                title="Reset to 60mm default"
              >
                <RotateCcw size={13} className="text-[#287C75]" />
                <span>Reset Defaults</span>
              </button>
            </div>

            {/* Top Offset Slider */}
            <div
              className={`space-y-3 p-4 rounded-xl border transition-all ${
                isPadMode
                  ? 'bg-amber-50/40 border-amber-200/90 shadow-nivara-xs'
                  : 'bg-slate-50/60 border-[#D9E6E2] opacity-60'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <label htmlFor="top-offset-slider" className="font-heading text-sm font-bold text-[#10201F] block">
                    Top Header Offset (Logo Blank Space)
                  </label>
                  <p className="text-xs text-[#4E6460] mt-0.5">
                    Height reserved for your doctor pre-printed header
                  </p>
                </div>
                <div className="flex items-center gap-2 bg-white px-2.5 py-1 rounded-lg border border-[#D9E6E2] shadow-nivara-xs">
                  <input
                    type="number"
                    min="10"
                    max="150"
                    value={topOffset}
                    onChange={(e) => handlePrintChange('topOffsetMm', Number(e.target.value))}
                    disabled={!isPadMode}
                    className="w-14 text-right text-sm font-heading font-bold text-[#10201F] border-none outline-none p-0 bg-transparent"
                  />
                  <span className="text-xs font-semibold text-[#4E6460]">mm</span>
                </div>
              </div>

              <input
                id="top-offset-slider"
                type="range"
                min="20"
                max="140"
                step="1"
                value={topOffset}
                onChange={(e) => handlePrintChange('topOffsetMm', Number(e.target.value))}
                disabled={!isPadMode}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#287C75]"
              />

              {/* Offset Quick Presets */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] font-semibold text-[#7D908C] mr-1">Presets:</span>
                {[
                  { label: 'Compact 45mm', val: 45 },
                  { label: 'Default 60mm', val: 60 },
                  { label: 'Medium 75mm', val: 75 },
                  { label: 'Large 90mm', val: 90 },
                ].map((preset) => (
                  <button
                    key={preset.val}
                    type="button"
                    onClick={() => handlePrintChange('topOffsetMm', preset.val)}
                    disabled={!isPadMode}
                    className={`text-[11px] px-2.5 py-1 rounded-lg font-medium transition-all ${
                      topOffset === preset.val
                        ? 'bg-[#287C75] text-white font-bold shadow-nivara-xs'
                        : 'bg-white border border-[#D9E6E2] text-[#4E6460] hover:bg-slate-50'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Left and Right Margins */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-[#F7FAF8]/80 border border-[#D9E6E2] rounded-xl space-y-2">
                <div className="flex justify-between items-center">
                  <label htmlFor="left-margin-slider" className="text-xs font-bold text-[#10201F]">
                    Left Margin
                  </label>
                  <span className="font-heading text-xs font-bold text-[#287C75]">{leftMargin} mm</span>
                </div>
                <input
                  id="left-margin-slider"
                  type="range"
                  min="10"
                  max="30"
                  step="1"
                  value={leftMargin}
                  onChange={(e) => handlePrintChange('leftMarginMm', Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#287C75]"
                />
              </div>

              <div className="p-4 bg-[#F7FAF8]/80 border border-[#D9E6E2] rounded-xl space-y-2">
                <div className="flex justify-between items-center">
                  <label htmlFor="right-margin-slider" className="text-xs font-bold text-[#10201F]">
                    Right Margin
                  </label>
                  <span className="font-heading text-xs font-bold text-[#287C75]">{rightMargin} mm</span>
                </div>
                <input
                  id="right-margin-slider"
                  type="range"
                  min="10"
                  max="30"
                  step="1"
                  value={rightMargin}
                  onChange={(e) => handlePrintChange('rightMarginMm', Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#287C75]"
                />
              </div>
            </div>

            {/* Bottom Margin */}
            <div className="p-4 bg-[#F7FAF8]/80 border border-[#D9E6E2] rounded-xl space-y-2">
              <div className="flex justify-between items-center">
                <label htmlFor="bottom-margin-slider" className="text-xs font-bold text-[#10201F]">
                  Bottom Margin
                </label>
                <span className="font-heading text-xs font-bold text-[#287C75]">{bottomMargin} mm</span>
              </div>
              <input
                id="bottom-margin-slider"
                type="range"
                min="10"
                max="40"
                step="1"
                value={bottomMargin}
                onChange={(e) => handlePrintChange('bottomOffsetMm', Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#287C75]"
              />
            </div>
          </div>

          {/* Section 3: Clinic & Doctor Demographics */}
          <div className="bg-white p-6 rounded-2xl border border-[#D9E6E2] shadow-nivara-xs space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-teal-50 text-[#287C75] border border-teal-100/80">
                  <Building2 size={18} />
                </span>
                <div>
                  <h3 className="font-heading text-base font-bold text-[#10201F]">
                    Clinic Branding, Logo & Header Information
                  </h3>
                  <p className="text-xs text-[#4E6460]">
                    Customize your clinic logo, header layout, and address printed in "Digital Header" mode.
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-[#287C75] bg-[#E8F3F1] px-2.5 py-0.5 rounded-full border border-[#287C75]/20">
                Digital Header Mode
              </span>
            </div>

            {/* Clinic Logo Upload & Preview Zone */}
            <div className="space-y-3 p-4 rounded-xl border border-[#D9E6E2] bg-[#F7FAF8]/70">
              <div className="flex items-center justify-between">
                <div>
                  <label className="font-heading text-xs font-bold text-[#10201F] block">
                    Clinic Logo (Header & Watermark)
                  </label>
                  <p className="text-[11px] text-[#4E6460] mt-0.5">
                    Upload clinic crest, emblem or logo to print on plain paper prescriptions.
                  </p>
                </div>
                {settings.clinicLogo && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#2E7D5B] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <CheckCircle size={12} />
                    Active
                  </span>
                )}
              </div>

              {logoError && (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs font-medium text-rose-800">
                  {logoError}
                </div>
              )}

              {settings.clinicLogo ? (
                <div className="flex items-center gap-4 p-3 bg-white rounded-xl border border-[#B5D8D0] shadow-nivara-xs">
                  <div className="flex h-18 w-32 items-center justify-center rounded-lg border border-[#D9E6E2] bg-slate-50/50 p-1.5 overflow-hidden">
                    <img
                      src={settings.clinicLogo}
                      alt="Clinic Logo Preview"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-xs font-bold text-[#10201F]">Clinic Logo Configured</p>
                    <p className="text-[11px] text-[#4E6460]">
                      Appears in the header and optionally as a subtle background watermark on Digital Header prints.
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <label className="btn-secondary inline-flex items-center gap-1.5 text-xs py-1 px-2.5 rounded-lg border border-[#D9E6E2] cursor-pointer hover:bg-slate-50 font-semibold text-[#287C75]">
                        <Upload size={12} />
                        <span>Change Logo</span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/svg+xml"
                          onChange={handleLogoUpload}
                          className="hidden"
                          aria-label="Change Clinic Logo"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="inline-flex items-center gap-1.5 text-xs py-1 px-2.5 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 font-semibold"
                        aria-label="Remove Clinic Logo"
                      >
                        <Trash2 size={12} />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-[#CFE2DC] rounded-xl hover:border-[#287C75] bg-white hover:bg-teal-50/20 cursor-pointer transition text-center group shadow-nivara-xs">
                  <span className="p-3 rounded-full bg-teal-50 text-[#287C75] border border-teal-100 group-hover:scale-105 transition">
                    <Upload size={20} />
                  </span>
                  <span className="mt-2 text-sm font-bold text-[#10201F]">
                    Click to Upload Clinic Logo
                  </span>
                  <span className="text-xs text-[#7D908C] mt-0.5">
                    PNG, JPG, WebP, or SVG (Recommended max height: 120px, under 2MB)
                  </span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    onChange={handleLogoUpload}
                    className="hidden"
                    aria-label="Upload Clinic Logo"
                  />
                </label>
              )}

              {/* Watermark Toggle */}
              <div className="pt-2">
                <label className="flex items-start gap-3 p-3 rounded-xl border border-[#D9E6E2] bg-white hover:bg-[#F7FAF8] cursor-pointer transition shadow-nivara-xs">
                  <input
                    type="checkbox"
                    checked={Boolean(settings.watermarkEnabled)}
                    onChange={(e) => {
                      setSettings((prev) => ({
                        ...prev,
                        watermarkEnabled: e.target.checked,
                      }));
                      setSavedSuccess(false);
                    }}
                    className="mt-0.5 h-4 w-4 rounded border-[#D9E6E2] text-[#287C75] focus:ring-[#287C75] accent-[#287C75]"
                    aria-label="Enable subtle clinic logo watermark on print"
                  />
                  <div className="flex-1 text-xs">
                    <span className="font-bold text-[#10201F] block">
                      Print Clinic Logo as Subtle Watermark
                    </span>
                    <span className="text-[#4E6460] mt-0.5 block">
                      Renders a transparent watermark (~6% opacity) in the center of the printed prescription sheet for a certified clinical look.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Clinic and Doctor Demographics Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="field-label">Clinic Name</label>
                <input
                  type="text"
                  value={settings.clinicName || ''}
                  onChange={(e) => handleClinicChange('clinicName', e.target.value)}
                  placeholder="ClinicRx Gastro Centre"
                  className="w-full px-3.5 py-2.5 text-sm border border-[#D9E6E2] rounded-xl focus:border-[#287C75] focus:ring-2 focus:ring-[#287C75]/20 bg-white outline-none transition"
                  aria-label="Clinic Name"
                />
              </div>

              <div>
                <label className="field-label">Clinic Tagline / Specialty</label>
                <input
                  type="text"
                  value={settings.clinicTagline || ''}
                  onChange={(e) => handleClinicChange('clinicTagline', e.target.value)}
                  placeholder="Digestive, Liver & Advanced Endoscopy Centre"
                  className="w-full px-3.5 py-2.5 text-sm border border-[#D9E6E2] rounded-xl focus:border-[#287C75] focus:ring-2 focus:ring-[#287C75]/20 bg-white outline-none transition"
                  aria-label="Clinic Tagline"
                />
              </div>

              <div>
                <label className="field-label">Doctor Name</label>
                <input
                  type="text"
                  value={settings.doctorName || ''}
                  onChange={(e) => handleClinicChange('doctorName', e.target.value)}
                  placeholder="Dr. Aarav Sharma"
                  className="w-full px-3.5 py-2.5 text-sm border border-[#D9E6E2] rounded-xl focus:border-[#287C75] focus:ring-2 focus:ring-[#287C75]/20 bg-white outline-none transition"
                  aria-label="Doctor Name"
                />
              </div>

              <div>
                <label className="field-label">Qualifications / Degree</label>
                <input
                  type="text"
                  value={settings.qualification || ''}
                  onChange={(e) => handleClinicChange('qualification', e.target.value)}
                  placeholder="MBBS, MD (Medicine), DM (Gastroenterology)"
                  className="w-full px-3.5 py-2.5 text-sm border border-[#D9E6E2] rounded-xl focus:border-[#287C75] focus:ring-2 focus:ring-[#287C75]/20 bg-white outline-none transition"
                  aria-label="Qualifications"
                />
              </div>

              <div>
                <label className="field-label">Registration Number</label>
                <input
                  type="text"
                  value={settings.regNumber || ''}
                  onChange={(e) => handleClinicChange('regNumber', e.target.value)}
                  placeholder="MCI-12345/2012"
                  className="w-full px-3.5 py-2.5 text-sm border border-[#D9E6E2] rounded-xl focus:border-[#287C75] focus:ring-2 focus:ring-[#287C75]/20 bg-white outline-none transition"
                  aria-label="Registration Number"
                />
              </div>

              <div>
                <label className="field-label">Contact Phone / Helpline</label>
                <input
                  type="text"
                  value={settings.phone || ''}
                  onChange={(e) => handleClinicChange('phone', e.target.value)}
                  placeholder="9876543210"
                  className="w-full px-3.5 py-2.5 text-sm border border-[#D9E6E2] rounded-xl focus:border-[#287C75] focus:ring-2 focus:ring-[#287C75]/20 bg-white outline-none transition"
                  aria-label="Contact Phone"
                />
              </div>

              <div>
                <label className="field-label">Contact Email (Optional)</label>
                <input
                  type="email"
                  value={settings.email || ''}
                  onChange={(e) => handleClinicChange('email', e.target.value)}
                  placeholder="info@gastrocure.com"
                  className="w-full px-3.5 py-2.5 text-sm border border-[#D9E6E2] rounded-xl focus:border-[#287C75] focus:ring-2 focus:ring-[#287C75]/20 bg-white outline-none transition"
                  aria-label="Contact Email"
                />
              </div>

              <div>
                <label className="field-label">Consulting Hours / Timing</label>
                <input
                  type="text"
                  value={settings.timing || ''}
                  onChange={(e) => handleClinicChange('timing', e.target.value)}
                  placeholder="10:00 AM - 02:00 PM, 06:00 PM - 09:00 PM"
                  className="w-full px-3.5 py-2.5 text-sm border border-[#D9E6E2] rounded-xl focus:border-[#287C75] focus:ring-2 focus:ring-[#287C75]/20 bg-white outline-none transition"
                  aria-label="Consulting Hours"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="field-label">Custom Clinic Address</label>
                <textarea
                  rows={2}
                  value={settings.address || ''}
                  onChange={(e) => handleClinicChange('address', e.target.value)}
                  placeholder="Shop 4, Ground Floor, Health Plaza, Metro Pillar 142, Main Ring Road, New Delhi 110024"
                  className="w-full px-3.5 py-2 text-sm border border-[#D9E6E2] rounded-xl focus:border-[#287C75] focus:ring-2 focus:ring-[#287C75]/20 bg-white outline-none transition resize-none"
                  aria-label="Custom Clinic Address"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Visual Preview Diagram (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="sticky top-6">
            <div className="bg-white p-6 rounded-2xl border border-[#D9E6E2] shadow-nivara-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="text-[#287C75]" size={18} />
                  <h3 className="font-heading text-base font-bold text-[#10201F]">Live A4 Paper Preview</h3>
                </div>
                <span className="text-[11px] font-bold text-[#4E6460] bg-teal-50/70 border border-teal-100 px-2 py-0.5 rounded-md">
                  210 × 297 mm
                </span>
              </div>

              <p className="text-xs text-[#4E6460]">
                Visual representation of how your printed prescription aligns with your stationery.
              </p>

              {/* Scaled A4 Sheet Diagram */}
              <div className="flex justify-center py-2">
                <div
                  className="relative bg-white border border-[#D9E6E2] rounded-md shadow-nivara-sm overflow-hidden"
                  style={{
                    width: `${a4WidthPx}px`,
                    height: `${a4HeightPx}px`,
                  }}
                >
                  {/* Pre-printed Pad Header Area */}
                  {isPadMode ? (
                    <div
                      className="absolute top-0 left-0 right-0 border-b-2 border-dashed border-[#C9A45C] bg-amber-50/70 flex flex-col items-center justify-center text-center p-2 transition-all duration-150"
                      style={{ height: `${topOffsetPx}px` }}
                    >
                      <span className="text-[10px] font-bold text-[#8F702B] tracking-wide uppercase">
                        Doctor Letterhead Area
                      </span>
                      <span className="text-[9px] font-semibold text-[#8F702B] mt-0.5">
                        Blank Space: {topOffset} mm
                      </span>
                    </div>
                  ) : (
                    <div
                      className="absolute top-0 left-0 right-0 border-b border-[#D9E6E2] bg-teal-50/40 p-2 flex justify-between items-start"
                      style={{ height: '58px' }}
                    >
                      <div className="flex items-start gap-1.5 text-left">
                        {settings.clinicLogo && (
                          <img
                            src={settings.clinicLogo}
                            alt=""
                            className="h-7 w-auto object-contain max-w-[36px] flex-shrink-0 rounded bg-white p-0.5 border border-[#D9E6E2]"
                          />
                        )}
                        <div>
                          <div className="text-[10px] font-extrabold text-[#10201F] truncate max-w-[110px]">
                            {settings.clinicName || 'ClinicRx Centre'}
                          </div>
                          {settings.clinicTagline && (
                            <div className="text-[7px] font-semibold text-[#287C75] truncate max-w-[110px]">
                              {settings.clinicTagline}
                            </div>
                          )}
                          <div className="text-[7.5px] text-[#4E6460] truncate max-w-[110px]">
                            {settings.address || 'Clinic Address'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[9px] font-bold text-[#10201F] truncate max-w-[85px]">
                          {settings.doctorName || 'Dr. Aarav Sharma'}
                        </div>
                        <div className="text-[7.5px] text-[#4E6460]">
                          {settings.qualification || 'MBBS'}
                        </div>
                        <div className="text-[7px] text-[#7D908C]">
                          {settings.regNumber || 'MCI-12345'}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Subtle Clinic Logo Watermark in diagram if enabled */}
                  {settings.watermarkEnabled && settings.clinicLogo && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                      <img
                        src={settings.clinicLogo}
                        alt=""
                        className="w-24 h-24 object-contain opacity-10 grayscale"
                      />
                    </div>
                  )}

                  {/* Software Prescription Content Area */}
                  <div
                    className="absolute transition-all duration-150 flex flex-col justify-between"
                    style={{
                      top: isPadMode ? `${topOffsetPx}px` : '58px',
                      left: `${leftMarginPx}px`,
                      right: `${rightMarginPx}px`,
                      bottom: `${bottomMarginPx}px`,
                    }}
                  >
                    {/* Simulated Content Lines */}
                    <div className="space-y-2 pt-2">
                      {/* Patient metadata box */}
                      <div className="h-6 bg-[#F7FAF8] rounded border border-[#D9E6E2] px-2 flex items-center justify-between text-[8px] text-[#4E6460] font-medium">
                        <span>Patient: Demo Patient (35y / M)</span>
                        <span>Date: Today</span>
                      </div>

                      {/* Vitals row */}
                      <div className="grid grid-cols-3 gap-1">
                        <div className="h-3 bg-[#F7FAF8] rounded text-[7px] text-[#7D908C] flex items-center px-1">BP: 120/80</div>
                        <div className="h-3 bg-[#F7FAF8] rounded text-[7px] text-[#7D908C] flex items-center px-1">Pulse: 74</div>
                        <div className="h-3 bg-[#F7FAF8] rounded text-[7px] text-[#7D908C] flex items-center px-1">Wt: 68kg</div>
                      </div>

                      {/* Rx Table */}
                      <div className="border border-[#D9E6E2] rounded p-1 space-y-1 bg-white">
                        <div className="text-[8px] font-bold text-[#10201F]">Rx / Medications</div>
                        <div className="h-2 bg-teal-100 rounded w-11/12" />
                        <div className="h-2 bg-slate-100 rounded w-9/12" />
                        <div className="h-2 bg-teal-100 rounded w-10/12" />
                        <div className="h-2 bg-slate-100 rounded w-8/12" />
                      </div>
                    </div>

                    {/* Footer sign area */}
                    <div className="border-t border-[#D9E6E2] pt-1 pb-1 flex justify-between items-end text-[7px] text-[#7D908C]">
                      <span>Follow-up: 7 Days</span>
                      <span className="font-semibold text-[#10201F]">Doctor Signature</span>
                    </div>
                  </div>

                  {/* Bottom Margin Indicator */}
                  <div
                    className="absolute bottom-0 left-0 right-0 bg-slate-100/70 border-t border-dashed border-[#D9E6E2] text-center text-[8px] text-[#7D908C] font-medium flex items-center justify-center"
                    style={{ height: `${bottomMarginPx}px` }}
                  >
                    Margin: {bottomMargin} mm
                  </div>
                </div>
              </div>

              {/* Status summary */}
              <div className="pt-2 border-t border-[#D9E6E2] text-xs space-y-2 text-[#4E6460]">
                <div className="flex justify-between items-center">
                  <span>Current Top Offset:</span>
                  <span className="font-heading font-bold text-[#287C75]">
                    {isPadMode ? `${topOffset} mm` : 'Auto (Digital Header)'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Left / Right Margins:</span>
                  <span className="font-heading font-bold text-[#10201F]">
                    {leftMargin} mm / {rightMargin} mm
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Bottom Margin:</span>
                  <span className="font-heading font-bold text-[#10201F]">
                    {bottomMargin} mm
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Active Mode:</span>
                  <span className="font-semibold text-[#10201F]">
                    {isPadMode ? 'Pre-printed Stationery' : 'Plain Paper Letterhead'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Test Print Calibration Modal */}
      {showTestSheet && (
        <TestPrintSheet
          onClose={() => setShowTestSheet(false)}
          onPrint={handleTestPrint}
        />
      )}
    </div>
  );
}

export default PrintSettingsTab;
