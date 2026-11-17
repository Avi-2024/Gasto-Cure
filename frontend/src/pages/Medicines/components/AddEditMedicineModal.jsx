import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Pill, X, ChevronDown, ChevronUp, SlidersHorizontal } from 'lucide-react';
import DosageFormIcon from '../../../components/common/DosageFormIcon';

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
  'After Food',
  'Before Food',
  'With Food',
  'Empty Stomach',
  'At Bedtime',
  'As Needed',
];

const quickFrequencies = ['1-0-1', '1-0-0', '1-1-1', '0-0-1', 'SOS'];

const quickDurations = ['3 Days', '5 Days', '7 Days', '14 Days'];

const quickRemarks = [
  'After food',
  'Empty stomach',
  'At bedtime',
  'Before food',
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
  const [showAdvanced, setShowAdvanced] = useState(false);

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
      // Expand advanced section if medicine has custom strength or custom category
      if (initialData.strength || (initialData.category && initialData.category !== 'General')) {
        setShowAdvanced(true);
      } else {
        setShowAdvanced(false);
      }
    } else {
      setForm(emptyMedicine);
      setShowAdvanced(false);
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
      defaultDosage: String(form.defaultDosage || '').trim() || '1-0-1',
      defaultTiming: form.defaultTiming || 'After Food',
      defaultDuration: String(form.defaultDuration || '').trim() || '5 Days',
      defaultInstruction: defaultInst,
      instructions: defaultInst,
    });
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#123A3A]/45 p-4 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="medicine-modal-title"
    >
      <div
        className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-5 sm:p-6 shadow-nivara-lg border border-[#D9E6E2]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#D9E6E2] pb-3.5">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-[#287C75] border border-teal-100 shadow-nivara-xs">
              <Pill size={20} />
            </span>
            <div>
              <h2
                id="medicine-modal-title"
                className="font-heading text-lg font-bold tracking-tight text-[#10201F]"
              >
                {isEdit ? 'Edit Medicine' : 'Add New Medicine'}
              </h2>
              <p className="text-xs text-[#7D908C]">
                {isEdit
                  ? 'Update formulation defaults for prescription autocomplete'
                  : 'Fast add formulation to clinic master catalog'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-[#7D908C] hover:bg-[#F7FAF8] hover:text-[#10201F] transition"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* 1. Medicine Name */}
          <div>
            <label className="block text-xs font-semibold text-[#123A3A] mb-1" htmlFor="med-name">
              Medicine Name <span className="text-rose-500">*</span>
            </label>
            <input
              id="med-name"
              aria-label="Medicine Name"
              type="text"
              autoFocus
              placeholder="e.g. Pantoprazole 40mg, Dolo 650mg, Augmentin 625mg"
              value={form.name}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, name: e.target.value }));
                if (error) setError('');
              }}
              className="w-full rounded-xl border border-[#D9E6E2] bg-white px-3.5 py-2.5 text-sm font-semibold text-[#10201F] placeholder-[#94A3B8] focus:border-[#287C75] focus:ring-2 focus:ring-[#287C75]/20 focus:outline-none transition"
            />
          </div>

          {/* 2. Type/Form & Frequency in 2 columns */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-[#123A3A] mb-1" htmlFor="med-form">
                Dosage Form (Type)
              </label>
              <div className="flex items-center gap-2">
                <DosageFormIcon
                  form={form.form}
                  className="h-9 w-9 shrink-0 rounded-xl border border-[#D9E6E2] bg-[#F7FAF8]"
                  imgClassName="h-6 w-6 object-contain"
                />
                <select
                  id="med-form"
                  aria-label="Dosage Form"
                  value={form.form}
                  onChange={(e) => setForm((prev) => ({ ...prev, form: e.target.value }))}
                  className="w-full flex-1 rounded-xl border border-[#D9E6E2] bg-white px-3 py-2 text-sm font-medium text-[#10201F] focus:border-[#287C75] focus:ring-2 focus:ring-[#287C75]/20 focus:outline-none transition cursor-pointer"
                >
                  {formOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-[#123A3A]" htmlFor="med-dosage">
                  Default Frequency
                </label>
                <span className="text-[10px] text-[#7D908C]">Daily schedule</span>
              </div>
              <input
                id="med-dosage"
                aria-label="Default Dosage"
                type="text"
                placeholder="1-0-1"
                value={form.defaultDosage}
                onChange={(e) => setForm((prev) => ({ ...prev, defaultDosage: e.target.value }))}
                className="w-full rounded-xl border border-[#D9E6E2] bg-white px-3 py-2 text-sm font-semibold font-mono text-[#10201F] focus:border-[#287C75] focus:ring-2 focus:ring-[#287C75]/20 focus:outline-none transition"
              />
              {/* Quick Frequency Pills */}
              <div className="mt-1.5 flex flex-wrap gap-1">
                {quickFrequencies.map((freq) => {
                  const isSelected = form.defaultDosage === freq;
                  return (
                    <button
                      key={freq}
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, defaultDosage: freq }))}
                      className={`rounded-md px-2 py-0.5 font-mono text-[11px] font-semibold transition ${
                        isSelected
                          ? 'border border-[#287C75] bg-teal-50 text-[#287C75]'
                          : 'border border-[#D9E6E2] bg-[#F7FAF8] text-[#556965] hover:bg-slate-100'
                      }`}
                    >
                      {freq}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 3. Duration & Remarks in 2 columns */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-[#123A3A]" htmlFor="med-duration">
                  Default Duration
                </label>
                <span className="text-[10px] text-[#7D908C]">Length of course</span>
              </div>
              <input
                id="med-duration"
                aria-label="Default Duration"
                type="text"
                placeholder="5 Days"
                value={form.defaultDuration}
                onChange={(e) => setForm((prev) => ({ ...prev, defaultDuration: e.target.value }))}
                onBlur={() => {
                  if (/^\d+$/.test(String(form.defaultDuration || '').trim())) {
                    setForm((prev) => ({ ...prev, defaultDuration: `${prev.defaultDuration.trim()} Days` }));
                  }
                }}
                className="w-full rounded-xl border border-[#D9E6E2] bg-white px-3 py-2 text-sm font-semibold text-[#10201F] focus:border-[#287C75] focus:ring-2 focus:ring-[#287C75]/20 focus:outline-none transition"
              />
              {/* Quick Duration Pills */}
              <div className="mt-1.5 flex flex-wrap gap-1">
                {quickDurations.map((dur) => {
                  const isSelected = form.defaultDuration === dur;
                  return (
                    <button
                      key={dur}
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, defaultDuration: dur }))}
                      className={`rounded-md px-2 py-0.5 text-[11px] font-medium transition ${
                        isSelected
                          ? 'border border-[#287C75] bg-teal-50 text-[#287C75] font-semibold'
                          : 'border border-[#D9E6E2] bg-[#F7FAF8] text-[#556965] hover:bg-slate-100'
                      }`}
                    >
                      {dur}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-[#123A3A]" htmlFor="med-instructions">
                  Default Remarks
                </label>
                <span className="text-[10px] text-[#7D908C]">Instructions</span>
              </div>
              <input
                id="med-instructions"
                aria-label="Default Instructions"
                type="text"
                placeholder="e.g. After food"
                value={form.defaultInstruction}
                onChange={(e) => setForm((prev) => ({ ...prev, defaultInstruction: e.target.value }))}
                className="w-full rounded-xl border border-[#D9E6E2] bg-white px-3 py-2 text-sm text-[#10201F] focus:border-[#287C75] focus:ring-2 focus:ring-[#287C75]/20 focus:outline-none transition"
              />
              {/* Quick Remarks Pills */}
              <div className="mt-1.5 flex flex-wrap gap-1">
                {quickRemarks.map((rem) => {
                  const isSelected = form.defaultInstruction === rem;
                  return (
                    <button
                      key={rem}
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, defaultInstruction: rem }))}
                      className={`rounded-md px-2 py-0.5 text-[11px] font-medium transition ${
                        isSelected
                          ? 'border border-[#287C75] bg-teal-50 text-[#287C75] font-semibold'
                          : 'border border-[#D9E6E2] bg-[#F7FAF8] text-[#556965] hover:bg-slate-100'
                      }`}
                    >
                      {rem}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 4. Collapsible Advanced Options Toggle */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowAdvanced((prev) => !prev)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#287C75] hover:text-[#123A3A] transition"
            >
              <SlidersHorizontal size={13} />
              <span>{showAdvanced ? 'Hide Additional Details' : '+ More Options (Strength, Category, Timing)'}</span>
              {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>

          {/* Collapsible Section: Strength, Category, Timing */}
          <div className={showAdvanced ? 'space-y-3 rounded-xl border border-[#D9E6E2] bg-[#F7FAF8] p-3' : 'hidden'}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-medium text-[#4E6460] mb-1" htmlFor="med-strength">
                  Strength
                </label>
                <input
                  id="med-strength"
                  aria-label="Strength"
                  type="text"
                  placeholder="e.g. 40mg, 500mg"
                  value={form.strength}
                  onChange={(e) => setForm((prev) => ({ ...prev, strength: e.target.value }))}
                  className="w-full rounded-lg border border-[#D9E6E2] bg-white px-2.5 py-1.5 text-xs text-[#10201F] focus:border-[#287C75] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#4E6460] mb-1" htmlFor="med-category">
                  Category
                </label>
                <input
                  id="med-category"
                  aria-label="Category"
                  type="text"
                  placeholder="e.g. Gastro, General"
                  value={form.category}
                  onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                  className="w-full rounded-lg border border-[#D9E6E2] bg-white px-2.5 py-1.5 text-xs text-[#10201F] focus:border-[#287C75] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#4E6460] mb-1" htmlFor="med-timing">
                  Default Timing
                </label>
                <select
                  id="med-timing"
                  aria-label="Default Timing"
                  value={form.defaultTiming}
                  onChange={(e) => setForm((prev) => ({ ...prev, defaultTiming: e.target.value }))}
                  className="w-full rounded-lg border border-[#D9E6E2] bg-white px-2.5 py-1.5 text-xs text-[#10201F] focus:border-[#287C75] focus:outline-none cursor-pointer"
                >
                  {timingOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Active Status Checkbox (Compact) */}
          <div className="flex items-center gap-2 pt-1">
            <input
              id="med-active"
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
              className="h-3.5 w-3.5 rounded border-[#D9E6E2] text-[#287C75] focus:ring-1 focus:ring-[#287C75] cursor-pointer"
            />
            <label htmlFor="med-active" className="text-xs font-medium text-[#4E6460] cursor-pointer">
              Active in Formulary (immediately available in prescription autocomplete)
            </label>
          </div>

          {/* Form Error */}
          {error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-[#B94A48]">
              {error}
            </div>
          ) : null}

          {/* Modal Actions */}
          <div className="flex items-center gap-3 border-t border-[#D9E6E2] pt-3.5">
            <button
              type="submit"
              className="btn-primary flex-1 py-2 text-sm font-semibold text-white shadow-nivara-xs"
            >
              {isEdit ? 'Update Medicine' : 'Save Medicine'}
            </button>
            <button
              type="button"
              className="btn-secondary px-5 py-2 text-sm font-semibold text-[#10201F]"
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
}

export default AddEditMedicineModal;
