import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, User, AlertCircle } from 'lucide-react';
import { localPatients } from '../../../services/localStore';

const BLOOD_GROUPS = ['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const INITIAL_FORM = {
  name: '',
  age: '',
  gender: 'Male',
  contact: '',
  address: '',
  bloodGroup: '',
  allergies: '',
  notes: '',
  status: 'Active',
};

function EditPatientModal({ isOpen, patient, onClose, onSave }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [error, setError] = useState('');

  // Sync form state when patient prop changes or modal opens
  useEffect(() => {
    if (patient) {
      setForm({
        name: patient.name || '',
        age: patient.age !== undefined && patient.age !== null ? String(patient.age) : '',
        gender: patient.gender || 'Male',
        contact: patient.contact || patient.mobile || '',
        address: patient.address || '',
        bloodGroup: patient.bloodGroup || '',
        allergies: patient.allergies || '',
        notes: patient.notes || '',
        status: patient.status || 'Active',
      });
      setError('');
    } else {
      setForm(INITIAL_FORM);
      setError('');
    }
  }, [patient, isOpen]);

  // Handle ESC key to dismiss modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopImmediatePropagation?.();
        onClose?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !patient) return null;

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  const handleSubmit = (e) => {
    e?.preventDefault();

    if (!form.name.trim() || !form.age.toString().trim() || !form.contact.trim()) {
      setError('Name, Age, and Contact are required.');
      return;
    }

    const payload = {
      ...form,
      name: form.name.trim(),
      age: Number(form.age),
      contact: form.contact.trim(),
      mobile: form.contact.trim(),
      address: form.address.trim(),
      bloodGroup: form.bloodGroup,
      allergies: form.allergies.trim(),
      notes: form.notes.trim(),
    };

    const updated = localPatients.update(patient.id, payload);
    if (onSave) {
      onSave(updated);
    }
    if (onClose) {
      onClose();
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose?.();
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs transition-opacity"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-patient-title"
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white border border-[#D9E6E2] shadow-clinixpulse-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#D9E6E2] px-6 py-4 bg-[#F7FAF8]">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-[#287C75] border border-teal-100 shadow-clinixpulse-xs">
              <User size={18} />
            </span>
            <div>
              <h2 id="edit-patient-title" className="font-heading text-base font-bold text-[#10201F]">
                Edit Patient Details
              </h2>
              <p className="text-xs font-mono font-semibold text-[#287C75] bg-teal-50/70 px-1.5 py-0.5 rounded border border-teal-100/60 inline-block mt-0.5">
                {patient.id}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-[#7D908C] hover:bg-slate-100 hover:text-[#10201F] transition"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} noValidate className="p-6 space-y-4 max-h-[calc(85vh-130px)] overflow-y-auto">
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-semibold text-[#B94A48] shadow-xs">
              <AlertCircle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Full Name */}
          <div>
            <label className="field-label" htmlFor="edit-pt-name">
              Full Name *
            </label>
            <input
              id="edit-pt-name"
              type="text"
              placeholder="e.g. Rajesh Kumar"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              required
            />
          </div>

          {/* Age, Gender, Blood Group */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="field-label" htmlFor="edit-pt-age">
                Age (Yrs) *
              </label>
              <input
                id="edit-pt-age"
                type="number"
                min="0"
                max="130"
                placeholder="Age"
                value={form.age}
                onChange={(e) => handleChange('age', e.target.value)}
                required
              />
            </div>

            <div>
              <label className="field-label" htmlFor="edit-pt-gender">
                Gender *
              </label>
              <select
                id="edit-pt-gender"
                value={form.gender}
                onChange={(e) => handleChange('gender', e.target.value)}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="field-label" htmlFor="edit-pt-blood">
                Blood Group
              </label>
              <select
                id="edit-pt-blood"
                value={form.bloodGroup}
                onChange={(e) => handleChange('bloodGroup', e.target.value)}
              >
                <option value="">Select</option>
                {BLOOD_GROUPS.filter(Boolean).map((bg) => (
                  <option key={bg} value={bg}>
                    {bg}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Mobile Number & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="field-label" htmlFor="edit-pt-contact">
                Mobile Number *
              </label>
              <input
                id="edit-pt-contact"
                type="tel"
                placeholder="10-digit mobile"
                value={form.contact}
                onChange={(e) => handleChange('contact', e.target.value)}
                required
              />
            </div>

            <div>
              <label className="field-label" htmlFor="edit-pt-status">
                Patient Status
              </label>
              <select
                id="edit-pt-status"
                value={form.status}
                onChange={(e) => handleChange('status', e.target.value)}
              >
                <option value="Active">Active</option>
                <option value="Follow-up">Follow-up</option>
                <option value="Stable">Stable</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="field-label" htmlFor="edit-pt-address">
              Address
            </label>
            <input
              id="edit-pt-address"
              type="text"
              placeholder="City, locality or complete address"
              value={form.address}
              onChange={(e) => handleChange('address', e.target.value)}
            />
          </div>

          {/* Allergies Alert */}
          <div>
            <label className="field-label text-[#B94A48] flex items-center gap-1.5" htmlFor="edit-pt-allergies">
              <AlertCircle size={13} />
              Drug Allergies / Contraindications
            </label>
            <input
              id="edit-pt-allergies"
              type="text"
              placeholder="e.g. Penicillin, Sulfa, Aspirin (or None)"
              value={form.allergies}
              onChange={(e) => handleChange('allergies', e.target.value)}
              className="border-rose-200 focus:border-[#B94A48] focus:ring-[#B94A48]/20"
            />
          </div>

          {/* Important Clinical Notes */}
          <div>
            <label className="field-label" htmlFor="edit-pt-notes">
              Important Clinical Notes
            </label>
            <textarea
              id="edit-pt-notes"
              rows={3}
              placeholder="Past medical history, chronic conditions, regular medications..."
              value={form.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              className="min-h-[85px]"
            />
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-[#D9E6E2] flex items-center justify-end gap-3">
            <button
              type="button"
              className="btn-secondary px-5"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary px-6"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
}

export default EditPatientModal;