import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MedicineAutocomplete from '../pages/Prescriptions/components/MedicineAutocomplete';
import MedicineTable from '../pages/Prescriptions/components/MedicineTable';
import { localMedicines } from '../services/localStore';

describe('MedicineAutocomplete Component', () => {
  beforeEach(() => {
    localStorage.clear();
    localMedicines.seed();
  });

  it('renders input with placeholder and responds to typing', () => {
    const handleSelect = vi.fn();
    render(<MedicineAutocomplete placeholder="Search medicine" onSelect={handleSelect} debounceMs={0} />);

    const input = screen.getByPlaceholderText('Search medicine');
    expect(input).toBeTruthy();

    fireEvent.change(input, { target: { value: 'P' } });
    expect(input.value).toBe('P');
    // For < 2 chars, dropdown should not appear
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('drops down matching medicines when >= 2 characters are typed', async () => {
    const handleSelect = vi.fn();
    render(<MedicineAutocomplete placeholder="Search medicine" onSelect={handleSelect} debounceMs={0} />);

    const input = screen.getByPlaceholderText('Search medicine');
    fireEvent.change(input, { target: { value: 'Panto' } });

    await waitFor(() => {
      const dropdown = screen.getByRole('listbox');
      expect(dropdown).toBeTruthy();
    });

    // Seeded medicine Pantoprazole 40mg should be in dropdown
    const options = screen.getAllByRole('option');
    expect(options.length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Pantoprazole/i).length).toBeGreaterThan(0);
  });

  it('navigates options with Arrow Up/Down and selects option on Enter key', async () => {
    const handleSelect = vi.fn();
    render(<MedicineAutocomplete placeholder="Search medicine" onSelect={handleSelect} debounceMs={0} />);

    const input = screen.getByPlaceholderText('Search medicine');
    fireEvent.change(input, { target: { value: 'Panto' } });

    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeTruthy();
    });

    const options = screen.getAllByRole('option');
    expect(options.length).toBeGreaterThan(0);

    // Press ArrowDown to highlight first option
    fireEvent.keyDown(input, { key: 'ArrowDown', code: 'ArrowDown' });
    expect(options[0].getAttribute('aria-selected')).toBe('true');

    // Press Enter to select highlighted option
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(handleSelect).toHaveBeenCalledTimes(1);
    const selected = handleSelect.mock.calls[0][0];
    expect(selected).toBeDefined();
    expect(selected.name).toMatch(/Pantoprazole/i);
    expect(selected.defaultDosage).toBe('1-0-0');
    expect(selected.defaultTiming).toBe('Before Food');
    expect(selected.defaultDuration).toBe('5 Days');
    expect(selected.defaultInstruction).toBe('Take empty stomach in the morning');
  });

  it('does not select option on Enter when no option is highlighted, preserving typed input', async () => {
    const handleSelect = vi.fn();
    render(<MedicineAutocomplete placeholder="Search medicine" onSelect={handleSelect} debounceMs={0} />);

    const input = screen.getByPlaceholderText('Search medicine');
    // Doctor types matching letters
    fireEvent.change(input, { target: { value: 'Panto' } });

    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeTruthy();
    });

    // Directly press Enter without using ArrowDown to highlight
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    // Must NOT auto-select results[0]
    expect(handleSelect).not.toHaveBeenCalled();
    // Dropdown should dismiss
    expect(screen.queryByRole('listbox')).toBeNull();
    // What the doctor typed must be preserved
    expect(input.value).toBe('Panto');
  });

  it('selects option on mouse click and passes complete medicine defaults', async () => {
    const handleSelect = vi.fn();
    render(<MedicineAutocomplete placeholder="Search medicine" onSelect={handleSelect} debounceMs={0} />);

    const input = screen.getByPlaceholderText('Search medicine');
    fireEvent.change(input, { target: { value: 'Rabe' } });

    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeTruthy();
    });

    const option = screen.getByText(/Rabeprazole 20mg/i);
    fireEvent.mouseDown(option);

    expect(handleSelect).toHaveBeenCalledTimes(1);
    const selected = handleSelect.mock.calls[0][0];
    expect(selected).toBeDefined();
    expect(selected.name).toMatch(/Rabeprazole/i);
    expect(selected.defaultDosage).toBe('1-0-0');
    expect(selected.defaultTiming).toBe('Before Food');
    expect(selected.defaultDuration).toBe('5 Days');
    expect(selected.defaultInstruction).toBe('Take 30 mins before breakfast');
  });

  it('dismisses dropdown on Escape key and on clicking outside', async () => {
    const handleSelect = vi.fn();
    render(
      <div>
        <div data-testid="outside-area">Outside</div>
        <MedicineAutocomplete placeholder="Search medicine" onSelect={handleSelect} debounceMs={0} />
      </div>
    );

    const input = screen.getByPlaceholderText('Search medicine');
    fireEvent.change(input, { target: { value: 'Panto' } });

    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeTruthy();
    });

    // Press Escape
    fireEvent.keyDown(input, { key: 'Escape', code: 'Escape' });
    expect(screen.queryByRole('listbox')).toBeNull();

    // Re-open by typing more
    fireEvent.change(input, { target: { value: 'Pantopr' } });
    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeTruthy();
    });

    // Click outside
    fireEvent.mouseDown(screen.getByTestId('outside-area'));
    expect(screen.queryByRole('listbox')).toBeNull();
  });
});

