import React, { useEffect, useState, useMemo } from 'react';
import {
  CalendarClock,
  MessageCircle,
  CheckCircle2,
  Phone,
  Clock,
  Stethoscope,
  Send,
  Zap,
  Info,
  X,
} from 'lucide-react';
import { localPatients, localVisits, localSettings } from '../../../services/localStore';
import { generateFollowUpReminderWhatsAppLink, generateExactHindiFollowUpMessage } from '../../../utils/whatsappHelper';
import { automatedRemindersService } from '../../../services/automatedRemindersService';

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

  const [autoSentKeys, setAutoSentKeys] = useState(() => {
    try {
      const history = automatedRemindersService.getHistory();
      return history.map((h) => h.key);
    } catch {
      return [];
    }
  });

  const [autoAlert, setAutoAlert] = useState(null);
  const [patientResponses, setPatientResponses] = useState(() => {
    return automatedRemindersService.getResponses();
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

  const pendingDueCount = useMemo(() => {
    return followUps.filter(
      (item) => item.daysLeft >= 0 && item.daysLeft <= 2 && !remindedIds.includes(item.key)
    ).length;
  }, [followUps, remindedIds]);

  const handleAutoSendAll = () => {
    const eligible = followUps.filter(
      (item) => item.daysLeft >= 0 && item.daysLeft <= 2 && !remindedIds.includes(item.key)
    );
    if (eligible.length === 0) return;

    const newRemindedKeys = [...remindedIds];
    const newAutoSent = [...autoSentKeys];
    let sentCount = 0;

    eligible.forEach((item) => {
      automatedRemindersService.sendAutomatedReminder(item, {
        clinicName: clinic?.clinicName || 'Gastro Cure Clinic',
        doctorName: clinic?.doctorName || 'Dr. Snehal Makwana',
      });
      if (!newRemindedKeys.includes(item.key)) newRemindedKeys.push(item.key);
      if (!newAutoSent.includes(item.key)) newAutoSent.push(item.key);
      sentCount++;
    });

    setRemindedIds(newRemindedKeys);
    setAutoSentKeys(newAutoSent);
    try {
      localStorage.setItem('clinicrx_reminded_followups', JSON.stringify(newRemindedKeys));
    } catch {}

    const firstPatientName = eligible[0]?.name || 'Patient';
    setAutoAlert({
      title: `Automated WhatsApp Interactive Reminders Dispatched (${sentCount} patient${sentCount > 1 ? 's' : ''})`,
      message: `Delivered English Interactive Confirmation to ${firstPatientName}: "Hi MR/MS ${firstPatientName.toUpperCase()}, I would like to know if you would be coming for your follow up appointment Tomorrow... * Tap 'Yes' to confirm. * Tap 'No' if you are not coming."`,
    });
  };

  const handleRecordResponse = (item, responseType) => {
    const record = automatedRemindersService.recordPatientResponse(
      item.patientId,
      item.followUpDate,
      responseType,
      {
        name: item.name,
        clinicName: clinic?.clinicName || 'Gastro Cure Clinic',
        doctorName: clinic?.doctorName || 'Dr. Snehal Makwana',
      }
    );
    setPatientResponses((prev) => ({ ...prev, [item.key]: record }));

    if (responseType === 'YES') {
      setAutoAlert({
        title: `Appointment Confirmed: ${item.name}`,
        message: `Patient tapped 'Yes'. Automated English reply dispatched: "${record.replyMessage}"`,
      });
    } else {
      setAutoAlert({
        title: `Follow-Up Reschedule Requested: ${item.name}`,
        message: `Patient tapped 'No'. Automated English reply dispatched: "${record.replyMessage}"`,
      });
    }
  };

  const getBadgeConfig = (daysLeft) => {
    if (daysLeft < 0) {
      return {
        label: 'Overdue',
        className: 'bg-[#FDECEB] text-[#C05646] border-[#F5C2BE] font-bold',
      };
    }
    if (daysLeft === 0) {
      return {
        label: 'Today',
        className: 'bg-[#FEF5E7] text-[#B5671B] border-[#FAD7A0] font-bold',
      };
    }
    if (daysLeft === 1) {
      return {
        label: 'Tomorrow',
        className: 'bg-[#EAF3EF] text-[#126857] border-[#C2DDD3] font-bold',
      };
    }
    if (daysLeft === 2) {
      return {
        label: 'In 2 Days',
        className: 'bg-[#EBF2F4] text-[#1D6072] border-[#C3DDE6] font-bold',
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

        {/* Automated WhatsApp Reminder Banner (24-48 hours window) */}
        <div className="mt-4 rounded-xl border border-teal-200 bg-teal-50/60 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-teal-600 text-white shadow-2xs mt-0.5">
              <Zap size={14} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-heading font-bold text-[#10201F]">
                  Automated WhatsApp Reminders
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-teal-800 bg-teal-100/80 px-2 py-0.5 rounded-full border border-teal-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  24–48h Active
                </span>
              </div>
              <p className="text-[11px] text-[#4E6460] mt-0.5">
                Auto-template: &ldquo;Hi MR/MS [Patient], I would like to know if you would be coming for your follow up appointment Tomorrow... * Tap &apos;Yes&apos; to confirm. * Tap &apos;No&apos; if you are not coming.&rdquo;
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleAutoSendAll}
              disabled={pendingDueCount === 0}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold shadow-sm transition active:scale-95 cursor-pointer ${
                pendingDueCount > 0
                  ? 'bg-[#287C75] text-white hover:bg-[#20635e] border border-teal-700'
                  : 'bg-white text-[#7D908C] border border-[#D9E6E2] cursor-not-allowed opacity-70'
              }`}
              title="Automatically send WhatsApp reminder to all patients due in 24-48 hours"
            >
              <Send size={13} />
              <span>Auto-Send Reminders ({pendingDueCount})</span>
            </button>
          </div>
        </div>

        {/* Live Auto-Dispatch Toast Alert */}
        {autoAlert && (
          <div className="mt-3 rounded-xl border border-emerald-300 bg-emerald-50 p-3 flex items-start justify-between gap-2 text-xs text-emerald-900 animate-in fade-in duration-150">
            <div className="flex items-start gap-2">
              <CheckCircle2 size={16} className="text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-emerald-950">{autoAlert.title}</p>
                <p className="text-[11px] text-emerald-800 mt-0.5">{autoAlert.message}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAutoAlert(null)}
              className="text-emerald-700 hover:text-emerald-950 p-1 rounded-lg"
              aria-label="Dismiss alert"
            >
              <X size={14} />
            </button>
          </div>
        )}

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
                        {autoSentKeys.includes(item.key) && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full">
                            <CheckCircle2 size={11} className="text-emerald-700" />
                            Auto-Sent 24–48h
                          </span>
                        )}
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
                    <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0 shrink-0">
                      {/* Patient Response Status Badge or Quick Reply Buttons */}
                      {patientResponses[item.key] ? (
                        <span
                          className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-semibold border ${
                            patientResponses[item.key].status === 'CONFIRMED'
                              ? 'border-emerald-300 bg-emerald-100 text-emerald-800'
                              : 'border-rose-300 bg-rose-100 text-rose-800'
                          }`}
                          title={`Replied: "${patientResponses[item.key].replyMessage}"`}
                        >
                          {patientResponses[item.key].status === 'CONFIRMED' ? (
                            <>
                              <CheckCircle2 size={13} className="text-emerald-700" />
                              Confirmed (Yes)
                            </>
                          ) : (
                            <>
                              <X size={13} className="text-rose-700" />
                              Declined (No)
                            </>
                          )}
                        </span>
                      ) : (
                        <div className="inline-flex items-center gap-1 bg-white border border-[#D9E6E2] rounded-xl p-0.5 text-xs">
                          <span className="text-[10px] text-[#7D908C] px-1 font-medium">Reply:</span>
                          <button
                            type="button"
                            onClick={() => handleRecordResponse(item, 'YES')}
                            className="inline-flex items-center gap-0.5 rounded-lg px-2 py-0.5 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-50 active:scale-95 transition cursor-pointer"
                            title="Simulate patient tapping 'Yes' (Confirm)"
                          >
                            + Yes
                          </button>
                          <span className="text-[#D9E6E2]">|</span>
                          <button
                            type="button"
                            onClick={() => handleRecordResponse(item, 'NO')}
                            className="inline-flex items-center gap-0.5 rounded-lg px-2 py-0.5 text-[11px] font-semibold text-rose-700 hover:bg-rose-50 active:scale-95 transition cursor-pointer"
                            title="Simulate patient tapping 'No' (Reschedule)"
                          >
                            - No
                          </button>
                        </div>
                      )}

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
