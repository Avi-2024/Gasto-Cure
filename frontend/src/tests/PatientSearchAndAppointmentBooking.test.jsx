import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PatientSearchSelector from '../components/common/PatientSearchSelector';
import AppointmentsPage from '../pages/Appointments/AppointmentsPage';
import { localPatients, localAppointments } from '../services/localStore';

describe('PatientSearchSelector & Senior Appointment Booking UX', () => {
  const samplePatients = [
    {
      id: 'PT-001',
      mrn: 'PX-2026-0001',
      name: 'Aarav Sharma',
      contact: '9876543210',
      phone: '9876543210',
      age: 34,
      gender: 'Male',
    },
    {
      id: 'PT-002',
      mrn: 'PX-2026-0002',
      name: 'Maya Verma',
      contact: '9123456789',
      phone: '9123456789',
      age: 28,
      gender: 'Female',
    },
    {
      id: 'PT-003',
      mrn: 'PX-2026-0003',
      name: 'Rohan Iyer',
      contact: '9888877777',
      phone: '9888877777',
      age: 45,
      gender: 'Male',
    },
  ];

  beforeEach(() => {
    localStorage.clear();
    samplePatients.forEach((p) => localPatients.add(p));
  });

  describe('PatientSearchSelector Unit Tests', () => {
    it('renders search input with placeholder', () => {
      render(
        <PatientSearchSelector
          placeholder="Search by Name, Mobile..."
          onSelectPatient={vi.fn()}
        />
      );

      const input = screen.getByPlaceholderText(/Search by Name, Mobile/i);
      expect(input).toBeTruthy();
    });

    it('filters patients by Name and selects patient on click', async () => {
      const handleSelect = vi.fn();
      render(<PatientSearchSelector onSelectPatient={handleSelect} />);

      const input = screen.getByRole('combobox');
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'Aarav' } });

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeTruthy();
      });

      const options = screen.getAllByRole('option');
      expect(options.length).toBe(1);
      expect(options[0].textContent).toContain('Aarav Sharma');

      fireEvent.click(options[0]);
      expect(handleSelect).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Aarav Sharma' })
      );
    });

    it('filters patients by Mobile Number', async () => {
      render(<PatientSearchSelector onSelectPatient={vi.fn()} />);

      const input = screen.getByRole('combobox');
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: '91234' } });

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeTruthy();
      });

      const options = screen.getAllByRole('option');
      expect(options.length).toBe(1);
      expect(options[0].textContent).toContain('Maya Verma');
      expect(options[0].textContent).toContain('9123456789');
    });

    it('filters patients by MRN / Patient ID', async () => {
      render(<PatientSearchSelector onSelectPatient={vi.fn()} />);

      const input = screen.getByRole('combobox');
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'PT-003' } });

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeTruthy();
      });

      const options = screen.getAllByRole('option');
      expect(options.length).toBe(1);
      expect(options[0].textContent).toContain('Rohan Iyer');
    });

    it('navigates with ArrowDown/ArrowUp and selects on Enter', async () => {
      const handleSelect = vi.fn();
      render(<PatientSearchSelector onSelectPatient={handleSelect} />);

      const input = screen.getByRole('combobox');
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'a' } });

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeTruthy();
      });

      // Press ArrowDown to highlight first item
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      // Press Enter to select
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(handleSelect).toHaveBeenCalledTimes(1);
    });

    it('displays active patient card when patient is selected and allows changing', () => {
      const handleClear = vi.fn();
      render(
        <PatientSearchSelector
          selectedPatient={samplePatients[0]}
          onClearPatient={handleClear}
        />
      );

      // Selected card displays patient info
      expect(screen.getByText('Aarav Sharma')).toBeTruthy();
      expect(screen.getByText(/PX-2026-0001|PT-001/)).toBeTruthy();
      expect(screen.getByText(/9876543210/)).toBeTruthy();

      // Change button is present
      const changeBtn = screen.getByRole('button', { name: /Change/i });
      expect(changeBtn).toBeTruthy();
      fireEvent.click(changeBtn);
      expect(handleClear).toHaveBeenCalledTimes(1);
    });

    it('shows empty state with switch to walk-in option when no matches exist', async () => {
      const handleWalkIn = vi.fn();
      render(
        <PatientSearchSelector
          onSelectPatient={vi.fn()}
          onSwitchToWalkIn={handleWalkIn}
        />
      );

      const input = screen.getByRole('combobox');
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'NonExistentPatient123' } });

      await waitFor(() => {
        expect(screen.getByText(/No registered patient found for/i)).toBeTruthy();
      });

      const walkInBtn = screen.getByRole('button', {
        name: /Register "NonExistentPatient123" as Walk-in/i,
      });
      expect(walkInBtn).toBeTruthy();
      fireEvent.click(walkInBtn);
      expect(handleWalkIn).toHaveBeenCalledWith('NonExistentPatient123');
    });
  });

  describe('AppointmentsPage Integration & No Raw UUIDs', () => {
    it('does not display raw 36-character UUIDs in the appointment register', () => {
      // Seed a local appointment with UUID
      const testUuid = 'ae7c751b-0f17-4319-bf1d-9e45ec04feb7';
      const storedAppts = [
        {
          id: testUuid,
          tokenNumber: 1,
          tokenFormatted: 'Token #1',
          patientName: 'Walk-in Patient',
          patientPhone: '9876543210',
          reason: 'General Consultation',
          status: 'waiting',
          appointmentDate: '2026-11-20',
          createdAt: '2026-11-20T10:00:00.000Z',
        },
      ];
      localStorage.setItem('ds_appointments', JSON.stringify(storedAppts));

      render(
        <MemoryRouter>
          <AppointmentsPage />
        </MemoryRouter>
      );

      // Verify Walk-in Patient is rendered
      expect(screen.getByText('Walk-in Patient')).toBeTruthy();
      expect(screen.getByText('Token #1')).toBeTruthy();

      // Verify raw UUID is NOT rendered anywhere in the DOM text
      expect(screen.queryByText(testUuid)).toBeNull();
      // Should show Walk-in badge or phone instead
      expect(screen.getByText(/9876543210/)).toBeTruthy();
    });

    it('validates patient selection inline without native browser alert', async () => {
      const alertMock = vi.fn();
      window.alert = alertMock;

      render(
        <MemoryRouter>
          <AppointmentsPage />
        </MemoryRouter>
      );

      // Open Book Appointment modal
      const bookBtn = screen.getByRole('button', { name: /Book Appointment/i });
      fireEvent.click(bookBtn);

      expect(screen.getByText('Book Clinic Appointment')).toBeTruthy();

      // Click Confirm Booking without selecting a patient
      const confirmBtn = screen.getByRole('button', {
        name: /Confirm Booking & Issue Token/i,
      });
      fireEvent.click(confirmBtn);

      // Native browser alert should NOT be called!
      expect(alertMock).not.toHaveBeenCalled();

      // Inline error message should be displayed inside modal
      await waitFor(() => {
        expect(
          screen.getByText(/Please search and select a registered patient/i)
        ).toBeTruthy();
      });
    });
  });
});
