import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Printer,
  Plus,
  Sliders,
  MessageCircle,
  Eye,
  Save,
  Check,
  User,
  Calendar,
  ArrowLeft,
  Activity,
  Phone,
  Clock,
  Sparkles,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';
import MedicineTable from './components/MedicineTable';
import AutoResizeTextarea from './components/AutoResizeTextarea';
import PrintPreviewModal from './components/PrintPreviewModal';
import { localPatients, localVisits, localSettings } from '../../services/localStore';
import { applyPrintSettings } from '../../utils/printStyles';
import { generatePrescriptionWhatsAppLink } from '../../utils/whatsappHelper';
import './PrescriptionPage.css';

const getInitials = (name = '') => {
  if (!name) return 'PT';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/**
 * PrescriptionPage Component
 *
 * Nivara Prescription Studio & Fast Formulary Autocomplete (/prescription/new)
 * - Patient Identity Banner with Demographics & Quick Switcher
 * - 6-Point Vitals Strip with Tabular Nums & Units (BP, Weight, Blood Sugar, Temp, Pulse, SpO2)
 * - Auto-Expanding Clinical Findings (Symptoms, Diagnosis, Advice)
 * - Rx Medicine Table with instant formulary search & default autofill
 * - Follow-up Selector with quick chips (7 Days, 14 Days, 30 Days, Custom Date)
 * - Bottom Action Dock (Print Preview, Direct Print, Save Visit, WhatsApp Share)
 * - Pad Mode vs Digital Letterhead alignment with live mm offset calibration
 */
function PrescriptionPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const patientIdParam = searchParams.get('patientId');
  const visitIdParam = searchParams.get('visitId') || searchParams.get('rxId');

  // Clinic and Print Settings
  const [clinicSettings, setClinicSettings] = useState(() => localSettings.get());
  const [printSettings, setPrintSettings] = useState(
    () => localSettings.get().print || { topOffsetMm: 60, padMode: true }
  );

  // Current Rx / Visit ID if saved or loaded
  const [currentRxId, setCurrentRxId] = useState('');
  const [prescriptionDate, setPrescriptionDate] = useState(() => new Date().toISOString());
  const [saveFeedback, setSaveFeedback] = useState(null);

  // Patient Info & Switcher
  const [patient, setPatient] = useState(null);
  const [allPatients, setAllPatients] = useState([]);
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [showPatientSwitcher, setShowPatientSwitcher] = useState(false);

  // Vitals: 6-Point Strip (BP, Weight, Sugar, Temp, Pulse, SpO2)
  const [vitals, setVitals] = useState({
    bloodPressure: '',
    weight: '',
    bloodSugar: '',
    temperature: '',
    pulseRate: '',
    spo2: '',
  });

  // Clinical Details
  const [symptoms, setSymptoms] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [advice, setAdvice] = useState('');
  const [notes, setNotes] = useState('');

  // Follow-up
  const [followUpOption, setFollowUpOption] = useState('14'); // '7' | '14' | '30' | 'custom'
  const [followUpCustomDays, setFollowUpCustomDays] = useState('');
  const [followUpCustomDate, setFollowUpCustomDate] = useState('');

  // Medicines
  const [medicines, setMedicines] = useState([
    { id: 1, name: '', dosage: '', frequency: '1-0-1', timing: '', duration: '', remarks: '' },
  ]);

  // Preview Modal
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Apply print settings on mount and when changed
  useEffect(() => {
    applyPrintSettings(printSettings);
  }, [printSettings]);

  // Load all patients for selection fallback
  useEffect(() => {
    setAllPatients(localPatients.getAll());
  }, []);

  // Load patient or visit data
  useEffect(() => {
    if (visitIdParam) {
      const visit = localVisits.getById(visitIdParam);
      if (visit) {
        setCurrentRxId(visit.id);
        if (visit.date || visit.createdAt) {
          setPrescriptionDate(visit.date || visit.createdAt);
        }
        if (visit.patientId) {
          const pt = localPatients.getById(visit.patientId);
          setPatient(
            pt || {
              id: visit.patientId,
              name: visit.patientName,
              contact: visit.patientMobile,
              age: visit.patientAge,
              gender: visit.patientGender,
            }
          );
        } else {
          setPatient({
            name: visit.patientName,
            contact: visit.patientMobile,
            age: visit.patientAge,
            gender: visit.patientGender,
          });
        }

        if (visit.vitals) {
          setVitals({
            bloodPressure: visit.vitals.bloodPressure || '',
            weight: visit.vitals.weight || '',
            bloodSugar: visit.vitals.bloodSugar || '',
            temperature: visit.vitals.temperature || '',
            pulseRate: visit.vitals.pulseRate || '',
            spo2: visit.vitals.spo2 || '',
          });
        }
        if (visit.symptoms) setSymptoms(visit.symptoms);
        if (visit.diagnosis) setDiagnosis(visit.diagnosis);
        if (visit.advice) setAdvice(visit.advice);
        if (visit.notes) setNotes(visit.notes);
        if (Array.isArray(visit.medicines) && visit.medicines.length > 0) {
          setMedicines(visit.medicines.map((m, idx) => ({ id: m.id || idx + 1, ...m })));
        }
        if (visit.followUpDays) {
          const daysStr = String(visit.followUpDays);
          if (['7', '14', '30'].includes(daysStr)) {
            setFollowUpOption(daysStr);
          } else {
            setFollowUpOption('custom');
            setFollowUpCustomDays(daysStr);
          }
        } else if (visit.followUpDate) {
          setFollowUpOption('custom');
          setFollowUpCustomDate(visit.followUpDate);
        }
      }
    } else if (patientIdParam) {
      const foundPatient = localPatients.getById(patientIdParam);
      if (foundPatient) {
        setPatient(foundPatient);
      }
    }
  }, [patientIdParam, visitIdParam]);

  // Calculate follow-up dates
  const getFollowUpIsoDate = () => {
    if (followUpOption === 'custom') {
      if (followUpCustomDate) return followUpCustomDate;
      const days = parseInt(followUpCustomDays, 10);
      if (days && !isNaN(days)) {
        const d = new Date();
        d.setDate(d.getDate() + days);
        return d.toISOString().split('T')[0];
      }
      return '';
    }

    const days = parseInt(followUpOption, 10);
    if (days && !isNaN(days)) {
      const d = new Date();
      d.setDate(d.getDate() + days);
      return d.toISOString().split('T')[0];
    }
    return '';
  };

  const getFollowUpFormattedDisplay = () => {
    const iso = getFollowUpIsoDate();
    if (!iso) return '';
    try {
      const parts = iso.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return iso;
    } catch {
      return iso;
    }
  };

  const handleQuickOffsetChange = (e) => {
    const newOffset = Number(e.target.value);
    const updated = {
      ...printSettings,
      topOffsetMm: newOffset,
    };
    setPrintSettings(updated);
    localSettings.update({ print: updated });
    applyPrintSettings(updated);
  };

  const handleTogglePadMode = (padMode) => {
    const updated = {
      ...printSettings,
      padMode,
    };
    setPrintSettings(updated);
    localSettings.update({ print: updated });
    applyPrintSettings(updated);
  };

  const handleVitalChange = (field, value) => {
    setVitals((prev) => ({ ...prev, [field]: value }));
  };

  const addMedicineRow = () => {
    setMedicines((prev) => {
      const newId = prev.length > 0 ? Math.max(...prev.map((m) => m.id)) + 1 : 1;
      return [
        ...prev,
        { id: newId, name: '', dosage: '', frequency: '', timing: '', duration: '', remarks: '' },
      ];
    });
  };

  const removeMedicineRow = (id) => {
    setMedicines((prev) => (prev.length > 1 ? prev.filter((med) => med.id !== id) : prev));
  };

  const updateMedicine = (id, field, value) => {
    setMedicines((prev) => prev.map((med) => (med.id === id ? { ...med, [field]: value } : med)));
  };

  const updateMedicineFull = (id, fullData) => {
    setMedicines((prev) => prev.map((med) => (med.id === id ? { ...med, ...fullData } : med)));
  };

  /**
   * Validates and saves prescription permanently to localVisits.
   * Updates patient's lastVisit and nextFollowUp.
   */
  const handleSavePrescription = (status = 'SAVED', triggerPrint = false) => {
    if (!patient) {
      alert('Please select a patient before saving.');
      return null;
    }

    const validMeds = medicines.filter((m) => m && (m.name || m.dosage));
    if (validMeds.length === 0 && !diagnosis.trim() && !symptoms.trim()) {
      alert('Please enter at least one medicine or a diagnosis before saving.');
      return null;
    }

    const calculatedFollowUpDate = getFollowUpIsoDate();
    let computedDays = null;
    if (followUpOption === 'custom' && followUpCustomDays) {
      computedDays = Number(followUpCustomDays);
    } else if (followUpOption !== 'custom') {
      computedDays = Number(followUpOption);
    }

    const visitPayload = {
      id: currentRxId || undefined,
      patientId: patient.id,
      patientName: patient.name,
      patientMobile: patient.contact || patient.mobile || '',
      patientAge: patient.age,
      patientGender: patient.gender,
      date: prescriptionDate || new Date().toISOString(),
      vitals,
      symptoms,
      diagnosis,
      advice,
      notes,
      medicines: validMeds,
      followUpDays: computedDays,
      followUpDate: calculatedFollowUpDate || null,
      nextFollowUp: calculatedFollowUpDate || null,
      status: status,
    };

    const savedVisit = localVisits.save(visitPayload);
    setCurrentRxId(savedVisit.id);

    setSaveFeedback({
      type: 'success',
      message: `Prescription saved permanently (${savedVisit.id})`,
    });
    setTimeout(() => setSaveFeedback(null), 4000);

    if (triggerPrint) {
      applyPrintSettings(printSettings);
      window.print();
    }

    return savedVisit;
  };

  const handlePrint = () => {
    handleSavePrescription('PRINTED', true);
  };

  const handleShareWhatsApp = () => {
    const visit = handleSavePrescription(currentRxId ? 'SAVED' : 'SAVED', false);
    if (!visit) return;
    const waUrl = generatePrescriptionWhatsAppLink(patient, visit, clinicSettings);
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const handleSelectPatientFromList = (selectedPt) => {
    setPatient(selectedPt);
    setPatientSearchQuery('');
    setShowPatientSwitcher(false);
  };

  const filteredPatients = patientSearchQuery
    ? allPatients.filter(
        (p) =>
          (p.name && p.name.toLowerCase().includes(patientSearchQuery.toLowerCase())) ||
          (p.contact && p.contact.includes(patientSearchQuery)) ||
          (p.id && p.id.toLowerCase().includes(patientSearchQuery.toLowerCase()))
      )
    : allPatients.slice(0, 5);

  // If no patient selected yet, show quick selection screen
  if (!patient) {
    return (
      <div className="prescription-page bg-[#F7FAF8] min-h-screen">
        <div className="prescription-error app-card max-w-lg mx-auto my-16 p-8 text-center shadow-nivara-md border border-[#D9E6E2]">
          <div className="flex items-center justify-center w-14 h-14 mx-auto mb-4 bg-[#E8F3F1] text-[#287C75] rounded-2xl">
            <User size={28} />
          </div>
          <h2 className="text-xl font-heading font-bold text-[#10201F] mb-1.5">
            Select Patient for Prescription Studio
          </h2>
          <p className="text-sm text-[#4E6460] mb-6">
            Choose an existing patient or search by name / mobile to begin.
          </p>

          <div className="mb-5 text-left">
            <div className="relative mb-3">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7D908C]" />
              <input
                type="text"
                placeholder="Search patient name, phone, or ID..."
                value={patientSearchQuery}
                onChange={(e) => setPatientSearchQuery(e.target.value)}
                className="vital-input pl-10 w-full rounded-xl border border-[#D9E6E2]"
                autoFocus
              />
            </div>

            <div className="border border-[#D9E6E2] rounded-xl divide-y divide-[#EBF1EE] max-h-60 overflow-y-auto bg-white shadow-inner">
              {filteredPatients.length > 0 ? (
                filteredPatients.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => handleSelectPatientFromList(p)}
                    className="p-3.5 hover:bg-[#F2F7F5] cursor-pointer flex justify-between items-center transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#123A3A] text-white flex items-center justify-center text-xs font-bold font-heading">
                        {getInitials(p.name)}
                      </div>
                      <div>
                        <p className="font-semibold text-[#10201F] text-sm">{p.name}</p>
                        <p className="text-xs text-[#4E6460]">
                          {p.age ? `${p.age} Yrs` : ''} • {p.gender || 'N/A'} • {p.contact || p.mobile}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 bg-white border border-[#D9E6E2] rounded-lg text-[#287C75] shadow-sm">
                      Select
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-5 text-center text-sm text-[#7D908C]">No matching patients found.</div>
              )}
            </div>
          </div>

          <div className="flex justify-center gap-3 mt-5">
            <button type="button" className="btn-secondary" onClick={() => navigate('/patients')}>
              Go to Patients Directory
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                const walkIn = {
                  id: `PT-${Date.now().toString().slice(-6)}`,
                  name: 'Walk-in Patient',
                  age: 30,
                  gender: 'Male',
                  contact: '',
                };
                setPatient(walkIn);
              }}
            >
              Start as Walk-in
            </button>
          </div>
        </div>
      </div>
    );
  }

  const followUpDisplay = getFollowUpFormattedDisplay();

  return (
    <div className={`prescription-page ${printSettings.padMode ? 'pad-mode' : 'digital-mode'}`}>
      {/* Toast Notification */}
      {saveFeedback && (
        <div className="prescription-toast-notification no-print shadow-nivara-md">
          <Check size={16} className="text-[#2E7D5B] mr-2" />
          <span className="font-medium text-[#10201F] text-sm">{saveFeedback.message}</span>
        </div>
      )}

      {/* Screen Controls Header Bar */}
      <div className="prescription-controls no-print app-card">
        <div className="controls-left">
          <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>
            <ArrowLeft size={15} />
            Back
          </button>
          {currentRxId && (
            <span className="inline-flex items-center px-3 py-1 text-xs font-mono font-bold rounded-lg bg-[#E8F3F1] text-[#287C75] border border-[#D9E6E2]">
              Rx: {currentRxId}
            </span>
          )}
        </div>

        {/* Quick Print Alignment Bar */}
        <div className="prescription-quick-alignment">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              className={`prescription-mode-toggle-btn ${printSettings.padMode ? 'is-active' : ''}`}
              onClick={() => handleTogglePadMode(true)}
              title="Print for doctor letterhead pad (leaves top margin for pad logo)"
            >
              Pad Mode
            </button>
            <button
              type="button"
              className={`prescription-mode-toggle-btn ${!printSettings.padMode ? 'is-active' : ''}`}
              onClick={() => handleTogglePadMode(false)}
              title="Print clinic letterhead header on plain paper"
            >
              Digital Header
            </button>
          </div>

          {printSettings.padMode && (
            <div className="flex items-center gap-2 pl-3 border-l border-[#D9E6E2]">
              <label htmlFor="quick-top-offset" className="flex items-center gap-1.5 text-xs font-semibold text-[#4E6460]">
                <Sliders size={13} className="text-[#287C75]" />
                Pad Offset:
              </label>
              <input
                id="quick-top-offset"
                type="range"
                min="20"
                max="140"
                step="5"
                value={printSettings.topOffsetMm || 60}
                onChange={handleQuickOffsetChange}
                className="w-24 accent-[#287C75] cursor-pointer"
              />
              <span className="prescription-offset-badge tabular-nums">
                {printSettings.topOffsetMm || 60} mm
              </span>
            </div>
          )}
        </div>

        {/* Top Action Buttons */}
        <div className="controls-right">
          <button
            type="button"
            className="btn-preview"
            onClick={() => setIsPreviewOpen(true)}
            title="Preview how prescription will look when printed"
          >
            <Eye size={15} />
            Preview
          </button>

          <button
            type="button"
            className="btn-whatsapp"
            onClick={handleShareWhatsApp}
            title="Save and share prescription via WhatsApp"
          >
            <MessageCircle size={15} />
            WhatsApp
          </button>

          <button
            type="button"
            className="btn-secondary"
            onClick={() => handleSavePrescription('SAVED', false)}
            title="Save prescription record to database"
          >
            <Save size={15} />
            Save
          </button>

          <button
            type="button"
            className="btn-primary"
            onClick={handlePrint}
            title="Save and print prescription"
          >
            <Printer size={15} />
            Print Prescription
          </button>
        </div>
      </div>

      {/* Main Prescription Container */}
      <div className="prescription-content shadow-nivara-sm">
        {/* Digital Letterhead Header (Rendered on plain paper when padMode is false) */}
        <div className="digital-letterhead">
          <div className="letterhead-header">
            <div>
              <h1 className="letterhead-clinic-name font-heading">
                {clinicSettings.clinicName || 'Nivara Clinic & Health Centre'}
              </h1>
              <p className="letterhead-clinic-details">{clinicSettings.address}</p>
              <p className="letterhead-clinic-details">Phone: {clinicSettings.phone}</p>
            </div>
            <div className="letterhead-doctor-info">
              <h2 className="letterhead-doctor-name font-heading">
                {clinicSettings.doctorName || 'Dr. Aarav Sharma'}
              </h2>
              <p className="letterhead-doctor-details">{clinicSettings.qualification || 'MBBS, MD'}</p>
              <p className="letterhead-doctor-details">Reg. No: {clinicSettings.regNumber}</p>
              {clinicSettings.timing && (
                <p className="letterhead-doctor-details">Timings: {clinicSettings.timing}</p>
              )}
            </div>
          </div>
        </div>

        {/* 1. Patient Identity Banner */}
        <section className="prescription-section patient-info-section">
          <div className="patient-banner-container">
            <div className="patient-banner-left">
              <div className="patient-avatar-badge no-print">
                {getInitials(patient.name)}
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="patient-banner-name font-heading">{patient.name}</h2>
                  {patient.id && (
                    <span className="patient-id-pill font-mono tabular-nums">{patient.id}</span>
                  )}
                </div>
                <div className="patient-banner-meta">
                  <span>
                    <strong>Age/Sex:</strong>{' '}
                    <span className="tabular-nums">
                      {patient.age ? `${patient.age} Yrs` : 'N/A'} / {patient.gender || 'N/A'}
                    </span>
                  </span>
                  <span>•</span>
                  <span>
                    <strong>Phone:</strong>{' '}
                    <span className="tabular-nums">{patient.contact || patient.mobile || 'N/A'}</span>
                  </span>
                  <span>•</span>
                  <span>
                    <strong>Date:</strong>{' '}
                    <span className="tabular-nums">
                      {prescriptionDate
                        ? (prescriptionDate.includes('T') ? prescriptionDate.split('T')[0] : prescriptionDate)
                        : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            <div className="patient-banner-right no-print">
              <button
                type="button"
                className="btn-switch-patient"
                onClick={() => setShowPatientSwitcher(!showPatientSwitcher)}
                title="Switch patient for this prescription"
              >
                <RefreshCw size={13} />
                Switch Patient
              </button>
            </div>
          </div>

          {/* Quick Patient Switcher Dropdown (Screen Only) */}
          {showPatientSwitcher && (
            <div className="patient-switcher-popover no-print app-card shadow-nivara-lg">
              <div className="flex items-center justify-between p-3 border-b border-[#D9E6E2]">
                <span className="text-xs font-semibold text-[#10201F] uppercase tracking-wider">
                  Select Patient
                </span>
                <button
                  type="button"
                  onClick={() => setShowPatientSwitcher(false)}
                  className="text-[#7D908C] hover:text-[#10201F]"
                >
                  <X size={15} />
                </button>
              </div>
              <div className="p-2.5">
                <input
                  type="text"
                  placeholder="Filter patients..."
                  value={patientSearchQuery}
                  onChange={(e) => setPatientSearchQuery(e.target.value)}
                  className="vital-input text-xs w-full mb-2"
                  autoFocus
                />
                <div className="max-h-48 overflow-y-auto divide-y divide-[#EBF1EE]">
                  {filteredPatients.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => handleSelectPatientFromList(p)}
                      className="p-2 hover:bg-[#F2F7F5] cursor-pointer flex justify-between items-center text-xs rounded-lg"
                    >
                      <div>
                        <span className="font-semibold text-[#10201F]">{p.name}</span>
                        <span className="text-[#7D908C] ml-1.5">({p.id})</span>
                      </div>
                      <span className="text-[#287C75] font-semibold">Select</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Print-only patient info grid */}
          <div className="patient-info-grid print-only">
            <div className="info-item">
              <span className="info-label">Name:</span>
              <span className="info-value font-semibold">{patient.name}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Age/Sex:</span>
              <span className="info-value tabular-nums">
                {patient.age ? `${patient.age} Yrs` : 'N/A'} / {patient.gender || 'N/A'}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Phone:</span>
              <span className="info-value tabular-nums">{patient.contact || patient.mobile || 'N/A'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Date:</span>
              <span className="info-value tabular-nums">
                {prescriptionDate
                  ? (prescriptionDate.includes('T') ? prescriptionDate.split('T')[0] : prescriptionDate)
                  : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
              </span>
            </div>
          </div>
        </section>

        {/* 2. 6-Point Vitals Strip */}
        <section className="prescription-section vitals-section">
          <div className="section-header">
            <h3 className="section-title font-heading flex items-center gap-1.5">
              <Activity size={14} className="text-[#287C75]" />
              Vitals Strip
            </h3>
          </div>
          <div className="vitals-grid">
            <div className="vital-item">
              <div className="vital-header-row">
                <label htmlFor="bp">BP:</label>
                <span className="vital-unit">mmHg</span>
              </div>
              <input
                id="bp"
                type="text"
                placeholder="120/80"
                value={vitals.bloodPressure}
                onChange={(e) => handleVitalChange('bloodPressure', e.target.value)}
                className="vital-input tabular-nums font-semibold"
              />
            </div>
            <div className="vital-item">
              <div className="vital-header-row">
                <label htmlFor="weight">Weight:</label>
                <span className="vital-unit">kg</span>
              </div>
              <input
                id="weight"
                type="text"
                placeholder="70"
                value={vitals.weight}
                onChange={(e) => handleVitalChange('weight', e.target.value)}
                className="vital-input tabular-nums font-semibold"
              />
            </div>
            <div className="vital-item">
              <div className="vital-header-row">
                <label htmlFor="bloodSugar">Blood Sugar:</label>
                <span className="vital-unit">mg/dL</span>
              </div>
              <input
                id="bloodSugar"
                type="text"
                placeholder="110"
                value={vitals.bloodSugar}
                onChange={(e) => handleVitalChange('bloodSugar', e.target.value)}
                className="vital-input tabular-nums font-semibold"
              />
            </div>
            <div className="vital-item">
              <div className="vital-header-row">
                <label htmlFor="temperature">Temp:</label>
                <span className="vital-unit">°F</span>
              </div>
              <input
                id="temperature"
                type="text"
                placeholder="98.6"
                value={vitals.temperature}
                onChange={(e) => handleVitalChange('temperature', e.target.value)}
                className="vital-input tabular-nums font-semibold"
              />
            </div>
            <div className="vital-item">
              <div className="vital-header-row">
                <label htmlFor="pulse">Pulse:</label>
                <span className="vital-unit">bpm</span>
              </div>
              <input
                id="pulse"
                type="text"
                placeholder="72"
                value={vitals.pulseRate}
                onChange={(e) => handleVitalChange('pulseRate', e.target.value)}
                className="vital-input tabular-nums font-semibold"
              />
            </div>
            <div className="vital-item">
              <div className="vital-header-row">
                <label htmlFor="spo2">SpO2:</label>
                <span className="vital-unit">%</span>
              </div>
              <input
                id="spo2"
                type="text"
                placeholder="98"
                value={vitals.spo2}
                onChange={(e) => handleVitalChange('spo2', e.target.value)}
                className="vital-input tabular-nums font-semibold"
              />
            </div>
          </div>
        </section>

        {/* 3. Chief Complaints / Symptoms */}
        <section className="prescription-section">
          <h3 className="section-title font-heading">Chief Complaints / Symptoms</h3>
          <AutoResizeTextarea
            id="symptoms"
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            placeholder="Enter patient symptoms and history..."
            minRows={2}
            className="prescription-textarea"
          />
        </section>

        {/* 4. Diagnosis */}
        <section className="prescription-section">
          <h3 className="section-title font-heading">Clinical Diagnosis</h3>
          <AutoResizeTextarea
            id="diagnosis"
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            placeholder="Enter clinical diagnosis..."
            minRows={2}
            className="prescription-textarea font-semibold text-[#10201F]"
          />
        </section>

        {/* 5. Prescription / Medicines - Dynamic Table with Fast Autocomplete */}
        <section className="prescription-section medicines-section">
          <div className="section-header">
            <h3 className="section-title font-heading flex items-center gap-1.5">
              <span className="text-[#287C75] font-black text-base">Rx</span>
              <span>Medicines</span>
            </h3>
            <button
              type="button"
              className="btn-add-medicine no-print"
              onClick={addMedicineRow}
            >
              <Plus size={14} />
              <span>+ Add Another Medicine</span>
            </button>
          </div>

          <MedicineTable
            medicines={medicines}
            onUpdate={updateMedicine}
            onUpdateMedicineFull={updateMedicineFull}
            onRemove={removeMedicineRow}
          />
        </section>

        {/* 6. Advice / Dietary Instructions */}
        <section className="prescription-section">
          <h3 className="section-title font-heading">Advice & Dietary Instructions</h3>
          <AutoResizeTextarea
            id="advice"
            value={advice}
            onChange={(e) => setAdvice(e.target.value)}
            placeholder="Enter patient advice, dietary directions, lifestyle recommendations..."
            minRows={2}
            className="prescription-textarea"
          />
        </section>

        {/* 6.5. Internal Notes (Screen only) */}
        <section className="prescription-section no-print">
          <h3 className="section-title text-[#7D908C]">Internal Doctor Notes (Not Printed)</h3>
          <AutoResizeTextarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Doctor's private observations or review notes..."
            minRows={1}
            className="prescription-textarea text-[#4E6460] bg-[#F7FAF8]"
          />
        </section>

        {/* 7. Follow-up / Next Visit */}
        <section className="prescription-section followup-section">
          <h3 className="section-title font-heading">Next Follow-Up</h3>

          {/* Quick Selection Chips (Screen Only) */}
          <div className="followup-chips no-print">
            {['7', '14', '30'].map((chipDays) => (
              <button
                key={chipDays}
                type="button"
                className={`followup-chip tabular-nums ${followUpOption === chipDays ? 'active' : ''}`}
                onClick={() => {
                  setFollowUpOption(chipDays);
                  setFollowUpCustomDays('');
                  setFollowUpCustomDate('');
                }}
              >
                {chipDays} Days
              </button>
            ))}
            <button
              type="button"
              className={`followup-chip ${followUpOption === 'custom' ? 'active' : ''}`}
              onClick={() => setFollowUpOption('custom')}
            >
              Custom Date
            </button>
          </div>

          <div className="followup-grid">
            {followUpOption === 'custom' && (
              <div className="followup-item no-print">
                <label htmlFor="custom-days">Custom Days or Pick Date:</label>
                <div className="flex gap-2">
                  <input
                    id="custom-days"
                    type="number"
                    min="1"
                    placeholder="Days (e.g. 10)"
                    value={followUpCustomDays}
                    onChange={(e) => {
                      setFollowUpCustomDays(e.target.value);
                      setFollowUpCustomDate('');
                    }}
                    className="followup-input w-28 tabular-nums"
                  />
                  <input
                    id="custom-date"
                    type="date"
                    value={followUpCustomDate}
                    onChange={(e) => {
                      setFollowUpCustomDate(e.target.value);
                      setFollowUpCustomDays('');
                    }}
                    className="followup-input flex-1 tabular-nums"
                  />
                </div>
              </div>
            )}

            <div className="followup-item">
              <label>Scheduled Follow-up Date:</label>
              <div className="followup-date">
                <Calendar size={15} className="text-[#287C75] mr-2 inline" />
                <span className="tabular-nums font-semibold text-[#10201F]">
                  {followUpDisplay || 'No follow-up scheduled'}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Doctor Signature Block (Prints at bottom) */}
        <div className="prescription-doctor-signature">
          <div className="signature-line">
            <p className="signature-doctor font-heading">{clinicSettings.doctorName || 'Dr. Aarav Sharma'}</p>
            <p className="signature-clinic">{clinicSettings.clinicName || 'Nivara Clinic & Health Centre'}</p>
          </div>
        </div>
      </div>

      {/* 8. Bottom Action Dock (Sticky / Floating) */}
      <div className="prescription-action-dock no-print shadow-nivara-lg">
        <div className="dock-inner">
          <div className="dock-left">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2E7D5B] animate-pulse"></span>
              <span className="text-xs font-semibold text-[#10201F]">
                {patient.name}
              </span>
              {currentRxId && (
                <span className="text-xs font-mono text-[#7D908C]">({currentRxId})</span>
              )}
            </div>
          </div>

          <div className="dock-right">
            <button
              type="button"
              className="btn-dock-preview"
              onClick={() => setIsPreviewOpen(true)}
              title="Preview how prescription will look when printed"
            >
              <Eye size={15} />
              <span>Print Preview</span>
            </button>

            <button
              type="button"
              className="btn-dock-whatsapp"
              onClick={handleShareWhatsApp}
              title="Save and share prescription via WhatsApp"
            >
              <MessageCircle size={15} />
              <span>WhatsApp Share</span>
            </button>

            <button
              type="button"
              className="btn-dock-save"
              onClick={() => handleSavePrescription('SAVED', false)}
              title="Save prescription visit to permanent store"
            >
              <Save size={15} />
              <span>Save Visit</span>
            </button>

            <button
              type="button"
              className="btn-dock-print"
              onClick={handlePrint}
              title="Save and print prescription immediately"
            >
              <Printer size={15} />
              <span>Direct Print</span>
            </button>
          </div>
        </div>
      </div>

      {/* Print Preview Modal */}
      <PrintPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        patient={patient}
        prescriptionDate={prescriptionDate}
        vitals={vitals}
        symptoms={symptoms}
        diagnosis={diagnosis}
        advice={advice}
        medicines={medicines}
        followUpDate={followUpDisplay}
        rxId={currentRxId}
        printSettings={printSettings}
        clinicSettings={clinicSettings}
        onPrint={() => {
          setIsPreviewOpen(false);
          setTimeout(() => handlePrint(), 50);
        }}
        onShareWhatsApp={handleShareWhatsApp}
      />
    </div>
  );
}

export default PrescriptionPage;
