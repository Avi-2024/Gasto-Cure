import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import PrescriptionPage from '../pages/Prescriptions/PrescriptionPage';
import { quickChipsService, DEFAULT_QUICK_CHIPS } from '../services/quickChipsService';
import { localPatients, localMedicines } from '../services/localStore';

describe('Prescription Studio Clinical Quick Chips Management', () => {
  beforeEach(() => {
    localStorage.clear();
    localPatients.seed();
    localMedicines.seed();
    quickChipsService.reset('ALL');
  });

  const renderStudio = () => {
    const pt = localPatients.getAll()[0];
    return render(
      <MemoryRouter initialEntries={[`/prescription/new?patientId=${pt ? pt.id : 'PT-1'}`]}>
        <Routes>
          <Route path="/prescription/new" element={<PrescriptionPage />} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('renders inline Manage buttons for Symptoms, Diagnosis, and Advice chip bars', () => {
    renderStudio();

    const manageButtons = screen.getAllByRole('button', { name: /Manage/i });
    expect(manageButtons.length).toBeGreaterThanOrEqual(3);

    const symptomsManageBtn = screen.getByTitle('Manage Symptoms Quick Chips');
    const diagnosisManageBtn = screen.getByTitle('Manage Diagnosis Quick Chips');
    const adviceManageBtn = screen.getByTitle('Manage Advice Quick Chips');

    expect(symptomsManageBtn).toBeTruthy();
    expect(diagnosisManageBtn).toBeTruthy();
    expect(adviceManageBtn).toBeTruthy();
  });

  it('opens modal, adds a custom symptom chip, and inserts it into the textarea', () => {
    renderStudio();

    // 1. Open Symptoms Quick Chips Manager
    const symptomsManageBtn = screen.getByTitle('Manage Symptoms Quick Chips');
    fireEvent.click(symptomsManageBtn);

    // Modal is open
    expect(screen.getByText('Manage Clinical Quick Chips')).toBeTruthy();
    expect(screen.getByText('Symptoms & Complaints')).toBeTruthy();

    // 2. Add custom chip: "Severe Dysphagia"
    const input = screen.getByPlaceholderText(/Type new symptom/i);
    fireEvent.change(input, { target: { value: 'Severe Dysphagia' } });

    const addBtn = screen.getByRole('button', { name: /Add Chip/i });
    fireEvent.click(addBtn);

    // Chip appears in active list inside modal
    expect(screen.getByText('Severe Dysphagia')).toBeTruthy();

    // 3. Close modal with Done
    const doneBtn = screen.getByRole('button', { name: 'Done' });
    fireEvent.click(doneBtn);

    // 4. Verify chip appears on PrescriptionPage
    const customChip = screen.getByRole('button', { name: /\+ Severe Dysphagia/i });
    expect(customChip).toBeTruthy();

    // 5. Click the chip and verify textarea is updated
    const symptomsTextarea = screen.getByPlaceholderText(/Enter patient symptoms and history/i);
    expect(symptomsTextarea.value).toBe('');

    fireEvent.click(customChip);
    expect(symptomsTextarea.value).toBe('Severe Dysphagia');
  });

  it('deletes a chip from modal and updates quick list', () => {
    renderStudio();

    const symptomsManageBtn = screen.getByTitle('Manage Symptoms Quick Chips');
    fireEvent.click(symptomsManageBtn);

    // Initial chip exists
    expect(screen.getByText('Belching & Gas')).toBeTruthy();

    // Find remove button for 'Belching & Gas'
    const removeBtn = screen.getByTitle('Remove "Belching & Gas"');
    fireEvent.click(removeBtn);

    // It should no longer be in the active chips list
    expect(screen.queryByTitle('Remove "Belching & Gas"')).toBeNull();

    // Close modal
    fireEvent.click(screen.getByRole('button', { name: 'Done' }));

    // Verify it is removed from screen quick chips bar
    expect(screen.queryByRole('button', { name: /\+ Belching & Gas/i })).toBeNull();
  });

  it('resets category back to clinic defaults', () => {
    renderStudio();

    const symptomsManageBtn = screen.getByTitle('Manage Symptoms Quick Chips');
    fireEvent.click(symptomsManageBtn);

    // Remove Belching & Gas via UI inside modal
    const removeBtn = screen.getByTitle('Remove "Belching & Gas"');
    fireEvent.click(removeBtn);
    expect(screen.queryByTitle('Remove "Belching & Gas"')).toBeNull();

    // Click Reset to Defaults
    const resetBtn = screen.getByRole('button', { name: /Reset to Clinic Defaults/i });
    fireEvent.click(resetBtn);

    // Now Belching & Gas is restored
    expect(screen.getByTitle('Remove "Belching & Gas"')).toBeTruthy();
  });
});
