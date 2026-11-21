import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useSearchParams, useOutletContext } from 'react-router-dom';
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
  UserPlus,
  ArrowRight,
  Clock3,
  ChevronRight,
  Heart,
  Droplet,
  Thermometer,
  HeartPulse,
  Wind,
  Scale,
  AlertTriangle,
  CheckCircle2,
  Stethoscope,
  SlidersHorizontal,
  RotateCcw,
  Tag,
  PenTool,
  History,
  Zap,
} from 'lucide-react';
import MedicineTable from './components/MedicineTable';
import AutoResizeTextarea from './components/AutoResizeTextarea';
import PrintPreviewModal from './components/PrintPreviewModal';
import PatientPastHistoryDrawer from './components/PatientPastHistoryDrawer';
import { localPatients, localVisits, localSettings, localAppointments } from '../../services/localStore';
import { prescriptionApi } from '../../services/prescriptionApi';
import { quickChipsService, DEFAULT_QUICK_CHIPS } from '../../services/quickChipsService';
import { rxProtocolsService } from '../../services/rxProtocolsService';
import { applyPrintSettings } from '../../utils/printStyles';
import { generatePrescriptionWhatsAppLink } from '../../utils/whatsappHelper';
import PatientAvatar from '../../components/common/PatientAvatar';
import './PrescriptionPage.css';

