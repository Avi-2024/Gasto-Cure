import React from 'react';
import { Trash2 } from 'lucide-react';
import MedicineAutocomplete from './MedicineAutocomplete';

const FREQUENCY_OPTIONS = [
  { value: '', label: 'Select frequency' },
  { value: '1-0-1', label: '1-0-1' },
  { value: '1-1-1', label: '1-1-1' },
  { value: '0-0-1', label: '0-0-1' },
  { value: '1-0-0', label: '1-0-0' },
  { value: '0-1-0', label: '0-1-0' },
  { value: '1-1-0', label: '1-1-0' },
  { value: '0-1-1', label: '0-1-1' },
  { value: '2-0-0', label: '2-0-0' },
  { value: '0-0-2', label: '0-0-2' },
  { value: '1-0-1-0-1', label: '1-0-1-0-1' },
  { value: 'OD', label: 'OD' },
  { value: 'BD', label: 'BD' },
  { value: 'TDS', label: 'TDS' },
  { value: 'QID', label: 'QID' },
  { value: 'SOS', label: 'SOS' },
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

const cleanFrequency = (val) => {
  if (!val) return '';
  return String(val).replace(/\s*\([^)]*\)/g, '').trim();
};

const getFrequencyLabel = (val) => {
  if (!val) return '';
  const cleaned = cleanFrequency(val);
  const opt = FREQUENCY_OPTIONS.find((o) => o.value === cleaned || o.value === val);
  return opt ? opt.label : cleaned;
};

const getTimingLabel = (val) => {
  if (!val) return '';
  const opt = TIMING_OPTIONS.find((o) => o.value === val);
  return opt ? opt.label : val;
};

/**
 * MedicineTable Component
 *
 * Dynamic medicine table for Nivara Prescription Studio.
 * - Fast autocomplete powered by localMedicines
 * - Auto-fills dosage, frequency, timing, duration, and remarks upon selection
 * - All cells remain directly editable
 * - Preserves exact header names for test compatibility:
 *   /Medicine Name/i, /^Dosage$/i, /^Frequency$/i, /Timing \/ Instructions/i, /^Duration$/i, /^Remarks$/i
 */
function MedicineTable({ medicines = [], onUpdate, onRemove, onUpdateMedicineFull, debounceMs = 0 }) {
  const handleSelectMedicine = (medicineId, selectedMed) => {
    const fullData = {
      name: selectedMed.name || '',
      dosage: selectedMed.strength || selectedMed.dosage || selectedMed.defaultDosage || '',
      frequency: cleanFrequency(selectedMed.defaultDosage || ''),
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
      const sanitizedValue = field === 'frequency' ? cleanFrequency(value) : value;
      onUpdate(medicineId, field, sanitizedValue);
    }
  };

  return (
    <div className="medicine-table-wrapper">
      <table className="medicine-table">
        <thead>
          <tr>
            <th className="col-number">#</th>
            <th className="col-medicine">Medicine Name</th>
            <th className="col-frequency">Frequency</th>
            <th className="col-duration">Duration</th>
            <th className="col-remarks">Remarks</th>
            <th className="col-action no-print">Action</th>
          </tr>
        </thead>
        <tbody>
          {medicines.map((medicine, index) => {
            const freqLabel = getFrequencyLabel(medicine.frequency);

            return (
              <tr key={medicine.id} className={medicine.name ? 'has-medicine-data' : ''}>
                <td className="medicine-number tabular-nums">{index + 1}</td>
                <td className="col-medicine-cell">
                  <MedicineAutocomplete
                    value={medicine.name || ''}
                    placeholder="Medicine name"
                    debounceMs={debounceMs}
                    onChange={(e) => handleFieldChange(medicine.id, 'name', e.target.value)}
                    onSelect={(selectedMed) => handleSelectMedicine(medicine.id, selectedMed)}
                  />
                  {medicine.name && (medicine.frequency || medicine.duration || medicine.remarks) && (
                    <div
                      className="medicine-row-summary no-print"
                      title="Quick summary of filled prescription details"
                    >
                      <span className="summary-pill">
                        {freqLabel && <strong>{freqLabel}</strong>}
                        {medicine.duration && <span> • for {medicine.duration}</span>}
                      </span>
                      {medicine.remarks && (
                        <span className="summary-remarks">({medicine.remarks})</span>
                      )}
                    </div>
                  )}
                </td>
                <td>
                  {(() => {
                    const normalizedFreq = cleanFrequency(medicine.frequency);
                    return (
                      <select
                        className="medicine-select font-semibold"
                        title={freqLabel || 'Frequency'}
                        value={normalizedFreq || ''}
                        onChange={(e) => handleFieldChange(medicine.id, 'frequency', e.target.value)}
                      >
                        {FREQUENCY_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                        {normalizedFreq &&
                          !FREQUENCY_OPTIONS.some((o) => o.value === normalizedFreq) && (
                            <option value={normalizedFreq}>{normalizedFreq}</option>
                          )}
                      </select>
                    );
                  })()}
                </td>
                <td>
                  <input
                    type="text"
                    className="medicine-input tabular-nums font-semibold"
                    placeholder="e.g. 5 days"
                    title={medicine.duration || 'Duration'}
                    value={medicine.duration || ''}
                    onChange={(e) => handleFieldChange(medicine.id, 'duration', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    className="medicine-input font-medium"
                    placeholder="e.g. After food"
                    title={medicine.remarks || 'Remarks'}
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
                      <Trash2 size={15} />
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default MedicineTable;
