import React, { useEffect, useState, useMemo } from 'react';
import {
  CalendarClock,
  MessageCircle,
  CheckCircle2,
  Phone,
  Clock,
  Stethoscope,
} from 'lucide-react';
import { localPatients, localVisits, localSettings } from '../../../services/localStore';
import { generateFollowUpReminderWhatsAppLink } from '../../../utils/whatsappHelper';

/**
 * Calculate difference in whole calendar days between target date and today.
 * < 0 : Overdue
 * = 0 : Today
 * = 1 : Tomorrow
 * = 2 : In 2 Days
 */
const calculateDaysDiff = (dateStr) => {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr.includes('T') ? dateStr : `${dateStr}T00:00:00`);
  target.setHours(0, 0, 0, 0);
  if (isNaN(target.getTime())) return null;
  const diffMs = target.getTime() - today.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
};

const formatDisplayDate = (dateStr) => {
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

export default function FollowUpRemindersWidget() {
  const [remindedIds, setRemindedIds] = useState(() => {
    try {
      const saved = localStorage.getItem('clinicrx_reminded_followups');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [followUps, setFollowUps] = useState([]);
  const clinic = useMemo(() => localSettings.get(), []);

  useEffect(() => {
    const patients = localPatients.getAll();
    const upcomingVisits = localVisits.getUpcomingFollowUps(2);
    const allVisits = localVisits.getAll() || [];

    // Pre-index visits by patient ID to avoid N+1 localStorage parsing
    const visitsByPatient = new Map();
    allVisits.forEach((v) => {
      if (!v?.patientId) return;
      if (!visitsByPatient.has(v.patientId)) {
        visitsByPatient.set(v.patientId, []);
      }
      visitsByPatient.get(v.patientId).push(v);
    });

    // Map by patient ID to merge data
    const patientMap = new Map();
    patients.forEach((p) => {
      patientMap.set(p.id, p);
    });

    const items = [];
    const seenKeys = new Set();

    // 1. Process all patients with scheduled follow-up
    patients.forEach((patient) => {
      const fDate = patient.nextFollowUp;
      if (!fDate) return;
      const daysDiff = calculateDaysDiff(fDate);
      if (daysDiff === null || daysDiff > 2) return; // Keep overdue, today, tomorrow, in 2 days

      // Find diagnosis from indexed visits
      const visits = visitsByPatient.get(patient.id) || [];
      const latestVisit = visits[0] || null;
      const diagnosis =
        latestVisit?.diagnosis ||
        latestVisit?.symptoms ||
        patient.notes ||
        'Follow-up Consultation';

      const key = `${patient.id}-${fDate}`;
      seenKeys.add(key);

      items.push({
        key,
        id: patient.id,
        patientId: patient.id,
        name: patient.name,
        age: patient.age,
        gender: patient.gender,
        contact: patient.contact || patient.mobile || '',
        followUpDate: fDate,
        daysLeft: daysDiff,
        diagnosis,
      });
    });

    // 2. Process any visits with upcoming follow-up not yet captured
    upcomingVisits.forEach((v) => {
      const fDate = v.followUpDate || v.nextFollowUp;
      if (!fDate) return;
      const daysDiff = calculateDaysDiff(fDate);
      if (daysDiff === null || daysDiff > 2) return;

      const key = `${v.patientId || v.id}-${fDate}`;
      if (seenKeys.has(key)) return;
      seenKeys.add(key);

      const patient = patientMap.get(v.patientId);
      items.push({
        key,
        id: v.patientId || v.id,
        patientId: v.patientId || v.id,
        name: patient?.name || v.patientName || 'Patient',
        age: patient?.age || v.patientAge || '',
        gender: patient?.gender || v.patientGender || '',
        contact: patient?.contact || patient?.mobile || v.patientMobile || '',
        followUpDate: fDate,
        daysLeft: daysDiff,
        diagnosis: v.diagnosis || v.symptoms || 'Follow-up Consultation',
      });
    });

    // Sort by earliest scheduled date (Overdue first, then today, tomorrow, etc.)
    items.sort((a, b) => a.daysLeft - b.daysLeft);
    setFollowUps(items);
  }, []);

  const toggleReminded = (key) => {
    setRemindedIds((prev) => {
      const updated = prev.includes(key) ? prev.filter((id) => id !== key) : [...prev, key];
      try {
        localStorage.setItem('clinicrx_reminded_followups', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleSendWhatsApp = (item) => {
    const patientObj = {
      name: item.name,
      contact: item.contact,
      nextFollowUp: item.followUpDate,
    };
    const link = generateFollowUpReminderWhatsAppLink(patientObj, clinic, item.daysLeft);
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  const getBadgeConfig = (daysLeft) => {
    if (daysLeft < 0) {
      return {
        label: 'Overdue',
        className: 'bg-rose-50 text-[#B94A48] border-rose-200',
      };
    }
    if (daysLeft === 0) {
      return {
        label: 'Today',
        className: 'bg-amber-50 text-[#B7791F] border-amber-200',
      };
    }
    if (daysLeft === 1) {
      return {
        label: 'Tomorrow',
        className: 'bg-teal-50 text-[#287C75] border-teal-200',
      };
    }
    if (daysLeft === 2) {
      return {
        label: 'In 2 Days',
        className: 'bg-teal-50 text-[#287C75] border-teal-200',
      };
    }
    return {
      label: `In ${daysLeft} Days`,
      className: 'bg-[#F7FAF8] text-[#4E6460] border-[#D9E6E2]',
    };
  };

  return (
    <article className="app-card p-6 flex flex-col justify-between border border-[#D9E6E2] bg-white rounded-2xl shadow-nivara-xs">
      <div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-[#B7791F] border border-amber-200">
              <CalendarClock size={20} />
            </div>
            <div>
              <h2 className="text-lg font-heading font-bold text-[#10201F]">Follow-Up Reminders</h2>
              <p className="text-xs text-[#4E6460]">Upcoming consultations within 48 hours & overdue</p>
            </div>
          </div>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              followUps.length > 0
                ? 'bg-amber-100 text-amber-800'
                : 'bg-[#F7FAF8] text-[#4E6460] border border-[#D9E6E2]'
            }`}
          >
            {followUps.length} Due
          </span>
        </div>

        {followUps.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-[#D9E6E2] bg-[#F7FAF8] p-8 text-center">
            <CheckCircle2 size={36} className="mx-auto text-[#2E7D5B]" />
            <p className="mt-2 text-sm font-semibold text-[#10201F]">No Follow-up Reminders Due</p>
            <p className="mt-1 text-xs text-[#4E6460]">
              No upcoming follow-ups scheduled for the next 2 days. All patients are up to date!
            </p>
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {followUps.map((item) => {
              const badge = getBadgeConfig(item.daysLeft);
              const isReminded = remindedIds.includes(item.key);

              return (
                <li
                  key={item.key}
                  className={`rounded-2xl border p-4 transition ${
                    isReminded
                      ? 'border-emerald-200 bg-emerald-50/40'
                      : 'border-[#D9E6E2] bg-[#F7FAF8]/70 hover:bg-white hover:border-[#287C75]/40 hover:shadow-nivara-xs'
                  }`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    {/* Patient Info */}
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-heading font-bold text-[#10201F]">{item.name}</span>
                        {(item.age || item.gender) && (
                          <span className="text-xs text-[#4E6460] font-medium">
                            ({item.age ? `${item.age} Y` : ''}
                            {item.age && item.gender ? ' / ' : ''}
                            {item.gender})
                          </span>
                        )}
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#4E6460]">
                        {item.contact && (
                          <span className="inline-flex items-center gap-1 font-mono">
                            <Phone size={12} className="text-[#7D908C]" />
                            {item.contact}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 text-[#4E6460]">
                          <Clock size={12} className="text-[#7D908C]" />
                          {formatDisplayDate(item.followUpDate)}
                        </span>
                        {item.diagnosis && (
                          <span className="inline-flex items-center gap-1 text-[#287C75] font-medium">
                            <Stethoscope size={12} />
                            {item.diagnosis}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2 sm:pt-0 shrink-0">
                      {/* WhatsApp Reminder Button */}
                      <button
                        type="button"
                        onClick={() => handleSendWhatsApp(item)}
                        aria-label="WhatsApp Reminder"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-[#2E7D5B] px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#25664a] transition active:scale-95"
                        title="Send WhatsApp Reminder"
                      >
                        <MessageCircle size={14} />
                        WhatsApp Reminder
                      </button>

                      {/* Mark Reminded Toggle */}
                      <button
                        type="button"
                        onClick={() => toggleReminded(item.key)}
                        className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-semibold border transition ${
                          isReminded
                            ? 'border-emerald-300 bg-emerald-100 text-emerald-800'
                            : 'border-[#D9E6E2] bg-white text-[#4E6460] hover:bg-[#F7FAF8] hover:text-[#10201F]'
                        }`}
                        title={isReminded ? 'Mark as Not Reminded' : 'Mark as Reminded'}
                      >
                        {isReminded ? (
                          <>
                            <CheckCircle2 size={13} className="text-emerald-700" />
                            Reminded ✓
                          </>
                        ) : (
                          'Mark Reminded'
                        )}
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </article>
  );
}
