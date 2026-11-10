import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PatientsPage from '../pages/Patients/PatientsPage';
import EditPatientModal from '../pages/Patients/components/EditPatientModal';
import PatientProfileDrawer from '../pages/Patients/components/PatientProfileDrawer';
import { localPatients, localVisits, localSettings } from '../services/localStore';
import { cleanPhoneNumber } from '../utils/whatsappHelper';

describe('Patient Management - Task 6 Tests', () => {
  const mockPatient = {
    id: 'PT-101010',
    name: 'Rajesh Kumar',
    age: 42,
    gender: 'Male',
    contact: '9876543210',
    mobile: '9876543210',
    address: '24 MG Road, Bengaluru',
    bloodGroup: 'B+',
    allergies: 'Penicillin',
    notes: 'Hypertension under control with medication',
    status: 'Active',
    lastVisit: '2026-03-01',
    nextFollowUp: '2026-03-15',
  };

  const mockVisits = [
    {
      id: 'RX-20260301-A1B2',
      patientId: 'PT-101010',
      patientName: 'Rajesh Kumar',
      patientAge: 42,
      patientGender: 'Male',
      patientMobile: '9876543210',
      date: '2026-03-01',
      diagnosis: 'Acid Peptic Disease / GERD',
      vitals: {
        bp: '128/82',
        pulse: '76',
        sugar: '110',
        weight: '74',
        temp: '98.4',
      },
      medicines: [
        {
          name: 'Pantoprazole 40mg',
          dosage: '40mg',
          frequency: '1-0-0',
          timing: 'Before Food',
          duration: '14 Days',
          instructions: 'Take empty stomach',
        },
        {
          name: 'Antacid Gel',
          dosage: '2 tsp',
          frequency: '0-0-1',
          timing: 'After Food',
          duration: '7 Days',
          instructions: 'At bedtime',
        },
      ],
      advice: 'Avoid spicy and oily food, drink plenty of water',
      followUpDate: '2026-03-15',
      nextFollowUp: '2026-03-15',
    },
    {
      id: 'RX-20260215-C3D4',
      patientId: 'PT-101010',
      patientName: 'Rajesh Kumar',
      patientAge: 42,
      patientGender: 'Male',
      patientMobile: '9876543210',
      date: '2026-02-15',
      diagnosis: 'Acute Gastritis',
      vitals: {
        bp: '130/84',
        pulse: '80',
        sugar: '115',
        weight: '75',
      },
      medicines: [
        {
          name: 'Rabeprazole 20mg',
          dosage: '20mg',
          frequency: '1-0-0',
          timing: 'Before Food',
          duration: '7 Days',
        },
      ],
      advice: 'Liquid diet for 2 days',
      followUpDate: '2026-03-01',
    },
  ];

  beforeEach(() => {
    localStorage.clear();
    // Pre-populate with our test patient and visits
    localPatients.add(mockPatient);
    mockVisits.forEach((v) => localVisits.save(v));
    window.open = vi.fn();
  });

  describe('EditPatientModal Component', () => {
    it('renders with existing patient details in form fields', () => {
      const handleClose = vi.fn();
      const handleSave = vi.fn();

      render(
        <EditPatientModal
          isOpen={true}
          patient={mockPatient}
          onClose={handleClose}
          onSave={handleSave}
        />
      );

      expect(screen.getByDisplayValue('Rajesh Kumar')).toBeTruthy();
      expect(screen.getByDisplayValue('42')).toBeTruthy();
      expect(screen.getByDisplayValue('9876543210')).toBeTruthy();
      expect(screen.getByDisplayValue('24 MG Road, Bengaluru')).toBeTruthy();
      expect(screen.getByDisplayValue('B+')).toBeTruthy();
      expect(screen.getByDisplayValue('Penicillin')).toBeTruthy();
      expect(screen.getByDisplayValue(/Hypertension under control/i)).toBeTruthy();
    });

    it('shows validation error when required fields are cleared', () => {
      const handleClose = vi.fn();
      const handleSave = vi.fn();

      render(
        <EditPatientModal
          isOpen={true}
          patient={mockPatient}
          onClose={handleClose}
          onSave={handleSave}
        />
      );

      const nameInput = screen.getByDisplayValue('Rajesh Kumar');
      fireEvent.change(nameInput, { target: { value: '   ' } });

      const saveBtn = screen.getByRole('button', { name: /save|update/i });
      fireEvent.click(saveBtn);

      expect(screen.getByText(/required/i)).toBeTruthy();
      expect(handleSave).not.toHaveBeenCalled();
    });

    it('updates patient details in localPatients and retains patient ID and visit linkage', () => {
      const handleClose = vi.fn();
      const handleSave = vi.fn();

      render(
        <EditPatientModal
          isOpen={true}
          patient={mockPatient}
          onClose={handleClose}
          onSave={handleSave}
        />
      );

      const addressInput = screen.getByDisplayValue('24 MG Road, Bengaluru');
      fireEvent.change(addressInput, { target: { value: '88 Indiranagar, Bengaluru' } });

      const allergiesInput = screen.getByDisplayValue('Penicillin');
      fireEvent.change(allergiesInput, { target: { value: 'Penicillin, Sulfa' } });

      const saveBtn = screen.getByRole('button', { name: /save|update/i });
      fireEvent.click(saveBtn);

      expect(handleSave).toHaveBeenCalled();
      const updated = localPatients.getById(mockPatient.id);
      expect(updated).toBeTruthy();
      expect(updated.address).toBe('88 Indiranagar, Bengaluru');
      expect(updated.allergies).toBe('Penicillin, Sulfa');

      // Verify visits are still linked to this patient ID
      const patientVisits = localVisits.getByPatient(mockPatient.id);
      expect(patientVisits.length).toBe(2);
      expect(patientVisits[0].diagnosis).toContain('GERD');
    });

    it('calls onClose when Escape key is pressed', () => {
      const handleClose = vi.fn();

      render(
        <EditPatientModal
          isOpen={true}
          patient={mockPatient}
          onClose={handleClose}
          onSave={vi.fn()}
        />
      );

      fireEvent.keyDown(window, { key: 'Escape' });
      expect(handleClose).toHaveBeenCalled();
    });
  });

  describe('PatientProfileDrawer Component', () => {
    it('displays demographic overview and allergy alert pill', () => {
      render(
        <MemoryRouter>
          <PatientProfileDrawer
            isOpen={true}
            patient={mockPatient}
            onClose={vi.fn()}
            onEdit={vi.fn()}
          />
        </MemoryRouter>
      );

      expect(screen.getByText('Rajesh Kumar')).toBeTruthy();
      expect(screen.getByText(/PT-101010/i)).toBeTruthy();
      expect(screen.getByText(/9876543210/)).toBeTruthy();
      expect(screen.getByText(/B\+/)).toBeTruthy();

      // Allergy alert pill should be visible with 'Penicillin'
      expect(screen.getByText(/Penicillin/i)).toBeTruthy();
    });

    it('renders chronological visit timeline with vitals, medicines, and advice', () => {
      render(
        <MemoryRouter>
          <PatientProfileDrawer
            isOpen={true}
            patient={mockPatient}
            onClose={vi.fn()}
            onEdit={vi.fn()}
          />
        </MemoryRouter>
      );

      // Past visits
      expect(screen.getByText(/Acid Peptic Disease \/ GERD/i)).toBeTruthy();
      expect(screen.getByText(/Acute Gastritis/i)).toBeTruthy();

      // Vitals
      expect(screen.getByText(/128\/82/)).toBeTruthy();

      // Medicines
      expect(screen.getByText(/Pantoprazole 40mg/i)).toBeTruthy();
      expect(screen.getByText(/Antacid Gel/i)).toBeTruthy();

      // Action buttons on visits
      const reprintBtns = screen.getAllByRole('button', { name: /view|reprint/i });
      expect(reprintBtns.length).toBeGreaterThanOrEqual(2);

      const shareWaBtns = screen.getAllByTitle(/share.*whatsapp/i);
      expect(shareWaBtns.length).toBeGreaterThanOrEqual(2);
    });

    it('harmonizes vitals schema displaying both alias formats (bloodPressure, pulseRate, sugar, etc.)', () => {
      const patientWithAltVitals = {
        id: 'PT-999',
        name: 'Suman Sen',
        contact: '9876543219',
        age: 39,
        gender: 'Female',
      };
      localVisits.save({
        patientId: 'PT-999',
        patientName: 'Suman Sen',
        patientMobile: '9876543219',
        patientAge: 39,
        patientGender: 'Female',
        date: '2026-11-10',
        vitals: {
          bloodPressure: '122/78',
          pulseRate: '74',
          bloodSugar: '95',
          temperature: '98.4',
          spo2: '99',
          weight: '62',
        },
        diagnosis: 'Dyspepsia Review',
        medicines: [],
        advice: 'Normal vitals',
        status: 'COMPLETED',
      });

      render(
        <MemoryRouter>
          <PatientProfileDrawer
            isOpen={true}
            patient={patientWithAltVitals}
            onClose={vi.fn()}
            onEdit={vi.fn()}
          />
        </MemoryRouter>
      );

      expect(screen.getByText(/122\/78/)).toBeTruthy();
      expect(screen.getByText(/74 bpm/)).toBeTruthy();
      expect(screen.getByText(/95 mg\/dL/)).toBeTruthy();
      expect(screen.getByText(/98\.4 °F/)).toBeTruthy();
      expect(screen.getByText(/99%/)).toBeTruthy();
    });

    it('clicking WhatsApp share on a past visit opens wa.me URL with clean phone', () => {
      render(
        <MemoryRouter>
          <PatientProfileDrawer
            isOpen={true}
            patient={mockPatient}
            onClose={vi.fn()}
            onEdit={vi.fn()}
          />
        </MemoryRouter>
      );

      const shareWaBtns = screen.getAllByTitle(/share.*whatsapp/i);
      fireEvent.click(shareWaBtns[0]);

      expect(window.open).toHaveBeenCalled();
      const openedUrl = window.open.mock.calls[0][0];
      expect(openedUrl).toContain('https://wa.me/919876543210');
      expect(openedUrl).toContain('Rajesh');
    });

    it('displays empty state when patient has no past visits', () => {
      const newPatient = {
        id: 'PT-999999',
        name: 'Anita Roy',
        age: 29,
        gender: 'Female',
        contact: '9123456789',
      };
      localPatients.add(newPatient);

      render(
        <MemoryRouter>
          <PatientProfileDrawer
            isOpen={true}
            patient={newPatient}
            onClose={vi.fn()}
            onEdit={vi.fn()}
          />
        </MemoryRouter>
      );

      expect(screen.getByText(/no past.*visit|no.*history/i)).toBeTruthy();
    });
  });

  describe('PatientsPage Integration', () => {
    const renderPatientsPage = () =>
      render(
        <MemoryRouter>
          <PatientsPage />
        </MemoryRouter>
      );

    it('renders Quick Stats strip (Total Patients, Active, Scheduled Follow-ups)', () => {
      renderPatientsPage();

      expect(screen.getByText(/Total Patients/i)).toBeTruthy();
      expect(screen.getAllByText(/Active/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/Scheduled Follow-ups/i)).toBeTruthy();
    });

    it('renders Next Follow-Up column in the patient table', () => {
      renderPatientsPage();

      expect(screen.getByText(/Next Follow-Up/i)).toBeTruthy();
      // Should show follow-up date for Rajesh Kumar
      expect(screen.getByText(/Mar 15, 2026/i)).toBeTruthy();
    });

    it('renders direct WhatsApp chat button on patient row opening wa.me URL', () => {
      renderPatientsPage();

      const waBtn = screen.getByTitle(/WhatsApp|Chat on WhatsApp/i);
      expect(waBtn).toBeTruthy();

      fireEvent.click(waBtn);
      expect(window.open).toHaveBeenCalled();
      const calledUrl = window.open.mock.calls[0][0];
      const clean = cleanPhoneNumber(mockPatient.contact);
      expect(calledUrl).toContain(`https://wa.me/91${clean}`);
    });

    it('opens Patient Profile drawer when Profile button is clicked', async () => {
      renderPatientsPage();

      const profileBtn = screen.getByRole('button', { name: /profile/i });
      fireEvent.click(profileBtn);

      // Drawer should open and display Rajesh Kumar's details
      expect(screen.getByText(/Acid Peptic Disease \/ GERD/i)).toBeTruthy();
    });

    it('opens Edit Patient modal when Edit button is clicked', async () => {
      renderPatientsPage();

      const editBtn = screen.getByRole('button', { name: /^edit$/i });
      fireEvent.click(editBtn);

      // Modal should open with Rajesh Kumar in form
      expect(screen.getByDisplayValue('Rajesh Kumar')).toBeTruthy();
      expect(screen.getByDisplayValue('24 MG Road, Bengaluru')).toBeTruthy();
    });
  });
});
