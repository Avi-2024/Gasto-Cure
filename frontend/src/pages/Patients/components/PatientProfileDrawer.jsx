import React, { useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Phone,
  MapPin,
  Calendar,
  AlertTriangle,
  FileText,
  Printer,
  MessageCircle,
  Edit,
  Plus,
  Droplet,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { localVisits, localSettings } from '../../../services/localStore';
import { cleanPhoneNumber, generatePrescriptionWhatsAppLink } from '../../../utils/whatsappHelper';

const formatDisplayDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr.includes('T') ? dateStr : `${dateStr}T00:00:00`);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

const getInitials = (name) => {
  if (!name) return 'PT';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

function PatientProfileDrawer({ isOpen, patient, onClose, onEdit, clinicSettings: propSettings }) {
  const navigate = useNavigate();

  // Escape key listener to dismiss drawer
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

  const visits = useMemo(() => {
    if (!patient?.id) return [];
    return localVisits.getByPatient(patient.id);
  }, [patient?.id, isOpen]);

  if (!isOpen || !patient) return null;

  const clinicSettings = propSettings || localSettings.get();
  const cleanPhone = cleanPhoneNumber(patient.contact || patient.mobile);
  const waChatUrl = cleanPhone ? `https://wa.me/91${cleanPhone}` : '';

  const hasAllergies =
    Boolean(patient.allergies) &&
    patient.allergies.trim().toLowerCase() !== 'none' &&
    patient.allergies.trim().toLowerCase() !== 'no' &&
    patient.allergies.trim().toLowerCase() !== 'nil';

  const handleStartPrescription = () => {
    navigate(`/prescription/new?patientId=${encodeURIComponent(patient.id)}`);
    onClose?.();
  };

  const handleReprintVisit = (visitId) => {
    navigate(`/prescription/new?visitId=${encodeURIComponent(visitId)}`);
    onClose?.();
  };

  const handleShareVisitWhatsApp = (visit) => {
    const waUrl = generatePrescriptionWhatsAppLink(patient, visit, clinicSettings);
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const handleDirectWhatsApp = () => {
    if (!waChatUrl) return;
    window.open(waChatUrl, '_blank', 'noopener,noreferrer');
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose?.();
    }
  };

  const drawerContent = (
    <div
      className="fixed inset-0 z-[9999] flex justify-end bg-black/40 backdrop-blur-xs transition-opacity"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="patient-profile-title"
    >
      <div
        className="w-full max-w-2xl bg-white h-full border-l border-[#D9E6E2] shadow-nivara-lg flex flex-col overflow-hidden animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header Bar */}
        <div className="flex items-center justify-between border-b border-[#D9E6E2] px-6 py-4 bg-[#F7FAF8] shrink-0">
          <div className="flex items-center gap-3.5">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-50 text-[#287C75] font-heading font-bold text-base border border-teal-100 shadow-nivara-xs">
              {getInitials(patient.name)}
            </span>
            <div>
              <h2 id="patient-profile-title" className="font-heading text-lg font-bold text-[#10201F] leading-tight">
                {patient.name}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs font-mono font-semibold text-[#287C75] bg-teal-50 px-2 py-0.5 rounded border border-teal-100">
                  {patient.id}
                </span>
                <span className="text-xs text-[#7D908C]">•</span>
                <span className="text-xs text-[#4E6460]">
                  {patient.age} Yrs, {patient.gender}
                </span>
                {patient.status && (
                  <>
                    <span className="text-xs text-[#7D908C]">•</span>
                    <span className="text-xs font-semibold text-[#2E7D5B] bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      {patient.status}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-[#7D908C] hover:bg-slate-100 hover:text-[#10201F] transition"
            aria-label="Close profile drawer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Drawer Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Patient Summary Card */}
          <div className="rounded-2xl border border-[#D9E6E2] bg-[#F7FAF8]/60 p-5 space-y-4">
            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="rounded-xl bg-white p-3.5 border border-[#D9E6E2] shadow-nivara-xs">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#7D908C]">Contact</p>
                <p className="mt-1 text-sm font-semibold text-[#10201F] flex items-center gap-1.5 tabular-nums">
                  <Phone size={13} className="text-[#287C75]" />
                  {patient.contact || patient.mobile || 'None'}
                </p>
              </div>

              <div className="rounded-xl bg-white p-3.5 border border-[#D9E6E2] shadow-nivara-xs">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#7D908C]">Blood Group</p>
                <p className="mt-1 text-sm font-bold text-[#B94A48] flex items-center gap-1.5">
                  <Droplet size={13} className="text-[#B94A48]" />
                  {patient.bloodGroup || 'Not Tested'}
                </p>
              </div>

              <div className="rounded-xl bg-white p-3.5 border border-[#D9E6E2] shadow-nivara-xs col-span-2 sm:col-span-1">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#7D908C]">Last Visit</p>
                <p className="mt-1 text-sm font-semibold text-[#10201F] flex items-center gap-1.5">
                  <Calendar size={13} className="text-[#4E6460]" />
                  {formatDisplayDate(patient.lastVisit) || 'No visits yet'}
                </p>
              </div>
            </div>

            {/* Address */}
            {patient.address && (
              <div className="flex items-start gap-2 text-xs text-[#4E6460]">
                <MapPin size={14} className="text-[#7D908C] shrink-0 mt-0.5" />
                <span>{patient.address}</span>
              </div>
            )}

            {/* Allergy Alert Banner */}
            {hasAllergies ? (
              <div className="flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-[#B94A48] font-semibold shadow-xs">
                <AlertTriangle size={16} className="text-[#B94A48] shrink-0" />
                <div>
                  <span className="font-bold">Allergies Alert: </span>
                  <span className="font-semibold">{patient.allergies}</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-xl border border-[#D9E6E2] bg-white px-3.5 py-2 text-xs text-[#4E6460]">
                <CheckCircle2 size={14} className="text-[#2E7D5B] shrink-0" />
                <span>No known drug allergies reported</span>
              </div>
            )}

            {/* Notes */}
            {patient.notes && (
              <div className="rounded-xl bg-[#FBF7EE] border border-[#EEDBBA] p-3 text-xs text-[#8C6D23]">
                <p className="font-semibold text-[#8C6D23] mb-1">Important Notes:</p>
                <p className="whitespace-pre-line text-[#6E551B]">{patient.notes}</p>
              </div>
            )}

            {/* Profile Action Buttons */}
            <div className="pt-1 flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleStartPrescription}
                className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5 shadow-sm"
              >
                <Plus size={14} />
                Start Prescription
              </button>

              <button
                type="button"
                onClick={() => onEdit?.(patient)}
                className="btn-secondary text-xs py-2 px-3.5 flex items-center gap-1.5"
              >
                <Edit size={14} />
                Edit Details
              </button>

              {cleanPhone && (
                <button
                  type="button"
                  onClick={handleDirectWhatsApp}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-[#2E7D5B] hover:bg-emerald-100 transition shadow-xs"
                  title="Direct WhatsApp Chat"
                >
                  <MessageCircle size={14} className="text-[#2E7D5B]" />
                  WhatsApp Message
                </button>
              )}
            </div>
          </div>

          {/* Chronological Visit Timeline */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-[#287C75]" />
                <h3 className="text-sm font-heading font-bold uppercase tracking-wider text-[#10201F]">
                  Visit & Prescription History
                </h3>
                <span className="rounded-full bg-teal-50 border border-teal-100 px-2.5 py-0.5 text-xs font-semibold text-[#287C75] font-mono">
                  {visits.length}
                </span>
              </div>
            </div>

            {visits.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#D9E6E2] bg-[#F7FAF8]/50 p-8 text-center space-y-3">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white border border-[#D9E6E2] text-[#7D908C]">
                  <FileText size={22} />
                </div>
                <div>
                  <h4 className="font-heading text-sm font-semibold text-[#10201F]">No Past Visits or History Found</h4>
                  <p className="text-xs text-[#7D908C] mt-1">
                    Start a consultation or write a new prescription to begin building this patient's medical history.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleStartPrescription}
                  className="btn-primary text-xs py-2 px-4 mt-2 inline-flex items-center gap-1.5 shadow-sm"
                >
                  <Plus size={14} />
                  Write First Prescription
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {visits.map((visit) => {
                  const bp = visit.vitals ? (visit.vitals.bp || visit.vitals.bloodPressure) : null;
                  const pulse = visit.vitals ? (visit.vitals.pulse || visit.vitals.pulseRate) : null;
                  const sugar = visit.vitals ? (visit.vitals.sugar || visit.vitals.bloodSugar) : null;
                  const temp = visit.vitals ? (visit.vitals.temp || visit.vitals.temperature) : null;
                  const weight = visit.vitals?.weight;
                  const spo2 = visit.vitals?.spo2;
                  const hasVitals =
                    visit.vitals &&
                    Boolean(
                      bp ||
                      pulse ||
                      sugar ||
                      temp ||
                      weight ||
                      spo2 ||
                      Object.values(visit.vitals).some((val) => val !== null && val !== undefined && val !== '')
                    );
                  const medicines = Array.isArray(visit.medicines) ? visit.medicines : [];
                  const followUp = visit.followUpDate || visit.nextFollowUp;

                  return (
                    <div
                      key={visit.id}
                      className="rounded-2xl border border-[#D9E6E2] bg-white p-5 shadow-nivara-xs space-y-3.5 hover:border-teal-200 hover:shadow-nivara-sm transition duration-200"
                    >
                      {/* Visit Header */}
                      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-[#D9E6E2]/70 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-heading font-semibold text-[#10201F] text-sm">
                              {formatDisplayDate(visit.date || visit.createdAt)}
                            </span>
                            <span className="font-mono text-xs text-[#7D908C] font-medium">
                              ({visit.id})
                            </span>
                          </div>
                          <p className="mt-1 text-xs font-semibold text-[#287C75]">
                            {visit.diagnosis || 'General Consultation'}
                          </p>
                        </div>

                        {/* Visit Actions */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleShareVisitWhatsApp(visit)}
                            className="p-2 rounded-xl border border-emerald-200 bg-emerald-50 text-[#2E7D5B] hover:bg-emerald-100 transition shadow-xs"
                            title="Share via WhatsApp"
                          >
                            <MessageCircle size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReprintVisit(visit.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 border border-teal-200 text-[#287C75] hover:bg-teal-100 text-xs font-semibold transition shadow-xs"
                          >
                            <Printer size={13} />
                            View / Reprint
                          </button>
                        </div>
                      </div>

                      {/* Vitals Strip */}
                      {hasVitals && (
                        <div className="flex flex-wrap gap-2 text-xs bg-[#F7FAF8] p-3 rounded-xl border border-[#D9E6E2]">
                          {bp && (
                            <span className="font-semibold text-[#10201F]">
                              <span className="text-[#7D908C]">BP:</span> {bp}
                            </span>
                          )}
                          {pulse && (
                            <span className="font-medium text-[#4E6460]">
                              <span className="text-[#7D908C]">• Pulse:</span> {pulse} bpm
                            </span>
                          )}
                          {sugar && (
                            <span className="font-medium text-[#4E6460]">
                              <span className="text-[#7D908C]">• Sugar:</span> {sugar} mg/dL
                            </span>
                          )}
                          {weight && (
                            <span className="font-medium text-[#4E6460]">
                              <span className="text-[#7D908C]">• Wt:</span> {weight} kg
                            </span>
                          )}
                          {temp && (
                            <span className="font-medium text-[#4E6460]">
                              <span className="text-[#7D908C]">• Temp:</span> {temp} °F
                            </span>
                          )}
                          {spo2 && (
                            <span className="font-medium text-[#4E6460]">
                              <span className="text-[#7D908C]">• SpO2:</span> {spo2}%
                            </span>
                          )}
                        </div>
                      )}

                      {/* Prescribed Medicines */}
                      {medicines.length > 0 && (
                        <div className="space-y-1.5">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-[#7D908C]">
                            Prescribed Medicines ({medicines.length})
                          </p>
                          <ul className="space-y-1.5 text-xs">
                            {medicines.map((m, idx) => (
                              <li
                                key={idx}
                                className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[#F7FAF8] px-3 py-2 border border-[#D9E6E2]"
                              >
                                <span className="font-semibold text-[#10201F]">
                                  {idx + 1}. {m.name} {m.dosage ? `(${m.dosage})` : ''}
                                </span>
                                <span className="text-[#4E6460] font-mono text-xs">
                                  {[m.frequency, m.timing, m.duration].filter(Boolean).join(' • ')}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Doctor Advice / Notes */}
                      {visit.advice && (
                        <div className="text-xs text-[#8C6D23] bg-[#FBF7EE] p-3 rounded-xl border border-[#EEDBBA]">
                          <span className="font-semibold text-[#8C6D23]">Advice: </span>
                          <span className="text-[#6E551B]">{visit.advice}</span>
                        </div>
                      )}

                      {/* Follow-up info */}
                      {followUp && (
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#2E7D5B]">
                          <Clock size={13} />
                          <span>Follow-up: {formatDisplayDate(followUp)}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(drawerContent, document.body) : drawerContent;
}

export default PatientProfileDrawer;