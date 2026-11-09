import { describe, it, expect, beforeEach } from 'vitest';
import {
  cleanPhoneNumber,
  generatePrescriptionWhatsAppLink,
  generateFollowUpReminderWhatsAppLink,
} from '../utils/whatsappHelper';
import { localPatients, localVisits } from '../services/localStore';

describe('Prescription & WhatsApp Workflow Tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('Phone Number Sanitizer (cleanPhoneNumber)', () => {
    it('cleans +91 with spaces and dashes: "+91 98765-43210"', () => {
      expect(cleanPhoneNumber('+91 98765-43210')).toBe('9876543210');
    });

    it('cleans leading 0: "09876543210"', () => {
      expect(cleanPhoneNumber('09876543210')).toBe('9876543210');
    });

    it('cleans spaces only: "98765 43210"', () => {
      expect(cleanPhoneNumber('98765 43210')).toBe('9876543210');
    });

    it('handles 12-digit number starting with 91: "919876543210"', () => {
      expect(cleanPhoneNumber('919876543210')).toBe('9876543210');
    });

    it('handles already clean 10-digit number: "9876543210"', () => {
      expect(cleanPhoneNumber('9876543210')).toBe('9876543210');
    });

    it('returns empty string for null, undefined, or empty string', () => {
      expect(cleanPhoneNumber(null)).toBe('');
      expect(cleanPhoneNumber(undefined)).toBe('');
      expect(cleanPhoneNumber('')).toBe('');
      expect(cleanPhoneNumber('N/A')).toBe('');
      expect(cleanPhoneNumber('na')).toBe('');
    });
  });

  describe('WhatsApp Link Generator (generatePrescriptionWhatsAppLink)', () => {
    const mockPatient = {
      id: 'PT-101',
      name: 'Ramesh Kumar',
      contact: '+91 98765-43210',
    };

    const mockPrescription = {
      date: '2026-11-09',
      diagnosis: 'Acute Gastritis & GERD',
      medicines: [
        {
          name: 'Pantoprazole 40mg',
          dosage: '40mg',
          frequency: '1-0-1',
          timing: 'Before Food',
          duration: '5 Days',
        },
        {
          name: 'Paracetamol 650mg',
          dosage: '650mg',
          frequency: '1-0-1',
          timing: 'After Food',
          duration: '3 Days',
        },
      ],
      advice: 'Avoid spicy food and drink plenty of water.',
      followUpDate: '2026-11-16',
    };

    const mockClinic = {
      clinicName: 'ClinicRx Medical Centre',
      doctorName: 'Dr. Aarav Sharma',
      phone: '9876543210',
    };

    it('generates valid https://wa.me/91<clean_phone> url', () => {
      const link = generatePrescriptionWhatsAppLink(mockPatient, mockPrescription, mockClinic);
      expect(link).toContain('https://wa.me/919876543210?text=');
    });

    it('contains patient name, diagnosis, medicines with dosage, advice, and follow-up in the encoded text', () => {
      const link = generatePrescriptionWhatsAppLink(mockPatient, mockPrescription, mockClinic);
      const url = new URL(link);
      const text = url.searchParams.get('text');

      expect(text).toContain('ClinicRx - Prescription Summary');
      expect(text).toContain('Ramesh Kumar');
      expect(text).toContain('Acute Gastritis & GERD');
      expect(text).toContain('Pantoprazole 40mg - 1-0-1 (Before Food) - 5 Days');
      expect(text).toContain('Paracetamol 650mg - 1-0-1 (After Food) - 3 Days');
      expect(text).toContain('Avoid spicy food and drink plenty of water.');
      expect(text).toContain('2026-11-16');
      expect(text).toContain('Dr. Aarav Sharma, ClinicRx Medical Centre');
    });

    it('handles prescription with patient contact from prescription object if patient is missing', () => {
      const link = generatePrescriptionWhatsAppLink(
        null,
        { ...mockPrescription, patientName: 'Anita Roy', patientMobile: '09876543210' },
        mockClinic
      );
      expect(link).toContain('https://wa.me/919876543210?text=');
      const url = new URL(link);
      const text = url.searchParams.get('text');
      expect(text).toContain('Anita Roy');
    });
  });

  describe('Follow-up Reminder WhatsApp Link (generateFollowUpReminderWhatsAppLink)', () => {
    it('generates polite follow-up reminder link with clinic and doctor info', () => {
      const patient = {
        name: 'Suresh Raina',
        contact: '98765 43210',
        nextFollowUp: '2026-11-12',
      };
      const clinic = {
        clinicName: 'Health First Clinic',
        doctorName: 'Dr. Priya Mehta',
        phone: '9123456780',
      };

      const link = generateFollowUpReminderWhatsAppLink(patient, clinic, 2);
      expect(link).toContain('https://wa.me/919876543210?text=');
      const url = new URL(link);
      const text = url.searchParams.get('text');
      expect(text).toContain('Suresh Raina');
      expect(text).toContain('Health First Clinic');
      expect(text).toContain('Dr. Priya Mehta');
      expect(text).toContain('in 2 days (2026-11-12)');
    });
  });

  describe('Prescription Visit Persistence & Patient Updates', () => {
    it('saves prescription to localVisits, assigns RX ID, and updates patient nextFollowUp and lastVisit', () => {
      // 1. Create a patient
      const patient = localPatients.add({
        id: 'PT-501',
        name: 'Vikas Gupta',
        contact: '9876543210',
        age: 45,
        gender: 'Male',
      });
      expect(patient.id).toBe('PT-501');
      expect(patient.nextFollowUp).toBeNull();

      // 2. Save prescription
      const visitData = {
        patientId: patient.id,
        patientName: patient.name,
        patientMobile: patient.contact,
        patientAge: patient.age,
        patientGender: patient.gender,
        date: '2026-11-09',
        vitals: {
          bloodPressure: '130/85',
          weight: '72',
          pulseRate: '78',
          spo2: '98',
          temperature: '98.6',
          bloodSugar: '110',
        },
        symptoms: 'Acid reflux and bloating after meals',
        diagnosis: 'Dyspepsia',
        medicines: [
          {
            name: 'Pantoprazole 40mg',
            dosage: '40mg',
            frequency: '1-0-0',
            timing: 'Before Food',
            duration: '7 Days',
          },
        ],
        advice: 'Avoid late night heavy dinners.',
        followUpDays: 14,
        followUpDate: '2026-11-23',
        status: 'PRINTED',
      };

      const savedVisit = localVisits.save(visitData);

      // Verify visit saved correctly
      expect(savedVisit.id).toMatch(/^RX-/);
      expect(savedVisit.patientId).toBe('PT-501');
      expect(savedVisit.patientName).toBe('Vikas Gupta');
      expect(savedVisit.vitals.bloodPressure).toBe('130/85');
      expect(savedVisit.vitals.temperature).toBe('98.6');
      expect(savedVisit.vitals.bloodSugar).toBe('110');
      expect(savedVisit.status).toBe('PRINTED');
      expect(savedVisit.followUpDate).toBe('2026-11-23');

      // Verify visit exists in localVisits.getAll()
      const allVisits = localVisits.getAll();
      expect(allVisits.length).toBe(1);
      expect(allVisits[0].id).toBe(savedVisit.id);

      // Verify patient record updated with lastVisit and nextFollowUp
      const updatedPatient = localPatients.getById('PT-501');
      expect(updatedPatient.lastVisit).toBeDefined();
      expect(updatedPatient.nextFollowUp).toBe('2026-11-23');

      // 3. Resaving the same prescription with same ID updates the visit without creating duplicate
      const reSaved = localVisits.save({
        ...savedVisit,
        diagnosis: 'Dyspepsia - Resolved',
      });
      expect(reSaved.id).toBe(savedVisit.id);
      expect(reSaved.diagnosis).toBe('Dyspepsia - Resolved');
      const allVisitsAfterUpdate = localVisits.getAll();
      expect(allVisitsAfterUpdate.length).toBe(1);
      expect(allVisitsAfterUpdate[0].diagnosis).toBe('Dyspepsia - Resolved');
    });
  });
});
