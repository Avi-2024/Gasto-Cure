import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Printer,
  Database,
  Download,
  Upload,
  CheckCircle,
  AlertCircle,
  Sliders,
  ShieldCheck,
  HardDrive,
  Zap,
  Sparkles,
  RotateCcw,
  ExternalLink,
  Check,
} from 'lucide-react';
import PrintSettingsTab from './tabs/PrintSettingsTab';
import { dataBackup, localSettings } from '../../services/localStore';
import { rxProtocolsService } from '../../services/rxProtocolsService';

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState('print');
  const [backupStatus, setBackupStatus] = useState(null);
  const [isProtoEnabled, setIsProtoEnabled] = useState(() => rxProtocolsService.isEnabled());
  const [protocolsList, setProtocolsList] = useState(() => rxProtocolsService.getAll());
  const [protocolResetMsg, setProtocolResetMsg] = useState('');

  const handleToggleProtocols = () => {
    const next = !isProtoEnabled;
    rxProtocolsService.setEnabled(next);
    setIsProtoEnabled(next);
  };

  const handleResetProtocols = () => {
    const defaults = rxProtocolsService.reset();
    setProtocolsList(defaults);
    setProtocolResetMsg('Clinical Rx Protocols restored to standard gastro defaults.');
    setTimeout(() => setProtocolResetMsg(''), 3500);
  };

  const handleExportBackup = () => {
    try {
      const json = dataBackup.exportJson();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = `clinixpulse-backup-${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setBackupStatus({ type: 'success', message: 'Clinic database exported successfully!' });
      setTimeout(() => setBackupStatus(null), 4000);
    } catch (err) {
      setBackupStatus({ type: 'error', message: 'Failed to export backup: ' + err.message });
    }
  };

  const handleImportBackup = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result;
        const res = dataBackup.importJson(content);
        if (res.success) {
          setBackupStatus({
            type: 'success',
            message: `Restore complete! Restored ${res.counts.patients} patients, ${res.counts.medicines} medicines, and ${res.counts.visits} visits.`,
          });
        } else {
          setBackupStatus({ type: 'error', message: res.error || 'Invalid backup file' });
        }
      } catch (err) {
        setBackupStatus({ type: 'error', message: 'Failed to parse JSON file' });
      }
      setTimeout(() => setBackupStatus(null), 6000);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Settings Top Bar with ClinixPulse Brand Icon */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-50 text-[#287C75] border border-teal-100 shadow-clinixpulse-xs flex-shrink-0">
            <Sliders size={22} />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#287C75]">
              Configuration
            </p>
            <h1 className="font-heading text-2xl font-bold tracking-tight text-[#10201F] mt-0.5">
              System & Clinic Settings
            </h1>
            <p className="text-xs text-[#4E6460] mt-0.5">
              Configure physical stationery alignment, doctor demographics, and offline local data storage.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-[#D9E6E2] gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('print')}
          className={`pb-3 pt-2.5 px-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all rounded-t-xl ${
            activeTab === 'print'
              ? 'border-[#287C75] text-[#123A3A] bg-teal-50/40'
              : 'border-transparent text-[#7D908C] hover:text-[#10201F] hover:bg-slate-50/80'
          }`}
        >
          <Printer size={16} className={activeTab === 'print' ? 'text-[#287C75]' : ''} />
          Print Alignment & Demographics
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('clinical')}
          className={`pb-3 pt-2.5 px-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all rounded-t-xl ${
            activeTab === 'clinical'
              ? 'border-[#287C75] text-[#123A3A] bg-teal-50/40'
              : 'border-transparent text-[#7D908C] hover:text-[#10201F] hover:bg-slate-50/80'
          }`}
        >
          <Zap size={16} className={activeTab === 'clinical' ? 'text-[#287C75] fill-[#287C75]' : ''} />
          Clinical Protocols (Kits)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('backup')}
          className={`pb-3 pt-2.5 px-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all rounded-t-xl ${
            activeTab === 'backup'
              ? 'border-[#287C75] text-[#123A3A] bg-teal-50/40'
              : 'border-transparent text-[#7D908C] hover:text-[#10201F] hover:bg-slate-50/80'
          }`}
        >
          <Database size={16} className={activeTab === 'backup' ? 'text-[#287C75]' : ''} />
          Data Backup & Restore
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'print' && <PrintSettingsTab />}

      {activeTab === 'clinical' && (
        <div className="space-y-6 max-w-4xl">
          {/* Main ON/OFF Toggle Card */}
          <div className="bg-white p-6 sm:p-7 rounded-2xl border border-[#D9E6E2] shadow-clinixpulse-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#D9E6E2]">
              <div className="flex items-center gap-3">
                <span className="p-2.5 rounded-xl bg-teal-50 text-[#287C75] border border-teal-100/80">
                  <Zap size={22} className="fill-[#287C75]" />
                </span>
                <div>
                  <h3 className="font-heading text-lg font-bold text-[#10201F]">
                    1-Click Clinical Rx Protocols (Protocol Kits)
                  </h3>
                  <p className="text-xs text-[#4E6460] mt-0.5">
                    Show or hide rapid clinical protocol kits in Prescription Studio
                  </p>
                </div>
              </div>

              {/* Master ON/OFF Switch */}
              <div className="flex items-center gap-3 self-end sm:self-auto">
                <span className="text-xs font-bold text-[#10201F]">
                  {isProtoEnabled ? 'ENABLED' : 'DISABLED'}
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isProtoEnabled}
                  onClick={handleToggleProtocols}
                  className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#287C75] ${
                    isProtoEnabled ? 'bg-[#287C75]' : 'bg-slate-300'
                  }`}
                  title="Toggle 1-Click Clinical Protocols on/off"
                >
                  <span
                    className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      isProtoEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Explanation / Status Alert */}
            <div
              className={`p-4 rounded-xl border flex items-start gap-3 transition-colors ${
                isProtoEnabled
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                  : 'bg-amber-50/70 border-amber-200 text-amber-950'
              }`}
            >
              {isProtoEnabled ? (
                <CheckCircle size={18} className="text-emerald-700 mt-0.5 shrink-0" />
              ) : (
                <AlertCircle size={18} className="text-amber-700 mt-0.5 shrink-0" />
              )}
              <div className="text-xs leading-relaxed">
                <span className="font-bold block mb-0.5">
                  {isProtoEnabled
                    ? 'Protocols are ACTIVE in Prescription Studio'
                    : 'Protocols are HIDDEN in Prescription Studio'}
                </span>
                {isProtoEnabled ? (
                  <p className="text-emerald-800">
                    Doctors can click any protocol kit (GERD, Gastritis, IBS, APD) to auto-fill Symptoms, Clinical Diagnosis, standard medicines, and lifestyle advice in 1 second.
                  </p>
                ) : (
                  <p className="text-amber-800">
                    The 1-Click Protocol bar is now hidden from the consultation screen. The studio displays a clean, blank writing space for doctors who prefer custom prescriptions.
                  </p>
                )}
              </div>
            </div>

            {/* Preview of Protocol Kits */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#287C75]">
                  Active Protocol Kits ({protocolsList.length})
                </span>
                <button
                  type="button"
                  onClick={handleResetProtocols}
                  className="inline-flex items-center gap-1.5 text-xs text-[#4E6460] hover:text-[#10201F] font-semibold transition cursor-pointer"
                >
                  <RotateCcw size={12} className="text-[#287C75]" />
                  <span>Restore Standard Defaults</span>
                </button>
              </div>

              {protocolResetMsg && (
                <div className="p-3 bg-teal-50 border border-teal-200 text-[#123A3A] rounded-xl text-xs font-medium animate-in fade-in">
                  {protocolResetMsg}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {protocolsList.map((proto) => (
                  <div
                    key={proto.id}
                    className="p-3.5 rounded-xl border border-[#D9E6E2] bg-white shadow-2xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[#10201F]">{proto.title}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-[#287C75] border border-teal-200/60">
                        {proto.medicines?.length || 0} meds
                      </span>
                    </div>
                    <p className="text-[11px] text-[#4E6460] line-clamp-1">{proto.diagnosis}</p>
                    <p className="text-[10px] text-[#7D908C] font-mono">
                      {proto.medicines?.map((m) => m.name.split(' ')[0]).join(' + ')}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-4 border-t border-[#D9E6E2] flex items-center justify-between">
              <span className="text-xs text-[#7D908C]">
                Changes take effect immediately across all consultation screens.
              </span>
              <Link
                to="/prescription/new"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#123A3A] hover:bg-[#287C75] rounded-xl shadow-sm transition"
              >
                <span>Test in Prescription Studio</span>
                <ExternalLink size={12} />
              </Link>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'backup' && (
        <div className="bg-white p-6 sm:p-7 rounded-2xl border border-[#D9E6E2] shadow-clinixpulse-xs space-y-6 max-w-3xl">
          <div>
            <h3 className="font-heading text-base font-bold text-[#10201F] flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-teal-50 text-[#287C75] border border-teal-100/80">
                <Database size={18} />
              </span>
              Offline Data Backup & Restore
            </h3>
            <p className="text-xs text-[#4E6460] mt-1.5 leading-relaxed">
              ClinixPulse™ stores all clinical data with high-resilience local caching and cloud synchronization. Regularly export a backup to safeguard patient records.
            </p>
          </div>

          {backupStatus && (
            <div
              className={`flex items-center gap-2.5 p-3.5 rounded-xl text-sm font-medium animate-in fade-in ${
                backupStatus.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-[#123A3A]'
                  : 'bg-rose-50 border border-rose-200 text-rose-800'
              }`}
            >
              {backupStatus.type === 'success' ? (
                <CheckCircle size={18} className="text-[#2E7D5B] flex-shrink-0" />
              ) : (
                <AlertCircle size={18} className="text-[#B94A48] flex-shrink-0" />
              )}
              <span>{backupStatus.message}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="p-5 border border-[#D9E6E2] rounded-xl space-y-3 bg-[#F7FAF8]/70 hover:bg-[#F7FAF8] transition">
              <div className="flex items-center gap-2 text-sm font-bold text-[#10201F]">
                <HardDrive size={16} className="text-[#287C75]" />
                <span>Export Clinic Data</span>
              </div>
              <p className="text-xs text-[#4E6460] leading-relaxed">
                Downloads a JSON file containing all patients, medicines, visits, and settings.
              </p>
              <button
                type="button"
                onClick={handleExportBackup}
                className="btn-primary inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl shadow-clinixpulse-xs"
              >
                <Download size={14} />
                Download JSON Backup
              </button>
            </div>

            <div className="p-5 border border-[#D9E6E2] rounded-xl space-y-3 bg-[#F7FAF8]/70 hover:bg-[#F7FAF8] transition">
              <div className="flex items-center gap-2 text-sm font-bold text-[#10201F]">
                <Upload size={16} className="text-[#287C75]" />
                <span>Restore from Backup</span>
              </div>
              <p className="text-xs text-[#4E6460] leading-relaxed">
                Restore patients and prescription records from a previously exported JSON backup.
              </p>
              <label className="btn-secondary inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl border border-[#D9E6E2] cursor-pointer shadow-clinixpulse-xs">
                <Upload size={14} className="text-[#287C75]" />
                Select Backup File
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleImportBackup}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Local-First Architecture Guarantee */}
          <div className="flex items-start gap-3 p-4 rounded-xl border border-teal-100 bg-teal-50/40 text-xs text-[#4E6460]">
            <ShieldCheck size={18} className="text-[#287C75] flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-[#123A3A]">Local-First Privacy Architecture: </span>
              All clinical consultations, patient vitals, and formulary definitions reside exclusively in your browser’s indexed local storage. Nothing is uploaded to remote servers without your deliberate manual export.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SettingsPage;
