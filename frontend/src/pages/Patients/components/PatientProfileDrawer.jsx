import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  User,
  Phone,
  MapPin,
  Calendar,
  AlertTriangle,
  FileText,
  Printer,
  MessageCircle,
  Edit,
  Plus,
  Activity,
  Heart,
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

function PatientProfileDrawer({ isOpen, patient, onClose, onEdit, clinicSettings: propSettings }) {
  const navigate = useNavigate();

  // Escape key handler
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

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs transition-opacity"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="patient-profile-title"
    >
      <div
        className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50/90 shrink-0">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
              <User size={20} />
            </span>
            <div>
              <h2 id="patient-profile-title" className="text-lg font-bold text-slate-900 leading-tight">
                {patient.name}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs font-mono font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                  {patient.id}
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs text-slate-600">
                  {patient.age} Yrs, {patient.gender}
                </span>
                {patient.status && (
                  <>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
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
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-200/70 hover:text-slate-600 transition"
            aria-label="Close profile drawer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Drawer Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Patient Summary Card */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 space-y-4">
            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="rounded-xl bg-white p-3 border border-slate-200/80 shadow-xs">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Contact</p>
                <p className="mt-1 text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                  <Phone size={13} className="text-blue-600" />
                  {patient.contact || patient.mobile || 'None'}
                </p>
              </div>

              <div className="rounded-xl bg-white p-3 border border-slate-200/80 shadow-xs">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Blood Group</p>
                <p className="mt-1 text-sm font-bold text-rose-700 flex items-center gap-1.5">
                  <Droplet size={13} className="text-rose-600" />
                  {patient.bloodGroup || 'Not Tested'}
                </p>
              </div>

              <div className="rounded-xl bg-white p-3 border border-slate-200/80 shadow-xs col-span-2 sm:col-span-1">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Last Visit</p>
                <p className="mt-1 text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                  <Calendar size={13} className="text-slate-500" />
                  {formatDisplayDate(patient.lastVisit) || 'No visits yet'}
                </p>
              </div>
            </div>

            {/* Address */}
            {patient.address && (
              <div className="flex items-start gap-2 text-xs text-slate-600">
                <MapPin size={14} className="text-slate-400 shrink-0 mt-0.5" />
                <span>{patient.address}</span>
              </div>
            )}

            {/* Allergy Alert Banner */}
            {hasAllergies ? (
              <div className="flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-800">
                <AlertTriangle size={16} className="text-rose-600 shrink-0" />
                <div>
                  <span className="font-bold">Allergies Alert: </span>
                  <span className="font-medium">{patient.allergies}</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-500">
                <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                <span>No known drug allergies reported</span>
              </div>
            )}

            {/* Notes */}
            {patient.notes && (
              <div className="rounded-xl bg-amber-50/60 border border-amber-200/80 p-3 text-xs text-amber-900">
                <p className="font-semibold text-amber-800 mb-1">Important Notes:</p>
                <p className="whitespace-pre-line">{patient.notes}</p>
              </div>
            )}

            {/* Profile Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleStartPrescription}
                className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5"
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
                  className="inline-flex items-center gap-1.5 rounded-2xl border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition"
                  title="Direct WhatsApp Chat"
                >
                  <MessageCircle size={14} className="text-emerald-600" />
                  WhatsApp Message
                </button>
              )}
            </div>
          </div>

          {/* Chronological Visit Timeline */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-blue-600" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                  Visit & Prescription History
                </h3>
                <span className="rounded-full bg-slate-100 border border-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-600">
                  {visits.length}
                </span>
              </div>
            </div>

            {visits.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center space-y-3">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white border border-slate-200 text-slate-400">
                  <FileText size={22} />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-700">No Past Visits or History Found</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Start a consultation or write a new prescription to begin building this patient's medical history.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleStartPrescription}
                  className="btn-primary text-xs py-2 px-4 mt-2 inline-flex items-center gap-1.5"
                >
                  <Plus size={14} />
                  Write First Prescription
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {visits.map((visit) => {
                  const hasVitals =
                    visit.vitals &&
                    Object.values(visit.vitals).some((val) => val !== null && val !== undefined && val !== '');
                  const medicines = Array.isArray(visit.medicines) ? visit.medicines : [];
                  const followUp = visit.followUpDate || visit.nextFollowUp;

                  return (
                    <div
                      key={visit.id}
                      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3 hover:border-blue-200 transition"
                    >
                      {/* Visit Header */}
                      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900 text-sm">
                              {formatDisplayDate(visit.date || visit.createdAt)}
                            </span>
                            <span className="font-mono text-xs text-slate-400 font-medium">
                              ({visit.id})
                            </span>
                          </div>
                          <p className="mt-1 text-xs font-semibold text-blue-700">
                            {visit.diagnosis || 'General Consultation'}
                          </p>
                        </div>

                        {/* Visit Actions */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleShareVisitWhatsApp(visit)}
                            className="p-1.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition"
                            title="Share via WhatsApp"
                          >
                            <MessageCircle size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReprintVisit(visit.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 text-xs font-semibold transition"
                          >
                            <Printer size={13} />
                            View / Reprint
                          </button>
                        </div>
                      </div>

                      {/* Vitals Strip */}
                      {hasVitals && (
                        <div className="flex flex-wrap gap-2 text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          {visit.vitals.bp && (
                            <span className="font-medium text-slate-700">
                              <span className="text-slate-400">BP:</span> {visit.vitals.bp}
                            </span>
                          )}
                          {visit.vitals.pulse && (
                            <span className="font-medium text-slate-700">
                              <span className="text-slate-400">• Pulse:</span> {visit.vitals.pulse} bpm
                            </span>
                          )}
                          {(visit.vitals.sugar || visit.vitals.bloodSugar) && (
                            <span className="font-medium text-slate-700">
                              <span className="text-slate-400">• Sugar:</span> {visit.vitals.sugar || visit.vitals.bloodSugar} mg/dL
                            </span>
                          )}
                          {visit.vitals.weight && (
                            <span className="font-medium text-slate-700">
                              <span className="text-slate-400">• Wt:</span> {visit.vitals.weight} kg
                            </span>
                          )}
                          {(visit.vitals.temp || visit.vitals.temperature) && (
                            <span className="font-medium text-slate-700">
                              <span className="text-slate-400">• Temp:</span> {visit.vitals.temp || visit.vitals.temperature} °F
                            </span>
                          )}
                        </div>
                      )}

                      {/* Prescribed Medicines */}
                      {medicines.length > 0 && (
                        <div className="space-y-1.5">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            Prescribed Medicines ({medicines.length})
                          </p>
                          <ul className="space-y-1 text-xs">
                            {medicines.map((m, idx) => (
                              <li
                                key={idx}
                                className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50/70 px-2.5 py-1.5 border border-slate-100"
                              >
                                <span className="font-medium text-slate-800">
                                  {idx + 1}. {m.name} {m.dosage ? `(${m.dosage})` : ''}
                                </span>
                                <span className="text-slate-500 font-mono text-[11px]">
                                  {[m.frequency, m.timing, m.duration].filter(Boolean).join(' • ')}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Doctor Advice / Notes */}
                      {visit.advice && (
                        <div className="text-xs text-slate-600 bg-amber-50/40 p-2.5 rounded-xl border border-amber-100">
                          <span className="font-semibold text-amber-800">Advice: </span>
                          <span>{visit.advice}</span>
                        </div>
                      )}

                      {/* Follow-up info */}
                      {followUp && (
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
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
}

export default PatientProfileDrawer;
