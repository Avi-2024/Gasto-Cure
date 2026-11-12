import { describe, it, expect, beforeEach } from 'vitest';
import {
  automatedRemindersService,
  calculateDaysDiff,
  formatDisplayDate,
} from '../services/automatedRemindersService';
import { generateExactHindiFollowUpMessage } from '../utils/whatsappHelper';
import { localPatients } from '../services/localStore';

describe('Automated Follow-Up Reminders Service Tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('generates the exact requested Hindi/Hinglish template message', () => {
    const message = automatedRemindersService.generateReminderMessage(
      'Rajesh Kumar',
      '2026-11-14',
      { clinicName: 'Gastro Cure Clinic', doctorName: 'Dr. Snehal Makwana' }
    );

    expect(message).toBe(
      'Namaste Rajesh Kumar, Gastro Cure Clinic me Dr. Snehal Makwana ke saath aapka follow-up checkup Nov 14, 2026 ko scheduled hai. Kripya samay par padharein.'
    );
  });

  it('generateExactHindiFollowUpMessage helper formats accurately', () => {
    const text = generateExactHindiFollowUpMessage({
      patientName: 'Maya Verma',
      clinicName: 'Gastro Cure Clinic',
      doctorName: 'Dr. Snehal Makwana',
      followUpDate: 'Nov 15, 2026',
    });

    expect(text).toBe(
      'Namaste Maya Verma, Gastro Cure Clinic me Dr. Snehal Makwana ke saath aapka follow-up checkup Nov 15, 2026 ko scheduled hai. Kripya samay par padharein.'
    );
  });

  it('correctly identifies patients within the 24–48 hours (1 to 2 days) window', () => {
    // 1 day ahead (Tomorrow) -> in 24h
    const d1 = new Date();
    d1.setDate(d1.getDate() + 1);
    const dateTomorrow = d1.toISOString().slice(0, 10);

    // 2 days ahead -> in 48h
    const d2 = new Date();
    d2.setDate(d2.getDate() + 2);
    const dateIn2Days = d2.toISOString().slice(0, 10);

    // 7 days ahead -> outside 48h
    const d7 = new Date();
    d7.setDate(d7.getDate() + 7);
    const dateIn7Days = d7.toISOString().slice(0, 10);

    localPatients.add({
      id: 'PT-AUTO-1',
      name: 'Aarav Sharma',
      contact: '9876543210',
      nextFollowUp: dateTomorrow,
    });

    localPatients.add({
      id: 'PT-AUTO-2',
      name: 'Sunita Sen',
      contact: '9876543211',
      nextFollowUp: dateIn2Days,
    });

    localPatients.add({
      id: 'PT-AUTO-3',
      name: 'Far Future Patient',
      contact: '9876543212',
      nextFollowUp: dateIn7Days,
    });

    const { eligible, totalDue } = automatedRemindersService.getEligibleFollowUps();
    expect(totalDue).toBe(2);
    expect(eligible.length).toBe(2);
    expect(eligible.map((p) => p.patientId)).toContain('PT-AUTO-1');
    expect(eligible.map((p) => p.patientId)).toContain('PT-AUTO-2');
    expect(eligible.map((p) => p.patientId)).not.toContain('PT-AUTO-3');
  });

  it('dispatches automated reminder and updates history without duplicate sending', () => {
    const dTomorrow = new Date();
    dTomorrow.setDate(dTomorrow.getDate() + 1);
    const dateTomorrow = dTomorrow.toISOString().slice(0, 10);

    const patient = {
      patientId: 'PT-AUTO-1',
      name: 'Aarav Sharma',
      contact: '9876543210',
      followUpDate: dateTomorrow,
      daysLeft: 1,
    };

    const res = automatedRemindersService.sendAutomatedReminder(patient);
    expect(res.success).toBe(true);
    expect(res.message).toContain('Aarav Sharma');
    expect(res.message).toContain('Gastro Cure Clinic');
    expect(res.message).toContain('Dr. Snehal Makwana');
    expect(res.message).toContain('Kripya samay par padharein.');

    // Verify history recorded
    const history = automatedRemindersService.getHistory();
    expect(history.length).toBe(1);
    expect(history[0].patientId).toBe('PT-AUTO-1');
    expect(history[0].status).toBe('DELIVERED');

    // Verify deduplication: now marked as already sent
    expect(automatedRemindersService.isReminderSent('PT-AUTO-1', dateTomorrow)).toBe(true);
  });

  it('batch processAutomatedReminders dispatches all eligible follow-ups', () => {
    const dTomorrow = new Date();
    dTomorrow.setDate(dTomorrow.getDate() + 1);
    const dateTomorrow = dTomorrow.toISOString().slice(0, 10);

    localPatients.add({
      id: 'PT-BATCH-1',
      name: 'Patient One',
      contact: '9123456780',
      nextFollowUp: dateTomorrow,
    });

    localPatients.add({
      id: 'PT-BATCH-2',
      name: 'Patient Two',
      contact: '9123456781',
      nextFollowUp: dateTomorrow,
    });

    const result = automatedRemindersService.processAutomatedReminders();
    expect(result.processed).toBe(2);
    expect(result.results.length).toBe(2);

    // Re-running batch should process 0 duplicates
    const rerun = automatedRemindersService.processAutomatedReminders();
    expect(rerun.processed).toBe(0);
  });
});
