import React from 'react';
import { FileDown, FileText, FlaskConical, Pill, Plus, Send, Trash2, UserCheck } from 'lucide-react';

const availableTests = ['CBC', 'LFT', 'KFT', 'Thyroid Profile', 'X-Ray Chest', 'ECG', 'Lipid Profile', 'HbA1c'];

export default function ConsultationForm({
  form,
  setForm,
  onAddMedicine,
  onRemoveMedicine,
  onToggleTest,
  onSaveVisit,
  onGeneratePdf,
  saving,
  selectedQueueItem,
}) {
  const selectedPatientName =
    selectedQueueItem?.patientName || selectedQueueItem?.patient?.fullName || 'No patient selected';

  return (
    <section className="rounded-3xl border border-[#D9E6E2] bg-white p-6 shadow-clinixpulse-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#D9E6E2]/60 pb-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#287C75]">
            Clinical Encounter
          </span>
          <h2 className="font-heading text-lg font-bold text-[#10201F]">
            Consultation & Digital Prescription
          </h2>
          <p className="mt-0.5 text-xs text-[#4E6460]">
            Active Patient: <span className="font-semibold text-[#123A3A]">{selectedPatientName}</span>
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-500/25 bg-teal-50 px-3 py-1 text-xs font-bold text-[#287C75]">
          <span className="h-2 w-2 rounded-full bg-[#287C75] animate-pulse" />
          Live Draft
        </span>
      </div>

      {/* Diagnosis Input */}
      <div className="mt-5">
        <label
          className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#4E6460]"
          htmlFor="consultation-diagnosis"
        >
          <FileText size={14} className="text-[#287C75]" />
          Clinical Diagnosis & Impression *
        </label>
        <textarea
          id="consultation-diagnosis"
          value={form.diagnosis}
          onChange={(event) => setForm((prev) => ({ ...prev, diagnosis: event.target.value }))}
          rows={3}
          placeholder="e.g. Acute Gastroenteritis with mild dehydration, symptomatic GERD..."
          className="mt-1.5 w-full rounded-2xl border border-[#D9E6E2] bg-[#F7FAF8] p-3 text-sm font-medium text-[#10201F] placeholder-[#7D908C] focus:border-[#287C75] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#287C75]/15 transition"
        />
      </div>

      {/* Formulary Medicines Section */}
      <div className="mt-5 space-y-3">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#4E6460]">
            <Pill size={14} className="text-[#287C75]" />
            Prescribed Medications
          </p>
          <button
            type="button"
            onClick={onAddMedicine}
            className="inline-flex items-center gap-1 rounded-xl border border-[#D9E6E2] bg-[#F7FAF8] px-2.5 py-1 text-xs font-bold text-[#123A3A] hover:bg-white hover:border-[#287C75] transition"
          >
            <Plus size={14} />
            Add Medicine
          </button>
        </div>

        {form.medicines.map((medicine, idx) => (
          <div
            key={`consult-medicine-${idx}`}
            className="rounded-2xl border border-[#D9E6E2] bg-[#F7FAF8]/70 p-3.5 transition focus-within:border-[#287C75] focus-within:bg-white"
          >
            <div className="grid gap-2.5 sm:grid-cols-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#7D908C] block mb-1">
                  Medicine & Strength
                </label>
                <input
                  placeholder="e.g. Tab Pantoprazole 40mg"
                  value={medicine.name}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      medicines: prev.medicines.map((item, i) =>
                        i === idx ? { ...item, name: event.target.value } : item
                      ),
                    }))
                  }
                  className="w-full rounded-xl border border-[#D9E6E2] bg-white px-3 py-2 text-xs font-medium text-[#10201F] placeholder-[#7D908C] focus:border-[#287C75] focus:outline-none focus:ring-1 focus:ring-[#287C75]"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#7D908C] block mb-1">
                  Dosage / Timing
                </label>
                <input
                  placeholder="e.g. 1 Tab Before Breakfast"
                  value={medicine.dosage}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      medicines: prev.medicines.map((item, i) =>
                        i === idx ? { ...item, dosage: event.target.value } : item
                      ),
                    }))
                  }
                  className="w-full rounded-xl border border-[#D9E6E2] bg-white px-3 py-2 text-xs font-medium text-[#10201F] placeholder-[#7D908C] focus:border-[#287C75] focus:outline-none focus:ring-1 focus:ring-[#287C75]"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#7D908C] block mb-1">
                  Frequency & Duration
                </label>
                <div className="flex gap-1.5 items-center">
                  <input
                    placeholder="e.g. 1-0-1 for 5 days"
                    value={medicine.frequency}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        medicines: prev.medicines.map((item, i) =>
                          i === idx ? { ...item, frequency: event.target.value } : item
                        ),
                      }))
                    }
                    className="w-full rounded-xl border border-[#D9E6E2] bg-white px-3 py-2 text-xs font-medium text-[#10201F] placeholder-[#7D908C] focus:border-[#287C75] focus:outline-none focus:ring-1 focus:ring-[#287C75]"
                  />
                  <button
                    type="button"
                    onClick={() => onRemoveMedicine(idx)}
                    disabled={form.medicines.length === 1}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 disabled:opacity-40 transition"
                    aria-label="Remove medicine"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Clinical Notes & Instructions */}
      <div className="mt-5">
        <label
          className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#4E6460]"
          htmlFor="consultation-notes"
        >
          <FileText size={14} className="text-[#287C75]" />
          Doctor's Advice & Dietary Instructions
        </label>
        <textarea
          id="consultation-notes"
          value={form.notes}
          onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
          rows={3}
          placeholder="e.g. Bland diet, avoid spicy food. Drink 3 liters of fluids daily. Review in 5 days if fever persists."
          className="mt-1.5 w-full rounded-2xl border border-[#D9E6E2] bg-[#F7FAF8] p-3 text-sm font-medium text-[#10201F] placeholder-[#7D908C] focus:border-[#287C75] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#287C75]/15 transition"
        />
      </div>

      {/* Suggested Tests */}
      <div className="mt-5">
        <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#4E6460] mb-2">
          <FlaskConical size={14} className="text-[#287C75]" />
          Order Lab Investigations
        </p>
        <div className="flex flex-wrap gap-2">
          {availableTests.map((test) => {
            const selected = form.tests.includes(test);
            return (
              <button
                key={test}
                type="button"
                onClick={() => onToggleTest(test)}
                className={`rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
                  selected
                    ? 'border-[#287C75] bg-[#123A3A] text-white shadow-xs'
                    : 'border-[#D9E6E2] bg-[#F7FAF8] text-[#10201F] hover:border-[#287C75]/40 hover:bg-white'
                }`}
              >
                {test}
              </button>
            );
          })}
        </div>
      </div>

      {/* Action CTA Bar */}
      <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-[#D9E6E2]/60 pt-5">
        <button
          type="button"
          onClick={onSaveVisit}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-[#123A3A] px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#287C75] transition disabled:opacity-50"
        >
          <Send size={15} />
          {saving ? 'Submitting...' : 'Submit Prescription'}
        </button>

        <button
          type="button"
          onClick={onGeneratePdf}
          className="inline-flex items-center gap-2 rounded-xl border border-[#D9E6E2] bg-white px-4 py-2.5 text-sm font-bold text-[#10201F] hover:bg-[#F7FAF8] hover:border-[#287C75] transition"
        >
          <FileDown size={15} className="text-[#287C75]" />
          Generate PDF
        </button>
      </div>
    </section>
  );
}
