import React, { useEffect, useState } from 'react';
import { Pill, X } from 'lucide-react';

const formOptions = [
  'Tablet',
  'Capsule',
  'Syrup',
  'Injection',
  'Drops',
  'Cream',
  'Gel',
  'Ointment',
  'Sachet',
  'Inhaler',
  'Lotion',
];

const timingOptions = [
  'Before Food',
  'After Food',
  'With Food',
  'Empty Stomach',
  'At Bedtime',
  'Bedtime',
  'As Needed',
];

const quickFrequencies = ['1-0-0', '1-0-1', '1-1-1', '0-0-1', 'SOS'];

const quickDurations = ['3 Days', '5 Days', '7 Days', '14 Days', '30 Days'];

const quickInstructions = [
  'Take empty stomach in the morning',
  'Take after food',
  'Take 30 mins before breakfast',
  'Take at bedtime',
  'Take with plenty of water',
  'Take for pain / fever SOS',
];

const emptyMedicine = {
  name: '',
  strength: '',
  form: 'Tablet',
  category: 'General',
  defaultDosage: '1-0-1',
  defaultTiming: 'After Food',
  defaultDuration: '5 Days',
  defaultInstruction: '',
  isActive: true,
};

function AddEditMedicineModal({ isOpen, onClose, onSave, initialData }) {
  const [form, setForm] = useState(emptyMedicine);
  const [error, setError] = useState('');

  const isEdit = Boolean(initialData && initialData.id);

  // Synchronize form with initialData or reset
  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name || '',
        strength: initialData.strength || '',
        form: initialData.form || 'Tablet',
        category: initialData.category || 'General',
        defaultDosage: initialData.defaultDosage || '1-0-1',
        defaultTiming: initialData.defaultTiming || 'After Food',
        defaultDuration: initialData.defaultDuration || '5 Days',
        defaultInstruction: initialData.defaultInstruction || initialData.instructions || '',
        isActive: initialData.isActive !== undefined ? Boolean(initialData.isActive) : true,
      });
    } else {
      setForm(emptyMedicine);
    }
    setError('');
  }, [initialData, isOpen]);

  // Handle ESC key to close modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const nameStr = String(form.name || '').trim();
    if (!nameStr) {
      setError('Medicine name is required.');
      return;
    }

    const defaultInst = String(form.defaultInstruction || '').trim();
    onSave({
      ...form,
      name: nameStr,
      strength: String(form.strength || '').trim(),
      category: String(form.category || '').trim() || 'General',
      defaultDosage: String(form.defaultDosage || '').trim(),
      defaultTiming: form.defaultTiming,
      defaultDuration: String(form.defaultDuration || '').trim(),
      defaultInstruction: defaultInst,
      instructions: defaultInst,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#123A3A]/45 p-4 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="medicine-modal-title"
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 md:p-8 shadow-nivara-lg border border-[#D9E6E2]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#D9E6E2] pb-4">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-50 text-[#287C75] border border-teal-100 shadow-nivara-xs">
              <Pill size={22} />
            </span>
            <div>
              <h2
                id="medicine-modal-title"
                className="font-heading text-xl font-bold tracking-tight text-[#10201F]"
              >
                {isEdit ? 'Edit Medicine' : 'Add New Medicine'}
              </h2>
              <p className="mt-0.5 text-xs text-[#4E6460]">
                {isEdit
                  ? 'Update formulation defaults, frequency, and timing instructions'
                  : 'Configure and add a new formulation to the clinic master catalog'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-[#7D908C] hover:bg-[#F7FAF8] hover:text-[#10201F] transition"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {/* Medicine Name */}
          <div>
            <label className="field-label" htmlFor="med-name">
              Medicine Name *
            </label>
            <input
              id="med-name"
              aria-label="Medicine Name"
              type="text"
              placeholder="e.g. Pantoprazole 40mg (Pan-D)"
              value={form.name}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, name: e.target.value }));
                if (error) setError('');
              }}
              className="w-full rounded-xl border border-[#D9E6E2] bg-white px-3.5 py-2.5 text-sm text-[#10201F] placeholder-[#7D908C] focus:border-[#287C75] focus:ring-2 focus:ring-[#287C75]/20 focus:outline-none transition"
            />
          </div>

          {/* Strength, Form & Category in 3 cols */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="field-label" htmlFor="med-strength">
                Strength
              </label>
              <input
                id="med-strength"
                aria-label="Strength"
                type="text"
                placeholder="e.g. 40mg, 500mg, 10ml"
                value={form.strength}
                onChange={(e) => setForm((prev) => ({ ...prev, strength: e.target.value }))}
                className="w-full rounded-xl border border-[#D9E6E2] bg-white px-3.5 py-2.5 text-sm text-[#10201F] placeholder-[#7D908C] focus:border-[#287C75] focus:ring-2 focus:ring-[#287C75]/20 focus:outline-none transition"
              />
            </div>

            <div>
              <label className="field-label" htmlFor="med-form">
                Dosage Form
              </label>
              <select
                id="med-form"
                aria-label="Dosage Form"
                value={form.form}
                onChange={(e) => setForm((prev) => ({ ...prev, form: e.target.value }))}
                className="w-full rounded-xl border border-[#D9E6E2] bg-white px-3.5 py-2.5 text-sm text-[#10201F] focus:border-[#287C75] focus:ring-2 focus:ring-[#287C75]/20 focus:outline-none transition"
              >
                {formOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="field-label" htmlFor="med-category">
                Category
              </label>
              <input
                id="med-category"
                aria-label="Category"
                type="text"
                placeholder="e.g. Gastro, Antibiotic"
                value={form.category}
                onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                className="w-full rounded-xl border border-[#D9E6E2] bg-white px-3.5 py-2.5 text-sm text-[#10201F] placeholder-[#7D908C] focus:border-[#287C75] focus:ring-2 focus:ring-[#287C75]/20 focus:outline-none transition"
              />
            </div>
          </div>

          {/* Default Dosage & Quick Frequency Chips */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="field-label !mb-0" htmlFor="med-dosage">
                Default Dosage
              </label>
              <span className="text-[11px] text-[#7D908C]">Common Prescribing Schedules</span>
            </div>
            <input
              id="med-dosage"
              aria-label="Default Dosage"
              type="text"
              placeholder="e.g. 1-0-1, 1-0-0, 1-1-1"
              value={form.defaultDosage}
              onChange={(e) => setForm((prev) => ({ ...prev, defaultDosage: e.target.value }))}
              className="w-full rounded-xl border border-[#D9E6E2] bg-white px-3.5 py-2.5 text-sm font-mono text-[#10201F] placeholder-[#7D908C] focus:border-[#287C75] focus:ring-2 focus:ring-[#287C75]/20 focus:outline-none transition"
            />
            {/* Quick Frequency Buttons */}
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-medium text-[#7D908C] mr-1">Quick pick:</span>
              {quickFrequencies.map((freq) => {
                const isSelected = form.defaultDosage === freq;
                return (
                  <button
                    key={freq}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, defaultDosage: freq }))}
                    className={`rounded-lg px-2.5 py-1 font-mono text-xs font-semibold transition ${
                      isSelected
                        ? 'border border-[#287C75] bg-teal-50 text-[#287C75] shadow-nivara-xs'
                        : 'border border-[#D9E6E2] bg-[#F7FAF8] text-[#4E6460] hover:bg-slate-100 hover:text-[#10201F]'
                    }`}
                  >
                    {freq}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Timing & Duration in 2 cols */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="field-label" htmlFor="med-timing">
                Default Timing
              </label>
              <select
                id="med-timing"
                aria-label="Default Timing"
                value={form.defaultTiming}
                onChange={(e) => setForm((prev) => ({ ...prev, defaultTiming: e.target.value }))}
                className="w-full rounded-xl border border-[#D9E6E2] bg-white px-3.5 py-2.5 text-sm text-[#10201F] focus:border-[#287C75] focus:ring-2 focus:ring-[#287C75]/20 focus:outline-none transition"
              >
                {timingOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="field-label !mb-0" htmlFor="med-duration">
                  Default Duration
                </label>
                <span className="text-[11px] text-[#7D908C]">Length of course</span>
              </div>
              <input
                id="med-duration"
                aria-label="Default Duration"
                type="text"
                placeholder="e.g. 5 Days, 14 Days"
                value={form.defaultDuration}
                onChange={(e) => setForm((prev) => ({ ...prev, defaultDuration: e.target.value }))}
                className="w-full rounded-xl border border-[#D9E6E2] bg-white px-3.5 py-2.5 text-sm text-[#10201F] placeholder-[#7D908C] focus:border-[#287C75] focus:ring-2 focus:ring-[#287C75]/20 focus:outline-none transition"
              />
              {/* Quick Duration Buttons */}
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {quickDurations.map((dur) => {
                  const isSelected = form.defaultDuration === dur;
                  return (
                    <button
                      key={dur}
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, defaultDuration: dur }))}
                      className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                        isSelected
                          ? 'border border-[#287C75] bg-teal-50 text-[#287C75] shadow-nivara-xs'
                          : 'border border-[#D9E6E2] bg-[#F7FAF8] text-[#4E6460] hover:bg-slate-100 hover:text-[#10201F]'
                      }`}
                    >
                      {dur}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Default Instructions & Quick Presets */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="field-label !mb-0" htmlFor="med-instructions">
                Default Instructions
              </label>
              <span className="text-[11px] text-[#7D908C]">Printed on prescription</span>
            </div>
            <textarea
              id="med-instructions"
              aria-label="Default Instructions"
              rows={2}
              placeholder="e.g. Take 30 mins before breakfast with a glass of water"
              value={form.defaultInstruction}
              onChange={(e) => setForm((prev) => ({ ...prev, defaultInstruction: e.target.value }))}
              className="w-full rounded-xl border border-[#D9E6E2] bg-white px-3.5 py-2.5 text-sm text-[#10201F] placeholder-[#7D908C] focus:border-[#287C75] focus:ring-2 focus:ring-[#287C75]/20 focus:outline-none transition resize-none min-h-[70px]"
            />
            {/* Quick Instruction Chips */}
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-medium text-[#7D908C] mr-1">Suggestions:</span>
              {quickInstructions.map((inst) => (
                <button
                  key={inst}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, defaultInstruction: inst }))}
                  className="rounded-lg border border-[#D9E6E2] bg-[#F7FAF8] px-2 py-0.5 text-xs text-[#4E6460] hover:border-[#287C75] hover:bg-teal-50 hover:text-[#287C75] transition"
                >
                  {inst}
                </button>
              ))}
            </div>
          </div>

          {/* Active Status Checkbox */}
          <div className="flex items-center gap-3 rounded-xl border border-[#D9E6E2] bg-[#F7FAF8] p-3.5">
            <input
              id="med-active"
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
              className="h-4 w-4 rounded border-[#D9E6E2] text-[#287C75] focus:ring-2 focus:ring-[#287C75]/20 cursor-pointer"
            />
            <label htmlFor="med-active" className="text-sm font-medium text-[#10201F] cursor-pointer">
              Active in Formulary{' '}
              <span className="text-xs text-[#7D908C] font-normal">
                (Immediately available in doctor prescription autocomplete search)
              </span>
            </label>
          </div>

          {/* Form Error */}
          {error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-semibold text-[#B94A48]">
              {error}
            </div>
          ) : null}

          {/* Modal Actions */}
          <div className="flex items-center gap-3 border-t border-[#D9E6E2] pt-5">
            <button
              type="submit"
              className="btn-primary flex-1 py-2.5 text-sm font-semibold text-white shadow-nivara-xs"
            >
              {isEdit ? 'Update Medicine' : 'Save Medicine'}
            </button>
            <button
              type="button"
              className="btn-secondary px-6 py-2.5 text-sm font-semibold text-[#10201F]"
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddEditMedicineModal;
