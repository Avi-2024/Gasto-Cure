import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Activity,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  Eye,
  FileText,
  Filter,
  History,
  Pill,
  Plus,
  Printer,
  Search,
  Sparkles,
  Stethoscope,
  X,
} from 'lucide-react';
import PatientAvatar from '../../../components/common/PatientAvatar';
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
 * PatientPastHistoryDrawer Component (Senior Clinical UX)
 *
 * Sliding side drawer that displays a patient's complete prescription timeline
 * during active consultation in Prescription Studio.
 *
 * Features:
 * 1. Collapsible Visit Accordions (latest expanded, older visits compact)
 * 2. Instant Search & Filter by medicine, diagnosis, complaint, or date
 * 3. 1-Click "Preview Rx" to view authentic A4 prescription preview
 * 4. 1-Click "Repeat This Rx" (entire visit) OR single medicine "+ Add"
 * 5. Clinical Vitals metric tiles (BP, Wt, Sugar, Pulse, SpO2)
 * 6. Prominent Allergy and Demographics summary banner
 * 7. Keyboard accessible (ESC closes) & backdrop blur
 */
export default function PatientPastHistoryDrawer({
  isOpen,
  onClose,
  patient,
  currentVisitId = null,
  onRepeatRx,
  onAddSingleMed,
  onPreviewVisit,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIds, setExpandedIds] = useState({});

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

  // Expand all visits if 4 or fewer visits, otherwise expand the first visit
  useEffect(() => {
    if (pastVisits.length > 0) {
      const initialExpanded = {};
      if (pastVisits.length <= 4) {
        pastVisits.forEach((v) => {
          initialExpanded[v.id || 0] = true;
        });
      } else {
        initialExpanded[pastVisits[0].id || 0] = true;
      }
      setExpandedIds(initialExpanded);
    }
  }, [pastVisits]);

  // Filter visits by search query
  const filteredVisits = useMemo(() => {
    if (!searchQuery.trim()) return pastVisits;
    const q = searchQuery.toLowerCase().trim();
    return pastVisits.filter((v) => {
      const matchDiag = (v.diagnosis || '').toLowerCase().includes(q);
      const matchSymp = (v.symptoms || '').toLowerCase().includes(q);
      const matchMeds =
        Array.isArray(v.medicines) &&
        v.medicines.some(
          (m) =>
            (m?.name || '').toLowerCase().includes(q) ||
            (m?.remarks || '').toLowerCase().includes(q)
        );
      const matchDate = (v.date || v.createdAt || '').toLowerCase().includes(q);
      const matchId = (v.id || '').toLowerCase().includes(q);
      return matchDiag || matchSymp || matchMeds || matchDate || matchId;
    });
  }, [pastVisits, searchQuery]);

  if (!isOpen || !patient) return null;

  const hasAllergies =
    Boolean(patient.allergies) &&
    !['none', 'no', 'nil', 'na', '-'].includes(patient.allergies.trim().toLowerCase());

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose?.();
    }
  };

  const isAllExpanded =
    filteredVisits.length > 0 && filteredVisits.every((v) => expandedIds[v.id || 0]);

  const toggleExpandAll = () => {
    if (isAllExpanded) {
      setExpandedIds({});
    } else {
      const all = {};
      filteredVisits.forEach((v) => {
        all[v.id || 0] = true;
      });
      setExpandedIds(all);
    }
  };

  const toggleVisit = (id) => {
    setExpandedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const drawerContent = (
    <div
      className="fixed inset-0 z-[9999] flex justify-end bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="past-history-drawer-title"
    >
      <div
        className="w-full max-w-2xl lg:max-w-3xl bg-white h-full border-l border-[#D9E6E2] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header with Patient Card */}
        <div className="border-b border-[#D9E6E2] bg-[#F7FAF8] px-6 py-4 shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <PatientAvatar
                gender={patient.gender}
                name={patient.name}
                className="h-12 w-12 shrink-0 border-2 border-white shadow-xs"
              />
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2
                    id="past-history-drawer-title"
                    className="font-heading text-lg font-bold text-[#10201F]"
                  >
                    Past Visit Records
                  </h2>
                  <span className="rounded-full bg-[#E8F3F1] text-[#287C75] px-2.5 py-0.5 text-xs font-bold border border-[#B5D8D0]">
                    {pastVisits.length} {pastVisits.length === 1 ? 'Visit' : 'Visits'}
                  </span>
                  {patient.bloodGroup && (
                    <span className="rounded-md bg-rose-50 text-rose-700 px-2 py-0.5 text-xs font-bold border border-rose-200">
                      🩸 {patient.bloodGroup}
                    </span>
                  )}
                </div>
                <div className="mt-0.5 flex items-center gap-2 text-xs text-[#5E8A83] flex-wrap">
                  <span className="font-semibold text-[#10201F]">{patient.name}</span>
                  <span>•</span>
                  <span>
                    {patient.age ? `${patient.age} Yrs` : ''} {patient.gender || 'Patient'}
                  </span>
                  <span>•</span>
                  <span className="font-mono font-semibold">PT-ID: {patient.id}</span>
                  {patient.contact && (
                    <>
                      <span>•</span>
                      <span className="font-mono text-[#287C75] font-semibold">
                        📱 {patient.contact}
                      </span>
                    </>
                  )}
                </div>
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

          {/* Allergy Alert Strip (High Visibility) */}
          {hasAllergies && (
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-1.5 border border-rose-200 text-xs font-semibold text-rose-800">
              <AlertTriangle size={14} className="text-rose-600 shrink-0" />
              <span>Known Drug Allergies:</span>
              <span className="font-bold uppercase tracking-wide text-rose-900 bg-white px-2 py-0.5 rounded border border-rose-200">
                {patient.allergies}
              </span>
            </div>
          )}
        </div>

        {/* Search & Timeline Filter Bar */}
        <div className="px-6 py-3 bg-white border-b border-[#D9E6E2] flex items-center justify-between gap-3 shrink-0">
          <div className="relative flex-1">
            <Search
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#7D908C]"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search past medicines, diagnosis, symptoms, or date..."
              className="w-full rounded-xl border border-[#D9E6E2] bg-[#F7FAF8] py-2 pl-9 pr-8 text-xs font-medium text-[#10201F] placeholder-[#7D908C] focus:border-[#287C75] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#287C75]/15 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#7D908C] hover:text-[#10201F] text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-semibold text-[#7D908C] whitespace-nowrap hidden sm:inline">
              Showing {filteredVisits.length} of {pastVisits.length}
            </span>
            <button
              type="button"
              onClick={toggleExpandAll}
              className="inline-flex items-center gap-1 rounded-xl border border-[#D9E6E2] bg-white px-3 py-1.5 text-xs font-semibold text-[#4E6460] hover:bg-[#F7FAF8] hover:text-[#10201F] transition cursor-pointer"
            >
              {isAllExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              <span>{isAllExpanded ? 'Collapse All' : 'Expand All'}</span>
            </button>
          </div>
        </div>

        {/* Drawer Body - Timeline Accordion List */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 bg-[#F7FAF8]/50">
          {filteredVisits.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-3xl border border-dashed border-[#D9E6E2] p-8">
              <div className="h-14 w-14 rounded-2xl bg-[#E8F3F1] text-[#287C75] flex items-center justify-center mb-3 shadow-xs">
                {searchQuery ? <Search size={26} /> : <Clock size={28} />}
              </div>
              <h3 className="font-heading text-base font-bold text-[#10201F]">
                {searchQuery ? 'No Matching Records Found' : 'No Previous Clinical History'}
              </h3>
              <p className="mt-1 text-xs text-[#7D908C] max-w-sm">
                {searchQuery
                  ? `No previous prescriptions matched "${searchQuery}". Clear your search query to view all visit records.`
                  : `This is ${patient.name}'s first consultation in ClinixPulse. Once saved, previous prescriptions will appear here for 1-click re-prescribing and realistic A4 print preview.`}
              </p>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="mt-4 rounded-xl bg-[#287C75]/10 text-[#287C75] px-4 py-1.5 text-xs font-bold hover:bg-[#287C75] hover:text-white transition cursor-pointer"
                >
                  Clear Search Filter
                </button>
              )}
            </div>
          ) : (
            filteredVisits.map((visit, index) => {
              const visitKey = visit.id || index;
              const isExpanded = Boolean(expandedIds[visitKey]);
              const meds = Array.isArray(visit.medicines)
                ? visit.medicines.filter((m) => m && (m.name || m.dosage))
                : [];

              return (
                <div
                  key={visitKey}
                  className="rounded-2xl border border-[#D9E6E2] bg-white shadow-xs transition hover:border-[#287C75]/50 overflow-hidden"
                >
                  {/* Visit Card Header Bar (Clickable Accordion Trigger) */}
                  <div
                    onClick={() => toggleVisit(visitKey)}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-white cursor-pointer select-none hover:bg-[#F7FAF8]/80 transition border-b border-[#EBF1EE]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-[#287C75] font-bold text-xs border border-teal-100 shadow-2xs">
                        #{pastVisits.length - index}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-heading text-sm font-bold text-[#10201F] whitespace-nowrap">
                            {formatDate(visit.date || visit.createdAt)}
                          </span>
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#4E6460]">
                            {visit.id}
                          </span>
                          {index === 0 && (
                            <span className="rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.2 text-[10px] font-bold border border-emerald-200">
                              Latest Visit
                            </span>
                          )}
                        </div>

                        <div className="mt-1 flex items-center gap-2 text-xs text-[#7D908C] flex-wrap">
                          <span>Attended by {visit.doctorName || 'Dr. Aarav Sharma'}</span>
                          <span>•</span>
                          <span className="font-medium text-[#287C75]">
                            💊 {meds.length} {meds.length === 1 ? 'Medicine' : 'Medicines'}
                          </span>
                          {visit.diagnosis && (
                            <>
                              <span>•</span>
                              <span className="font-semibold text-[#10201F] truncate max-w-[200px]">
                                {visit.diagnosis}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Controls & Accordion Chevron */}
                    <div
                      className="flex items-center gap-2 self-end sm:self-center shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* 1-Click Realistic A4 Preview */}
                      <button
                        type="button"
                        onClick={() => onPreviewVisit?.(visit)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-xs font-bold text-[#10201F] border border-[#D9E6E2] hover:bg-[#F7FAF8] hover:border-[#287C75] hover:text-[#287C75] transition shadow-2xs cursor-pointer"
                        title="View realistic A4 prescription preview for this past visit"
                      >
                        <Eye size={13} className="text-[#287C75]" />
                        <span>Preview Rx</span>
                      </button>

                      {/* 1-Click Repeat Entire Prescription */}
                      {meds.length > 0 && onRepeatRx && (
                        <button
                          type="button"
                          onClick={() => {
                            onRepeatRx(meds, visit);
                            onClose?.();
                          }}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-teal-50 px-3 py-1.5 text-xs font-bold text-[#287C75] border border-teal-200 hover:bg-[#287C75] hover:text-white transition shadow-2xs cursor-pointer"
                          title={`Copy all ${meds.length} medicines to active consultation`}
                        >
                          <Copy size={13} />
                          <span>Repeat This Rx</span>
                        </button>
                      )}

                      {/* Accordion Toggle Chevron */}
                      <button
                        type="button"
                        onClick={() => toggleVisit(visitKey)}
                        className="p-1.5 text-[#7D908C] hover:text-[#10201F] transition rounded-lg hover:bg-slate-100 cursor-pointer"
                        title={isExpanded ? 'Collapse visit details' : 'Expand visit details'}
                      >
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Accordion Body */}
                  {isExpanded && (
                    <div className="p-4 space-y-4 bg-white animate-in fade-in duration-150">
                      {/* Diagnosis & Complaints */}
                      {(visit.diagnosis || visit.symptoms) && (
                        <div className="rounded-xl bg-[#F7FAF8] p-3 border border-[#EBF1EE] space-y-2">
                          {visit.diagnosis && (
                            <div className="flex items-start gap-2">
                              <span className="text-[11px] font-bold text-[#7D908C] uppercase tracking-wider shrink-0 mt-0.5">
                                Diagnosis:
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {visit.diagnosis.split('&').map((dPart, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-flex items-center rounded-lg bg-[#E8F3F1] px-2.5 py-0.5 text-xs font-bold text-[#287C75] border border-[#B5D8D0]"
                                  >
                                    {dPart.trim()}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {visit.symptoms && (
                            <div className="flex items-start gap-2 text-xs text-[#4E6460]">
                              <span className="font-bold text-[#10201F] shrink-0">Complaints:</span>
                              <span className="leading-relaxed">{visit.symptoms}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Clinical Vitals Matrix */}
                      {visit.vitals && Object.values(visit.vitals).some(Boolean) && (
                        <div>
                          <span className="text-[11px] font-bold uppercase tracking-wider text-[#7D908C] block mb-1.5">
                            Clinical Vitals Snapshot
                          </span>
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                            {visit.vitals.bloodPressure && (
                              <div className="rounded-xl border border-[#D9E6E2] bg-[#F7FAF8] p-2 text-center">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-[#7D908C] block">
                                  BP (mmHg)
                                </span>
                                <span className="font-mono text-xs font-bold text-[#10201F]">
                                  {visit.vitals.bloodPressure}
                                </span>
                              </div>
                            )}
                            {visit.vitals.weight && (
                              <div className="rounded-xl border border-[#D9E6E2] bg-[#F7FAF8] p-2 text-center">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-[#7D908C] block">
                                  Weight
                                </span>
                                <span className="font-mono text-xs font-bold text-[#10201F]">
                                  {visit.vitals.weight} kg
                                </span>
                              </div>
                            )}
                            {visit.vitals.bloodSugar && (
                              <div className="rounded-xl border border-[#D9E6E2] bg-[#F7FAF8] p-2 text-center">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-[#7D908C] block">
                                  Sugar (mg/dL)
                                </span>
                                <span className="font-mono text-xs font-bold text-[#10201F]">
                                  {visit.vitals.bloodSugar}
                                </span>
                              </div>
                            )}
                            {visit.vitals.pulseRate && (
                              <div className="rounded-xl border border-[#D9E6E2] bg-[#F7FAF8] p-2 text-center">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-[#7D908C] block">
                                  Pulse
                                </span>
                                <span className="font-mono text-xs font-bold text-[#10201F]">
                                  {visit.vitals.pulseRate} bpm
                                </span>
                              </div>
                            )}
                            {visit.vitals.spo2 && (
                              <div className="rounded-xl border border-[#D9E6E2] bg-[#F7FAF8] p-2 text-center">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-[#7D908C] block">
                                  SpO2
                                </span>
                                <span
                                  className={`font-mono text-xs font-bold ${
                                    Number(visit.vitals.spo2) < 90 ? 'text-rose-600' : 'text-[#10201F]'
                                  }`}
                                >
                                  {visit.vitals.spo2}%
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Prescribed Medicines Table with Single-Med Repeat */}
                      {meds.length > 0 ? (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[#10201F]">
                              Prescribed Medicines ({meds.length})
                            </span>
                            <span className="text-[10px] text-[#7D908C]">
                              Click "+ Add" to repeat an individual formulation
                            </span>
                          </div>

                          <div className="rounded-xl border border-[#D9E6E2] overflow-hidden text-xs divide-y divide-[#EBF1EE]">
                            {meds.map((m, mIdx) => (
                              <div
                                key={m.id || mIdx}
                                className="flex items-center justify-between p-2.5 hover:bg-[#F7FAF8] transition"
                              >
                                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                                  <span className="text-[#7D908C] font-mono text-[11px] w-4 shrink-0">
                                    {mIdx + 1}.
                                  </span>
                                  <div className="min-w-0">
                                    <span className="font-bold text-[#10201F] text-xs">
                                      {m.name}
                                    </span>
                                    {m.remarks && (
                                      <span className="ml-2 text-[11px] text-[#5E8A83] italic">
                                        ({m.remarks})
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="text-right shrink-0 flex items-center gap-2">
                                  <span className="font-mono font-bold text-[#287C75] bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100 text-xs">
                                    {m.frequency || '-'}
                                  </span>
                                  {m.duration && (
                                    <span className="text-[11px] font-medium text-[#4E6460] bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                                      {m.duration}
                                    </span>
                                  )}

                                  {/* Individual Medicine Add Action */}
                                  {onAddSingleMed && (
                                    <button
                                      type="button"
                                      onClick={() => onAddSingleMed(m, visit)}
                                      className="inline-flex items-center gap-0.5 rounded-md bg-[#287C75]/10 px-2 py-0.5 text-[11px] font-bold text-[#287C75] hover:bg-[#287C75] hover:text-white transition cursor-pointer"
                                      title={`Add only ${m.name} to active prescription`}
                                      aria-label={`Add ${m.name} to active prescription`}
                                    >
                                      <Plus size={11} />
                                      <span>Add</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-[#7D908C] italic">
                          No medicines recorded in this visit.
                        </p>
                      )}

                      {/* Doctor Advice & Scheduled Follow-up */}
                      {(visit.advice || visit.followUpDate) && (
                        <div className="rounded-xl border border-amber-200/80 bg-amber-50/50 p-3 space-y-2">
                          {visit.advice && (
                            <div className="flex items-start gap-2 text-xs">
                              <span className="text-amber-600 shrink-0 mt-0.5">💡</span>
                              <div>
                                <span className="font-bold text-[#10201F] mr-1">
                                  Advice & Instructions:
                                </span>
                                <span className="text-[#4E6460] leading-relaxed">
                                  {visit.advice}
                                </span>
                              </div>
                            </div>
                          )}

                          {visit.followUpDate && (
                            <div className="flex items-center gap-2 pt-1.5 border-t border-amber-200/60 text-xs">
                              <Calendar size={13} className="text-[#287C75]" />
                              <span className="font-semibold text-[#10201F]">Follow-up Visit:</span>
                              <span className="font-bold text-[#287C75] bg-white px-2 py-0.5 rounded-md border border-teal-200">
                                {formatDate(visit.followUpDate)}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Drawer Sticky Footer */}
        <div className="border-t border-[#D9E6E2] px-6 py-3.5 bg-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-[#7D908C]">
            <History size={14} className="text-[#287C75]" />
            <span>
              Showing {filteredVisits.length} recorded consultations for {patient.name}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#D9E6E2] bg-[#F7FAF8] hover:bg-slate-100 px-4 py-1.5 text-xs font-bold text-[#10201F] transition cursor-pointer shadow-2xs"
          >
            Close History
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(drawerContent, document.body)
    : drawerContent;
}