const getInitials = (name = '') => {
  if (!name) return 'PT';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// 1-Click Clinical Suggestion Chips tailored for Gastroenterology & General Practice
const GASTRO_SYMPTOMS = DEFAULT_QUICK_CHIPS.symptoms;
const GASTRO_DIAGNOSES = DEFAULT_QUICK_CHIPS.diagnosis;
const GASTRO_ADVICE = DEFAULT_QUICK_CHIPS.advice;

/**
 * PrescriptionPage Component
 *
 * ClinixPulse Prescription Studio & Fast Formulary Autocomplete (/prescription/new)
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
  const outletContext = useOutletContext();
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
    { id: 1, name: '',  frequency: '1-0-1', timing: '', duration: '', remarks: '' },
  ]);

  // Preview Modal
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewPastVisit, setPreviewPastVisit] = useState(null);

  // 1-Click Clinical Rx Protocols (Protocol Kits) & Patient History Drawer
  const [enableProtocols, setEnableProtocols] = useState(() => rxProtocolsService.isEnabled());
  const [protocols, setProtocols] = useState(() => rxProtocolsService.getAll());
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);

  // Computed count of past visits for active patient (excluding current open visit if editing)
  const pastVisitsCount = React.useMemo(() => {
    if (!patient?.id) return 0;
    const all = localVisits.getByPatient(patient.id) || [];
    return visitIdParam ? all.filter((v) => v.id !== visitIdParam).length : all.length;
  }, [patient?.id, visitIdParam]);

  // Clinical Quick Chips State (Doctor Customizable)
  const [clinicalChips, setClinicalChips] = useState(() => quickChipsService.getAll());
  const [isManageChipsOpen, setIsManageChipsOpen] = useState(false);
  const [manageActiveTab, setManageActiveTab] = useState('symptoms'); // 'symptoms' | 'diagnosis' | 'advice'
  const [newChipInput, setNewChipInput] = useState('');
  const [chipNotification, setChipNotification] = useState('');

  // Clinical Intake & Quick Registration Modal State
  const [showIntakeAddModal, setShowIntakeAddModal] = useState(false);
  const [intakeForm, setIntakeForm] = useState({
    name: '',
    age: '',
    gender: 'Male',
    contact: '',
    address: '',
    allergies: '',
  });
  const [intakeFormError, setIntakeFormError] = useState('');

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
            bloodPressure: visit.vitals.bloodPressure || visit.vitals.bp || '',
            weight: visit.vitals.weight || '',
            bloodSugar: visit.vitals.bloodSugar || visit.vitals.sugar || '',
            temperature: visit.vitals.temperature || visit.vitals.temp || '',
            pulseRate: visit.vitals.pulseRate || visit.vitals.pulse || '',
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

  // Calculate follow-up dates based on prescription date
  const getFollowUpIsoDate = () => {
    const baseDate = prescriptionDate ? new Date(prescriptionDate) : new Date();
    const anchor = isNaN(baseDate.getTime()) ? new Date() : baseDate;

    if (followUpOption === 'custom') {
      if (followUpCustomDate) return followUpCustomDate;
      const days = parseInt(followUpCustomDays, 10);
      if (days && !isNaN(days)) {
        const d = new Date(anchor);
        d.setDate(d.getDate() + days);
        return d.toISOString().split('T')[0];
      }
      return '';
    }

    const days = parseInt(followUpOption, 10);
    if (days && !isNaN(days)) {
      const d = new Date(anchor);
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

  const handleAddSymptom = (text) => {
    setSymptoms((prev) => {
      if (!prev || !prev.trim()) return text;
      if (prev.toLowerCase().includes(text.toLowerCase())) return prev;
      return `${prev.trim()}, ${text}`;
    });
  };

  const handleAddDiagnosis = (text) => {
    setDiagnosis((prev) => {
      if (!prev || !prev.trim()) return text;
      if (prev.toLowerCase().includes(text.toLowerCase())) return prev;
      return `${prev.trim()} & ${text}`;
    });
  };

  const handleAddAdvice = (text) => {
    setAdvice((prev) => {
      if (!prev || !prev.trim()) return `• ${text}`;
      if (prev.toLowerCase().includes(text.toLowerCase())) return prev;
      return `${prev.trim()}\n• ${text}`;
    });
  };

  // 1-Click Clinical Protocol Application
  const handleApplyProtocol = (proto) => {
    if (!proto) return;

    // 1. Symptoms (Chief complaints)
    if (proto.symptoms) {
      setSymptoms((prev) => {
        if (!prev || !prev.trim()) return proto.symptoms;
        return `${prev.trim()}, ${proto.symptoms}`;
      });
    }

    // 2. Clinical Diagnosis
    if (proto.diagnosis) {
      setDiagnosis((prev) => {
        if (!prev || !prev.trim()) return proto.diagnosis;
        return `${prev.trim()} & ${proto.diagnosis}`;
      });
    }

    // 3. Rx Medicines
    if (proto.medicines && proto.medicines.length > 0) {
      const mappedMeds = proto.medicines.map((m, idx) => ({
        id: Date.now() + idx,
        name: m.name || '',
        dosage: m.dosage || '',
        frequency: m.frequency || '1-0-1',
        timing: m.timing || 'After Food',
        duration: m.duration || '5 Days',
        remarks: m.remarks || '',
      }));

      setMedicines((prev) => {
        const isOnlyEmpty = prev.length === 1 && !prev[0].name?.trim();
        return isOnlyEmpty ? mappedMeds : [...prev, ...mappedMeds];
      });
    }

    // 4. Dietary & Lifestyle Advice
    if (proto.advice) {
      setAdvice((prev) => {
        if (!prev || !prev.trim()) return `• ${proto.advice}`;
        return `${prev.trim()}\n• ${proto.advice}`;
      });
    }

    // 5. Follow-Up Schedule
    if (proto.followUpDays) {
      const dayStr = String(proto.followUpDays);
      if (['7', '14', '30'].includes(dayStr)) {
        setFollowUpOption(dayStr);
      } else {
        setFollowUpOption('custom');
        setFollowUpCustomDays(dayStr);
      }
    }

    setSaveFeedback({
      message: `⚡ Applied ${proto.title} Protocol (${proto.medicines?.length || 0} medicines filled)`,
    });
    setTimeout(() => setSaveFeedback(null), 3500);
  };

  // 1-Click Repeat Past Rx from History Drawer
  const handleRepeatRx = (pastMeds, pastVisit) => {
    if (!pastMeds || pastMeds.length === 0) {
      setSaveFeedback({ message: 'No medicines in past visit to repeat' });
      setTimeout(() => setSaveFeedback(null), 3000);
      return;
    }

    const clonedMeds = pastMeds.map((m, idx) => ({
      id: Date.now() + idx,
      name: m.name || '',
      dosage: m.dosage || '',
      frequency: m.frequency || '1-0-1',
      timing: m.timing || 'After Food',
      duration: m.duration || '5 Days',
      remarks: m.remarks || '',
    }));

    setMedicines((prev) => {
      const isOnlyEmpty = prev.length === 1 && !prev[0].name?.trim();
      return isOnlyEmpty ? clonedMeds : [...prev, ...clonedMeds];
    });

    if (pastVisit?.advice && !advice) {
      setAdvice(pastVisit.advice);
    }
    if (pastVisit?.diagnosis && !diagnosis) {
      setDiagnosis(pastVisit.diagnosis);
    }

    setIsHistoryDrawerOpen(false);
    const visitDateLabel = pastVisit?.visitDate
      ? new Date(pastVisit.visitDate).toLocaleDateString('en-IN')
      : 'past visit';
    setSaveFeedback({
      message: `⚡ Repeated ${clonedMeds.length} medicines from visit (${visitDateLabel})`,
    });
    setTimeout(() => setSaveFeedback(null), 3500);
  };

  // 1-Click Repeat Single Medicine from Past Visit
  const handleAddSingleMed = (med) => {
    if (!med || !med.name) return;
    const newMed = {
      id: Date.now() + Math.random(),
      name: med.name || '',
      dosage: med.dosage || '',
      frequency: med.frequency || '1-0-1',
      timing: med.timing || 'After Food',
      duration: med.duration || '5 Days',
      remarks: med.remarks || '',
    };
    setMedicines((prev) => {
      const isOnlyEmpty = prev.length === 1 && !prev[0].name?.trim();
      return isOnlyEmpty ? [newMed] : [...prev, newMed];
    });
    setSaveFeedback({
      message: `+ Added ${med.name} (${med.frequency || '1-0-1'}) to active prescription`,
    });
    setTimeout(() => setSaveFeedback(null), 3000);
  };

  // Quick Chips Management Handlers
  const handleOpenManageChips = (category = 'symptoms') => {
    setManageActiveTab(category);
    setNewChipInput('');
    setChipNotification('');
    setIsManageChipsOpen(true);
  };

  const handleAddNewCustomChip = (e) => {
    if (e) e.preventDefault();
    const trimmed = newChipInput.trim();
    if (!trimmed) return;
    const updatedList = quickChipsService.add(manageActiveTab, trimmed);
    setClinicalChips((prev) => ({ ...prev, [manageActiveTab]: updatedList }));
    setNewChipInput('');
    const catLabel =
      manageActiveTab === 'symptoms'
        ? 'Symptoms'
        : manageActiveTab === 'diagnosis'
        ? 'Diagnoses'
        : 'Advice';
    setChipNotification(`Added "${trimmed}" to ${catLabel}!`);
    setTimeout(() => setChipNotification(''), 3000);
  };

  const handleRemoveChip = (category, item) => {
    const updatedList = quickChipsService.remove(category, item);
    setClinicalChips((prev) => ({ ...prev, [category]: updatedList }));
    setChipNotification(`Removed "${item}"`);
    setTimeout(() => setChipNotification(''), 2500);
  };

  const handleResetCategoryChips = (category) => {
    quickChipsService.reset(category);
    setClinicalChips(quickChipsService.getAll());
    const catLabel =
      category === 'symptoms'
        ? 'Symptoms'
        : category === 'diagnosis'
        ? 'Diagnosis'
        : 'Advice';
    setChipNotification(`Reset ${catLabel} to clinic defaults`);
    setTimeout(() => setChipNotification(''), 3000);
  };

  const addMedicineRow = () => {
    setMedicines((prev) => {
      const newId = prev.length > 0 ? Math.max(...prev.map((m) => m.id)) + 1 : 1;
      return [
        ...prev,
        { id: newId, name: '',  frequency: '', timing: '', duration: '', remarks: '' },
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
      vitals: {
        ...vitals,
        bp: vitals.bloodPressure,
        pulse: vitals.pulseRate,
        sugar: vitals.bloodSugar,
        temp: vitals.temperature,
      },
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

    // Sync to Supabase PostgreSQL with immutable legal branding snapshot
    if (import.meta.env.MODE !== 'test') {
      prescriptionApi
        .createPrescription({
          patientId: patient.id,
          patientName: patient.name,
          medicines: validMeds,
          diagnosis,
          symptoms,
          vitals: visitPayload.vitals,
          advice,
          followUpDate: calculatedFollowUpDate,
          followUpNotes: notes,
        })
        .then((res) => {
          if (res?.data?.rxNumber) {
            setSaveFeedback({
              type: 'success',
              message: `Prescription saved permanently (${res.data.rxNumber})`,
            });
          }
        })
        .catch((err) => console.warn('Supabase prescription sync note:', err.message));
    }

    // Auto-clear patient from waiting queue once prescription is saved
    try {
      const activeQueue = localAppointments.getQueue();
      const matched = activeQueue.find(
        (a) => a.patientId === patient?.id || a.patientId === savedVisit.patientId
      );
      if (matched) {
        localAppointments.markCompleted(matched.id);
      }
    } catch {}

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
    const visit = handleSavePrescription('SAVED', false);
    if (!visit) return;
    const waUrl = generatePrescriptionWhatsAppLink(patient, visit, clinicSettings);
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const handleSignatureFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      const updated = localSettings.update({ signatureUrl: dataUrl });
      setClinicSettings(updated);
      setSaveFeedback({
        type: 'success',
        message: 'Doctor digital signature updated successfully!',
      });
      setTimeout(() => setSaveFeedback(null), 3500);
    };
    reader.readAsDataURL(file);
  };

  const handleIntakeAddPatient = () => {
    if (!intakeForm.name.trim() || !intakeForm.age || !intakeForm.contact.trim()) {
      setIntakeFormError('Patient Name, Age, and Contact are required.');
      return;
    }
    const newPt = localPatients.add({
      ...intakeForm,
      age: Number(intakeForm.age),
    });
    localAppointments.addToQueue(newPt.id, newPt.name, newPt.age, 'Prescription consultation');
    setAllPatients(localPatients.getAll());
    setShowIntakeAddModal(false);
    setIntakeForm({ name: '', age: '', gender: 'Male', contact: '', address: '', allergies: '' });
    setIntakeFormError('');
    setPatient(newPt);
  };

  const handleSelectPatientFromList = (selectedPt) => {
    setPatient(selectedPt);
    setPatientSearchQuery('');
    setShowPatientSwitcher(false);
  };

  const waitingQueue = localAppointments.getQueue() || [];
  const recentVisits = (localVisits.getAll() || []).slice(0, 4);

  const filteredPatients = patientSearchQuery.trim()
    ? allPatients.filter(
        (p) =>
          (p.name && p.name.toLowerCase().includes(patientSearchQuery.toLowerCase())) ||
          (p.contact && p.contact.includes(patientSearchQuery)) ||
          (p.id && p.id.toLowerCase().includes(patientSearchQuery.toLowerCase()))
      )
    : allPatients;

  // If no patient selected yet, show clinical intake suite
  if (!patient) {
    return (
      <div className="prescription-page bg-[#F7FAF8] pb-4">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Top Header & Quick Actions Bar */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-[#D9E6E2] shadow-clinixpulse-xs">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#287C75] bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                  Prescription Studio • Clinical Intake
                </span>
                <span className="text-xs font-mono text-[#7D908C]">
                  {allPatients.length} Registered Patients
                </span>
              </div>
              <h1 className="text-2xl font-heading font-bold text-[#10201F]">
                Select Patient for Consultation
              </h1>
              <p className="text-sm text-[#4E6460]">
                Choose from today's waiting queue, search directory, or register a walk-in patient.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  setIntakeForm((prev) => ({
                    ...prev,
                    name: patientSearchQuery.trim() || '',
                  }));
                  setShowIntakeAddModal(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#287C75] text-white text-xs font-semibold hover:bg-[#1f635d] shadow-clinixpulse-xs transition cursor-pointer"
              >
                <UserPlus size={15} />
                <span>+ Register New Patient</span>
              </button>

              <button
                type="button"
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
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#D9E6E2] bg-white text-[#10201F] text-xs font-semibold hover:bg-[#F7FAF8] transition cursor-pointer"
                title="Instant consultation for unregistered walk-in"
              >
                <Sparkles size={14} className="text-[#C9A45C]" />
                <span>Instant Walk-in</span>
              </button>
            </div>
          </div>

          {/* Main 2-Column Split: Queue & Directory */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column (5/12 cols): Waiting Queue & Recent Prescriptions */}
            <div className="lg:col-span-5 space-y-6">
              {/* Card 1: Today's Waiting Queue */}
              <div className="bg-white p-5 rounded-2xl border border-[#D9E6E2] shadow-clinixpulse-xs">
                <div className="flex items-center justify-between pb-3 border-b border-[#D9E6E2]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#2E7D5B] animate-pulse" />
                    <h2 className="text-sm font-heading font-bold text-[#10201F]">
                      Today's Waiting Queue
                    </h2>
                  </div>
                  <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-[#2E7D5B] border border-emerald-200">
                    {waitingQueue.length} Waiting
                  </span>
                </div>

                {waitingQueue.length > 0 ? (
                  <div className="mt-3 divide-y divide-[#EBF1EE] max-h-72 overflow-y-auto pr-1">
                    {waitingQueue.map((item) => {
                      const matched = localPatients.getById(item.patientId);
                      const displayPt = matched || {
                        id: item.patientId || `PT-${item.id}`,
                        name: item.patientName,
                        age: item.patientAge,
                        gender: 'Patient',
                        contact: '',
                      };

                      return (
                        <div
                          key={item.id}
                          className="py-3 flex items-center justify-between gap-3 hover:bg-[#F7FAF8] rounded-xl px-2 transition group cursor-pointer"
                          onClick={() => handleSelectPatientFromList(displayPt)}
                        >
                          <div className="flex items-center gap-3">
                            <PatientAvatar
                              gender={displayPt.gender}
                              name={displayPt.name}
                              className="w-9 h-9 rounded-full shrink-0 shadow-2xs"
                            />
                            <div>
                              <p className="text-xs font-bold text-[#10201F] group-hover:text-[#287C75] transition">
                                {displayPt.name}
                              </p>
                              <div className="flex items-center gap-2 text-[11px] text-[#4E6460]">
                                <span>{displayPt.age ? `${displayPt.age} Y` : ''}</span>
                                {item.startTime && (
                                  <span className="font-mono text-[#7D908C]">
                                    • in queue {item.startTime}
                                  </span>
                                )}
                              </div>
                              {item.reason && (
                                <p className="text-[11px] text-[#7D908C] italic truncate max-w-[180px]">
                                  {item.reason}
                                </p>
                              )}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectPatientFromList(displayPt);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#287C75] text-white text-xs font-semibold hover:bg-[#1f635d] transition shrink-0"
                          >
                            <span>Start Rx</span>
                            <ArrowRight size={12} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-8 text-center text-[#7D908C] text-xs">
                    <p className="font-semibold text-[#10201F]">Waiting Queue Empty</p>
                    <p className="mt-1">No checked-in patients currently waiting.</p>
                  </div>
                )}
              </div>

              {/* Card 2: Recent Consultations */}
              {recentVisits.length > 0 && (
                <div className="bg-white p-5 rounded-2xl border border-[#D9E6E2] shadow-clinixpulse-xs">
                  <div className="flex items-center justify-between pb-3 border-b border-[#D9E6E2]">
                    <div className="flex items-center gap-2">
                      <Clock3 size={15} className="text-[#C9A45C]" />
                      <h2 className="text-sm font-heading font-bold text-[#10201F]">
                        Recent Consultations
                      </h2>
                    </div>
                    <span className="text-xs font-mono text-[#7D908C]">
                      Quick Follow-up
                    </span>
                  </div>

                  <div className="mt-3 divide-y divide-[#EBF1EE]">
                    {recentVisits.map((v) => {
                      const matched = v.patientId ? localPatients.getById(v.patientId) : null;
                      const displayPt = matched || {
                        id: v.patientId || 'PT-PREV',
                        name: v.patientName,
                        age: v.patientAge,
                        gender: v.patientGender,
                        contact: v.patientMobile,
                      };

                      return (
                        <div
                          key={v.id}
                          className="py-2.5 flex items-center justify-between gap-3 hover:bg-[#F7FAF8] rounded-xl px-2 transition group cursor-pointer"
                          onClick={() => handleSelectPatientFromList(displayPt)}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-[#10201F] group-hover:text-[#287C75] transition">
                                {v.patientName}
                              </span>
                              <span className="text-[10px] font-mono text-[#7D908C]">
                                {v.date ? (v.date.includes('T') ? v.date.split('T')[0] : v.date) : ''}
                              </span>
                            </div>
                            {v.diagnosis && (
                              <p className="text-[11px] text-[#4E6460] truncate max-w-[200px] italic">
                                {v.diagnosis}
                              </p>
                            )}
                          </div>
                          <span className="text-[11px] font-semibold text-[#287C75] hover:underline">
                            Select →
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column (7/12 cols): Patient Directory & Search */}
            <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-[#D9E6E2] shadow-clinixpulse-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <h2 className="text-sm font-heading font-bold text-[#10201F]">
                  Patient Directory Lookup
                </h2>
                <span className="text-xs font-mono text-[#7D908C]">
                  Showing {filteredPatients.length} of {allPatients.length} patients
                </span>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7D908C]" />
                <input
                  type="text"
                  placeholder="Search by patient name, phone number, or PT-ID..."
                  value={patientSearchQuery}
                  onChange={(e) => setPatientSearchQuery(e.target.value)}
                  className="w-full h-11 pl-10 pr-10 text-sm rounded-xl border border-[#D9E6E2] bg-[#F7FAF8] focus:bg-white focus:border-[#287C75] focus:outline-none focus:ring-2 focus:ring-[#287C75]/15 transition"
                  autoFocus
                />
                {patientSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setPatientSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#7D908C] hover:text-[#10201F] rounded-full hover:bg-slate-100 transition"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Patients List */}
              <div className="divide-y divide-[#EBF1EE] max-h-[500px] overflow-y-auto pr-1">
                {filteredPatients.length > 0 ? (
                  filteredPatients.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => handleSelectPatientFromList(p)}
                      className="py-3.5 px-3 hover:bg-[#F7FAF8] rounded-xl cursor-pointer flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 transition border border-transparent hover:border-[#D9E6E2]"
                    >
                      <div className="flex items-center gap-3">
                        <PatientAvatar
                          gender={p.gender}
                          name={p.name}
                          className="w-10 h-10 rounded-full shrink-0 shadow-xs"
                        />
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-[#10201F]">
                              {p.name}
                            </span>
                            <span className="text-[11px] font-mono text-[#7D908C] bg-[#F7FAF8] border border-[#D9E6E2] px-1.5 py-0.2 rounded">
                              {p.id}
                            </span>
                            {p.status && (
                              <span className="text-[10px] font-bold text-[#2E7D5B] bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-full">
                                {p.status}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#4E6460]">
                            <span>
                              {p.age ? `${p.age} Yrs` : ''} {p.gender ? `• ${p.gender}` : ''}
                            </span>
                            {(p.contact || p.mobile) && (
                              <span className="inline-flex items-center gap-1 font-mono">
                                <Phone size={11} className="text-[#7D908C]" />
                                {p.contact || p.mobile}
                              </span>
                            )}
                            {p.bloodGroup && (
                              <span className="font-semibold text-rose-600">
                                {p.bloodGroup}
                              </span>
                            )}
                          </div>
                          {p.allergies && p.allergies !== 'None' && (
                            <p className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-block mt-1">
                              ⚠️ Allergy: {p.allergies}
                            </p>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectPatientFromList(p);
                        }}
                        className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl border border-[#287C75] bg-teal-50 text-[#287C75] text-xs font-semibold hover:bg-[#287C75] hover:text-white transition shrink-0 self-end sm:self-auto cursor-pointer"
                      >
                        <span>Select Patient</span>
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center space-y-3">
                    <p className="text-sm font-semibold text-[#10201F]">
                      No patients found matching "{patientSearchQuery}"
                    </p>
                    <p className="text-xs text-[#7D908C]">
                      You can register this patient right now to start the prescription.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setIntakeForm((prev) => ({
                          ...prev,
                          name: patientSearchQuery.trim(),
                        }));
                        setShowIntakeAddModal(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#287C75] text-white text-xs font-semibold hover:bg-[#1f635d] transition shadow-xs cursor-pointer"
                    >
                      <UserPlus size={14} />
                      <span>+ Register "{patientSearchQuery.trim()}" as Patient</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal: Quick Register New Patient */}
        {showIntakeAddModal && typeof document !== 'undefined' &&
          createPortal(
            <div
              className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 transition-opacity"
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setShowIntakeAddModal(false);
                  setIntakeFormError('');
                }
              }}
              role="dialog"
            aria-modal="true"
          >
            <div
              className="w-full max-w-md rounded-2xl bg-white border border-[#D9E6E2] shadow-clinixpulse-lg p-6 animate-in fade-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-[#D9E6E2] pb-3.5">
                <div className="flex items-center gap-2">
                  <UserPlus size={18} className="text-[#287C75]" />
                  <h2 className="font-heading text-lg font-bold text-[#10201F]">
                    Register Patient & Begin Rx
                  </h2>
                </div>
                <button
                  type="button"
                  className="rounded-xl p-1.5 text-[#7D908C] hover:bg-slate-100 hover:text-[#10201F] transition"
                  onClick={() => {
                    setShowIntakeAddModal(false);
                    setIntakeFormError('');
                  }}
                  aria-label="Close modal"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mt-4 space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-[#10201F] mb-1">
                    Patient Name *
                  </label>
                  <input
                    type="text"
                    placeholder="Full name"
                    value={intakeForm.name}
                    onChange={(e) => setIntakeForm((p) => ({ ...p, name: e.target.value }))}
                    className="w-full h-10 px-3 text-sm rounded-xl border border-[#D9E6E2] bg-white focus:border-[#287C75] focus:outline-none"
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#10201F] mb-1">
                      Age *
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="130"
                      placeholder="Age"
                      value={intakeForm.age}
                      onChange={(e) => setIntakeForm((p) => ({ ...p, age: e.target.value }))}
                      className="w-full h-10 px-3 text-sm rounded-xl border border-[#D9E6E2] bg-white focus:border-[#287C75] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#10201F] mb-1">
                      Gender *
                    </label>
                    <select
                      value={intakeForm.gender}
                      onChange={(e) => setIntakeForm((p) => ({ ...p, gender: e.target.value }))}
                      className="w-full h-10 px-3 text-sm rounded-xl border border-[#D9E6E2] bg-white focus:border-[#287C75] focus:outline-none"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#10201F] mb-1">
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    placeholder="10 digit phone number"
                    value={intakeForm.contact}
                    onChange={(e) => setIntakeForm((p) => ({ ...p, contact: e.target.value }))}
                    className="w-full h-10 px-3 text-sm rounded-xl border border-[#D9E6E2] bg-white focus:border-[#287C75] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#10201F] mb-1">
                    Known Allergies (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sulfa, Penicillin, None"
                    value={intakeForm.allergies}
                    onChange={(e) => setIntakeForm((p) => ({ ...p, allergies: e.target.value }))}
                    className="w-full h-10 px-3 text-sm rounded-xl border border-[#D9E6E2] bg-white focus:border-[#287C75] focus:outline-none"
                  />
                </div>

                {intakeFormError && (
                  <p className="text-xs font-semibold text-[#B94A48] bg-rose-50 border border-rose-200 px-3 py-2 rounded-xl">
                    {intakeFormError}
                  </p>
                )}
              </div>

              <div className="mt-6 flex gap-3 pt-3 border-t border-[#D9E6E2]">
                <button
                  type="button"
                  onClick={handleIntakeAddPatient}
                  className="flex-1 py-2.5 rounded-xl bg-[#287C75] text-white text-xs font-semibold hover:bg-[#1f635d] transition cursor-pointer"
                >
                  Save & Open Studio
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowIntakeAddModal(false);
                    setIntakeFormError('');
                  }}
                  className="px-4 py-2.5 rounded-xl border border-[#D9E6E2] text-xs font-semibold text-[#4E6460] hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
    );
  }

  const followUpDisplay = getFollowUpFormattedDisplay();

  return (
    <div className={`prescription-page ${printSettings.padMode ? 'pad-mode' : 'digital-mode'}`}>
      {/* Toast Notification */}
      {saveFeedback && (
        <div className="prescription-toast-notification no-print shadow-clinixpulse-md">
          <Check size={16} className="text-[#2E7D5B] mr-2" />
          <span className="font-medium text-[#10201F] text-sm">{saveFeedback.message}</span>
        </div>
      )}

      {/* Screen Controls Header Bar */}
      <div className="prescription-controls no-print">
        <div className="controls-left">
          <button type="button" className="btn-secondary btn-header-back" onClick={() => navigate(-1)} title="Go back to previous page">
            <ArrowLeft size={14} />
            <span>Back</span>
          </button>
        </div>

        {/* Quick Print Alignment Bar */}
        <div className="prescription-quick-alignment">
          <div className="prescription-segmented-control">
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
            <div className="pad-offset-inline">
              <label htmlFor="quick-top-offset" className="flex items-center gap-1 text-[11px] font-semibold text-[#4E6460]">
                <Sliders size={12} className="text-[#287C75]" />
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
                className="w-16 accent-[#287C75] cursor-pointer"
              />
              <span className="prescription-offset-badge tabular-nums">
                {printSettings.topOffsetMm || 60} mm
              </span>
            </div>
          )}

          <button
            type="button"
            className="btn-secondary btn-header-back"
            onClick={() => navigate('/settings')}
            title="Configure Clinic Logo, Custom Address, and Stationery Settings"
            aria-label="Clinic Settings"
          >
            <SlidersHorizontal size={13} />
            <span className="hidden sm:inline">Settings</span>
          </button>
        </div>

        {/* Top Action Buttons */}
        <div className="controls-right">
          <button
            type="button"
            className="btn-preview"
            onClick={() => setIsPreviewOpen(true)}
            title="Preview how prescription will look when printed"
          >
            <Eye size={14} />
            <span>Preview</span>
          </button>

          <button
            type="button"
            className="btn-whatsapp"
            onClick={handleShareWhatsApp}
            title="Save and share prescription via WhatsApp"
          >
            <MessageCircle size={14} />
            <span>WhatsApp</span>
          </button>

          <button
            type="button"
            className="btn-secondary btn-header-save"
            onClick={() => handleSavePrescription('SAVED', false)}
            title="Save prescription record to database"
          >
            <Save size={14} />
            <span>Save</span>
          </button>

          <button
            type="button"
            className="btn-primary btn-header-print"
            onClick={handlePrint}
            title="Save and print prescription"
          >
            <Printer size={14} />
            <span>Print Prescription</span>
          </button>
        </div>
      </div>

      {/* Main Prescription Container */}
      <div className="prescription-content shadow-clinixpulse-sm">
        {/* Digital Letterhead Header (Rendered on plain paper when padMode is false) */}
        <div className="digital-letterhead">
          <div className="letterhead-header">
            <div className="letterhead-clinic-brand">
              {clinicSettings.clinicLogo && (
                <img
                  src={clinicSettings.clinicLogo}
                  alt={clinicSettings.clinicName || 'Clinic Logo'}
                  className="letterhead-clinic-logo"
                />
              )}
              <div>
                <h1 className="letterhead-clinic-name font-heading">
                  {clinicSettings.clinicName || 'ClinixPulse Clinic & Health Centre'}
                </h1>
                {clinicSettings.clinicTagline && (
                  <p className="letterhead-clinic-tagline">{clinicSettings.clinicTagline}</p>
                )}
                <p className="letterhead-clinic-details">{clinicSettings.address}</p>
                <p className="letterhead-clinic-details">Phone: {clinicSettings.phone}</p>
              </div>
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

        {/* Subtle Background Clinic Watermark if configured */}
        {clinicSettings.watermarkEnabled && clinicSettings.clinicLogo && (
          <div
            className="prescription-watermark-overlay"
            style={{ opacity: clinicSettings.watermarkOpacity || 0.06 }}
            aria-hidden="true"
          >
            <img src={clinicSettings.clinicLogo} alt="" className="prescription-watermark-img" />
          </div>
        )}

        {/* 1. Patient Identity Banner */}
        <section className="prescription-section patient-info-section">
          <div className="patient-banner-container">
            <div className="patient-banner-left">
              <div className="patient-avatar-badge no-print relative">
                <PatientAvatar
                  gender={patient.gender}
                  name={patient.name}
                  className="w-12 h-12 rounded-full shrink-0 shadow-2xs"
                />
                <span className="patient-avatar-subicon">
                  <Stethoscope size={10} />
                </span>
              </div>
              <div className="patient-banner-details">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="patient-banner-name font-heading">{patient.name}</h2>
                  {patient.id && (
                    <span className="patient-id-pill font-mono tabular-nums">{patient.id}</span>
                  )}
                  {/* Blood Group Badge */}
                  <span className="patient-blood-pill font-mono">
                    <Droplet size={11} className="text-rose-500 fill-rose-500 inline mr-1" />
                    <strong>Blood:</strong> {patient.bloodGroup || 'B+'}
                  </span>
                  {/* Known Allergy Alert */}
                  {patient.allergies && patient.allergies !== 'None' ? (
                    <span className="patient-allergy-alert-pill">
                      <AlertTriangle size={11} className="text-amber-700 inline mr-1" />
                      <strong>Allergy:</strong> {patient.allergies}
                    </span>
                  ) : (
                    <span className="patient-allergy-safe-pill">
                      <CheckCircle2 size={11} className="text-emerald-700 inline mr-1" />
                      NKDA
                    </span>
                  )}
                  {/* In Consultation Status Dot */}
                  <span className="patient-status-pulse no-print">
                    <span className="pulse-indicator" />
                    In Consultation
                  </span>
                </div>
                <div className="patient-banner-meta">
                  <span className="meta-chip">
                    <User size={12} className="text-[#287C75]" />
                    <strong>Age/Sex:</strong>{' '}
                    <span className="tabular-nums">
                      {patient.age ? `${patient.age} Yrs` : 'N/A'} / {patient.gender || 'N/A'}
                    </span>
                  </span>
                  <span>•</span>
                  <span className="meta-chip">
                    <Phone size={12} className="text-[#287C75]" />
                    <strong>Phone:</strong>{' '}
                    <span className="tabular-nums">{patient.contact || patient.mobile || 'N/A'}</span>
                  </span>
                  <span>•</span>
                  <span className="meta-chip">
                    <Calendar size={12} className="text-[#287C75]" />
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
                className="btn-past-history"
                onClick={() => setIsHistoryDrawerOpen(true)}
                title="View previous clinical visits and prescriptions for this patient"
                aria-label="Patient Past Visits History"
              >
                <History size={13} className="text-[#287C75]" />
                <span>Past History</span>
                <span className="past-history-badge tabular-nums">{pastVisitsCount}</span>
              </button>
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
            <div className="patient-switcher-popover no-print app-card shadow-clinixpulse-lg">
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
            <span className="vitals-guidance-badge no-print">
              <HeartPulse size={12} className="text-rose-500 inline mr-1" />
              Standard Adult Clinical Baseline
            </span>
          </div>
          <div className="vitals-grid">
            <div className="vital-item">
              <div className="vital-header-row">
                <span className="vital-label-group">
                  <Heart size={12} className="text-rose-500" />
                  <label htmlFor="bp">BP:</label>
                </span>
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
                <span className="vital-label-group">
                  <Scale size={12} className="text-amber-600" />
                  <label htmlFor="weight">Weight:</label>
                </span>
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
                <span className="vital-label-group">
                  <Droplet size={12} className="text-red-500" />
                  <label htmlFor="bloodSugar">Blood Sugar:</label>
                </span>
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
                <span className="vital-label-group">
                  <Thermometer size={12} className="text-orange-500" />
                  <label htmlFor="temperature">Temp:</label>
                </span>
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
                <span className="vital-label-group">
                  <HeartPulse size={12} className="text-rose-600" />
                  <label htmlFor="pulse">Pulse:</label>
                </span>
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
                <span className="vital-label-group">
                  <Wind size={12} className="text-cyan-600" />
                  <label htmlFor="spo2">SpO2:</label>
                </span>
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

        {/* 1-Click Clinical Rx Protocols (Protocol Kits) - Configurable via Settings */}
        {enableProtocols && (
          <section className="prescription-section rx-protocol-section no-print" aria-label="Clinical Rx Protocols">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-2.5">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-md bg-[#287C75]/10 text-[#287C75]">
                  <Zap size={14} className="fill-[#287C75]" />
                </span>
                <div>
                  <h3 className="section-title font-heading mb-0 text-[13px] font-bold text-[#10201F]">
                    1-Click Clinical Rx Protocols (Protocol Kits)
                  </h3>
                  <p className="text-[11px] text-[#7D908C] m-0">
                    Select a protocol to auto-fill Symptoms, Diagnosis, Standard Meds & Dietary Advice in 1 click
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-[#287C75] bg-[#E8F3F1] px-2.5 py-0.5 rounded-full self-start sm:self-auto border border-[#287C75]/20">
                Gastro Specialty Kits
              </span>
            </div>

            <div className="rx-protocol-chips-grid">
              {protocols.map((proto) => (
                <button
                  key={proto.id}
                  type="button"
                  className="rx-protocol-card-chip"
                  onClick={() => handleApplyProtocol(proto)}
                  title={`Apply ${proto.title} Protocol (${proto.medicines?.length || 0} medicines)`}
                >
                  <div className="rx-protocol-chip-header">
                    <span className="rx-protocol-chip-title">{proto.title}</span>
                    <span className="rx-protocol-chip-count">{proto.medicines?.length || 0} meds</span>
                  </div>
                  <div className="rx-protocol-chip-summary text-truncate">
                    {proto.medicines?.map((m) => m.name.split(' ')[0]).join(' + ')}
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* 3. Chief Complaints / Symptoms */}
        <section className="prescription-section">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-2">
            <h3 className="section-title font-heading mb-0">Chief Complaints / Symptoms</h3>
            <span className="text-[11px] font-semibold text-[#7D908C] no-print">
              Tap chips below to quick-fill common gastro complaints
            </span>
          </div>

          {/* Quick GI Symptom Chips */}
          <div className="clinical-chips-bar no-print">
            <span className="chips-hint">
              <Sparkles size={11} className="text-[#C9A45C]" />
              Quick:
            </span>
            {(clinicalChips.symptoms || []).map((item) => (
              <button
                key={item}
                type="button"
                className="clinical-suggestion-chip"
                onClick={() => handleAddSymptom(item)}
                title={`Add ${item} to symptoms`}
              >
                + {item}
              </button>
            ))}
            <button
              type="button"
              className="clinical-manage-trigger-btn"
              onClick={() => handleOpenManageChips('symptoms')}
              title="Manage Symptoms Quick Chips"
            >
              <SlidersHorizontal size={11} />
              <span>Manage</span>
            </button>
          </div>

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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-2">
            <h3 className="section-title font-heading mb-0">Clinical Diagnosis</h3>
            <span className="text-[11px] font-semibold text-[#7D908C] no-print">
              Tap chips to insert verified GI & hepatology diagnoses
            </span>
          </div>

          {/* Quick GI Diagnosis Chips */}
          <div className="clinical-chips-bar no-print">
            <span className="chips-hint">
              <Sparkles size={11} className="text-[#C9A45C]" />
              Quick:
            </span>
            {(clinicalChips.diagnosis || []).map((item) => (
              <button
                key={item}
                type="button"
                className="clinical-suggestion-chip diagnosis-chip"
                onClick={() => handleAddDiagnosis(item)}
                title={`Add ${item} to diagnosis`}
              >
                + {item}
              </button>
            ))}
            <button
              type="button"
              className="clinical-manage-trigger-btn diagnosis-trigger"
              onClick={() => handleOpenManageChips('diagnosis')}
              title="Manage Diagnosis Quick Chips"
            >
              <SlidersHorizontal size={11} />
              <span>Manage</span>
            </button>
          </div>

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
          </div>

          <MedicineTable
            medicines={medicines}
            onUpdate={updateMedicine}
            onUpdateMedicineFull={updateMedicineFull}
            onRemove={removeMedicineRow}
          />

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#EBF1EE] no-print">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-dashed border-[#287C75] text-[#287C75] hover:bg-[#E8F3F1] text-xs font-semibold transition cursor-pointer"
              onClick={addMedicineRow}
            >
              <Plus size={13} />
              <span>Add Another Medicine</span>
            </button>
            <span className="text-xs font-semibold text-[#7D908C]">
              {medicines.filter((m) => m.name).length} {medicines.filter((m) => m.name).length === 1 ? 'Formulation' : 'Formulations'} Prescribed
            </span>
          </div>
        </section>

        {/* 6. Advice / Dietary Instructions */}
        <section className="prescription-section">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-2">
            <h3 className="section-title font-heading mb-0">Advice & Dietary Instructions</h3>
            <span className="text-[11px] font-semibold text-[#7D908C] no-print">
              Tap chips for dietary & lifestyle recommendations
            </span>
          </div>

          {/* Quick Dietary & Lifestyle Chips */}
          <div className="clinical-chips-bar no-print">
            <span className="chips-hint">
              <Sparkles size={11} className="text-[#C9A45C]" />
              Quick:
            </span>
            {(clinicalChips.advice || []).map((item) => (
              <button
                key={item}
                type="button"
                className="clinical-suggestion-chip advice-chip"
                onClick={() => handleAddAdvice(item)}
                title={`Add ${item} to advice`}
              >
                + {item}
              </button>
            ))}
            <button
              type="button"
              className="clinical-manage-trigger-btn advice-trigger"
              onClick={() => handleOpenManageChips('advice')}
              title="Manage Advice Quick Chips"
            >
              <SlidersHorizontal size={11} />
              <span>Manage</span>
            </button>
          </div>

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

          <p className="followup-reassurance-note no-print">
            <MessageCircle size={13} className="text-emerald-600 inline mr-1.5 shrink-0" />
            <span>
              Patient{' '}
              <strong className="text-[#10201F] font-bold">{patient.name}</strong>{' '}
              will receive an automated WhatsApp appointment reminder 2 days before this follow-up date.
            </span>
          </p>
        </section>

        {/* Doctor Signature Block (Prints at bottom) */}
        <div className="prescription-doctor-signature">
          <div className="">
            {clinicSettings?.signatureUrl ? (
              <div className="signature-digital-wrap">
                <img
                  src={clinicSettings.signatureUrl}
                  alt="Doctor Digital Signature"
                  className="signature-digital-img"
                />
              </div>
            ) : (
              <div className="signature-placeholder-space" />
            )}
            <p className="signature-doctor font-heading">{clinicSettings.doctorName || 'Dr. Aarav Sharma'}</p>
            <p className="signature-credentials">
              {clinicSettings.qualification || 'MBBS, MD (Medicine)'}
           
            </p>
            <div className="signature-upload-action no-print">
              <label
                htmlFor="rx-signature-upload-input"
                className="cursor-pointer text-[10.5px] font-semibold text-[#287C75] hover:underline inline-flex items-center gap-1 mt-1"
                title="Upload or update doctor digital signature"
              >
                <PenTool size={11} />
                <span>{clinicSettings?.signatureUrl ? 'Change Digital Signature' : '+ Upload Digital Signature'}</span>
              </label>
              <input
                id="rx-signature-upload-input"
                type="file"
                accept="image/*"
                onChange={handleSignatureFileUpload}
                className="hidden"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Manage Clinical Quick Chips */}
      {isManageChipsOpen &&
        (typeof document !== 'undefined' ? (
          createPortal(
            <div
              className="manage-chips-overlay"
              style={{ zIndex: 9999 }}
              onClick={() => setIsManageChipsOpen(false)}
              role="dialog"
              aria-modal="true"
              aria-labelledby="manage-chips-title"
            >
          <div
            className="manage-chips-modal"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="manage-chips-header">
              <div className="flex items-center gap-2.5">
                <div className="manage-chips-icon-wrap">
                  <SlidersHorizontal size={18} className="text-[#287C75]" />
                </div>
                <div>
                  <h3 id="manage-chips-title" className="manage-chips-title font-heading">
                    Manage Clinical Quick Chips
                  </h3>
                  <p className="manage-chips-subtitle">
                    Personalize 1-click clinical suggestions for faster prescription writing.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsManageChipsOpen(false)}
                className="manage-chips-close-btn"
                aria-label="Close Quick Chips Manager"
              >
                <X size={18} />
              </button>
            </div>

            {/* Category Tabs */}
            <div className="manage-chips-tabs">
              <button
                type="button"
                className={`manage-tab-btn ${manageActiveTab === 'symptoms' ? 'is-active' : ''}`}
                onClick={() => {
                  setManageActiveTab('symptoms');
                  setNewChipInput('');
                }}
              >
                <span>Symptoms & Complaints</span>
                <span className="tab-chip-count">{clinicalChips.symptoms?.length || 0}</span>
              </button>
              <button
                type="button"
                className={`manage-tab-btn ${manageActiveTab === 'diagnosis' ? 'is-active' : ''}`}
                onClick={() => {
                  setManageActiveTab('diagnosis');
                  setNewChipInput('');
                }}
              >
                <span>Clinical Diagnosis</span>
                <span className="tab-chip-count">{clinicalChips.diagnosis?.length || 0}</span>
              </button>
              <button
                type="button"
                className={`manage-tab-btn ${manageActiveTab === 'advice' ? 'is-active' : ''}`}
                onClick={() => {
                  setManageActiveTab('advice');
                  setNewChipInput('');
                }}
              >
                <span>Diet & Lifestyle Advice</span>
                <span className="tab-chip-count">{clinicalChips.advice?.length || 0}</span>
              </button>
            </div>

            {/* Notification alert banner if any */}
            {chipNotification && (
              <div className="manage-chips-alert">
                <CheckCircle2 size={14} className="text-[#287C75]" />
                <span>{chipNotification}</span>
              </div>
            )}

            {/* Add New Custom Chip Form */}
            <form onSubmit={handleAddNewCustomChip} className="manage-chips-add-form">
              <div className="relative flex-1">
                <Tag size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7D908C]" />
                <input
                  type="text"
                  value={newChipInput}
                  onChange={(e) => setNewChipInput(e.target.value)}
                  placeholder={
                    manageActiveTab === 'symptoms'
                      ? 'Type new symptom (e.g. Severe Dysphagia, Hematemesis)...'
                      : manageActiveTab === 'diagnosis'
                      ? 'Type new diagnosis (e.g. Celiac Disease, Crohn’s Disease)...'
                      : 'Type new advice (e.g. Avoid citrus fruits, Drink coconut water)...'
                  }
                  className="manage-chip-input"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                className="manage-chip-add-submit-btn"
                disabled={!newChipInput.trim()}
              >
                <Plus size={15} />
                <span>Add Chip</span>
              </button>
            </form>

            {/* Active Chips List */}
            <div className="manage-chips-body">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[#4E6460] uppercase tracking-wider">
                  Active Quick Chips ({clinicalChips[manageActiveTab]?.length || 0})
                </span>
                <span className="text-[11px] text-[#7D908C]">
                  Click ✕ to remove chip
                </span>
              </div>

              <div className="manage-chips-list">
                {clinicalChips[manageActiveTab]?.length > 0 ? (
                  clinicalChips[manageActiveTab].map((item) => (
                    <div
                      key={item}
                      className={`manage-chip-item ${
                        manageActiveTab === 'diagnosis'
                          ? 'chip-item-diagnosis'
                          : manageActiveTab === 'advice'
                          ? 'chip-item-advice'
                          : 'chip-item-symptom'
                      }`}
                    >
                      <span className="manage-chip-text">{item}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveChip(manageActiveTab, item)}
                        className="manage-chip-delete-btn"
                        title={`Remove "${item}"`}
                        aria-label={`Remove ${item}`}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="manage-chips-empty">
                    <p className="text-xs text-[#7D908C]">
                      No chips in this section. Add one above or reset to clinic defaults below.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="manage-chips-footer">
              <button
                type="button"
                onClick={() => handleResetCategoryChips(manageActiveTab)}
                className="manage-chips-reset-btn"
                title="Reset this category to clinic defaults"
              >
                <RotateCcw size={13} />
                <span>Reset to Clinic Defaults</span>
              </button>

              <button
                type="button"
                onClick={() => setIsManageChipsOpen(false)}
                className="manage-chips-done-btn"
              >
                Done
              </button>
            </div>
          </div>
        </div>,
        document.body
      )
    ) : null)}

      {/* Patient Past History Drawer */}
      <PatientPastHistoryDrawer
        isOpen={isHistoryDrawerOpen}
        onClose={() => setIsHistoryDrawerOpen(false)}
        patient={patient}
        currentVisitId={visitIdParam}
        onRepeatRx={handleRepeatRx}
        onAddSingleMed={handleAddSingleMed}
        onPreviewVisit={(visit) => setPreviewPastVisit(visit)}
      />

      {/* Print Preview Modal for Past Visit */}
      {previewPastVisit && (
        <PrintPreviewModal
          isOpen={Boolean(previewPastVisit)}
          onClose={() => setPreviewPastVisit(null)}
          patient={patient}
          prescriptionDate={previewPastVisit.date || previewPastVisit.createdAt}
          vitals={previewPastVisit.vitals || {}}
          symptoms={previewPastVisit.symptoms || ''}
          diagnosis={previewPastVisit.diagnosis || ''}
          advice={previewPastVisit.advice || ''}
          medicines={previewPastVisit.medicines || []}
          followUpDate={previewPastVisit.followUpDate ? (new Date(previewPastVisit.followUpDate).toLocaleDateString('en-IN')) : ''}
          rxId={previewPastVisit.id || ''}
          printSettings={printSettings}
          clinicSettings={clinicSettings}
          onPrint={() => {
            setTimeout(() => window.print(), 100);
          }}
        />
      )}

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
