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

    it('filters appointments when clicking on a calendar date cell and toggles filter', () => {
      const todayDate = new Date();
      const dayNum = todayDate.getDate();
      const monthStr = String(todayDate.getMonth() + 1).padStart(2, '0');
      const dateStr = `${todayDate.getFullYear()}-${monthStr}-${String(dayNum).padStart(2, '0')}`;

      const storedAppts = [
        {
          id: 'apt-today-1',
          tokenNumber: 1,
          tokenFormatted: 'Token #1',
          patientName: 'Kavita Roy',
          reason: 'General Consultation',
          status: 'waiting',
          appointmentDate: dateStr,
          createdAt: new Date().toISOString(),
        },
      ];
      localStorage.setItem('ds_appointments', JSON.stringify(storedAppts));

      render(
        <MemoryRouter>
          <AppointmentsPage />
        </MemoryRouter>
      );

      // Find calendar button for today
      const dayButtons = screen.getAllByRole('button');
      const dayBtn = dayButtons.find((btn) => btn.textContent.trim().startsWith(String(dayNum)));
      expect(dayBtn).toBeTruthy();

      // Click the calendar date
      fireEvent.click(dayBtn);

      // Banner should display filtered date
      expect(screen.getByText(/Filtered to:/i)).toBeTruthy();

      // Click "Show All Dates" to clear
      const clearBtn = screen.getByRole('button', { name: /Show All Dates/i });
      fireEvent.click(clearBtn);
      expect(screen.queryByText(/Filtered to:/i)).toBeNull();
    });

    it('allows setting/editing patient name for a walk-in appointment', async () => {
      const storedAppts = [
        {
          id: 'apt-walkin-1',
          patientId: 'pt-walkin-1',
          tokenNumber: 1,
          tokenFormatted: 'Token #1',
          patientName: 'Walk-in Patient',
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

      // Button to set patient name
      const setNameBtn = screen.getByRole('button', { name: /Set Name/i });
      expect(setNameBtn).toBeTruthy();
      fireEvent.click(setNameBtn);

      // Modal should appear
      expect(screen.getByText('Set Patient Information')).toBeTruthy();

      // Enter real name
      const nameInput = screen.getByPlaceholderText(/Enter patient full name/i);
      fireEvent.change(nameInput, { target: { value: 'Suresh Kumar' } });

      // Save
      const saveBtn = screen.getByRole('button', { name: /Save Patient Name/i });
      fireEvent.click(saveBtn);

      // Patient name should now update on the card/table
      await waitFor(() => {
        expect(screen.getByText('Suresh Kumar')).toBeTruthy();
      });
    });

    it('renders Clinical Table View by default and toggles between Table and Cards view', () => {
      const storedAppts = [
        {
          id: 'test-tbl-1',
          tokenNumber: 1,
          tokenFormatted: 'Token #1',
          patientId: 'pt-001',
          patientName: 'Aarav Sharma',
          patientMrn: 'MLC-2026-0001',
          patientPhone: '9876543210',
          reason: 'Acid Peptic Disease / GERD Workup',
          chiefComplaint: 'Acid Peptic Disease / GERD Workup (Morning OPD)',
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

      // Verify Table View headers are present
      expect(screen.getByText('Token')).toBeTruthy();
      expect(screen.getByText('Patient Details')).toBeTruthy();
      expect(screen.getByText('Complaint / Shift')).toBeTruthy();
      expect(screen.getByText('Schedule')).toBeTruthy();

      // Verify Table view shows patient details
      expect(screen.getByText('Aarav Sharma')).toBeTruthy();
      expect(screen.getByText('MLC-2026-0001')).toBeTruthy();
      expect(screen.getByText(/9876543210/)).toBeTruthy();

      // Click Cards view button
      const cardsBtn = screen.getByRole('button', { name: /Cards/i });
      fireEvent.click(cardsBtn);

      // Verify Cards view is active and displays patient card
      expect(screen.getByText('Aarav Sharma')).toBeTruthy();

      // Switch back to Table view
      const tableBtn = screen.getByRole('button', { name: /Table/i });
      fireEvent.click(tableBtn);
      expect(screen.getByText('Patient Details')).toBeTruthy();
    });
  });
});