describe('MedicineTable with MedicineAutocomplete Integration', () => {
  beforeEach(() => {
    localStorage.clear();
    localMedicines.seed();
  });

  it('renders table columns for Medicine Name, Frequency, Duration, and Remarks', () => {
    const medicines = [
      { id: 1, name: '', dosage: '', frequency: '', timing: '', duration: '', remarks: '' },
    ];
    render(<MedicineTable medicines={medicines} onUpdate={vi.fn()} onRemove={vi.fn()} />);

    expect(screen.getByRole('columnheader', { name: /Medicine Name/i })).toBeTruthy();
    expect(screen.getByRole('columnheader', { name: /^Frequency$/i })).toBeTruthy();
    expect(screen.getByRole('columnheader', { name: /^Duration$/i })).toBeTruthy();
    expect(screen.getByRole('columnheader', { name: /^Remarks$/i })).toBeTruthy();
    expect(screen.queryByRole('columnheader', { name: /^Dosage$/i })).toBeNull();
    expect(screen.queryByRole('columnheader', { name: /Timing \/ Instructions/i })).toBeNull();
  });

  it('calls onUpdateMedicineFull when an autocomplete option is chosen', async () => {
    const onUpdateMedicineFull = vi.fn();
    const medicines = [
      { id: 101, name: '', dosage: '', frequency: '', timing: '', duration: '', remarks: '' },
    ];

    render(
      <MedicineTable
        medicines={medicines}
        onUpdate={vi.fn()}
        onRemove={vi.fn()}
        onUpdateMedicineFull={onUpdateMedicineFull}
      />
    );

    const input = screen.getByPlaceholderText('Medicine name');
    fireEvent.change(input, { target: { value: 'Panto' } });

    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeTruthy();
    });

    const option = screen.getByText(/Pantoprazole 40mg/i);
    fireEvent.mouseDown(option);

    expect(onUpdateMedicineFull).toHaveBeenCalledWith(
      101,
      expect.objectContaining({
        name: expect.stringMatching(/Pantoprazole/i),
        dosage: expect.any(String),
        frequency: '1-0-0',
        timing: 'Before Food',
        duration: '5 Days',
        remarks: 'Take empty stomach in the morning',
      })
    );
  });

  it('calls onUpdate for each field without corrupted property when onUpdateMedicineFull is not provided', async () => {
    const onUpdate = vi.fn();
    const medicines = [
      { id: 201, name: '', dosage: '', frequency: '', timing: '', duration: '', remarks: '' },
    ];

    render(
      <MedicineTable
        medicines={medicines}
        onUpdate={onUpdate}
        onRemove={vi.fn()}
      />
    );

    const input = screen.getByPlaceholderText('Medicine name');
    fireEvent.change(input, { target: { value: 'Panto' } });

    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeTruthy();
    });

    const option = screen.getByText(/Pantoprazole 40mg/i);
    fireEvent.mouseDown(option);

    // Verify onUpdate was called for individual fields
    expect(onUpdate).toHaveBeenCalledWith(201, 'name', expect.stringMatching(/Pantoprazole/i));
    expect(onUpdate).toHaveBeenCalledWith(201, 'dosage', '40mg');
    expect(onUpdate).toHaveBeenCalledWith(201, 'frequency', '1-0-0');
    expect(onUpdate).toHaveBeenCalledWith(201, 'timing', 'Before Food');
    expect(onUpdate).toHaveBeenCalledWith(201, 'duration', '5 Days');
    expect(onUpdate).toHaveBeenCalledWith(201, 'remarks', 'Take empty stomach in the morning');

    // Crucial check: verify onUpdate was NEVER called with an object as the 2nd argument
    onUpdate.mock.calls.forEach((call) => {
      expect(typeof call[1]).toBe('string');
      expect(call[1]).not.toBe('[object Object]');
    });
  });

  it('allows direct editing of individual row cells', () => {
    const onUpdate = vi.fn();
    const medicines = [
      {
        id: 102,
        name: 'Pantoprazole 40mg',
        dosage: '40mg',
        frequency: '1-0-0',
        timing: 'Before Food',
        duration: '5 Days',
        remarks: 'Take empty stomach',
      },
    ];

    render(<MedicineTable medicines={medicines} onUpdate={onUpdate} onRemove={vi.fn()} />);

    // Edit duration
    const durationInput = screen.getByPlaceholderText('e.g. 5 days');
    fireEvent.change(durationInput, { target: { value: '10 days' } });
    expect(onUpdate).toHaveBeenCalledWith(102, 'duration', '10 days');

    // Edit remarks
    const remarksInput = screen.getByPlaceholderText('e.g. After food');
    fireEvent.change(remarksInput, { target: { value: 'Take with warm water' } });
    expect(onUpdate).toHaveBeenCalledWith(102, 'remarks', 'Take with warm water');
  });

  it('calls onRemove when delete button is clicked on multi-row tables', () => {
    const onRemove = vi.fn();
    const medicines = [
      { id: 1, name: 'Med 1', dosage: '', frequency: '', timing: '', duration: '', remarks: '' },
      { id: 2, name: 'Med 2', dosage: '', frequency: '', timing: '', duration: '', remarks: '' },
    ];

    render(<MedicineTable medicines={medicines} onUpdate={vi.fn()} onRemove={onRemove} />);

    const removeButtons = screen.getAllByRole('button', { name: /Delete this medicine/i });
    expect(removeButtons.length).toBe(2);

    fireEvent.click(removeButtons[0]);
    expect(onRemove).toHaveBeenCalledWith(1);
  });

  it('renders frequency dropdown options without bracketed details', () => {
    const medicines = [
      { id: 1, name: 'Pantoprazole 40mg', frequency: '0-1-0', duration: '5 Days', remarks: '' },
    ];
    render(<MedicineTable medicines={medicines} onUpdate={vi.fn()} onRemove={vi.fn()} />);

    const select = document.querySelector('select.medicine-select');
    expect(select).toBeTruthy();
    const options = Array.from(select.querySelectorAll('option')).map((o) => o.textContent);

    // Verify key frequency options do not contain bracketed descriptions
    expect(options).toContain('1-0-1');
    expect(options).toContain('1-1-1');
    expect(options).toContain('0-0-1');
    expect(options).toContain('1-0-0');
    expect(options).toContain('0-1-0');
    expect(options).toContain('OD');
    expect(options).toContain('BD');
    expect(options).toContain('TDS');
    expect(options).toContain('SOS');

    // Ensure none of the frequency options have brackets
    const bracketedOptions = options.filter((text) => text.includes('(') || text.includes(')'));
    expect(bracketedOptions.length).toBe(0);
  });
});
