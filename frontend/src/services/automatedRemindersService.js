/**
 * Automated Follow-Up Reminders Service for Nivara / Gastro Cure Clinic
 *
 * Automatically monitors patient follow-up dates and dispatches WhatsApp
 * reminders when the appointment is within 24–48 hours (1 to 2 days ahead).
 *
 * Standard Template:
 * "Namaste [Patient], Gastro Cure Clinic me Dr. Snehal Makwana ke saath
 *  aapka follow-up checkup [Date] ko scheduled hai. Kripya samay par padharein."
 */

import { localPatients, localVisits, localSettings } from './localStore';
import { cleanPhoneNumber } from '../utils/whatsappHelper';

const STORAGE_KEY_CONFIG = 'clinicrx_auto_reminders_config';
const STORAGE_KEY_HISTORY = 'clinicrx_auto_reminders_history';
const STORAGE_KEY_REMINDED = 'clinicrx_reminded_followups';
const STORAGE_KEY_RESPONSES = 'clinicrx_followup_responses';

const DEFAULT_CONFIG = {
  enabled: true,
  clinicName: 'Gastro Cure Clinic',
  doctorName: 'Dr. Snehal Makwana',
  windowHoursMin: 24,
  windowHoursMax: 48,
  autoProcessOnLoad: true,
};

/**
 * Calculate calendar days difference between a target date and today.
 */
export const calculateDaysDiff = (dateStr) => {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr.includes('T') ? dateStr : `${dateStr}T00:00:00`);
  target.setHours(0, 0, 0, 0);
  if (isNaN(target.getTime())) return null;
  const diffMs = target.getTime() - today.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
};

export const formatDisplayDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr.includes('T') ? dateStr : `${dateStr}T00:00:00`);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

