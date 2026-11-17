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
  X,
  Sparkles,
} from 'lucide-react';
import { localPatients, localVisits, localSettings } from '../../../services/localStore';
import { generateFollowUpReminderWhatsAppLink } from '../../../utils/whatsappHelper';
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

const getInitials = (name) => {
  if (!name) return 'PT';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
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
        className: 'bg-rose-50 text-rose-700 border-rose-200/90 font-bold',
        dot: 'bg-rose-500',
      };
    }
    if (daysLeft === 0) {
      return {
        label: 'Today',
        className: 'bg-amber-50 text-amber-800 border-amber-300 font-bold',
        dot: 'bg-amber-500 animate-pulse',
      };
    }
    if (daysLeft === 1) {
      return {
        label: 'Tomorrow',
        className: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold',
        dot: 'bg-emerald-500',
      };
    }
    if (daysLeft === 2) {
      return {
        label: 'In 2 Days',
        className: 'bg-cyan-50 text-cyan-800 border-cyan-200 font-bold',
        dot: 'bg-cyan-500',
      };
    }
    return {
      label: `In ${daysLeft} Days`,
      className: 'bg-slate-50 text-slate-700 border-slate-200 font-semibold',
      dot: 'bg-slate-400',
    };
  };

  return (
    <article className="app-card p-6 flex flex-col justify-between border border-[#D9E6E2] bg-white rounded-2xl shadow-nivara-xs">
      <div>
        {/* Card Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-200/60 shadow-2xs">
              <CalendarClock size={22} />
            </div>
            <div>
              <h2 className="text-lg font-heading font-bold text-[#10201F] tracking-tight">
                Follow-Up Reminders
              </h2>
              <p className="text-xs text-[#4E6460]">Upcoming consultations within 48 hours & overdue</p>
            </div>
          </div>
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold transition-colors ${
              followUps.length > 0
                ? 'bg-amber-100 text-amber-900 border border-amber-200/80 shadow-2xs'
                : 'bg-[#F7FAF8] text-[#4E6460] border border-[#D9E6E2]'
            }`}
          >
            {followUps.length} Due
          </span>
        </div>

        {/* Automated WhatsApp Reminder Smart Banner (24-48 hours window) */}
        <div className="mt-4 rounded-2xl border border-teal-200/80 bg-gradient-to-r from-teal-50/90 via-emerald-50/40 to-teal-50/70 p-3.5 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#287C75] text-white shadow-2xs">
                <Zap size={15} />
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-heading font-bold text-[#10201F]">
                  Automated WhatsApp Reminders
                </span>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-teal-900 bg-teal-100/90 px-2.5 py-0.5 rounded-full border border-teal-200 shadow-2xs">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  24–48h Active
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAutoSendAll}
              disabled={pendingDueCount === 0}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold shadow-2xs transition-all active:scale-95 cursor-pointer shrink-0 self-start sm:self-auto ${
                pendingDueCount > 0
                  ? 'bg-[#287C75] text-white hover:bg-[#20635e] border border-teal-700 shadow-teal-900/10'
                  : 'bg-white text-[#7D908C] border border-[#D9E6E2] cursor-not-allowed opacity-60'
              }`}
              title="Automatically send WhatsApp reminder to all patients due in 24-48 hours"
            >
              <Send size={12} />
              <span>Auto-Send Reminders ({pendingDueCount})</span>
            </button>
          </div>

          <div className="mt-2.5 pt-2 border-t border-teal-200/60 text-[11px] text-[#4E6460] leading-relaxed">
            <span className="font-semibold text-teal-950">Auto-template:</span> &ldquo;Hi MR/MS [Patient], I would like to know if you would be coming for your follow up appointment Tomorrow... * Tap &apos;Yes&apos; to confirm. * Tap &apos;No&apos; if you are not coming.&rdquo;
          </div>
        </div>

        {/* Live Auto-Dispatch Toast Alert */}
        {autoAlert && (
          <div className="mt-3 rounded-xl border border-emerald-300 bg-emerald-50/90 p-3 flex items-start justify-between gap-2 text-xs text-emerald-900 shadow-2xs animate-in fade-in duration-150">
            <div className="flex items-start gap-2">
              <CheckCircle2 size={16} className="text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-emerald-950">{autoAlert.title}</p>
                <p className="text-[11px] text-emerald-800 mt-0.5 leading-relaxed">{autoAlert.message}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAutoAlert(null)}
              className="text-emerald-700 hover:text-emerald-950 p-1 rounded-lg transition-colors cursor-pointer"
              aria-label="Dismiss alert"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Patient Reminders List */}
        {followUps.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-[#D9E6E2] bg-[#F7FAF8] p-8 text-center">
            <CheckCircle2 size={36} className="mx-auto text-[#2E7D5B]" />
            <p className="mt-2 text-sm font-semibold text-[#10201F]">No Follow-up Reminders Due</p>
            <p className="mt-1 text-xs text-[#4E6460]">
              No upcoming follow-ups scheduled for the next 2 days. All patients are up to date!
            </p>
          </div>
        ) : (
          <ul className="mt-4 space-y-3.5 max-h-[500px] overflow-y-auto pr-1">
            {followUps.map((item) => {
              const badge = getBadgeConfig(item.daysLeft);
              const isReminded = remindedIds.includes(item.key);
              const initials = getInitials(item.name);

              return (
                <li
                  key={item.key}
                  className={`rounded-2xl border p-4 transition-all duration-200 ${
                    isReminded
                      ? 'border-emerald-200 bg-emerald-50/30 shadow-2xs'
                      : 'border-[#D9E6E2] bg-white hover:border-[#287C75]/40 hover:shadow-nivara-xs hover:bg-[#F7FAF8]/50'
                  }`}
                >
                  {/* Row 1: Patient Identity + Badges */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Initials Avatar */}
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 border border-teal-200/70 text-teal-800 font-heading font-bold text-xs shadow-2xs">
                        {initials}
                      </div>
                      
                      {/* Name & Demographics */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-sm font-heading font-bold text-[#10201F] truncate">
                            {item.name}
                          </span>
                          {(item.age || item.gender) && (
                            <span className="text-xs text-[#4E6460] font-medium">
                              ({item.age ? `${item.age} Y` : ''}
                              {item.age && item.gender ? ' / ' : ''}
                              {item.gender})
                            </span>
                          )}
                        </div>

                        {/* Clinical Diagnosis Tag */}
                        {item.diagnosis && (
                          <div className="flex items-center gap-1.5 text-xs text-[#287C75] font-medium mt-0.5">
                            <Stethoscope size={12} className="shrink-0 text-teal-600" />
                            <span className="truncate">{item.diagnosis}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Status Pill Badges */}
                    <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs ${badge.className} shadow-2xs`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
                        {badge.label}
                      </span>

                      {autoSentKeys.includes(item.key) && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full shadow-2xs">
                          <CheckCircle2 size={11} className="text-emerald-700" />
                          Auto-Sent 24–48h
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Row 2: Metadata Strip (Phone & Scheduled Date) */}
                  <div className="flex flex-wrap items-center gap-2 mt-3 pt-2.5 border-t border-[#E8F0EC] text-xs">
                    {item.contact && (
                      <span className="inline-flex items-center gap-1.5 font-mono text-[#10201F] bg-[#F7FAF8] border border-[#D9E6E2] px-2.5 py-1 rounded-lg">
                        <Phone size={12} className="text-[#7D908C]" />
                        {item.contact}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1.5 text-[#4E6460] bg-[#F7FAF8] border border-[#D9E6E2] px-2.5 py-1 rounded-lg">
                      <Clock size={12} className="text-[#7D908C]" />
                      {formatDisplayDate(item.followUpDate)}
                    </span>
                  </div>

                  {/* Row 3: Ergonomic Actions Dock */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-2.5 border-t border-[#E8F0EC]">
                    {/* Left: Patient Response Simulator Status or Quick Actions */}
                    <div className="flex items-center">
                      {patientResponses[item.key] ? (
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-bold border shadow-2xs ${
                            patientResponses[item.key].status === 'CONFIRMED'
                              ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                              : 'border-rose-300 bg-rose-50 text-rose-800'
                          }`}
                          title={`Replied: "${patientResponses[item.key].replyMessage}"`}
                        >
                          {patientResponses[item.key].status === 'CONFIRMED' ? (
                            <>
                              <CheckCircle2 size={13} className="text-emerald-600" />
                              Confirmed (Yes)
                            </>
                          ) : (
                            <>
                              <X size={13} className="text-rose-600" />
                              Declined (No)
                            </>
                          )}
                        </span>
                      ) : (
                        <div className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200/80 rounded-xl p-1 text-xs shadow-2xs">
                          <span className="text-[10px] text-[#7D908C] px-1 font-semibold">Reply:</span>
                          <button
                            type="button"
                            onClick={() => handleRecordResponse(item, 'YES')}
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-bold text-emerald-700 bg-white hover:bg-emerald-50 active:scale-95 border border-emerald-200/70 shadow-2xs transition cursor-pointer"
                            title="Simulate patient tapping 'Yes' (Confirm)"
                          >
                            + Yes
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRecordResponse(item, 'NO')}
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-bold text-rose-700 bg-white hover:bg-rose-50 active:scale-95 border border-rose-200/70 shadow-2xs transition cursor-pointer"
                            title="Simulate patient tapping 'No' (Reschedule)"
                          >
                            - No
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Right: Operational Buttons */}
                    <div className="flex items-center gap-2">
                      {/* Mark Reminded Toggle */}
                      <button
                        type="button"
                        onClick={() => toggleReminded(item.key)}
                        className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold border transition-all active:scale-95 cursor-pointer ${
                          isReminded
                            ? 'border-emerald-300 bg-emerald-100 text-emerald-800 shadow-2xs'
                            : 'border-[#D9E6E2] bg-white text-[#4E6460] hover:bg-[#F7FAF8] hover:text-[#10201F] hover:border-slate-300 shadow-2xs'
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

                      {/* WhatsApp Reminder Button */}
                      <button
                        type="button"
                        onClick={() => handleSendWhatsApp(item)}
                        aria-label="WhatsApp Reminder"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-600/20 bg-[#2E7D5B] hover:bg-[#25664a] px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs transition-all active:scale-95 cursor-pointer"
                        title="Send WhatsApp Reminder"
                      >
                        <MessageCircle size={14} className="fill-white/10" />
                        <span>WhatsApp Reminder</span>
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
