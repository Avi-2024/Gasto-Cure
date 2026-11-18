import React from 'react';
import { Calendar, ClipboardCheck, History } from 'lucide-react';

const formatVisitDate = (value) => {
  if (!value) return 'Unknown date';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export default function PatientHistory({ history = [] }) {
  return (
    <section className="rounded-3xl border border-[#D9E6E2] bg-white p-5 shadow-clinixpulse-xs">
      <div className="flex items-center justify-between border-b border-[#D9E6E2]/60 pb-3">
        <div className="flex items-center gap-2">
          <History size={15} className="text-[#287C75]" />
          <h2 className="font-heading text-sm font-bold text-[#10201F]">
            Prior Visit Records
          </h2>
        </div>
        <span className="text-[11px] font-semibold text-[#7D908C]">
          {history.length} {history.length === 1 ? 'record' : 'records'}
        </span>
      </div>

      {history.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-[#D9E6E2] bg-[#F7FAF8] p-5 text-center text-xs text-[#7D908C]">
          No prior outpatient consultations on file for this patient.
        </div>
      ) : (
        <ul className="mt-3 space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
          {history.map((visit) => (
            <li
              key={visit.id || visit._id}
              className="rounded-2xl border border-[#D9E6E2] bg-[#F7FAF8]/70 p-3.5 transition hover:bg-white hover:border-[#287C75]/40"
            >
              <div className="flex items-start gap-2.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-[#287C75]">
                  <ClipboardCheck size={14} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-heading text-xs font-bold text-[#10201F] truncate">
                      {visit.diagnosis || 'Clinical Consultation'}
                    </span>
                    <span className="text-[10px] text-[#7D908C] shrink-0 font-mono">
                      {formatVisitDate(visit.date || visit.createdAt)}
                    </span>
                  </div>
                  {visit.notes && (
                    <p className="mt-1 text-xs text-[#4E6460] line-clamp-2">{visit.notes}</p>
                  )}
                  {visit.medicines && visit.medicines.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {visit.medicines.map((m, idx) => (
                        <span
                          key={idx}
                          className="rounded-md border border-[#D9E6E2] bg-white px-1.5 py-0.5 text-[10px] font-medium text-[#10201F]"
                        >
                          {m.name || m}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
