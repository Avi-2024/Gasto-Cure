import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MedicinesPage from '../pages/Medicines/MedicinesPage';
import { localMedicines } from '../services/localStore';

describe('MedicinesPage Component', () => {
  beforeEach(() => {
    localStorage.clear();
    localMedicines.seed();
    if (typeof window !== 'undefined') {
      window.confirm = vi.fn(() => true);
    }
  });

  const renderComponent = () =>
    render(
      <MemoryRouter>
        <MedicinesPage />
      </MemoryRouter>
    );

  it('renders master medicine list from localMedicines', () => {
    renderComponent();

    expect(screen.getByText(/Medicine Catalog/i)).toBeTruthy();
    expect(screen.getByPlaceholderText(/Search medicine/i)).toBeTruthy();

    // Verify some seeded medicines are visible
    expect(screen.getByText(/Pantoprazole 40mg/i)).toBeTruthy();
    expect(screen.getByText(/Paracetamol 650mg/i)).toBeTruthy();
  });

  it('filters medicines by search query', () => {
    renderComponent();

    const searchInput = screen.getByPlaceholderText(/Search medicine/i);
    fireEvent.change(searchInput, { target: { value: 'Panto' } });

    expect(screen.getByText(/Pantoprazole 40mg/i)).toBeTruthy();
    expect(screen.queryByText(/Paracetamol 650mg/i)).toBeNull();
  });

  it('filters medicines by form selection', () => {
    renderComponent();

    // Find the Form filter dropdown/select
    const formFilter = screen.getByLabelText(/Filter by form/i);
    fireEvent.change(formFilter, { target: { value: 'Syrup' } });

    // Should show syrups like Antacid Gel or Sucralfate Suspension or Cough Syrup
    const syrups = screen.getAllByText(/Syrup/i);
    expect(syrups.length).toBeGreaterThan(0);

    // Tablet like Pantoprazole 40mg shouldn't be listed in the table body
    expect(screen.queryByText(/Pantoprazole 40mg/i)).toBeNull();
  });

  it('opens modal to add new medicine and saves to localMedicines', () => {
    renderComponent();

    const addBtn = screen.getByRole('button', { name: /Add Medicine/i });
    fireEvent.click(addBtn);

    // Modal should be open
    expect(screen.getByRole('heading', { name: /Add New Medicine/i })).toBeTruthy();

    fireEvent.change(screen.getByLabelText(/Medicine Name/i), {
      target: { value: 'Esomeprazole 40mg' },
    });
    fireEvent.change(screen.getByLabelText(/Strength/i), {
      target: { value: '40mg' },
    });
    fireEvent.change(screen.getByLabelText(/Dosage Form/i), {
      target: { value: 'Tablet' },
    });
    fireEvent.change(screen.getByLabelText(/Default Dosage/i), {
      target: { value: '1-0-0' },
    });
    fireEvent.change(screen.getByLabelText(/Default Timing/i), {
      target: { value: 'Before Food' },
    });
    fireEvent.change(screen.getByLabelText(/Default Duration/i), {
      target: { value: '14 Days' },
    });
    fireEvent.change(screen.getByLabelText(/Default Instructions/i), {
      target: { value: 'Take 30 mins before breakfast' },
    });

    const saveBtn = screen.getByRole('button', { name: /Save Medicine/i });
    fireEvent.click(saveBtn);

    // Modal should close and new medicine should appear
    expect(screen.getAllByText(/Esomeprazole 40mg/i).length).toBeGreaterThan(0);

    // Verify persisted in localMedicines
    const stored = localMedicines.getAll().find((m) => m.name === 'Esomeprazole 40mg');
    expect(stored).toBeDefined();
    expect(stored.defaultDosage).toBe('1-0-0');
    expect(stored.defaultDuration).toBe('14 Days');
  });

  it('allows editing existing medicine defaults (dosage, timing, instructions)', () => {
    renderComponent();

    // Find Pantoprazole row edit button
    const pantoRow = screen.getByText(/Pantoprazole 40mg/i).closest('tr');
    expect(pantoRow).not.toBeNull();

    const editBtn = within(pantoRow).getByRole('button', { name: /Edit/i });
    fireEvent.click(editBtn);

    // Edit modal open
    expect(screen.getByRole('heading', { name: /Edit Medicine/i })).toBeTruthy();

    const dosageInput = screen.getByLabelText(/Default Dosage/i);
    fireEvent.change(dosageInput, { target: { value: '1-0-1' } });

    const timingSelect = screen.getByLabelText(/Default Timing/i);
    fireEvent.change(timingSelect, { target: { value: 'After Food' } });

    const saveBtn = screen.getByRole('button', { name: /Update Medicine/i });
    fireEvent.click(saveBtn);

    // Verify updated in localMedicines
    const updated = localMedicines.getAll().find((m) => m.name.includes('Pantoprazole 40mg'));
    expect(updated.defaultDosage).toBe('1-0-1');
    expect(updated.defaultTiming).toBe('After Food');
  });

  it('toggles Active/Inactive status', () => {
    renderComponent();

    const pantoRow = screen.getByText(/Pantoprazole 40mg/i).closest('tr');
    const toggleBtn = within(pantoRow).getByRole('button', { name: /Toggle Status/i });

    // Initially active
    expect(within(pantoRow).getByText(/Active/i)).toBeTruthy();

    fireEvent.click(toggleBtn);

    // Now inactive
    const updated = localMedicines.getAll().find((m) => m.name.includes('Pantoprazole 40mg'));
    expect(updated.isActive).toBe(false);
  });

  it('allows deleting a medicine with confirmation', () => {
    renderComponent();

    const pantoRow = screen.getByText(/Pantoprazole 40mg/i).closest('tr');
    const deleteBtn = within(pantoRow).getByRole('button', { name: /Delete/i });

    fireEvent.click(deleteBtn);

    // Check deleted from localMedicines
    const found = localMedicines.getAll().find((m) => m.name.includes('Pantoprazole 40mg'));
    expect(found).toBeUndefined();
    expect(screen.queryByText(/Pantoprazole 40mg \(Pan-40/i)).toBeNull();
  });
});
