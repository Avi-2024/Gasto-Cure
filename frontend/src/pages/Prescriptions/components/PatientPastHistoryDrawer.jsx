import React, { useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Clock,
  History,
  Calendar,
  Pill,
  Copy,
  AlertTriangle,
  FileText,
  Activity,
  CheckCircle2,
  Stethoscope,
  ChevronRight,
  Printer,
  Eye,
} from 'lucide-react';
import { localVisits } from '../../../services/localStore';

/**
 * Format a raw date string to readable Indian format (e.g., "14 Nov 2026")
 */
function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * PatientPastHistoryDrawer Component
 *
 * Sliding side drawer that displays a patient's complete prescription timeline
 * during active consultation in Prescription Studio.
 *
 * Features:
 * 1. View all previous visits, diagnoses, vitals, and prescribed medicines
 * 2. 1-Click "Preview Rx" to view realistic A4 prescription preview
 * 3. 1-Click "Repeat Rx" to copy past medicines directly into active prescription
 * 4. Immunity to layout stacking context via React Portal (z-[9999])
 * 5. Keyboard accessible (ESC closes)
 */
export default function PatientPastHistoryDrawer({
  isOpen,
  onClose,
  patient,
  currentVisitId = null,
  onRepeatRx,
  onPreviewVisit,
}) {
  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Load patient visits
  const pastVisits = useMemo(() => {
    if (!patient?.id) return [];
    const all = localVisits.getByPatient(patient.id) || [];
    // If current prescription is an existing saved visit, exclude it so doctor sees true past history
    return currentVisitId ? all.filter((v) => v.id !== currentVisitId) : all;
  }, [patient?.id, currentVisitId, isOpen]);

  if (!isOpen || !patient) return null;

  const hasAllergies =
    Boolean(patient.allergies) &&
    !['none', 'no', 'nil', 'na', '-'].includes(patient.allergies.trim().toLowerCase());

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose?.();
    }
  };

  const drawerContent = (
    <div
      className="fixed inset-0 z-[9999] flex justify-end bg-black/45 backdrop-blur-xs transition-opacity animate-in fade-in"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="past-history-drawer-title"
    >
      <div
        className="w-full max-w-xl md:max-w-[560px] bg-white h-full border-l border-[#D9E6E2] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-[#D9E6E2] px-6 py-4 bg-[#F7FAF8] shrink-0">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-[#287C75] border border-teal-100 shadow-clinixpulse-xs">
              <History size={20} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2
                  id="past-history-drawer-title"
                  className="font-heading text-lg font-bold text-[#10201F]"
                >
                  Past Visit Records
                </h2>
                <span className="rounded-full bg-[#E8F3F1] text-[#287C75] px-2 py-0.5 text-xs font-semibold">
                  {pastVisits.length} {pastVisits.length === 1 ? 'Visit' : 'Visits'}
                </span>
              </div>
              <p className="text-xs text-[#5E8A83]">
                {patient.name} • {patient.age ? `${patient.age} Yrs` : ''} {patient.gender || ''} • PT-ID: {patient.id}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-[#7D908C] hover:bg-[#EBF1EE] hover:text-[#10201F] transition cursor-pointer"
            aria-label="Close past history drawer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Patient Health Summary Bar */}
        <div className="px-6 py-2.5 bg-[#F0F5F3] border-b border-[#D9E6E2] flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-[#123A3A]">Allergies:</span>
            {hasAllergies ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-0.5 text-xs font-semibold text-[#B94A48] border border-rose-200">
                <AlertTriangle size={12} />
                {patient.allergies}
              </span>
            ) : (
              <span className="text-[#5E8A83] italic">No documented drug allergies</span>
            )}
          </div>
          {patient.contact && (
            <span className="text-[#287C75] font-mono text-xs whitespace-nowrap pl-2 font-semibold">
              📱 {patient.contact}
            </span>
          )}
        </div>

        {/* Drawer Body - Scrollable Visit Timeline */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {pastVisits.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-14 w-14 rounded-2xl bg-[#E8F3F1] text-[#287C75] flex items-center justify-center mb-3 shadow-clinixpulse-xs">
                <Clock size={28} />
              </div>
              <h3 className="font-heading text-base font-bold text-[#10201F]">
                No Previous Clinical History
              </h3>
              <p className="mt-1 text-xs text-[#7D908C] max-w-sm">
                This is {patient.name}’s first consultation or digital prescription in Gastro Cure. Once saved, previous prescriptions will appear here for 1-click re-prescribing and preview.
              </p>
            </div>
          ) : (
            pastVisits.map((visit, index) => {
              const meds = Array.isArray(visit.medicines)
                ? visit.medicines.filter((m) => m && (m.name || m.dosage))
                : [];

              return (
                <div
                  key={visit.id || index}
                  className="rounded-2xl border border-[#D9E6E2] bg-white p-4.5 shadow-clinixpulse-xs hover:border-[#287C75]/40 transition duration-150"
                >
                  {/* Visit Top Header */}
                  <div className="flex items-start justify-between border-b border-[#EBF1EE] pb-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-teal-50 text-[#287C75] flex items-center justify-center font-bold text-xs">
                        #{pastVisits.length - index}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-heading text-sm font-bold text-[#10201F]">
                            {formatDate(visit.date || visit.createdAt)}
                          </span>
                          <span className="text-[11px] font-mono bg-slate-100 text-[#4E6460] px-1.5 py-0.2 rounded font-semibold">
                            {visit.id}
                          </span>
                        </div>
                        <span className="text-[11px] text-[#7D908C]">
                          Attended by {visit.doctorName || 'Dr. Aarav Sharma'}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons: Preview Rx & Repeat Rx */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => onPreviewVisit?.(visit)}
                        className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1.5 text-xs font-semibold text-[#10201F] border border-[#D9E6E2] hover:bg-[#F7FAF8] hover:border-[#287C75] hover:text-[#287C75] transition shadow-2xs cursor-pointer"
                        title="View realistic A4 prescription preview for this past visit"
                      >
                        <Eye size={13} className="text-[#287C75]" />
                        <span>Preview Rx</span>
                      </button>

                      {meds.length > 0 && onRepeatRx && (
                        <button
                          type="button"
                          onClick={() => {
                            onRepeatRx(meds, visit);
                            onClose?.();
                          }}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-teal-50 px-2.5 py-1.5 text-xs font-semibold text-[#287C75] border border-teal-200 hover:bg-[#287C75] hover:text-white transition shadow-2xs cursor-pointer"
                          title={`Copy ${meds.length} medicines to active prescription`}
                        >
                          <Copy size={13} />
                          <span>Repeat This Rx</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Diagnosis & Symptoms */}
                  {(visit.diagnosis || visit.symptoms) && (
                    <div className="mb-3 space-y-1.5">
                      {visit.diagnosis && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[11px] font-semibold text-[#7D908C] uppercase tracking-wider">
                            Diagnosis:
                          </span>
                          <span className="inline-flex items-center rounded-md bg-[#E8F3F1] px-2 py-0.5 text-xs font-bold text-[#287C75] border border-[#B5D8D0]">
                            {visit.diagnosis}
                          </span>
                        </div>
                      )}
                      {visit.symptoms && (
                        <p className="text-xs text-[#4E6460]">
                          <strong className="text-[#10201F]">Complaints:</strong> {visit.symptoms}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Vitals Snapshot */}
                  {visit.vitals && Object.values(visit.vitals).some(Boolean) && (
                    <div className="mb-3 rounded-xl bg-[#F7FAF8] p-2.5 text-xs flex flex-wrap gap-2 border border-[#EBF1EE]">
                      {visit.vitals.bloodPressure && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-0.5 border border-[#D9E6E2] text-[11px] font-semibold text-[#10201F]">
                          <span className="text-[#7D908C]">BP:</span> {visit.vitals.bloodPressure}
                        </span>
                      )}
                      {visit.vitals.weight && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-0.5 border border-[#D9E6E2] text-[11px] font-semibold text-[#10201F]">
                          <span className="text-[#7D908C]">Wt:</span> {visit.vitals.weight} kg
                        </span>
                      )}
                      {visit.vitals.bloodSugar && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-0.5 border border-[#D9E6E2] text-[11px] font-semibold text-[#10201F]">
                          <span className="text-[#7D908C]">Sugar:</span> {visit.vitals.bloodSugar} mg/dL
                        </span>
                      )}
                      {visit.vitals.pulseRate && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-0.5 border border-[#D9E6E2] text-[11px] font-semibold text-[#10201F]">
                          <span className="text-[#7D908C]">Pulse:</span> {visit.vitals.pulseRate} bpm
                        </span>
                      )}
                      {visit.vitals.spo2 && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-0.5 border border-[#D9E6E2] text-[11px] font-semibold text-[#10201F]">
                          <span className="text-[#7D908C]">SpO2:</span> {visit.vitals.spo2}%
                        </span>
                      )}
                    </div>
                  )}

                  {/* Prescribed Medicines List */}
                  {meds.length > 0 ? (
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#123A3A]">
                          Rx Medicines ({meds.length})
                        </span>
                        <span className="text-[10px] text-[#7D908C]">
                          Schedule • Duration
                        </span>
                      </div>
                      <div className="divide-y divide-[#EBF1EE] rounded-xl border border-[#EBF1EE] overflow-hidden text-xs bg-white">
                        {meds.map((m, mIdx) => (
                          <div
                            key={m.id || mIdx}
                            className="flex items-center justify-between p-2.5 hover:bg-[#F7FAF8] transition"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="text-[#7D908C] font-mono text-[11px] w-4 shrink-0">
                                {mIdx + 1}.
                              </span>
                              <div className="min-w-0">
                                <span className="font-bold text-[#10201F]">
                                  {m.name}
                                </span>
                                {m.remarks && (
                                  <span className="ml-2 text-[11px] text-[#5E8A83] italic">
                                    ({m.remarks})
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-right shrink-0 flex items-center gap-1.5">
                              <span className="font-mono font-bold text-[#287C75] bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100 text-xs">
                                {m.frequency || '-'}
                              </span>
                              {m.duration && (
                                <span className="text-[11px] font-medium text-[#4E6460] bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                                  {m.duration}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-[#7D908C] italic">No medicines recorded in this visit.</p>
                  )}

                  {/* Advice & Follow-up */}
                  {(visit.advice || visit.followUpDate) && (
                    <div className="mt-3 pt-2.5 border-t border-[#EBF1EE] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      {visit.advice ? (
                        <div className="flex items-start gap-1.5 text-[#287C75]">
                          <span className="shrink-0 text-amber-500">💡</span>
                          <span className="font-medium text-[#123A3A] leading-relaxed">
                            {visit.advice}
                          </span>
                        </div>
                      ) : <span />}
                      {visit.followUpDate && (
                        <span className="font-semibold text-[#287C75] bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100 whitespace-nowrap shrink-0">
                          Follow-up: {formatDate(visit.followUpDate)}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Drawer Footer */}
        <div className="border-t border-[#D9E6E2] px-6 py-3.5 bg-[#F7FAF8] flex items-center justify-between shrink-0">
          <span className="text-xs text-[#7D908C]">
            Showing all archived visit records for {patient.name}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary px-4 py-1.5 text-xs font-semibold text-[#10201F] cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(drawerContent, document.body) : drawerContent;
}
