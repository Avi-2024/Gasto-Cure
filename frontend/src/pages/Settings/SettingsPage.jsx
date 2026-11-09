import React, { useState } from 'react';
import { Printer, Building, Database, Download, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import PrintSettingsTab from './tabs/PrintSettingsTab';
import { dataBackup, localSettings } from '../../services/localStore';

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState('print');
  const [backupStatus, setBackupStatus] = useState(null);

  const handleExportBackup = () => {
    try {
      const json = dataBackup.exportJson();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = `clinicrx-backup-${dateStr}.json`;
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
    // Reset file input
    e.target.value = '';
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Settings Top Bar */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-blue-600">Configuration</p>
        <h1 className="text-2xl font-extrabold text-slate-900 mt-1">System & Clinic Settings</h1>
        <p className="text-sm text-slate-500 mt-1">
          Configure physical stationery alignment, doctor demographics, and offline local data storage.
        </p>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 gap-4">
        <button
          type="button"
          onClick={() => setActiveTab('print')}
          className={`pb-3.5 px-2 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'print'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Printer size={16} />
          Print Alignment & Demographics
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('backup')}
          className={`pb-3.5 px-2 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'backup'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Database size={16} />
          Data Backup & Restore
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'print' && <PrintSettingsTab />}

      {activeTab === 'backup' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 max-w-2xl">
          <div>
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Database className="text-blue-600" size={18} />
              Offline Data Backup & Restore
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              ClinicRx stores all clinical data locally in your browser. Regularly export a backup to safeguard patient records.
            </p>
          </div>

          {backupStatus && (
            <div
              className={`flex items-center gap-2.5 p-3.5 rounded-xl text-sm font-medium ${
                backupStatus.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border border-rose-200 text-rose-800'
              }`}
            >
              {backupStatus.type === 'success' ? (
                <CheckCircle size={18} className="text-emerald-600 flex-shrink-0" />
              ) : (
                <AlertCircle size={18} className="text-rose-600 flex-shrink-0" />
              )}
              <span>{backupStatus.message}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-4 border border-slate-200 rounded-xl space-y-3 bg-slate-50">
              <div className="font-semibold text-sm text-slate-800">Export Clinic Data</div>
              <p className="text-xs text-slate-500">
                Downloads a JSON file containing all patients, medicines, visits, and settings.
              </p>
              <button
                type="button"
                onClick={handleExportBackup}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
              >
                <Download size={14} />
                Download JSON Backup
              </button>
            </div>

            <div className="p-4 border border-slate-200 rounded-xl space-y-3 bg-slate-50">
              <div className="font-semibold text-sm text-slate-800">Restore from Backup</div>
              <p className="text-xs text-slate-500">
                Restore patients and prescription records from a previously exported JSON backup.
              </p>
              <label className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 cursor-pointer shadow-sm transition-colors">
                <Upload size={14} className="text-blue-600" />
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
        </div>
      )}
    </div>
  );
}

export default SettingsPage;
