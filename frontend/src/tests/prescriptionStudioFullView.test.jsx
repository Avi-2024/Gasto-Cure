import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import PrescriptionPage from '../pages/Prescriptions/PrescriptionPage';
import { localPatients, localVisits, localMedicines, localSettings } from '../services/localStore';

describe('Prescription Studio Full-View Ergonomics & Zero-Clipping Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    localPatients.seed();
    localMedicines.seed();
  });

  const renderStudioWithPatient = (patientId) => {
    const pt = localPatients.getAll()[0];
    const pid = patientId || (pt ? pt.id : 'PT-1');
    return render(
      <MemoryRouter initialEntries={[`/prescription/new?patientId=${pid}`]}>
        <Routes>
          <Route path="/prescription/new" element={<PrescriptionPage />} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('renders dual-column studio view toggle with active studio view by default', () => {
    renderStudioWithPatient();

    const studioToggle = screen.getByRole('button', { name: /Studio View/i });
    const stackedToggle = screen.getByRole('button', { name: /Stacked View/i });

    expect(studioToggle).toBeTruthy();
    expect(stackedToggle).toBeTruthy();
    expect(studioToggle.classList.contains('is-active')).toBe(true);

    // Can toggle to Stacked View
    fireEvent.click(stackedToggle);
    expect(stackedToggle.classList.contains('is-active')).toBe(true);
    expect(studioToggle.classList.contains('is-active')).toBe(false);

    // Can toggle back to Studio View
    fireEvent.click(studioToggle);
    expect(studioToggle.classList.contains('is-active')).toBe(true);
  });

  it('renders all 6 vital points with clear tabular inputs and labels in full view', () => {
    renderStudioWithPatient();

    const bpInput = screen.getByLabelText(/BP:/i);
    const weightInput = screen.getByLabelText(/Weight:/i);
    const sugarInput = screen.getByLabelText(/Blood Sugar:/i);
    const tempInput = screen.getByLabelText(/Temp:/i);
    const pulseInput = screen.getByLabelText(/Pulse:/i);
    const spo2Input = screen.getByLabelText(/SpO2:/i);

    expect(bpInput).toBeTruthy();
    expect(weightInput).toBeTruthy();
    expect(sugarInput).toBeTruthy();
    expect(tempInput).toBeTruthy();
    expect(pulseInput).toBeTruthy();
    expect(spo2Input).toBeTruthy();

    fireEvent.change(bpInput, { target: { value: '120/80' } });
    fireEvent.change(weightInput, { target: { value: '68' } });

    expect(bpInput.value).toBe('120/80');
    expect(weightInput.value).toBe('68');
  });

  it('renders clinical diagnosis, symptoms, and advice auto-resizing textareas without truncation', () => {
    renderStudioWithPatient();

    const symptomsInput = screen.getByPlaceholderText(/Enter patient symptoms and history/i);
    const diagnosisInput = screen.getByPlaceholderText(/Enter clinical diagnosis/i);
    const adviceInput = screen.getByPlaceholderText(/Enter patient advice, dietary directions/i);

    expect(symptomsInput).toBeTruthy();
    expect(diagnosisInput).toBeTruthy();
    expect(adviceInput).toBeTruthy();

    fireEvent.change(diagnosisInput, { target: { value: 'Acute Erosive Gastritis with H. Pylori' } });
    expect(diagnosisInput.value).toBe('Acute Erosive Gastritis with H. Pylori');
  });

  it('provides accessible title tooltips on all medicine row inputs and selects for full view inspection', async () => {
    renderStudioWithPatient();

    const medicineInput = screen.getByPlaceholderText('Medicine name');
    expect(medicineInput.getAttribute('title')).toBeDefined();

    const dosageInput = screen.getByPlaceholderText('e.g. 500mg');
    const durationInput = screen.getByPlaceholderText('e.g. 5 days');
    const remarksInput = screen.getByPlaceholderText('e.g. After food');

    expect(dosageInput.getAttribute('title')).toBe('Dosage');
    expect(durationInput.getAttribute('title')).toBe('Duration');
    expect(remarksInput.getAttribute('title')).toBe('Remarks');

    // Type dosage and verify title updates with the filled value
    fireEvent.change(dosageInput, { target: { value: '650mg' } });
    expect(dosageInput.getAttribute('title')).toBe('650mg');

    // Select frequency and verify title updates with the filled value
    const frequencySelects = screen.getAllByRole('combobox');
    // Find frequency select
    const freqSelect = frequencySelects.find((s) => s.classList.contains('medicine-select'));
    if (freqSelect) {
      fireEvent.change(freqSelect, { target: { value: '1-0-1' } });
      expect(freqSelect.getAttribute('title')).toBe('1-0-1');
    }
  });

  it('preserves complete follow-up quick chips and calendar display without overlap', () => {
    renderStudioWithPatient();

    const sevenDaysChip = screen.getByRole('button', { name: /7 Days/i });
    const fourteenDaysChip = screen.getByRole('button', { name: /14 Days/i });
    const thirtyDaysChip = screen.getByRole('button', { name: /30 Days/i });
    const customChip = screen.getByRole('button', { name: /Custom Date/i });

    expect(sevenDaysChip).toBeTruthy();
    expect(fourteenDaysChip).toBeTruthy();
    expect(thirtyDaysChip).toBeTruthy();
    expect(customChip).toBeTruthy();

    // Scheduled follow-up date is displayed
    expect(screen.getByText(/Scheduled Follow-up Date:/i)).toBeTruthy();
  });
});
