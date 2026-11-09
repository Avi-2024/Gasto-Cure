import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Printer,
  Plus,
  X,
  Sliders,
  MessageCircle,
  Eye,
  Save,
  Check,
  User,
  Calendar,
  ArrowLeft,
} from 'lucide-react';
import MedicineTable from './components/MedicineTable';
import AutoResizeTextarea from './components/AutoResizeTextarea';
import PrintPreviewModal from './components/PrintPreviewModal';
import { localPatients, localVisits, localSettings } from '../../services/localStore';
import { applyPrintSettings } from '../../utils/printStyles';
import { generatePrescriptionWhatsAppLink } from '../../utils/whatsappHelper';
import './PrescriptionPage.css';

/**
 * PrescriptionPage Component
 *
 * Comprehensive Prescription Builder & Permanent Visit Storage.
 * - Full Vitals inputs: BP, Weight, Blood Sugar, Temperature, Pulse, SpO2
 * - Dynamic Medicine Table with autocomplete
 * - In-screen Quick Top Margin slider and Pad Mode toggle
 * - Follow-up Selector with quick chips (7 Days, 14 Days, 30 Days, Custom)
 * - Permanent saving to localVisits and patient update
 * - Direct Print, Print Preview Modal, and 1-Click WhatsApp sharing
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

  // Patient Info
  const [patient, setPatient] = useState(null);
  const [allPatients, setAllPatients] = useState([]);
  const [patientSearchQuery, setPatientSearchQuery] = useState('');

  // Vitals: Full 6 inputs
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
      <div className="prescription-page">
        <div className="prescription-error">
          <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 bg-blue-50 text-blue-600 rounded-full">
            <User size={24} />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Select a Patient for Prescription</h2>
          <p className="text-sm text-slate-500 mb-5">
            Choose an existing patient or search by name / mobile to begin.
          </p>

          <div className="mb-4 text-left">
            <input
              type="text"
              placeholder="Search patient name, phone, or ID..."
              value={patientSearchQuery}
              onChange={(e) => setPatientSearchQuery(e.target.value)}
              className="vital-input w-full mb-3"
              autoFocus
            />

            <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-56 overflow-y-auto bg-slate-50">
              {filteredPatients.length > 0 ? (
                filteredPatients.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => handleSelectPatientFromList(p)}
                    className="p-3 hover:bg-blue-50 cursor-pointer flex justify-between items-center transition-colors"
                  >
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">{p.name}</p>
                      <p className="text-xs text-slate-500">
                        {p.age ? `${p.age} Yrs` : ''} • {p.gender || 'N/A'} • {p.contact || p.mobile}
                      </p>
                    </div>
                    <span className="text-xs font-semibold px-2 py-1 bg-white border border-slate-200 rounded text-blue-600">
                      Select
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-sm text-slate-400">No patients found.</div>
              )}
            </div>
          </div>

          <div className="flex justify-center gap-3 mt-4">
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
      {/* Save Notification Banner */}
      {saveFeedback && (
        <div className="prescription-toast-notification no-print">
          <Check size={16} className="text-emerald-500 mr-2" />
          <span>{saveFeedback.message}</span>
        </div>
      )}

      {/* Screen-only controls bar */}
      <div className="prescription-controls no-print">
        <div className="controls-left">
          <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>
            <ArrowLeft size={15} />
            Back
          </button>
          {currentRxId && (
            <span className="inline-flex items-center px-2.5 py-1 text-xs font-mono font-semibold rounded bg-slate-100 text-slate-700 border border-slate-200">
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
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <label htmlFor="quick-top-offset" className="flex items-center gap-1 text-xs font-semibold text-slate-600">
                <Sliders size={13} className="text-slate-400" />
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
                className="w-24 accent-blue-600 cursor-pointer"
              />
              <span className="prescription-offset-badge">
                {printSettings.topOffsetMm || 60} mm
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
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
            Share WhatsApp
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

      {/* Printable Content Area - Content Driven Layout */}
      <div className="prescription-content">
        {/* Digital Letterhead Header (Rendered on plain paper when padMode is false) */}
        <div className="digital-letterhead">
          <div className="letterhead-header">
            <div>
              <h1 className="letterhead-clinic-name">{clinicSettings.clinicName || 'ClinicRx Medical Centre'}</h1>
              <p className="letterhead-clinic-details">{clinicSettings.address}</p>
              <p className="letterhead-clinic-details">Phone: {clinicSettings.phone}</p>
            </div>
            <div className="letterhead-doctor-info">
              <h2 className="letterhead-doctor-name">{clinicSettings.doctorName || 'Dr. Aarav Sharma'}</h2>
              <p className="letterhead-doctor-details">{clinicSettings.qualification || 'MBBS, MD'}</p>
              <p className="letterhead-doctor-details">Reg. No: {clinicSettings.regNumber}</p>
              {clinicSettings.timing && (
                <p className="letterhead-doctor-details">Timings: {clinicSettings.timing}</p>
              )}
            </div>
          </div>
        </div>

        {/* 1. Patient Information Section */}
        <section className="prescription-section patient-info-section">
          <div className="patient-info-grid">
            <div className="info-item">
              <span className="info-label">Name:</span>
              <span className="info-value font-semibold">{patient.name}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Age/Sex:</span>
              <span className="info-value">
                {patient.age ? `${patient.age} Yrs` : 'N/A'} / {patient.gender || 'N/A'}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Phone:</span>
              <span className="info-value">{patient.contact || patient.mobile || 'N/A'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Date:</span>
              <span className="info-value">
                {prescriptionDate
                  ? (prescriptionDate.includes('T') ? prescriptionDate.split('T')[0] : prescriptionDate)
                  : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
              </span>
            </div>
          </div>
        </section>

        {/* 2. Full Vitals Section - 6 Inputs (BP, Weight, Blood Sugar, Temp, Pulse, SpO2) */}
        <section className="prescription-section vitals-section">
          <h3 className="section-title">Vitals</h3>
          <div className="vitals-grid">
            <div className="vital-item">
              <label htmlFor="bp">BP:</label>
              <input
                id="bp"
                type="text"
                placeholder="120/80"
                value={vitals.bloodPressure}
                onChange={(e) => handleVitalChange('bloodPressure', e.target.value)}
                className="vital-input"
              />
            </div>
            <div className="vital-item">
              <label htmlFor="weight">Weight:</label>
              <input
                id="weight"
                type="text"
                placeholder="kg"
                value={vitals.weight}
                onChange={(e) => handleVitalChange('weight', e.target.value)}
                className="vital-input"
              />
            </div>
            <div className="vital-item">
              <label htmlFor="bloodSugar">Blood Sugar:</label>
              <input
                id="bloodSugar"
                type="text"
                placeholder="mg/dL"
                value={vitals.bloodSugar}
                onChange={(e) => handleVitalChange('bloodSugar', e.target.value)}
                className="vital-input"
              />
            </div>
            <div className="vital-item">
              <label htmlFor="temperature">Temp:</label>
              <input
                id="temperature"
                type="text"
                placeholder="°F"
                value={vitals.temperature}
                onChange={(e) => handleVitalChange('temperature', e.target.value)}
                className="vital-input"
              />
            </div>
            <div className="vital-item">
              <label htmlFor="pulse">Pulse:</label>
              <input
                id="pulse"
                type="text"
                placeholder="bpm"
                value={vitals.pulseRate}
                onChange={(e) => handleVitalChange('pulseRate', e.target.value)}
                className="vital-input"
              />
            </div>
            <div className="vital-item">
              <label htmlFor="spo2">SpO2:</label>
              <input
                id="spo2"
                type="text"
                placeholder="%"
                value={vitals.spo2}
                onChange={(e) => handleVitalChange('spo2', e.target.value)}
                className="vital-input"
              />
            </div>
          </div>
        </section>

        {/* 3. Chief Complaints / Symptoms - Auto Expanding */}
        <section className="prescription-section">
          <h3 className="section-title">Chief Complaints / Symptoms</h3>
          <AutoResizeTextarea
            id="symptoms"
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            placeholder="Enter patient symptoms and history..."
            minRows={2}
            className="prescription-textarea"
          />
        </section>

        {/* 4. Diagnosis - Auto Expanding */}
        <section className="prescription-section">
          <h3 className="section-title">Diagnosis</h3>
          <AutoResizeTextarea
            id="diagnosis"
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            placeholder="Enter clinical diagnosis..."
            minRows={2}
            className="prescription-textarea"
          />
        </section>

        {/* 5. Prescription / Medicines - Dynamic Table with Autocomplete */}
        <section className="prescription-section medicines-section">
          <div className="section-header">
            <h3 className="section-title">Rx (Medicines)</h3>
            <button type="button" className="btn-add-medicine no-print" onClick={addMedicineRow}>
              <Plus size={14} />
              Add Medicine
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
          <h3 className="section-title">Advice & Instructions</h3>
          <AutoResizeTextarea
            id="advice"
            value={advice}
            onChange={(e) => setAdvice(e.target.value)}
            placeholder="Enter patient advice, dietary directions, lifestyle recommendations..."
            minRows={2}
            className="prescription-textarea"
          />
        </section>

        {/* 6.5. Internal Notes (Optional) */}
        <section className="prescription-section no-print">
          <h3 className="section-title text-slate-500">Internal Doctor Notes (Not Printed)</h3>
          <AutoResizeTextarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Doctor's private observations or review notes..."
            minRows={1}
            className="prescription-textarea text-slate-600 bg-slate-50"
          />
        </section>

        {/* 7. Follow-up / Next Visit - Quick Chips & Date Calculation */}
        <section className="prescription-section followup-section">
          <h3 className="section-title">Next Follow-Up</h3>

          {/* Quick Selection Chips (Screen Only) */}
          <div className="followup-chips no-print">
            {['7', '14', '30'].map((chipDays) => (
              <button
                key={chipDays}
                type="button"
                className={`followup-chip ${followUpOption === chipDays ? 'active' : ''}`}
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
              Custom
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
                    className="followup-input w-28"
                  />
                  <input
                    id="custom-date"
                    type="date"
                    value={followUpCustomDate}
                    onChange={(e) => {
                      setFollowUpCustomDate(e.target.value);
                      setFollowUpCustomDays('');
                    }}
                    className="followup-input flex-1"
                  />
                </div>
              </div>
            )}

            <div className="followup-item">
              <label>Scheduled Follow-up Date:</label>
              <div className="followup-date">
                <Calendar size={15} className="text-blue-600 mr-2 inline" />
                <span>{followUpDisplay || 'No follow-up scheduled'}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Doctor Signature Block (Prints at bottom) */}
        <div className="prescription-doctor-signature">
          <div className="signature-line">
            <p className="signature-doctor">{clinicSettings.doctorName || 'Dr. Aarav Sharma'}</p>
            <p className="signature-clinic">{clinicSettings.clinicName || 'ClinicRx Medical Centre'}</p>
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
