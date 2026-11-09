import React, { useState } from 'react';
import {
  Printer,
  Sliders,
  Building2,
  FileText,
  CheckCircle,
  RotateCcw,
  Sparkles,
  Info,
  Ruler,
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

  // Demographics form fields
  const handleClinicChange = (field, value) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
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
      doctorName: settings.doctorName,
      qualification: settings.qualification,
      regNumber: settings.regNumber,
      phone: settings.phone,
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
    handlePrintChange('topOffsetMm', DEFAULT_PRINT_SETTINGS.topOffsetMm);
    handlePrintChange('leftMarginMm', DEFAULT_PRINT_SETTINGS.leftMarginMm);
    handlePrintChange('rightMarginMm', DEFAULT_PRINT_SETTINGS.rightMarginMm);
    handlePrintChange('bottomOffsetMm', DEFAULT_PRINT_SETTINGS.bottomOffsetMm);
    handlePrintChange('padMode', DEFAULT_PRINT_SETTINGS.padMode);
  };

  const handleTestPrint = () => {
    document.body.classList.add('printing-calibration');
    window.print();
    setTimeout(() => {
      document.body.classList.remove('printing-calibration');
    }, 1000);
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Print Alignment & Stationery Settings</h2>
          <p className="text-sm text-slate-500 mt-1">
            Configure clinic demographics, letterhead pad margins, and top alignment to print accurately on doctor stationery.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowTestSheet(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-lg transition-colors border border-slate-300"
          >
            <Ruler size={16} className="text-blue-600" />
            Test Print Alignment Sheet
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
          >
            <Printer size={16} />
            Save Settings
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="flex items-center gap-2.5 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm font-medium animate-fadeIn">
          <CheckCircle size={18} className="text-emerald-600 flex-shrink-0" />
          <span>Print configuration and clinic demographics saved successfully!</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Form Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-8">
          {/* Section 1: Print Mode Toggle */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <Printer className="text-blue-600" size={18} />
              <h3 className="text-base font-bold text-slate-800">Stationery Paper Mode</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => handlePrintChange('padMode', true)}
                className={`p-4 text-left rounded-xl border-2 transition-all flex flex-col justify-between ${
                  isPadMode
                    ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-sm">Pre-printed Pad Mode</span>
                    {isPadMode && <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />}
                  </div>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    Leaves a blank space at the top so software content prints directly below your doctor printed header/logo.
                  </p>
                </div>
                <span className="mt-3 inline-block text-[11px] font-semibold text-blue-700 bg-blue-100/60 px-2 py-0.5 rounded">
                  Recommended for Clinics
                </span>
              </button>

              <button
                type="button"
                onClick={() => handlePrintChange('padMode', false)}
                className={`p-4 text-left rounded-xl border-2 transition-all flex flex-col justify-between ${
                  !isPadMode
                    ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-sm">Plain Paper Letterhead</span>
                    {!isPadMode && <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />}
                  </div>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    Prints the digital clinic header (Name, Qualifications, Address, Reg. No.) directly on blank A4 paper.
                  </p>
                </div>
                <span className="mt-3 inline-block text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                  Plain A4 Paper
                </span>
              </button>
            </div>
          </div>

          {/* Section 2: Alignment Sliders */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="text-blue-600" size={18} />
                <h3 className="text-base font-bold text-slate-800">Print Margins & Padding</h3>
              </div>
              <button
                type="button"
                onClick={handleResetDefaults}
                className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors"
                title="Reset to 60mm default"
              >
                <RotateCcw size={12} />
                Reset Defaults
              </button>
            </div>

            {/* Top Offset Slider */}
            <div className={`space-y-3 p-4 rounded-xl border transition-all ${
              isPadMode ? 'bg-amber-50/40 border-amber-200' : 'bg-slate-50 border-slate-200 opacity-60'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <label htmlFor="top-offset-slider" className="text-sm font-bold text-slate-800">
                    Top Header Offset (Logo Blank Space)
                  </label>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Height reserved for your doctor pre-printed header
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="10"
                    max="150"
                    value={topOffset}
                    onChange={(e) => handlePrintChange('topOffsetMm', Number(e.target.value))}
                    disabled={!isPadMode}
                    className="w-16 px-2 py-1 text-right text-sm font-bold border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                  <span className="text-sm font-semibold text-slate-600">mm</span>
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
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />

              {/* Offset Quick Presets */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] text-slate-400 mr-1">Presets:</span>
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
                    className={`text-[11px] px-2 py-0.5 rounded font-medium transition-colors ${
                      topOffset === preset.val
                        ? 'bg-blue-600 text-white font-bold'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Left and Right Margins */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex justify-between items-center">
                  <label htmlFor="left-margin-slider" className="text-xs font-bold text-slate-700">Left Margin</label>
                  <span className="text-xs font-bold text-blue-700">{leftMargin} mm</span>
                </div>
                <input
                  id="left-margin-slider"
                  type="range"
                  min="10"
                  max="30"
                  step="1"
                  value={leftMargin}
                  onChange={(e) => handlePrintChange('leftMarginMm', Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex justify-between items-center">
                  <label htmlFor="right-margin-slider" className="text-xs font-bold text-slate-700">Right Margin</label>
                  <span className="text-xs font-bold text-blue-700">{rightMargin} mm</span>
                </div>
                <input
                  id="right-margin-slider"
                  type="range"
                  min="10"
                  max="30"
                  step="1"
                  value={rightMargin}
                  onChange={(e) => handlePrintChange('rightMarginMm', Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>
            </div>

            {/* Bottom Margin */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex justify-between items-center">
                <label htmlFor="bottom-margin-slider" className="text-xs font-bold text-slate-700">Bottom Margin</label>
                <span className="text-xs font-bold text-blue-700">{bottomMargin} mm</span>
              </div>
              <input
                id="bottom-margin-slider"
                type="range"
                min="10"
                max="40"
                step="1"
                value={bottomMargin}
                onChange={(e) => handlePrintChange('bottomOffsetMm', Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>
          </div>

          {/* Section 3: Clinic & Doctor Demographics */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center gap-2">
              <Building2 className="text-blue-600" size={18} />
              <h3 className="text-base font-bold text-slate-800">Clinic & Doctor Information</h3>
            </div>
            <p className="text-xs text-slate-500">
              Used when printing plain paper letterhead, receipts, and consultation reports.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Clinic Name</label>
                <input
                  type="text"
                  value={settings.clinicName || ''}
                  onChange={(e) => handleClinicChange('clinicName', e.target.value)}
                  placeholder="e.g. ClinicRx Gastro Centre"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Doctor Name</label>
                <input
                  type="text"
                  value={settings.doctorName || ''}
                  onChange={(e) => handleClinicChange('doctorName', e.target.value)}
                  placeholder="e.g. Dr. Aarav Sharma"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Qualifications / Degree</label>
                <input
                  type="text"
                  value={settings.qualification || ''}
                  onChange={(e) => handleClinicChange('qualification', e.target.value)}
                  placeholder="e.g. MBBS, MD (Medicine)"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Registration Number</label>
                <input
                  type="text"
                  value={settings.regNumber || ''}
                  onChange={(e) => handleClinicChange('regNumber', e.target.value)}
                  placeholder="e.g. MCI-12345/2012"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={settings.phone || ''}
                  onChange={(e) => handleClinicChange('phone', e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Consulting Hours / Timing</label>
                <input
                  type="text"
                  value={settings.timing || ''}
                  onChange={(e) => handleClinicChange('timing', e.target.value)}
                  placeholder="e.g. 10:00 AM - 02:00 PM, 06:00 PM - 09:00 PM"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Clinic Address</label>
                <input
                  type="text"
                  value={settings.address || ''}
                  onChange={(e) => handleClinicChange('address', e.target.value)}
                  placeholder="e.g. Shop 4, Ground Floor, Health Plaza, New Delhi"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Visual Preview Diagram (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="sticky top-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="text-blue-600" size={18} />
                  <h3 className="text-base font-bold text-slate-800">Live A4 Paper Preview</h3>
                </div>
                <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  210 × 297 mm
                </span>
              </div>

              <p className="text-xs text-slate-500">
                Visual representation of how your printed prescription aligns with your stationery.
              </p>

              {/* Scaled A4 Sheet Diagram */}
              <div className="flex justify-center py-2">
                <div
                  className="relative bg-white border border-slate-400 rounded shadow-md overflow-hidden"
                  style={{
                    width: `${a4WidthPx}px`,
                    height: `${a4HeightPx}px`,
                  }}
                >
                  {/* Pre-printed Pad Header Area */}
                  {isPadMode ? (
                    <div
                      className="absolute top-0 left-0 right-0 border-b-2 border-dashed border-amber-500 bg-amber-50/80 flex flex-col items-center justify-center text-center p-2 transition-all duration-150"
                      style={{ height: `${topOffsetPx}px` }}
                    >
                      <span className="text-[10px] font-bold text-amber-900 tracking-wide uppercase">
                        Doctor Letterhead Area
                      </span>
                      <span className="text-[9px] font-semibold text-amber-700 mt-0.5">
                        Blank Space: {topOffset} mm
                      </span>
                    </div>
                  ) : (
                    <div
                      className="absolute top-0 left-0 right-0 border-b border-slate-300 bg-slate-50 p-2 flex justify-between items-start"
                      style={{ height: '55px' }}
                    >
                      <div className="text-left">
                        <div className="text-[10px] font-extrabold text-slate-800 truncate max-w-[130px]">
                          {settings.clinicName || 'ClinicRx Centre'}
                        </div>
                        <div className="text-[8px] text-slate-500 truncate max-w-[130px]">
                          {settings.address || 'Clinic Address'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[9px] font-bold text-slate-800 truncate max-w-[100px]">
                          {settings.doctorName || 'Dr. Aarav Sharma'}
                        </div>
                        <div className="text-[7.5px] text-slate-500">
                          {settings.qualification || 'MBBS'}
                        </div>
                      </div>
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
                      <div className="h-6 bg-slate-100 rounded border border-slate-200 px-2 flex items-center justify-between text-[8px] text-slate-500 font-medium">
                        <span>Patient: Demo Patient (35y / M)</span>
                        <span>Date: Today</span>
                      </div>

                      {/* Vitals row */}
                      <div className="grid grid-cols-3 gap-1">
                        <div className="h-3 bg-slate-100 rounded text-[7px] text-slate-400 flex items-center px-1">BP: 120/80</div>
                        <div className="h-3 bg-slate-100 rounded text-[7px] text-slate-400 flex items-center px-1">Pulse: 74</div>
                        <div className="h-3 bg-slate-100 rounded text-[7px] text-slate-400 flex items-center px-1">Wt: 68kg</div>
                      </div>

                      {/* Rx Table */}
                      <div className="border border-slate-200 rounded p-1 space-y-1">
                        <div className="text-[8px] font-bold text-slate-700">Rx / Medications</div>
                        <div className="h-2 bg-blue-100 rounded w-11/12" />
                        <div className="h-2 bg-slate-100 rounded w-9/12" />
                        <div className="h-2 bg-blue-100 rounded w-10/12" />
                        <div className="h-2 bg-slate-100 rounded w-8/12" />
                      </div>
                    </div>

                    {/* Footer sign area */}
                    <div className="border-t border-slate-200 pt-1 pb-1 flex justify-between items-end text-[7px] text-slate-400">
                      <span>Follow-up: 7 Days</span>
                      <span className="font-semibold text-slate-600">Doctor Signature</span>
                    </div>
                  </div>

                  {/* Bottom Margin Indicator */}
                  <div
                    className="absolute bottom-0 left-0 right-0 bg-slate-100/70 border-t border-dashed border-slate-300 text-center text-[8px] text-slate-400 font-medium flex items-center justify-center"
                    style={{ height: `${bottomMarginPx}px` }}
                  >
                    Margin: {bottomMargin} mm
                  </div>
                </div>
              </div>

              {/* Status summary */}
              <div className="pt-2 border-t border-slate-100 text-xs space-y-1.5 text-slate-600">
                <div className="flex justify-between">
                  <span>Current Top Offset:</span>
                  <span className="font-bold text-blue-700">{isPadMode ? `${topOffset} mm` : 'Auto (Digital Header)'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Left / Right Margins:</span>
                  <span className="font-bold text-slate-800">{leftMargin} mm / {rightMargin} mm</span>
                </div>
                <div className="flex justify-between">
                  <span>Bottom Margin:</span>
                  <span className="font-bold text-slate-800">{bottomMargin} mm</span>
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
