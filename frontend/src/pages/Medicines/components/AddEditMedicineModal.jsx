import React, { useEffect, useState } from 'react';
import { Pill, X } from 'lucide-react';

const formOptions = [
  'Tablet',
  'Capsule',
  'Syrup',
  'Injection',
  'Drops',
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
  'Bedtime',
  'As Needed',
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

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Medicine name is required.');
      return;
    }

    onSave({
      ...form,
      name: form.name.trim(),
      strength: form.strength.trim(),
      category: form.category.trim() || 'General',
      defaultDosage: form.defaultDosage.trim(),
      defaultTiming: form.defaultTiming,
      defaultDuration: form.defaultDuration.trim(),
      defaultInstruction: form.defaultInstruction.trim(),
      instructions: form.defaultInstruction.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
              <Pill size={18} />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                {isEdit ? 'Edit Medicine' : 'Add New Medicine'}
              </h2>
              <p className="text-xs text-slate-500">
                {isEdit ? 'Update formulation defaults and timing' : 'Add a new formulation to clinic master catalog'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="field-label" htmlFor="med-name">
              Medicine Name *
            </label>
            <input
              id="med-name"
              aria-label="Medicine Name"
              type="text"
              placeholder="e.g. Pantoprazole 40mg (Pan-40)"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-sky-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="field-label" htmlFor="med-strength">
                Strength
              </label>
              <input
                id="med-strength"
                aria-label="Strength"
                type="text"
                placeholder="e.g. 40mg / 500mg"
                value={form.strength}
                onChange={(e) => setForm((prev) => ({ ...prev, strength: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-sky-500 focus:outline-none"
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
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-sky-500 focus:outline-none"
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
                placeholder="e.g. Antacid, Antibiotic"
                value={form.category}
                onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-sky-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="field-label" htmlFor="med-dosage">
                Default Dosage
              </label>
              <input
                id="med-dosage"
                aria-label="Default Dosage"
                type="text"
                placeholder="e.g. 1-0-1, 1-0-0"
                value={form.defaultDosage}
                onChange={(e) => setForm((prev) => ({ ...prev, defaultDosage: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="field-label" htmlFor="med-timing">
                Default Timing
              </label>
              <select
                id="med-timing"
                aria-label="Default Timing"
                value={form.defaultTiming}
                onChange={(e) => setForm((prev) => ({ ...prev, defaultTiming: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-sky-500 focus:outline-none"
              >
                {timingOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="field-label" htmlFor="med-duration">
                Default Duration
              </label>
              <input
                id="med-duration"
                aria-label="Default Duration"
                type="text"
                placeholder="e.g. 5 Days, 10 Days"
                value={form.defaultDuration}
                onChange={(e) => setForm((prev) => ({ ...prev, defaultDuration: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-sky-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="field-label" htmlFor="med-instructions">
              Default Instructions
            </label>
            <textarea
              id="med-instructions"
              aria-label="Default Instructions"
              rows={2}
              placeholder="e.g. Take 30 mins before breakfast with a glass of water"
              value={form.defaultInstruction}
              onChange={(e) => setForm((prev) => ({ ...prev, defaultInstruction: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-sky-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              id="med-active"
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
              className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
            />
            <label htmlFor="med-active" className="text-sm font-medium text-slate-700">
              Active (available in doctor prescription search)
            </label>
          </div>

          {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}

          <div className="mt-6 flex gap-3 border-t border-slate-100 pt-4">
            <button
              type="submit"
              className="btn-primary flex-1 py-2 text-center text-sm font-semibold text-white shadow-sm"
            >
              {isEdit ? 'Update Medicine' : 'Save Medicine'}
            </button>
            <button
              type="button"
              className="btn-secondary px-5 py-2 text-sm font-semibold text-slate-700"
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
