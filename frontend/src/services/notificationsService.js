/**
 * Notifications Service for ClinixPulse / Gastro Cure Clinic
 *
 * Aggregates real-time notifications from:
 * 1. Follow-up reminders due in 24–48 hours (or today/overdue)
 * 2. WhatsApp patient replies (Confirmed Yes / Reschedule No)
 * 3. Checked-in patients currently in the Waiting Queue
 * 4. Offline system and backup status
 */

import { localPatients, localAppointments, localVisits } from './localStore';
import { automatedRemindersService, calculateDaysDiff, formatDisplayDate } from './automatedRemindersService';

const STORAGE_KEY_READ_IDS = 'clinicrx_notifications_read_ids';
const STORAGE_KEY_DISMISSED_IDS = 'clinicrx_notifications_dismissed_ids';

export const notificationsService = {
  getReadIds: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_READ_IDS);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  getDismissedIds: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_DISMISSED_IDS);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  markAsRead: (id) => {
    try {
      const readIds = notificationsService.getReadIds();
      if (!readIds.includes(id)) {
        readIds.push(id);
        localStorage.setItem(STORAGE_KEY_READ_IDS, JSON.stringify(readIds));
      }
    } catch {}
  },

  markAllAsRead: () => {
    const all = notificationsService.getAll();
    const ids = all.map((n) => n.id);
    try {
      localStorage.setItem(STORAGE_KEY_READ_IDS, JSON.stringify(ids));
    } catch {}
  },

  dismiss: (id) => {
    try {
      const dismissed = notificationsService.getDismissedIds();
      if (!dismissed.includes(id)) {
        dismissed.push(id);
        localStorage.setItem(STORAGE_KEY_DISMISSED_IDS, JSON.stringify(dismissed));
      }
    } catch {}
  },

  clearAll: () => {
    const all = notificationsService.getAll();
    const ids = all.map((n) => n.id);
    try {
      localStorage.setItem(STORAGE_KEY_DISMISSED_IDS, JSON.stringify(ids));
    } catch {}
  },

  getAll: () => {
    const readIds = new Set(notificationsService.getReadIds());
    const dismissedIds = new Set(notificationsService.getDismissedIds());
    const list = [];

    // 1. Follow-Up Reminders Due (Today, Tomorrow, Overdue)
    try {
      const patients = localPatients.getAll() || [];
      patients.forEach((patient) => {
        if (!patient.nextFollowUp) return;
        const diff = calculateDaysDiff(patient.nextFollowUp);
        if (diff === null || diff > 2) return;

        const id = `notif-followup-${patient.id}-${patient.nextFollowUp}`;
        if (dismissedIds.has(id)) return;

        const timingLabel =
          diff < 0
            ? 'Overdue Follow-up'
            : diff === 0
            ? 'Follow-up Due Today'
            : diff === 1
            ? 'Follow-up Due Tomorrow'
            : `Follow-up in 2 Days`;

        list.push({
          id,
          category: 'FOLLOW_UP',
          type: diff <= 0 ? 'warning' : 'info',
          title: `${timingLabel}: ${patient.name}`,
          message: `Consultation scheduled for ${formatDisplayDate(patient.nextFollowUp)}. WhatsApp reminder ready for dispatch.`,
          timestamp: patient.lastVisit || new Date().toISOString(),
          read: readIds.has(id),
          actionUrl: '/dashboard',
          actionLabel: 'View Reminder',
        });
      });
    } catch {}

    // 2. WhatsApp Patient Responses (Yes/No incoming replies)
    try {
      const responses = automatedRemindersService.getResponses() || {};
      Object.values(responses).forEach((resp) => {
        const id = `notif-whatsapp-${resp.key}`;
        if (dismissedIds.has(id)) return;

        const isYes = resp.status === 'CONFIRMED';
        list.push({
          id,
          category: 'WHATSAPP',
          type: isYes ? 'success' : 'warning',
          title: isYes
            ? `WhatsApp Confirmed: ${resp.patientName}`
            : `WhatsApp Reschedule Request: ${resp.patientName}`,
          message: isYes
            ? `Patient tapped 'Yes'. Appointment confirmed for ${formatDisplayDate(resp.followUpDate)}.`
            : `Patient tapped 'No'. Follow-up rescheduled or callback requested.`,
          timestamp: resp.repliedAt || new Date().toISOString(),
          read: readIds.has(id),
          actionUrl: '/dashboard',
          actionLabel: 'Open Dashboard',
        });
      });
    } catch {}

    // 3. Waiting Queue Patients
    try {
      const queue = localAppointments.getQueue() || [];
      queue.forEach((patient, index) => {
        const id = `notif-queue-${patient.id}`;
        if (dismissedIds.has(id)) return;

        list.push({
          id,
          category: 'QUEUE',
          type: index === 0 ? 'success' : 'info',
          title: `Waiting Queue Token #${index + 1}: ${patient.patientName}`,
          message: `Checked in at ${patient.startTime || 'reception'} for: ${patient.reason || 'General consultation'}.`,
          timestamp: patient.createdAt || new Date().toISOString(),
          read: readIds.has(id),
          actionUrl: `/prescription/new?patientId=${encodeURIComponent(patient.patientId || patient.id)}`,
          actionLabel: 'Start Consultation',
        });
      });
    } catch {}

    // 4. System / Engine Status Notification
    const sysId = 'notif-system-local-engine';
    if (!dismissedIds.has(sysId)) {
      list.push({
        id: sysId,
        category: 'SYSTEM',
        type: 'info',
        title: 'Local Clinical Engine Active',
        message: 'All patient records, prescriptions, and formulary data are operating securely in offline mode.',
        timestamp: new Date().toISOString(),
        read: readIds.has(sysId),
        actionUrl: '/settings',
        actionLabel: 'View Settings',
      });
    }

    return list;
  },

  getUnreadCount: () => {
    const all = notificationsService.getAll();
    return all.filter((n) => !n.read).length;
  },
};
