import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PatientsPage from '../pages/Patients/PatientsPage';
import QuickPatientSearch from '../pages/Dashboard/components/QuickPatientSearch';
import {
  localPatients,
  localMedicines,
  localVisits,
  localSettings,
} from '../services/localStore';
import {
  cleanPhoneNumber,
  generatePrescriptionWhatsAppLink,
  generateFollowUpReminderWhatsAppLink,
} from '../utils/whatsappHelper';
import {
  applyPrintSettings,
  getEffectivePrintSettings,
  sanitizePrintSettings,
  generatePrintCss,
  MIN_PRINT_OFFSET_MM,
  MAX_PRINT_OFFSET_MM,
} from '../utils/printStyles';

describe('ClinicRx End-to-End Workflow & Edge Cases Verification - Task 8', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Focus Case 1: Phone Number Sanitizer & WhatsApp Deep Link Generation
  // ───────────────────────────────────────────────────────────────────────────
  describe('Focus Case 1: Phone Sanitizer & WhatsApp wa.me Link Generation', () => {
    it('sanitizes tricky Indian and formatted phone numbers correctly', () => {
      // Standard +91 prefix with dashes and spaces
      expect(cleanPhoneNumber('+91 98765-43210')).toBe('9876543210');

      // Leading zero standard STD/mobile input
      expect(cleanPhoneNumber('09876543210')).toBe('9876543210');

      // Prefix with 91 but no plus
      expect(cleanPhoneNumber('919876543210')).toBe('9876543210');

      // Spaces between digit groups
      expect(cleanPhoneNumber('98765 43210')).toBe('9876543210');

      // Parentheses and dots
      expect(cleanPhoneNumber('+91 (987) 654.3210')).toBe('9876543210');

      // Already clean 10-digit number
      expect(cleanPhoneNumber('9876543210')).toBe('9876543210');
    });

    it('safely handles non-numbers, empty strings, and invalid placeholders', () => {
      expect(cleanPhoneNumber('')).toBe('');
      expect(cleanPhoneNumber(null)).toBe('');
      expect(cleanPhoneNumber(undefined)).toBe('');
      expect(cleanPhoneNumber('N/A')).toBe('');
      expect(cleanPhoneNumber('na')).toBe('');
      expect(cleanPhoneNumber('null')).toBe('');
      expect(cleanPhoneNumber('undefined')).toBe('');
      expect(cleanPhoneNumber('abc-xyz')).toBe('');
    });

    it('generates fully formed https://wa.me/91<phone> prescription link with URL encoded details', () => {
      const patient = {
        name: 'Amitabh Bachchan',
        contact: '+91 98765-43210',
      };
      const prescription = {
        date: '2026-11-10',
        diagnosis: 'Dyspepsia & Acid Reflux',
        vitals: { bp: '120/80', pulse: '72' },
        medicines: [
          {
            name: 'Pantoprazole 40mg',
            dosage: '40mg',
            frequency: '1-0-0',
            timing: 'Before Food',
            duration: '14 Days',
            instructions: 'Empty stomach',
          },
        ],
        advice: 'Avoid late heavy dinner and caffeine.',
        followUpDate: '2026-11-24',
      };
      const clinic = {
        clinicName: 'Gastro Cure Clinic',
        doctorName: 'Dr. Aarav Sharma',
        phone: '9876543210',
      };

      const link = generatePrescriptionWhatsAppLink(patient, prescription, clinic);
      expect(link).toContain('https://wa.me/919876543210?text=');

      const url = new URL(link);
      const text = url.searchParams.get('text');
      expect(text).toContain('Amitabh Bachchan');
      expect(text).toContain('Gastro Cure Clinic');
      expect(text).toContain('Dyspepsia & Acid Reflux');
      expect(text).toContain('Pantoprazole 40mg');
      expect(text).toContain('14 Days');
      expect(text).toContain('*Next Follow-up:* 2026-11-24');
    });

    it('generates polite follow-up reminder links with cleaned phrasing "in X days"', () => {
      const patient = {
        name: 'Sunita Sharma',
        contact: '09876543211',
        nextFollowUp: '2026-11-15',
      };
      const clinic = {
        clinicName: 'Gastro Cure Clinic',
        doctorName: 'Dr. Aarav Sharma',
        phone: '9876543210',
      };

      // 3 days left
      const link3Days = generateFollowUpReminderWhatsAppLink(patient, clinic, 3);
      const text3Days = new URL(link3Days).searchParams.get('text');
      expect(text3Days).toContain('in 3 days (2026-11-15)');
      expect(text3Days).not.toContain('for in 3 days');

      // Tomorrow (1 day left)
      const linkTomorrow = generateFollowUpReminderWhatsAppLink(patient, clinic, 1);
      const textTomorrow = new URL(linkTomorrow).searchParams.get('text');
      expect(textTomorrow).toContain('for tomorrow (2026-11-15)');

      // Today (0 days left)
      const linkToday = generateFollowUpReminderWhatsAppLink(patient, clinic, 0);
      const textToday = new URL(linkToday).searchParams.get('text');
      expect(textToday).toContain('for today (2026-11-15)');

      // Overdue (-1 days)
      const linkOverdue = generateFollowUpReminderWhatsAppLink(patient, clinic, -2);
      const textOverdue = new URL(linkOverdue).searchParams.get('text');
      expect(textOverdue).toContain('for 2026-11-15 (Overdue)');
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Focus Case 2: Top Margin Slider, LocalStorage Persistence & CSS Variables
  // ───────────────────────────────────────────────────────────────────────────
  describe('Focus Case 2: Print Alignment Engine & CSS Variables', () => {
    it('persists top margin offset and print configuration to localStorage', () => {
      const customPrint = {
        paperSize: 'A4',
        padMode: true,
        topOffsetMm: 75,
        bottomMarginMm: 25,
        leftMarginMm: 18,
        rightMarginMm: 18,
      };

      localSettings.update({ print: customPrint });
      const stored = localSettings.get();
      expect(stored.print.topOffsetMm).toBe(75);
      expect(stored.print.bottomMarginMm).toBe(25);
      expect(stored.print.padMode).toBe(true);

      const effective = getEffectivePrintSettings();
      expect(effective.topOffsetMm).toBe(75);
      expect(effective.padMode).toBe(true);
    });

    it('immediately injects CSS variables and pad-mode attributes onto document :root', () => {
      const settings = {
        topOffsetMm: 80,
        leftMarginMm: 20,
        rightMarginMm: 20,
        bottomMarginMm: 30,
        padMode: true,
      };

      applyPrintSettings(settings);

      const root = document.documentElement;
      expect(root.style.getPropertyValue('--print-top-offset')).toBe('80mm');
      expect(root.style.getPropertyValue('--print-left-margin')).toBe('20mm');
      expect(root.style.getPropertyValue('--print-right-margin')).toBe('20mm');
      expect(root.style.getPropertyValue('--print-bottom-margin')).toBe('30mm');
      expect(root.getAttribute('data-pad-mode')).toBe('true');
      expect(root.classList.contains('pad-mode')).toBe(true);
    });

    it('switches padMode to false and updates root class and attributes cleanly', () => {
      const digitalLetterheadSettings = {
        topOffsetMm: 20,
        leftMarginMm: 15,
        rightMarginMm: 15,
        bottomMarginMm: 20,
        padMode: false,
      };

      applyPrintSettings(digitalLetterheadSettings);

      const root = document.documentElement;
      expect(root.getAttribute('data-pad-mode')).toBe('false');
      expect(root.classList.contains('pad-mode')).toBe(false);
      expect(root.style.getPropertyValue('--print-top-offset')).toBe('20mm');
    });

    it('enforces safety bounds clamping between MIN_PRINT_OFFSET_MM (10) and MAX_PRINT_OFFSET_MM (150)', () => {
      const underflow = sanitizePrintSettings({ topOffsetMm: 2, leftMarginMm: -5 });
      expect(underflow.topOffsetMm).toBe(MIN_PRINT_OFFSET_MM);
      expect(underflow.leftMarginMm).toBe(MIN_PRINT_OFFSET_MM);

      const overflow = sanitizePrintSettings({ topOffsetMm: 220, rightMarginMm: 180 });
      expect(overflow.topOffsetMm).toBe(MAX_PRINT_OFFSET_MM);
      expect(overflow.rightMarginMm).toBe(MAX_PRINT_OFFSET_MM);
    });

    it('generates clean @media print stylesheet rule string', () => {
      const css = generatePrintCss({ topOffsetMm: 65, leftMarginMm: 15 });
      expect(css).toContain('@media print');
      expect(css).toContain('--print-top-offset: 65mm;');
      expect(css).toContain('--print-left-margin: 15mm;');
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Focus Case 3: Master Medicine Updates Do NOT Mutate Saved Prescriptions
  // ───────────────────────────────────────────────────────────────────────────
  describe('Focus Case 3: Prescription Snapshot Immutability vs Master Catalog', () => {
    it('preserves historical prescription medicine snapshot when master medicine is modified or deleted', () => {
      // 1. Add medicine to catalog
      const med = localMedicines.add({
        name: 'Rabeprazole 20mg',
        dosage: '20mg',
        frequency: '1-0-0',
        timing: 'Before Food',
        duration: '14 Days',
        category: 'Antacid',
      });
      expect(med.id).toBeDefined();

      // 2. Create patient and save a prescription with this medicine
      const patient = localPatients.add({
        name: 'Kavita Krishnan',
        age: 38,
        contact: '9876543212',
      });

      const originalSnapshotMedicines = [
        {
          name: 'Rabeprazole 20mg',
          dosage: '20mg',
          frequency: '1-0-0',
          timing: 'Before Food',
          duration: '14 Days',
          instructions: 'Take in morning',
        },
      ];

      const savedVisit = localVisits.save({
        patientId: patient.id,
        patientName: patient.name,
        diagnosis: 'Peptic Ulcer',
        medicines: originalSnapshotMedicines,
        date: '2026-11-10',
      });
      expect(savedVisit.id).toMatch(/^RX-/);

      // 3. Doctor later updates the master medicine in catalog (e.g. changes name & dosage)
      localMedicines.update(med.id, {
        name: 'Rabeprazole + Domperidone (RAB-D)',
        dosage: '20mg/30mg',
        frequency: '1-0-1',
      });

      // Verify catalog reflects new name
      const updatedInCatalog = localMedicines.getById(med.id);
      expect(updatedInCatalog.name).toBe('Rabeprazole + Domperidone (RAB-D)');

      // 4. Retrieve original visit and verify snapshot is 100% UNTOUCHED
      const fetchedVisit = localVisits.getById(savedVisit.id);
      expect(fetchedVisit.medicines[0].name).toBe('Rabeprazole 20mg');
      expect(fetchedVisit.medicines[0].dosage).toBe('20mg');
      expect(fetchedVisit.medicines[0].frequency).toBe('1-0-0');

      // 5. Delete medicine from catalog completely
      localMedicines.delete(med.id);
      expect(localMedicines.getById(med.id)).toBeNull();

      // Historical visit still retains its medicine snapshot intact
      const visitAfterDelete = localVisits.getById(savedVisit.id);
      expect(visitAfterDelete.medicines[0].name).toBe('Rabeprazole 20mg');
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Focus Case 4: Follow-up Date Calculations Across Month & Year Boundaries
  // ───────────────────────────────────────────────────────────────────────────
  describe('Focus Case 4: Follow-up Date Calculations Across Boundaries', () => {
    it('accurately calculates follow-up dates across month end and year end boundaries', () => {
      // Test month boundary: Nov 25 + 14 days -> Dec 09
      const baseDateNov = new Date(2026, 10, 25); // Nov 25, 2026
      const novTarget = new Date(baseDateNov);
      novTarget.setDate(novTarget.getDate() + 14);
      expect(novTarget.getMonth()).toBe(11); // December (0-indexed 11)
      expect(novTarget.getDate()).toBe(9);

      // Test year boundary: Dec 28, 2026 + 14 days -> Jan 11, 2027
      const baseDateDec = new Date(2026, 11, 28); // Dec 28, 2026
      const decTarget = new Date(baseDateDec);
      decTarget.setDate(decTarget.getDate() + 14);
      expect(decTarget.getFullYear()).toBe(2027);
      expect(decTarget.getMonth()).toBe(0); // January
      expect(decTarget.getDate()).toBe(11);
    });

    it('saves followUpDate into visit and updates patient.nextFollowUp correctly', () => {
      const patient = localPatients.add({
        name: 'Deepak Chopra',
        contact: '9876543213',
      });

      // Save visit with explicit follow-up date across year boundary
      const visit = localVisits.save({
        patientId: patient.id,
        patientName: patient.name,
        diagnosis: 'GERD',
        followUpDate: '2027-01-15',
        medicines: [],
      });

      expect(visit.followUpDate).toBe('2027-01-15');

      // Patient record must be updated with the new follow-up date
      const updatedPatient = localPatients.getById(patient.id);
      expect(updatedPatient.nextFollowUp).toBe('2027-01-15');
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Focus Case 5: Editing Patient Details Preserves Patient ID and Visit History
  // ───────────────────────────────────────────────────────────────────────────
  describe('Focus Case 5: Patient Details Update & Historical Visits Preservation', () => {
    it('preserves permanent patient ID and all past visit records when updating patient demographic details', () => {
      // 1. Create patient
      const patient = localPatients.add({
        name: 'Manoj Bajpayee',
        age: 51,
        gender: 'Male',
        contact: '9876543214',
        address: 'Bandra West, Mumbai',
      });
      const initialId = patient.id;

      // 2. Add two historical visits for this patient
      const visit1 = localVisits.save({
        patientId: initialId,
        patientName: patient.name,
        diagnosis: 'Gastric Erosion',
        date: '2026-10-01',
        medicines: [{ name: 'Sucralfate Syrup', dosage: '10ml', frequency: '1-1-1' }],
      });

      const visit2 = localVisits.save({
        patientId: initialId,
        patientName: patient.name,
        diagnosis: 'Gastric Erosion - Resolving',
        date: '2026-10-20',
        medicines: [{ name: 'Pantoprazole 40mg', dosage: '40mg', frequency: '1-0-0' }],
      });

      // Confirm both visits are linked to initialId
      let visits = localVisits.getByPatient(initialId);
      expect(visits.length).toBe(2);

      // 3. Edit patient demographic info (new address, updated phone, new allergy, new notes)
      const updated = localPatients.update(initialId, {
        name: 'Manoj Bajpayee (Senior)',
        contact: '9876599999',
        address: 'Andheri West, Mumbai',
        bloodGroup: 'O+',
        allergies: 'Sulfa Drugs',
        notes: 'Regular health monitoring required',
      });

      // Patient ID must remain strictly identical
      expect(updated.id).toBe(initialId);
      expect(updated.name).toBe('Manoj Bajpayee (Senior)');
      expect(updated.contact).toBe('9876599999');
      expect(updated.allergies).toBe('Sulfa Drugs');

      // 4. Retrieve visits by patient ID again: both historical visits must remain fully intact
      visits = localVisits.getByPatient(initialId);
      expect(visits.length).toBe(2);
      expect(visits.map((v) => v.id)).toContain(visit1.id);
      expect(visits.map((v) => v.id)).toContain(visit2.id);
      expect(visits.find((v) => v.id === visit1.id).diagnosis).toBe('Gastric Erosion');
      expect(visits.find((v) => v.id === visit2.id).diagnosis).toBe('Gastric Erosion - Resolving');
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Focus Case 6: Navigation Query Params & Quick Patient Search Dropdown
  // ───────────────────────────────────────────────────────────────────────────
  describe('Focus Case 6: Navigation Query Params & Quick Search Dropdown', () => {
    it('automatically opens Add Patient modal when URL has ?action=new', async () => {
      render(
        <MemoryRouter initialEntries={['/patients?action=new']}>
          <PatientsPage />
        </MemoryRouter>
      );

      // The modal title "Add New Patient" should be visible
      await waitFor(() => {
        expect(screen.getByText(/Add New Patient/i)).toBeTruthy();
        expect(screen.getByLabelText(/Patient Name/i)).toBeTruthy();
      });
    });

    it('automatically opens Patient Profile drawer when URL has ?patientId=<id>', async () => {
      // Seed a test patient
      const patient = localPatients.add({
        id: 'PT-999001',
        name: 'Ananya Panday',
        age: 26,
        gender: 'Female',
        contact: '9876543215',
        status: 'Active',
      });

      render(
        <MemoryRouter initialEntries={[`/patients?patientId=${patient.id}`]}>
          <PatientsPage />
        </MemoryRouter>
      );

      // Profile drawer should open showing the patient's name and demographic info
      await waitFor(() => {
        expect(screen.getAllByText(/Ananya Panday/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/PT-999001/i).length).toBeGreaterThanOrEqual(2);
        expect(screen.getByText(/Visit & Prescription History/i)).toBeTruthy();
      });
    });

    it('closes QuickPatientSearch dropdown when Escape key is pressed', () => {
      // Seed patients so search produces results
      localPatients.add({
        id: 'PT-888',
        name: 'Virender Sehwag',
        contact: '9876543216',
      });

      render(
        <MemoryRouter>
          <QuickPatientSearch />
        </MemoryRouter>
      );

      const input = screen.getByPlaceholderText(/Search patient by name/i);

      // Type search query to open dropdown
      fireEvent.change(input, { target: { value: 'Virender' } });
      expect(screen.getByText(/Patient Search Results/i)).toBeTruthy();
      expect(screen.getByText(/Virender Sehwag/i)).toBeTruthy();

      // Press Escape key
      fireEvent.keyDown(document, { key: 'Escape' });

      // Dropdown should now be closed
      expect(screen.queryByText(/Patient Search Results/i)).toBeNull();
    });
  });
});