export const automatedRemindersService = {
  getConfig: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_CONFIG);
      const settings = localSettings.get();
      const clinicName =
        settings?.clinicName && !settings.clinicName.includes('ClinicRx')
          ? settings.clinicName
          : DEFAULT_CONFIG.clinicName;
      const doctorName =
        settings?.doctorName && !settings.doctorName.includes('Aarav')
          ? settings.doctorName
          : DEFAULT_CONFIG.doctorName;

      return {
        ...DEFAULT_CONFIG,
        clinicName,
        doctorName,
        ...(stored ? JSON.parse(stored) : {}),
      };
    } catch {
      return DEFAULT_CONFIG;
    }
  },

  updateConfig: (patch = {}) => {
    const current = automatedRemindersService.getConfig();
    const updated = { ...current, ...patch };
    try {
      localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(updated));
    } catch {}
    return updated;
  },

  getHistory: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_HISTORY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  isReminderSent: (patientId, followUpDate) => {
    if (!patientId || !followUpDate) return false;
    const history = automatedRemindersService.getHistory();
    const key = `${patientId}-${followUpDate}`;
    // Check if sent in the last 24 hours
    const todayStr = new Date().toISOString().slice(0, 10);
    return history.some((h) => h.key === key && h.sentAt?.startsWith(todayStr));
  },

  /**
   * Builds the English interactive confirmation reminder message with Tap 'Yes' / 'No'.
   * "Hi MR AVI TAMRAKAR,
   *  I would like to know if you would be coming for your follow up appointment Tomorrow, 14th Sep'26.
   *  * Tap 'Yes' to confirm.
   *  * Tap 'No' if you are not coming."
   */
  generateEnglishConfirmationMessage: (patientName, followUpDate, daysLeft = 1, options = {}) => {
    const prefix = String(options.gender || '').toLowerCase() === 'female' ? 'MS' : 'MR';
    const timing =
      daysLeft === 1
        ? 'Tomorrow'
        : daysLeft === 0
        ? 'Today'
        : `in ${daysLeft} days`;
    const formattedDate = formatDisplayDate(followUpDate);

    return `Hi ${prefix} ${patientName},

I would like to know if you would be coming for your follow up appointment ${timing}, ${formattedDate}.

* Tap 'Yes' to confirm.
* Tap 'No' if you are not coming.`;
  },

  /**
   * Retrieves all recorded patient replies (CONFIRMED / DECLINED).
   */
  getResponses: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_RESPONSES);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  },

  /**
   * Records a patient's reply ('YES' to confirm or 'NO' to decline/reschedule)
   * and generates the appropriate English automated response.
   */
  recordPatientResponse: (patientId, followUpDate, responseType = 'YES', options = {}) => {
    const key = `${patientId}-${followUpDate}`;
    const isYes = String(responseType).toUpperCase() === 'YES';
    const status = isYes ? 'CONFIRMED' : 'DECLINED';

    const patient = localPatients.getById(patientId);
    const patientName = patient?.name || options.name || 'Patient';
    const config = automatedRemindersService.getConfig();
    const clinicName = options.clinicName || config.clinicName || 'Gastro Cure Clinic';
    const doctorName = options.doctorName || config.doctorName || 'Dr. Snehal Makwana';

    const replyMessage = isYes
      ? `Thank you, ${patientName}! Your follow-up appointment is confirmed for ${formatDisplayDate(followUpDate)} with ${doctorName} at ${clinicName}. Please arrive 10 minutes prior to your slot. See you soon!`
      : `Understood, ${patientName}. If you would like to reschedule your consultation, please call ${clinicName} or reply here with your preferred date.`;

    const record = {
      key,
      patientId,
      patientName,
      followUpDate,
      response: isYes ? 'Yes' : 'No',
      status,
      replyMessage,
      repliedAt: new Date().toISOString(),
    };

    const all = automatedRemindersService.getResponses();
    all[key] = record;
    try {
      localStorage.setItem(STORAGE_KEY_RESPONSES, JSON.stringify(all));
    } catch {}

    // Also update history log if found
    try {
      const history = automatedRemindersService.getHistory();
      const entry = history.find((h) => h.key === key);
      if (entry) {
        entry.patientResponse = status;
        entry.autoReplySent = replyMessage;
        localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history));
      }
    } catch {}

    return record;
  },

  /**
   * Builds the exact Hindi/Hinglish reminder message requested by clinic doctors.
   */
  generateReminderMessage: (patientName, followUpDate, options = {}) => {
    const config = automatedRemindersService.getConfig();
    const clinicName = options.clinicName || config.clinicName || 'Gastro Cure Clinic';
    const doctorName = options.doctorName || config.doctorName || 'Dr. Snehal Makwana';
    const formattedDate = formatDisplayDate(followUpDate);

    return `Namaste ${patientName}, ${clinicName} me ${doctorName} ke saath aapka follow-up checkup ${formattedDate} ko scheduled hai. Kripya samay par padharein.`;
  },

  /**
   * Get all patients due for an automated reminder (within 24–48 hours, i.e. daysDiff 1 or 2, or today).
   */
  getEligibleFollowUps: () => {
    const patients = localPatients.getAll() || [];
    const eligible = [];
    const alreadySent = [];

    patients.forEach((patient) => {
      const fDate = patient.nextFollowUp;
      if (!fDate) return;
      const daysDiff = calculateDaysDiff(fDate);

      // 24–48 hours corresponds to daysDiff = 1 (tomorrow) or 2 (in 2 days)
      // We also include daysDiff = 0 (today) if not yet reminded
      if (daysDiff === null || daysDiff < 0 || daysDiff > 2) return;

      const key = `${patient.id}-${fDate}`;
      const hasSent = automatedRemindersService.isReminderSent(patient.id, fDate);

      const item = {
        key,
        patientId: patient.id,
        name: patient.name,
        contact: patient.contact || patient.mobile || '',
        followUpDate: fDate,
        daysLeft: daysDiff,
        isSent: hasSent,
      };

      if (hasSent) {
        alreadySent.push(item);
      } else {
        eligible.push(item);
      }
    });

    return {
      eligible,
      alreadySent,
      totalDue: eligible.length + alreadySent.length,
    };
  },

  /**
   * Send an automated reminder for a single patient record.
   */
  sendAutomatedReminder: (item, options = {}) => {
    if (!item?.patientId || !item?.followUpDate) {
      return { success: false, error: 'Invalid patient item' };
    }

    const message = options.useHindi
      ? automatedRemindersService.generateReminderMessage(item.name, item.followUpDate, options)
      : automatedRemindersService.generateEnglishConfirmationMessage(
          item.name,
          item.followUpDate,
          item.daysLeft,
          options
        );

    const key = `${item.patientId}-${item.followUpDate}`;
    const cleanPhone = cleanPhoneNumber(item.contact);
    const logEntry = {
      id: `REM-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      key,
      patientId: item.patientId,
      patientName: item.name,
      contact: cleanPhone,
      followUpDate: item.followUpDate,
      daysLeft: item.daysLeft,
      message,
      sentAt: new Date().toISOString(),
      channel: 'WHATSAPP_AUTOMATED',
      status: 'DELIVERED',
    };

    // 1. Update History
    try {
      const history = automatedRemindersService.getHistory();
      history.unshift(logEntry);
      // Keep last 100 entries
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history.slice(0, 100)));
    } catch {}

    // 2. Mark as reminded in widget storage
    try {
      const saved = localStorage.getItem(STORAGE_KEY_REMINDED);
      const list = saved ? JSON.parse(saved) : [];
      if (!list.includes(key)) {
        list.push(key);
        localStorage.setItem(STORAGE_KEY_REMINDED, JSON.stringify(list));
      }
    } catch {}

    return {
      success: true,
      logEntry,
      message,
    };
  },

  /**
   * Batch process all eligible reminders due in 24–48 hours.
   */
  processAutomatedReminders: () => {
    const config = automatedRemindersService.getConfig();
    if (!config.enabled) {
      return { processed: 0, skipped: 'Auto-reminders disabled in settings', results: [] };
    }

    const { eligible } = automatedRemindersService.getEligibleFollowUps();
    const results = [];

    eligible.forEach((item) => {
      const res = automatedRemindersService.sendAutomatedReminder(item);
      if (res.success) {
        results.push(res.logEntry);
      }
    });

    return {
      processed: results.length,
      results,
    };
  },
};
