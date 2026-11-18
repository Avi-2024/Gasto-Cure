import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { doctorApi } from '../../services/doctorApi';
import { localAppointments, localVisits } from '../../services/localStore';
import PatientQueue from './components/PatientQueue';
import PatientHistory from './components/PatientHistory';
import ConsultationForm from './components/ConsultationForm';
import { Activity, AlertCircle, ArrowLeft, CheckCircle2, Stethoscope } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ConsultationPage() {
  const { accessToken, activeClinicId } = useAuth();
  const [queue, setQueue] = useState([]);
  const [selectedQueueItem, setSelectedQueueItem] = useState(null);
  const [history, setHistory] = useState([]);
  const [saving, setSaving] = useState(false);
  const [savedVisitId, setSavedVisitId] = useState(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [form, setForm] = useState({
    diagnosis: '',
    notes: '',
    medicines: [{ name: '', dosage: '', frequency: '' }],
    tests: [],
  });

  const selectedPatientId = useMemo(
    () => selectedQueueItem?.patientId || selectedQueueItem?.patient?._id || selectedQueueItem?.id || null,
    [selectedQueueItem]
  );

  // Load Patient Queue with robust offline fallback
  const refreshQueue = async () => {
    try {
      if (activeClinicId && accessToken) {
        const res = await doctorApi.getPatientQueue({ clinicId: activeClinicId, token: accessToken });
        const queueItems = res.appointments || res.queue || [];
        if (queueItems.length > 0) {
          setQueue(queueItems);
          setSelectedQueueItem((prev) => prev || queueItems[0]);
          return;
        }
      }
    } catch (err) {
      // Graceful offline fallback
    }

    // Local fallback
    const offlineQueue = localAppointments.getQueue();
    setQueue(offlineQueue);
    if (offlineQueue.length > 0) {
      setSelectedQueueItem((prev) => prev || offlineQueue[0]);
    }
  };

  useEffect(() => {
    refreshQueue();
  }, [activeClinicId, accessToken]);

  // Load Patient History with robust offline fallback
  useEffect(() => {
    if (!selectedPatientId) {
      setHistory([]);
      return;
    }

    const loadHistory = async () => {
      try {
        if (activeClinicId && accessToken) {
          const res = await doctorApi.getPatientHistory({
            clinicId: activeClinicId,
            patientId: selectedPatientId,
            token: accessToken,
          });
          const historyItems = res.history || res.visits || [];
          if (historyItems.length > 0) {
            setHistory(historyItems);
            return;
          }
        }
      } catch (err) {
        // Fall back to localVisits
      }

      // Offline fallback
      const offlineVisits = localVisits.getByPatient(selectedPatientId);
      setHistory(offlineVisits);
    };

    loadHistory();
  }, [selectedPatientId, activeClinicId, accessToken]);

  useEffect(() => {
    setSavedVisitId(null);
    setSuccessMsg('');
    setError('');
  }, [selectedPatientId]);

  const onAddMedicine = () => {
    setForm((prev) => ({
      ...prev,
      medicines: [...prev.medicines, { name: '', dosage: '', frequency: '' }],
    }));
  };

  const onRemoveMedicine = (index) => {
    setForm((prev) => ({
      ...prev,
      medicines: prev.medicines.length === 1 ? prev.medicines : prev.medicines.filter((_, i) => i !== index),
    }));
  };

  const onToggleTest = (test) => {
    setForm((prev) => ({
      ...prev,
      tests: prev.tests.includes(test) ? prev.tests.filter((item) => item !== test) : [...prev.tests, test],
    }));
  };

  const onSaveVisit = async () => {
    try {
      if (!selectedQueueItem) {
        setError('Please select a patient from the waiting queue first.');
        return;
      }

      setSaving(true);
      setError('');
      setSuccessMsg('');

      const appointmentId = selectedQueueItem.id || selectedQueueItem._id;
      const patientName = selectedQueueItem?.patientName || selectedQueueItem?.patient?.fullName || 'Patient';

      const payload = {
        patientId: selectedPatientId,
        patientName,
        patientAge: selectedQueueItem?.patientAge || null,
        appointmentId,
        diagnosis: form.diagnosis,
        notes: form.notes,
        tests: form.tests,
        medicines: form.medicines.filter((medicine) => medicine.name.trim()),
      };

      const response = await doctorApi.saveVisit({ clinicId: activeClinicId, token: accessToken, payload });
      const visitId = response?.visit?.id || response?.visit?._id || `visit-${Date.now()}`;
      setSavedVisitId(visitId);
      setSuccessMsg(`Clinical consultation recorded successfully (ID: ${visitId}).`);

      // Refresh queue
      await refreshQueue();
    } catch (err) {
      setError(err.message || 'Failed to save clinical consultation.');
    } finally {
      setSaving(false);
    }
  };

  const onGeneratePdf = async () => {
    try {
      if (!savedVisitId) {
        setError('Submit and save the consultation before generating a PDF.');
        return;
      }

      const response = await doctorApi.generatePrescriptionPdf({
        clinicId: activeClinicId,
        visitId: savedVisitId,
        token: accessToken,
      });

      if (response?.pdfUrl) {
        window.open(response.pdfUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      setError(err.message || 'Failed to generate PDF document.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <section className="rounded-3xl border border-[#D9E6E2] bg-white p-6 shadow-clinixpulse-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/doctor"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#D9E6E2] bg-[#F7FAF8] text-[#4E6460] hover:bg-white hover:text-[#10201F] transition"
              aria-label="Back to Doctor Console"
            >
              <ArrowLeft size={16} />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full border border-[#287C75]/25 bg-[#287C75]/10 px-2.5 py-0.5 text-[11px] font-semibold text-[#287C75]">
                  <Stethoscope size={12} />
                  Live Clinical Workflow
                </span>
                <span className="text-xs text-[#7D908C]">
                  {queue.length} {queue.length === 1 ? 'patient' : 'patients'} waiting
                </span>
              </div>
              <h1 className="mt-1 font-heading text-xl font-bold text-[#10201F] sm:text-2xl">
                Consultation Studio
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/prescription/new"
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#D9E6E2] bg-[#F7FAF8] px-3.5 py-2 text-xs font-semibold text-[#10201F] hover:bg-white transition"
            >
              <span>Full Prescription Studio &rarr;</span>
            </Link>
          </div>
        </div>

        {/* Feedback banners */}
        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700">
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-medium text-emerald-800">
            <CheckCircle2 size={15} className="shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}
      </section>

      {/* Main Workspace Grid */}
      <section className="grid gap-6 xl:grid-cols-[380px_1fr]">
        {/* Left Column: Queue & Recent Visits */}
        <div className="space-y-6">
          <PatientQueue
            queue={queue}
            selectedPatientId={selectedPatientId}
            onSelect={setSelectedQueueItem}
          />
          <PatientHistory history={history} />
        </div>

        {/* Right Column: Active Consultation Form */}
        <div>
          <ConsultationForm
            form={form}
            setForm={setForm}
            onAddMedicine={onAddMedicine}
            onRemoveMedicine={onRemoveMedicine}
            onToggleTest={onToggleTest}
            onSaveVisit={onSaveVisit}
            onGeneratePdf={onGeneratePdf}
            saving={saving}
            selectedQueueItem={selectedQueueItem}
          />
        </div>
      </section>
    </div>
  );
}
