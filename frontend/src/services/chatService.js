/**
 * WhatsApp Business & Patient Chat Service for ClinixPulse / Gastro Cure Clinic
 *
 * Manages two-way messaging threads between Clinic and Patients:
 * - Logs automated 24-48h reminders & interactive quick-replies
 * - Supports sending custom manual messages to any patient
 * - Simulates incoming patient messages & automated conversational replies
 * - Persists conversation threads in localStorage
 */

import { localPatients, localSettings } from './localStore';
import { cleanPhoneNumber } from '../utils/whatsappHelper';
import { automatedRemindersService } from './automatedRemindersService';

const STORAGE_KEY_CHATS = 'clinicrx_patient_chats';

export const chatService = {
  getRawChats: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_CHATS);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  },

  saveRawChats: (chats) => {
    try {
      localStorage.setItem(STORAGE_KEY_CHATS, JSON.stringify(chats));
    } catch {}
  },

  /**
   * Seed friendly initial sample conversations if chat store is fresh.
   */
  seedInitialChatsIfEmpty: () => {
    const raw = chatService.getRawChats();
    if (Object.keys(raw).length > 0) return raw;

    const patients = localPatients.getAll() || [];
    const avi = patients.find((p) => p.name?.toLowerCase().includes('avi')) || patients[0];
    const maya = patients.find((p) => p.name?.toLowerCase().includes('maya')) || patients[1];

    const seeded = {};

    if (avi) {
      seeded[avi.id] = [
        {
          id: 'msg-avi-1',
          patientId: avi.id,
          sender: 'CLINIC',
          senderName: 'Gastro Cure Clinic',
          text: `Hi MR ${avi.name},\n\nI would like to know if you would be coming for your follow up appointment Tomorrow, Nov 14, 2026.\n\n* Tap 'Yes' to confirm.\n* Tap 'No' if you are not coming.`,
          timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
          type: 'AUTO_REMINDER',
          status: 'DELIVERED',
        },
        {
          id: 'msg-avi-2',
          patientId: avi.id,
          sender: 'PATIENT',
          senderName: avi.name,
          text: 'Yes, I will be attending the clinic at 11 AM.',
          timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
          type: 'PATIENT_REPLY',
          status: 'RECEIVED',
        },
        {
          id: 'msg-avi-3',
          patientId: avi.id,
          sender: 'CLINIC',
          senderName: 'Gastro Cure Clinic',
          text: `Thank you, ${avi.name}! Your follow-up appointment is confirmed for Nov 14, 2026 with Dr. Snehal Makwana at Gastro Cure Clinic. Please arrive 10 minutes prior to your slot. See you soon!`,
          timestamp: new Date(Date.now() - 3600000 * 2.9).toISOString(),
          type: 'AUTO_REPLY',
          status: 'DELIVERED',
        },
      ];
    }

    if (maya) {
      seeded[maya.id] = [
        {
          id: 'msg-maya-1',
          patientId: maya.id,
          sender: 'CLINIC',
          senderName: 'Gastro Cure Clinic',
          text: `Hi MS ${maya.name},\n\nI would like to know if you would be coming for your follow up appointment Tomorrow, Nov 13, 2026.\n\n* Tap 'Yes' to confirm.\n* Tap 'No' if you are not coming.`,
          timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
          type: 'AUTO_REMINDER',
          status: 'DELIVERED',
        },
        {
          id: 'msg-maya-2',
          patientId: maya.id,
          sender: 'PATIENT',
          senderName: maya.name,
          text: 'Yes',
          timestamp: new Date(Date.now() - 3600000 * 1.5).toISOString(),
          type: 'PATIENT_REPLY',
          status: 'RECEIVED',
        },
        {
          id: 'msg-maya-3',
          patientId: maya.id,
          sender: 'CLINIC',
          senderName: 'Gastro Cure Clinic',
          text: `Thank you, ${maya.name}! Your follow-up appointment is confirmed for Nov 13, 2026 with Dr. Snehal Makwana at Gastro Cure Clinic. Please arrive 10 minutes prior to your slot. See you soon!`,
          timestamp: new Date(Date.now() - 3600000 * 1.4).toISOString(),
          type: 'AUTO_REPLY',
          status: 'DELIVERED',
        },
      ];
    }

    const vikram = patients.find((p) => p.name?.toLowerCase().includes('vikram'));
    if (vikram) {
      seeded[vikram.id] = [
        {
          id: 'msg-vikram-1',
          patientId: vikram.id,
          sender: 'CLINIC',
          senderName: 'Gastro Cure Clinic',
          text: `Hello Mr. Vikram Patel, please remember to take your Pantoprazole 40mg before breakfast for your GERD symptoms.`,
          timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
          type: 'MANUAL',
          status: 'DELIVERED',
        },
        {
          id: 'msg-vikram-2',
          patientId: vikram.id,
          sender: 'PATIENT',
          senderName: vikram.name,
          text: 'Understood, thank you Doctor. Acidity is much better today.',
          timestamp: new Date(Date.now() - 3600000 * 4.5).toISOString(),
          type: 'PATIENT_REPLY',
          status: 'RECEIVED',
        },
      ];
    }

    const priya = patients.find((p) => p.name?.toLowerCase().includes('priya'));
    if (priya) {
      seeded[priya.id] = [
        {
          id: 'msg-priya-1',
          patientId: priya.id,
          sender: 'CLINIC',
          senderName: 'Gastro Cure Clinic',
          text: `Hi Ms. Priya Deshmukh, your liver function test (LFT) reports have been reviewed by Dr. Snehal Makwana. Everything is within normal limits.`,
          timestamp: new Date(Date.now() - 3600000 * 8).toISOString(),
          type: 'MANUAL',
          status: 'DELIVERED',
        },
      ];
    }

    chatService.saveRawChats(seeded);
    return seeded;
  },

  /**
   * Returns list of patient conversations with preview info and last activity.
   */
  getConversations: () => {
    chatService.seedInitialChatsIfEmpty();
    const chats = chatService.getRawChats();
    const allPatients = localPatients.getAll() || [];
    const conversations = [];

    allPatients.forEach((patient) => {
      const thread = chats[patient.id] || [];
      const lastMsg = thread.length > 0 ? thread[thread.length - 1] : null;

      conversations.push({
        patientId: patient.id,
        patientName: patient.name,
        contact: patient.contact || patient.mobile || '',
        gender: patient.gender,
        age: patient.age,
        bloodGroup: patient.bloodGroup,
        nextFollowUp: patient.nextFollowUp,
        lastMessage: lastMsg?.text || 'No messages yet. Tap to start chat.',
        lastSender: lastMsg?.sender || null,
        lastTimestamp: lastMsg?.timestamp || patient.createdAt || new Date().toISOString(),
        unread: lastMsg?.sender === 'PATIENT',
        totalMessages: thread.length,
      });
    });

    // Sort by recent activity
    conversations.sort((a, b) => new Date(b.lastTimestamp) - new Date(a.lastTimestamp));
    return conversations;
  },

  /**
   * Get all messages in a conversation thread for a patient.
   */
  getThread: (patientId) => {
    chatService.seedInitialChatsIfEmpty();
    const chats = chatService.getRawChats();
    return chats[patientId] || [];
  },

  /**
   * Send a manual custom message from the Clinic to the Patient.
   */
  sendMessage: (patientId, text, options = {}) => {
    if (!patientId || !text.trim()) return null;

    const patient = localPatients.getById(patientId);
    const settings = localSettings.get();
    const senderName = options.senderName || settings?.clinicName || 'Gastro Cure Clinic';

    const newMsg = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      patientId,
      sender: 'CLINIC',
      senderName,
      text: text.trim(),
      timestamp: new Date().toISOString(),
      type: 'MANUAL',
      status: 'SENT',
    };

    const chats = chatService.getRawChats();
    if (!chats[patientId]) chats[patientId] = [];
    chats[patientId].push(newMsg);
    chatService.saveRawChats(chats);

    // Build WhatsApp wa.me link
    const rawPhone = patient?.contact || patient?.mobile || '';
    const cleanPhone = cleanPhoneNumber(rawPhone);
    const waPhone = cleanPhone
      ? (cleanPhone.length === 10 ? `91${cleanPhone}` : (cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`))
      : '';
    const waUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(text.trim())}`;

    return { message: newMsg, waUrl };
  },

  /**
   * Simulate or record an incoming message from a Patient.
   * If the patient types 'Yes' or 'No', automatically triggers clinical follow-up handling.
   */
  receivePatientMessage: (patientId, text) => {
    if (!patientId || !text.trim()) return null;

    const patient = localPatients.getById(patientId);
    const patientName = patient?.name || 'Patient';

    const incomingMsg = {
      id: `msg-in-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      patientId,
      sender: 'PATIENT',
      senderName: patientName,
      text: text.trim(),
      timestamp: new Date().toISOString(),
      type: 'PATIENT_REPLY',
      status: 'RECEIVED',
    };

    const chats = chatService.getRawChats();
    if (!chats[patientId]) chats[patientId] = [];
    chats[patientId].push(incomingMsg);

    // Auto-respond to 'Yes' or 'No' quick-reply triggers
    const trimmed = text.trim().toLowerCase();
    let autoReply = null;

    if (trimmed === 'yes' || trimmed === 'y' || trimmed.startsWith('yes,')) {
      if (patient?.nextFollowUp) {
        automatedRemindersService.recordPatientResponse(patient.id, patient.nextFollowUp, 'YES');
      }
      autoReply = {
        id: `msg-auto-${Date.now()}`,
        patientId,
        sender: 'CLINIC',
        senderName: 'Gastro Cure Clinic',
        text: `Thank you, ${patientName}! Your follow-up appointment is confirmed with Dr. Snehal Makwana at Gastro Cure Clinic. Please arrive 10 minutes prior to your slot. See you soon!`,
        timestamp: new Date(Date.now() + 1000).toISOString(),
        type: 'AUTO_REPLY',
        status: 'DELIVERED',
      };
      chats[patientId].push(autoReply);
    } else if (trimmed === 'no' || trimmed === 'n' || trimmed.startsWith('no,')) {
      if (patient?.nextFollowUp) {
        automatedRemindersService.recordPatientResponse(patient.id, patient.nextFollowUp, 'NO');
      }
      autoReply = {
        id: `msg-auto-${Date.now()}`,
        patientId,
        sender: 'CLINIC',
        senderName: 'Gastro Cure Clinic',
        text: `Understood, ${patientName}. If you would like to reschedule your consultation, please call Gastro Cure Clinic at 9876543210 or reply here with your preferred date.`,
        timestamp: new Date(Date.now() + 1000).toISOString(),
        type: 'AUTO_REPLY',
        status: 'DELIVERED',
      };
      chats[patientId].push(autoReply);
    }

    chatService.saveRawChats(chats);
    return { incoming: incomingMsg, autoReply };
  },
};
