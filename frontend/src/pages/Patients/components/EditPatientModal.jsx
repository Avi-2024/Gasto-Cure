import React, { useState, useEffect } from 'react';
import { X, User, Phone, MapPin, HeartPulse, AlertCircle, FileText } from 'lucide-react';
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

  // Sync form when patient prop changes or modal opens
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

  // Handle ESC key to close modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs transition-opacity"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-patient-title"
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
              <User size={18} />
            </span>
            <div>
              <h2 id="edit-patient-title" className="text-base font-bold text-slate-900">
                Edit Patient Details
              </h2>
              <p className="text-xs font-mono text-slate-400">{patient.id}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-200/70 hover:text-slate-600 transition"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[calc(85vh-130px)] overflow-y-auto">
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-semibold text-rose-700">
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
              placeholder="e.g. Ramesh Chandra"
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
              <div className="relative">
                <input
                  id="edit-pt-contact"
                  type="tel"
                  placeholder="10-digit mobile"
                  value={form.contact}
                  onChange={(e) => handleChange('contact', e.target.value)}
                  required
                />
              </div>
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
            <label className="field-label text-rose-600 flex items-center gap-1.5" htmlFor="edit-pt-allergies">
              <AlertCircle size={13} />
              Drug Allergies / Contraindications
            </label>
            <input
              id="edit-pt-allergies"
              type="text"
              placeholder="e.g. Penicillin, Sulfa, Aspirin (or None)"
              value={form.allergies}
              onChange={(e) => handleChange('allergies', e.target.value)}
              className="border-rose-200 focus:border-rose-500 focus:ring-rose-500/20"
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
              className="min-h-[80px]"
            />
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
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
}

export default EditPatientModal;
