import React from 'react';
import { Trash2 } from 'lucide-react';
import MedicineAutocomplete from './MedicineAutocomplete';

const FREQUENCY_OPTIONS = [
  { value: '', label: 'Select frequency' },
  { value: '1-0-1', label: '1-0-1 (Morning & Evening)' },
  { value: '1-1-1', label: '1-1-1 (Morning, Afternoon & Evening)' },
  { value: '0-0-1', label: '0-0-1 (Evening Only)' },
  { value: '1-0-0', label: '1-0-0 (Morning Only)' },
  { value: '0-1-0', label: '0-1-0 (Afternoon Only)' },
  { value: '1-1-0', label: '1-1-0 (Morning & Afternoon)' },
  { value: '0-1-1', label: '0-1-1 (Afternoon & Evening)' },
  { value: '2-0-0', label: '2-0-0 (Twice Morning)' },
  { value: '0-0-2', label: '0-0-2 (Twice Evening)' },
  { value: '1-0-1-0-1', label: '1-0-1-0-1 (Every 12 hours)' },
  { value: 'OD', label: 'OD (Once Daily)' },
  { value: 'BD', label: 'BD (Twice Daily)' },
  { value: 'TDS', label: 'TDS (Thrice Daily)' },
  { value: 'QID', label: 'QID (Four Times Daily)' },
  { value: 'SOS', label: 'SOS (As Needed)' },
];

const TIMING_OPTIONS = [
  { value: '', label: 'Select timing' },
  { value: 'Before Food', label: 'Before Food' },
  { value: 'After Food', label: 'After Food' },
  { value: 'With Food', label: 'With Food' },
  { value: 'Empty Stomach', label: 'Empty Stomach' },
  { value: 'At Bedtime', label: 'At Bedtime' },
  { value: 'As Directed', label: 'As Directed' },
];

/**
 * MedicineTable Component
 *
 * Dynamic medicine table for prescriptions.
 * - Fast autocomplete powered by localMedicines
 * - Auto-fills dosage, frequency, timing, duration, and remarks upon selection
 * - All cells remain directly editable
 * - Minimal borders, clean clinic layout
 *
 * Columns:
 * - # (number)
 * - Medicine Name (Autocomplete)
 * - Dosage
 * - Frequency
 * - Timing (Before Food / After Food, etc.)
 * - Duration
 * - Remarks / Instructions
 * - Action (no-print)
 */
function MedicineTable({ medicines = [], onUpdate, onRemove, onUpdateMedicineFull, debounceMs = 0 }) {
  const handleSelectMedicine = (medicineId, selectedMed) => {
    const fullData = {
      name: selectedMed.name || '',
      dosage: selectedMed.strength || selectedMed.defaultDosage || '',
      frequency: selectedMed.defaultDosage || '',
      timing: selectedMed.defaultTiming || '',
      duration: selectedMed.defaultDuration || '',
      remarks: selectedMed.defaultInstruction || selectedMed.defaultTiming || '',
    };

    if (typeof onUpdateMedicineFull === 'function') {
      onUpdateMedicineFull(medicineId, fullData);
    } else if (typeof onUpdate === 'function') {
      Object.entries(fullData).forEach(([field, value]) => {
        onUpdate(medicineId, field, value);
      });
    }
  };

  const handleFieldChange = (medicineId, field, value) => {
    if (typeof onUpdate === 'function') {
      onUpdate(medicineId, field, value);
    }
  };

  return (
    <div className="medicine-table-wrapper">
      <table className="medicine-table">
        <thead>
          <tr>
            <th className="col-number">#</th>
            <th className="col-medicine">Medicine Name</th>
            <th className="col-dosage">Dosage</th>
            <th className="col-frequency">Frequency</th>
            <th className="col-timing">Timing / Instructions</th>
            <th className="col-duration">Duration</th>
            <th className="col-remarks">Remarks</th>
            <th className="col-action no-print">Action</th>
          </tr>
        </thead>
        <tbody>
          {medicines.map((medicine, index) => (
            <tr key={medicine.id}>
              <td className="medicine-number">{index + 1}</td>
              <td className="col-medicine-cell">
                <MedicineAutocomplete
                  value={medicine.name || ''}
                  placeholder="Medicine name"
                  debounceMs={debounceMs}
                  onChange={(e) => handleFieldChange(medicine.id, 'name', e.target.value)}
                  onSelect={(selectedMed) => handleSelectMedicine(medicine.id, selectedMed)}
                />
              </td>
              <td>
                <input
                  type="text"
                  className="medicine-input"
                  placeholder="e.g. 500mg"
                  value={medicine.dosage || ''}
                  onChange={(e) => handleFieldChange(medicine.id, 'dosage', e.target.value)}
                />
              </td>
              <td>
                <select
                  className="medicine-select"
                  value={medicine.frequency || ''}
                  onChange={(e) => handleFieldChange(medicine.id, 'frequency', e.target.value)}
                >
                  {FREQUENCY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                  {medicine.frequency &&
                    !FREQUENCY_OPTIONS.some((o) => o.value === medicine.frequency) && (
                      <option value={medicine.frequency}>{medicine.frequency}</option>
                    )}
                </select>
              </td>
              <td>
                <select
                  className="medicine-select"
                  value={medicine.timing || ''}
                  onChange={(e) => handleFieldChange(medicine.id, 'timing', e.target.value)}
                >
                  {TIMING_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                  {medicine.timing &&
                    !TIMING_OPTIONS.some((o) => o.value === medicine.timing) && (
                      <option value={medicine.timing}>{medicine.timing}</option>
                    )}
                </select>
              </td>
              <td>
                <input
                  type="text"
                  className="medicine-input"
                  placeholder="e.g. 5 days"
                  value={medicine.duration || ''}
                  onChange={(e) => handleFieldChange(medicine.id, 'duration', e.target.value)}
                />
              </td>
              <td>
                <input
                  type="text"
                  className="medicine-input"
                  placeholder="e.g. After food"
                  value={medicine.remarks || ''}
                  onChange={(e) => handleFieldChange(medicine.id, 'remarks', e.target.value)}
                />
              </td>
              <td className="no-print action-cell">
                {medicines.length > 1 && (
                  <button
                    type="button"
                    className="btn-remove-medicine"
                    onClick={() => onRemove && onRemove(medicine.id)}
                    title="Remove medicine"
                    aria-label="Delete this medicine"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default MedicineTable;
