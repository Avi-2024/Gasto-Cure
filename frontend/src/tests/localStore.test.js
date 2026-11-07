import { describe, it, expect, beforeEach } from 'vitest';
import {
  localPatients,
  localMedicines,
  localVisits,
  localSettings,
  dataBackup,
} from '../services/localStore';

// In-memory localStorage polyfill for node test environment
if (typeof globalThis.localStorage === 'undefined' || !globalThis.localStorage.getItem) {
  let store = {};
  globalThis.localStorage = {
    getItem: (key) => (Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null),
    setItem: (key, val) => {
      store[key] = String(val);
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
}

describe('localStore Data Service', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // =========================================================================
  // 1. localPatients
  // =========================================================================
  describe('localPatients', () => {
    it('seeds demo patients into empty storage and does not re-seed if patients exist', () => {
      localPatients.seed();
      const initial = localPatients.getAll();
      expect(initial.length).toBeGreaterThan(0);

      // Verify structure of seeded patient
      const first = initial[0];
      expect(first).toHaveProperty('id');
      expect(first).toHaveProperty('name');
      expect(first).toHaveProperty('contact');

      // Re-seeding should not duplicate
      localPatients.seed();
      expect(localPatients.getAll().length).toBe(initial.length);
    });

    it('adds a patient and generates an ID and timestamps', () => {
      const added = localPatients.add({
        name: 'Sunita Rao',
        age: 48,
        gender: 'Female',
        contact: '9812345678',
        address: 'Sector 14, Gurgaon',
        bloodGroup: 'B+',
        allergies: 'Penicillin',
      });

      expect(added.id).toMatch(/^PT-/);
      expect(added.name).toBe('Sunita Rao');
      expect(added.age).toBe(48);
      expect(added.gender).toBe('Female');
      expect(added.contact).toBe('9812345678');
      expect(added.mobile).toBe('9812345678');
      expect(added.status).toBe('Active');
      expect(added.createdAt).toBeDefined();

      const all = localPatients.getAll();
      expect(all.length).toBe(1);
      expect(all[0].id).toBe(added.id);
    });

    it('retrieves patient by ID with getById', () => {
      const patient = localPatients.add({
        name: 'Vikas Gupta',
        age: 35,
        contact: '9988776655',
      });

      const found = localPatients.getById(patient.id);
      expect(found).not.toBeNull();
      expect(found.name).toBe('Vikas Gupta');

      const notFound = localPatients.getById('non-existent-id');
      expect(notFound).toBeNull();
    });

    it('updates patient details preserving other attributes', () => {
      const patient = localPatients.add({
        name: 'Anita Roy',
        age: 29,
        contact: '9123456780',
        address: 'Kolkata',
      });

      const updated = localPatients.update(patient.id, {
        name: 'Anita Roy Banerjee',
        address: 'Salt Lake, Kolkata',
        allergies: 'Dust',
      });

      expect(updated).not.toBeNull();
      expect(updated.name).toBe('Anita Roy Banerjee');
      expect(updated.address).toBe('Salt Lake, Kolkata');
      expect(updated.allergies).toBe('Dust');
      expect(updated.contact).toBe('9123456780'); // Preserved
      expect(updated.age).toBe(29); // Preserved

      const fetched = localPatients.getById(patient.id);
      expect(fetched.name).toBe('Anita Roy Banerjee');

      const nonExistent = localPatients.update('missing-id', { name: 'Nobody' });
      expect(nonExistent).toBeNull();
    });

    it('deletes a patient by ID', () => {
      const patient = localPatients.add({ name: 'Temp Patient', contact: '9000000000' });
      expect(localPatients.getAll().length).toBe(1);

      const deleted = localPatients.delete(patient.id);
      expect(deleted).toBe(true);
      expect(localPatients.getAll().length).toBe(0);

      const deleteAgain = localPatients.delete(patient.id);
      expect(deleteAgain).toBe(false);
    });

    it('searches patients by name, mobile, and patient ID', () => {
      const p1 = localPatients.add({ id: 'PT-1001', name: 'Rajesh Kumar', contact: '9876543210' });
      const p2 = localPatients.add({ id: 'PT-1002', name: 'Priya Sharma', contact: '9811223344' });
      const p3 = localPatients.add({ id: 'PT-1003', name: 'Rajeshwari Patel', contact: '9998887777' });

      // Search by partial name (case-insensitive)
      const nameResults = localPatients.search('rajesh');
      expect(nameResults.length).toBe(2);
      expect(nameResults.map((p) => p.name)).toContain('Rajesh Kumar');
      expect(nameResults.map((p) => p.name)).toContain('Rajeshwari Patel');

      // Search by mobile
      const phoneResults = localPatients.search('112233');
      expect(phoneResults.length).toBe(1);
      expect(phoneResults[0].id).toBe(p2.id);

      // Search by ID
      const idResults = localPatients.search('1003');
      expect(idResults.length).toBe(1);
      expect(idResults[0].id).toBe(p3.id);

      // Empty query returns all patients
      expect(localPatients.search('').length).toBe(3);
      expect(localPatients.search(null).length).toBe(3);

      // No match
      expect(localPatients.search('nonexistent').length).toBe(0);
    });
  });

  // =========================================================================
  // 2. localMedicines
  // =========================================================================
  describe('localMedicines', () => {
    it('seeds at least 35 common Indian clinic medicines with essential fields', () => {
      localMedicines.seed();
      const medicines = localMedicines.getAll();
      expect(medicines.length).toBeGreaterThanOrEqual(35);

      const requiredMeds = [
        'Pantoprazole',
        'Paracetamol',
        'Amoxicillin',
        'Rabeprazole',
        'Cefixime',
        'Ondansetron',
        'Domperidone',
        'Azithromycin',
        'Metformin',
        'Telmisartan',
      ];

      for (const medName of requiredMeds) {
        const found = medicines.some((m) =>
          m.name.toLowerCase().includes(medName.toLowerCase())
        );
        expect(found, `Expected master catalog to contain ${medName}`).toBe(true);
      }

      // Check formulation properties
      const panto = medicines.find((m) => m.name.toLowerCase().includes('pantoprazole'));
      expect(panto).toHaveProperty('id');
      expect(panto).toHaveProperty('form');
      expect(panto).toHaveProperty('defaultDosage');
      expect(panto).toHaveProperty('defaultTiming');
      expect(panto).toHaveProperty('defaultDuration');
      expect(panto.isActive).toBe(true);

      // Does not duplicate on re-seed
      const count = medicines.length;
      localMedicines.seed();
      expect(localMedicines.getAll().length).toBe(count);
    });

    it('searches medicines by name and form/strength', () => {
      localMedicines.seed();

      const pantoResults = localMedicines.search('panto');
      expect(pantoResults.length).toBeGreaterThan(0);
      expect(pantoResults[0].name.toLowerCase()).toContain('panto');

      const paraResults = localMedicines.search('paracetamol');
      expect(paraResults.length).toBeGreaterThan(0);

      // Empty query returns all
      expect(localMedicines.search('').length).toBe(localMedicines.getAll().length);

      // Non-matching query
      expect(localMedicines.search('xyzunknownmedicine123').length).toBe(0);
    });

    it('supports CRUD operations on medicines catalog', () => {
      const added = localMedicines.add({
        name: 'Custom Med 100mg',
        form: 'Capsule',
        defaultDosage: '1-0-1',
        defaultTiming: 'After Food',
        defaultDuration: '10 Days',
        defaultInstruction: 'Drink with water',
      });

      expect(added.id).toMatch(/^MED-/);
      expect(added.name).toBe('Custom Med 100mg');
      expect(added.isActive).toBe(true);

      // Update
      const updated = localMedicines.update(added.id, {
        defaultDosage: '0-0-1',
        isActive: false,
      });
      expect(updated.defaultDosage).toBe('0-0-1');
      expect(updated.isActive).toBe(false);

      // Delete
      const deleted = localMedicines.delete(added.id);
      expect(deleted).toBe(true);
      expect(localMedicines.getAll().some((m) => m.id === added.id)).toBe(false);
    });
  });

  // =========================================================================
  // 3. localVisits
  // =========================================================================
  describe('localVisits', () => {
    it('saves a visit, generates RX-YYYYMMDD-XXXX prescription ID, and updates patient follow-up', () => {
      const patient = localPatients.add({
        id: 'PT-2001',
        name: 'Deepak Verma',
        age: 40,
        contact: '9876501234',
      });

      const today = new Date().toISOString().split('T')[0];
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      const nextWeekStr = nextWeek.toISOString().split('T')[0];

      const visit = localVisits.save({
        patientId: patient.id,
        patientName: patient.name,
        patientAge: patient.age,
        diagnosis: 'Acute Gastritis',
        symptoms: 'Heartburn, epigastric pain',
        vitals: { bp: '120/80', pulse: '76', temp: '98.4' },
        medicines: [
          {
            name: 'Pantoprazole 40mg',
            dosage: '1-0-0',
            timing: 'Before Food',
            duration: '7 Days',
            remarks: 'Take empty stomach',
          },
        ],
        tests: ['Upper GI Endoscopy'],
        advice: 'Avoid spicy and oily food',
        followUpDays: 7,
        followUpDate: nextWeekStr,
      });

      // Prescription ID format: RX-YYYYMMDD-XXXX
      const datePart = today.replace(/-/g, '');
      const expectedPrefix = new RegExp(`^RX-${datePart}-[A-Za-z0-9]{4,}$`);
      expect(visit.id).toMatch(expectedPrefix);
      expect(visit.patientId).toBe(patient.id);
      expect(visit.diagnosis).toBe('Acute Gastritis');
      expect(visit.medicines.length).toBe(1);
      expect(visit.medicines[0].name).toBe('Pantoprazole 40mg');

      // Check linked patient was updated with lastVisit and nextFollowUp
      const updatedPatient = localPatients.getById(patient.id);
      expect(updatedPatient.lastVisit).toBe(today);
      expect(updatedPatient.nextFollowUp).toBe(nextWeekStr);
    });

    it('calculates followUpDate from followUpDays when followUpDate is omitted', () => {
      const patient = localPatients.add({ name: 'Sanjay Mehra' });
      const visit = localVisits.save({
        patientId: patient.id,
        diagnosis: 'GERD',
        followUpDays: 14,
      });

      expect(visit.followUpDate).toBeDefined();
      const updatedPatient = localPatients.getById(patient.id);
      expect(updatedPatient.nextFollowUp).toBe(visit.followUpDate);
    });

    it('retrieves visits by patient and by ID', () => {
      const p1 = localPatients.add({ name: 'Patient One' });
      const p2 = localPatients.add({ name: 'Patient Two' });

      const v1 = localVisits.save({ patientId: p1.id, diagnosis: 'Diagnosis 1' });
      const v2 = localVisits.save({ patientId: p1.id, diagnosis: 'Diagnosis 2' });
      const v3 = localVisits.save({ patientId: p2.id, diagnosis: 'Diagnosis 3' });

      const p1Visits = localVisits.getByPatient(p1.id);
      expect(p1Visits.length).toBe(2);
      expect(p1Visits.map((v) => v.id)).toContain(v1.id);
      expect(p1Visits.map((v) => v.id)).toContain(v2.id);

      const single = localVisits.getById(v3.id);
      expect(single).not.toBeNull();
      expect(single.diagnosis).toBe('Diagnosis 3');

      expect(localVisits.getById('non-existent')).toBeNull();
    });

    it('correctly filters upcoming follow-ups occurring today, tomorrow, or overdue', () => {
      const p = localPatients.add({ name: 'Follow-up Test Patient' });

      const now = new Date();
      const formatDate = (d) => d.toISOString().split('T')[0];

      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);

      const today = new Date(now);

      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);

      const nextWeek = new Date(now);
      nextWeek.setDate(now.getDate() + 7);

      // Overdue visit
      const overdueVisit = localVisits.save({
        patientId: p.id,
        diagnosis: 'Overdue Follow-up',
        followUpDate: formatDate(yesterday),
      });

      // Today visit
      const todayVisit = localVisits.save({
        patientId: p.id,
        diagnosis: 'Today Follow-up',
        followUpDate: formatDate(today),
      });

      // Tomorrow visit
      const tomorrowVisit = localVisits.save({
        patientId: p.id,
        diagnosis: 'Tomorrow Follow-up',
        followUpDate: formatDate(tomorrow),
      });

      // Distant future visit (7 days ahead)
      const distantVisit = localVisits.save({
        patientId: p.id,
        diagnosis: 'Distant Follow-up',
        followUpDate: formatDate(nextWeek),
      });

      // Query upcoming follow-ups with default 2 days ahead
      const upcoming = localVisits.getUpcomingFollowUps(2);
      const upcomingIds = upcoming.map((v) => v.id);

      expect(upcomingIds).toContain(overdueVisit.id);
      expect(upcomingIds).toContain(todayVisit.id);
      expect(upcomingIds).toContain(tomorrowVisit.id);
      expect(upcomingIds).not.toContain(distantVisit.id);
    });
  });

  // =========================================================================
  // 4. localSettings
  // =========================================================================
  describe('localSettings', () => {
    it('returns default clinic and print settings when not previously configured', () => {
      const settings = localSettings.get();
      expect(settings).toHaveProperty('clinicName');
      expect(settings).toHaveProperty('doctorName');
      expect(settings.print).toHaveProperty('padMode', true);
      expect(settings.print).toHaveProperty('topOffsetMm', 60);
      expect(settings.print).toHaveProperty('paperSize', 'A4');
    });

    it('persists updated clinic and print configuration across get() calls', () => {
      const updated = localSettings.update({
        clinicName: 'Apollo Gastro Clinic',
        doctorName: 'Dr. Vikram Malhotra',
        print: {
          topOffsetMm: 75,
          padMode: false,
        },
      });

      expect(updated.clinicName).toBe('Apollo Gastro Clinic');
      expect(updated.print.topOffsetMm).toBe(75);
      expect(updated.print.padMode).toBe(false);

      // Verify persistent on subsequent get()
      const reloaded = localSettings.get();
      expect(reloaded.clinicName).toBe('Apollo Gastro Clinic');
      expect(reloaded.print.topOffsetMm).toBe(75);
      expect(reloaded.print.padMode).toBe(false);
      expect(reloaded.print.paperSize).toBe('A4'); // Default preserved
    });
  });

  // =========================================================================
  // 5. dataBackup
  // =========================================================================
  describe('dataBackup', () => {
    it('exports all collections as JSON string and restores from exported JSON', () => {
      localPatients.add({ name: 'Export Patient', contact: '9999999999' });
      localMedicines.seed();
      localSettings.update({ clinicName: 'Exported Hospital' });

      const exportedJson = dataBackup.exportJson();
      expect(typeof exportedJson).toBe('string');
      const parsed = JSON.parse(exportedJson);
      expect(parsed).toHaveProperty('patients');
      expect(parsed).toHaveProperty('medicines');
      expect(parsed).toHaveProperty('settings');
      expect(parsed.patients.length).toBe(1);
      expect(parsed.settings.clinicName).toBe('Exported Hospital');

      // Clear storage to simulate fresh device
      localStorage.clear();
      expect(localPatients.getAll().length).toBe(0);

      // Restore
      const result = dataBackup.importJson(exportedJson);
      expect(result.success).toBe(true);
      expect(localPatients.getAll().length).toBe(1);
      expect(localPatients.getAll()[0].name).toBe('Export Patient');
      expect(localSettings.get().clinicName).toBe('Exported Hospital');
    });

    it('gracefully handles invalid JSON in importJson', () => {
      const result = dataBackup.importJson('{ invalid: json');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
