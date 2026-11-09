/**
 * WhatsApp Helper Utilities for ClinicRx
 *
 * Provides sanitization for Indian and international phone numbers and generates
 * direct WhatsApp Web/App deep links (wa.me) for prescriptions and follow-up reminders.
 */

/**
 * Clean and format raw phone strings.
 * Strips spaces, dashes, parentheses, dots, and prefixes (+91, 91, or leading 0).
 * Returns clean 10-digit Indian mobile or cleaned number string.
 *
 * @param {string|number} phone - Raw input phone number
 * @returns {string} Sanitized phone digits without country prefix
 */
export const cleanPhoneNumber = (phone) => {
  if (!phone) return '';
  let cleaned = String(phone).trim().replace(/[\s\-\(\)\.]+/g, '');

  if (cleaned.startsWith('+')) {
    cleaned = cleaned.slice(1);
  }

  // If 12 digits starting with 91 (e.g. 919876543210)
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    cleaned = cleaned.slice(2);
  }

  // If 11 digits starting with 0 (e.g. 09876543210)
  if (cleaned.length === 11 && cleaned.startsWith('0')) {
    cleaned = cleaned.slice(1);
  }

  return cleaned;
};

/**
 * Format a medicine line for WhatsApp message.
 * Formats: "1. Pantoprazole 40mg - 1-0-1 (Before Food) - 5 Days"
 *
 * @param {Object} med - Medicine object
 * @param {number} index - 1-based index
 * @returns {string} Formatted medicine line
 */
export const formatMedicineLine = (med, index) => {
  if (!med) return '';

  const name = (med.name || '').trim();
  const dosage = (med.dosage || '').trim();
  const frequency = (med.frequency || '').trim();
  const timing = (med.timing || '').trim();
  const duration = (med.duration || '').trim();
  const remarks = (med.remarks || med.instructions || '').trim();

  // Combine title nicely avoiding duplicated strength in name
  let title = name;
  if (dosage && !name.toLowerCase().includes(dosage.toLowerCase())) {
    title = `${name} ${dosage}`;
  }
  if (!title) title = 'Medicine';

  const parts = [];
  if (frequency && timing) {
    parts.push(`${frequency} (${timing})`);
  } else if (frequency) {
    parts.push(frequency);
  } else if (timing) {
    parts.push(`(${timing})`);
  }

  if (duration) {
    parts.push(duration.replace(/^- /, ''));
  }

  if (remarks && remarks !== timing) {
    parts.push(`[${remarks}]`);
  }

  const suffix = parts.length > 0 ? ` - ${parts.join(' - ')}` : '';
  return `${index}. ${title}${suffix}`;
};

/**
 * Generate a WhatsApp deep link containing a full prescription summary.
 *
 * @param {Object} patient - Patient record
 * @param {Object} prescription - Prescription record (diagnosis, medicines, advice, followUpDate, etc.)
 * @param {Object} clinic - Clinic settings (clinicName, doctorName, phone)
 * @returns {string} wa.me URL
 */
export const generatePrescriptionWhatsAppLink = (patient = {}, prescription = {}, clinic = {}) => {
  const rawPhone =
    patient?.contact ||
    patient?.mobile ||
    patient?.phone ||
    prescription?.patientMobile ||
    prescription?.patientContact ||
    '';

  const cleanPhone = cleanPhoneNumber(rawPhone);
  const waPhone = cleanPhone
    ? (cleanPhone.length === 10 ? `91${cleanPhone}` : (cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`))
    : '';

  const patientName = patient?.name || prescription?.patientName || 'Patient';
  const rawDate = prescription?.date || new Date().toISOString();
  const dateFormatted = rawDate.includes('T') ? rawDate.split('T')[0] : rawDate;
  const diagnosis = prescription?.diagnosis || 'General Consultation';
  const advice = prescription?.advice || prescription?.notes || '';
  const followUpDate = prescription?.followUpDate || prescription?.nextFollowUp || '';

  const doctorName = clinic?.doctorName || 'Dr. Aarav Sharma';
  const clinicName = clinic?.clinicName || 'ClinicRx Medical Centre';

  const medicines = Array.isArray(prescription?.medicines) ? prescription.medicines : [];
  const validMedicines = medicines.filter((m) => m && (m.name || m.dosage));

  let medicinesText = 'No medicines prescribed';
  if (validMedicines.length > 0) {
    medicinesText = validMedicines.map((med, idx) => formatMedicineLine(med, idx + 1)).join('\n');
  }

  const lines = [
    `*ClinicRx - Prescription Summary*`,
    `Patient: ${patientName} | Date: ${dateFormatted}`,
    `Diagnosis: ${diagnosis}`,
    ``,
    `*Medicines (Rx):*`,
    medicinesText,
    ``,
  ];

  if (advice) {
    lines.push(`*Advice:* ${advice}`);
  }

  if (followUpDate) {
    lines.push(`*Next Follow-up:* ${followUpDate}`);
  }

  lines.push(``);

  const docPrefix = doctorName.startsWith('Dr.') || doctorName.startsWith('Dr ') ? '' : 'Dr. ';
  lines.push(`${docPrefix}${doctorName}, ${clinicName}`);

  const message = lines.join('\n');
  return `https://wa.me/${waPhone}?text=${encodeURIComponent(message)}`;
};

/**
 * Generate a follow-up reminder WhatsApp link for a patient.
 *
 * @param {Object} patient - Patient record with contact and nextFollowUp
 * @param {Object} clinic - Clinic settings
 * @param {number} daysLeft - Days remaining until follow-up
 * @returns {string} wa.me URL
 */
export const generateFollowUpReminderWhatsAppLink = (patient = {}, clinic = {}, daysLeft = null) => {
  const rawPhone = patient?.contact || patient?.mobile || patient?.phone || '';
  const cleanPhone = cleanPhoneNumber(rawPhone);
  const waPhone = cleanPhone
    ? (cleanPhone.length === 10 ? `91${cleanPhone}` : (cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`))
    : '';

  const patientName = patient?.name || 'Patient';
  const clinicName = clinic?.clinicName || 'ClinicRx Medical Centre';
  const doctorName = clinic?.doctorName || 'Dr. Aarav Sharma';
  const followUpDate = patient?.nextFollowUp || '';

  let timingDescription = 'soon';
  if (daysLeft === 0) {
    timingDescription = 'today';
  } else if (daysLeft === 1) {
    timingDescription = 'tomorrow';
  } else if (typeof daysLeft === 'number' && daysLeft > 1) {
    timingDescription = `in ${daysLeft} days (${followUpDate || 'scheduled'})`;
  } else if (followUpDate) {
    timingDescription = `on ${followUpDate}`;
  }

  const docPrefix = doctorName.startsWith('Dr.') || doctorName.startsWith('Dr ') ? '' : 'Dr. ';

  const lines = [
    `*ClinicRx - Follow-Up Appointment Reminder*`,
    `Dear ${patientName},`,
    ``,
    `This is a friendly reminder from *${clinicName}* that your follow-up consultation with *${docPrefix}${doctorName}* is scheduled ${timingDescription}.`,
    ``,
    clinic?.phone ? `Please contact us at ${clinic.phone} if you need to reschedule.` : `Please reach out to the clinic if you need to reschedule.`,
    ``,
    `Wishing you good health!`,
    `${clinicName}`,
  ];

  const message = lines.join('\n');
  return `https://wa.me/${waPhone}?text=${encodeURIComponent(message)}`;
};
