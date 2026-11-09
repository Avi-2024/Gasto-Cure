import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Printer, Plus, X, Sliders } from 'lucide-react';
import MedicineTable from './components/MedicineTable';
import AutoResizeTextarea from './components/AutoResizeTextarea';
import { localPatients, localSettings } from '../../services/localStore';
import { applyPrintSettings } from '../../utils/printStyles';
import './PrescriptionPage.css';

/**
 * Prescription Page Component
 * 
 * Professional medical prescription form that behaves like a real prescription pad.
 * 
 * Layout:
 * 1. Patient Information (name, age, gender, phone)
 * 2. Basic Vitals (BP, weight, height, pulse)
 * 3. Chief Complaints/Symptoms (auto-expanding textarea)
 * 4. Diagnosis (auto-expanding textarea)
 * 5. Prescription/RX (dynamic medicine table)
 * 
 * Features:
 * - Content-driven layout (no fixed heights)
 * - Auto-expanding textareas
 * - Direct editing of fields
 * - Professional medical design
 * - Configurable print alignment engine (top offset slider & pad mode toggle)
 */
function PrescriptionPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const patientId = searchParams.get('patientId');

  // Clinic and Print Settings
  const [clinicSettings, setClinicSettings] = useState(() => localSettings.get());
  const [printSettings, setPrintSettings] = useState(() => localSettings.get().print || { topOffsetMm: 60, padMode: true });

  // Patient Info
  const [patient, setPatient] = useState(null);

  // Vitals
  const [vitals, setVitals] = useState({
    bloodPressure: '',
    weight: '',
    pulseRate: '',
    spo2: '',
  });

  // Medical Content
  const [symptoms, setSymptoms] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');

  // Follow-up
  const [followUpDays, setFollowUpDays] = useState(30);
  const [followUpCustomDays, setFollowUpCustomDays] = useState('');

  // Medicines
  const [medicines, setMedicines] = useState([
    { id: 1, name: '', dosage: '', frequency: '1-0-1', timing: '', duration: '', remarks: '' },
  ]);

  // Calculate follow-up date
  const getFollowUpDate = () => {
    const days = followUpCustomDays ? parseInt(followUpCustomDays) : followUpDays;
    if (!days || isNaN(days)) return '';
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    return futureDate.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  // Apply print settings on mount and when changed
  useEffect(() => {
    applyPrintSettings(printSettings);
  }, [printSettings]);

  // Load patient data
  useEffect(() => {
    if (patientId) {
      const patients = localPatients.getAll();
      const foundPatient = patients.find((p) => p.id === patientId);
      if (foundPatient) {
        setPatient(foundPatient);
      }
    }
  }, [patientId]);

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

  const handlePrint = () => {
    applyPrintSettings(printSettings);
    window.print();
  };

  if (!patient) {
    return (
      <div className="prescription-page">
        <div className="prescription-error">
          <p>No patient selected. Please select a patient first.</p>
          <button type="button" className="btn-primary" onClick={() => navigate('/patients')}>
            Go to Patients
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`prescription-page ${printSettings.padMode ? 'pad-mode' : 'digital-mode'}`}>
      {/* Screen-only controls */}
      <div className="prescription-controls no-print">
        <div className="controls-left">
          <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>
            <X size={16} />
            Cancel
          </button>
        </div>

        {/* Quick Print Alignment Bar */}
        <div className="prescription-quick-alignment">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              className={`prescription-mode-toggle-btn ${printSettings.padMode ? 'is-active' : ''}`}
              onClick={() => handleTogglePadMode(true)}
              title="Print for doctor letterhead pad (skips top logo area)"
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
              <label htmlFor="quick-top-offset">
                <Sliders size={13} className="text-slate-400" />
                Offset:
              </label>
              <input
                id="quick-top-offset"
                type="range"
                min="20"
                max="140"
                step="5"
                value={printSettings.topOffsetMm || 60}
                onChange={handleQuickOffsetChange}
              />
              <span className="prescription-offset-badge">
                {printSettings.topOffsetMm || 60} mm
              </span>
            </div>
          )}
        </div>

        <div className="controls-right">
          <button type="button" className="btn-primary" onClick={handlePrint}>
            <Printer size={16} />
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
              <span className="info-value">{patient.name}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Age:</span>
              <span className="info-value">{patient.age} years</span>
            </div>
            <div className="info-item">
              <span className="info-label">Gender:</span>
              <span className="info-value">{patient.gender || 'N/A'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Phone:</span>
              <span className="info-value">{patient.contact}</span>
            </div>
          </div>
        </section>

        {/* 2. Basic Vitals Section - Single Row */}
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
              <label htmlFor="pulse">Pulse Rate:</label>
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
            placeholder="Enter diagnosis..."
            minRows={2}
            className="prescription-textarea"
          />
        </section>

        {/* 4.5. Additional Notes - Optional */}
        <section className="prescription-section">
          <h3 className="section-title">Notes</h3>
          <AutoResizeTextarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Enter additional notes (optional)..."
            minRows={2}
            className="prescription-textarea"
          />
        </section>

        {/* 5. Prescription / Medicines - Dynamic Table */}
        <section className="prescription-section medicines-section">
          <div className="section-header">
            <h3 className="section-title">Rx</h3>
            <button type="button" className="btn-add-medicine no-print" onClick={addMedicineRow}>
              <Plus size={14} />
              Add Medicine
            </button>
          </div>

          <MedicineTable medicines={medicines} onUpdate={updateMedicine} onUpdateMedicineFull={updateMedicineFull} onRemove={removeMedicineRow} />
        </section>

        {/* 6. Follow-up / Next Visit - Auto Calculate */}
        <section className="prescription-section followup-section">
          <h3 className="section-title">Next Follow-Up</h3>
          <div className="followup-grid">
            <div className="followup-item">
              <label htmlFor="followup-days">Follow-up in:</label>
              <select
                id="followup-days"
                value={followUpCustomDays ? 'custom' : followUpDays}
                onChange={(e) => {
                  if (e.target.value === 'custom') {
                    setFollowUpDays(0);
                  } else {
                    setFollowUpDays(parseInt(e.target.value));
                    setFollowUpCustomDays('');
                  }
                }}
                className="followup-select"
              >
                <option value="7">7 Days</option>
                <option value="14">14 Days</option>
                <option value="30">30 Days</option>
                <option value="45">45 Days</option>
                <option value="60">60 Days</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            {(!followUpDays || followUpDays === 0) && (
              <div className="followup-item">
                <label htmlFor="custom-days">Custom Days:</label>
                <input
                  id="custom-days"
                  type="number"
                  min="1"
                  placeholder="Enter days"
                  value={followUpCustomDays}
                  onChange={(e) => setFollowUpCustomDays(e.target.value)}
                  className="followup-input"
                />
              </div>
            )}

            <div className="followup-item">
              <label>Scheduled Date:</label>
              <span className="followup-date">{getFollowUpDate() || 'Select days above'}</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default PrescriptionPage;
