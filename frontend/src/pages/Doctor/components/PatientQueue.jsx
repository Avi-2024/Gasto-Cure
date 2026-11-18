import React from 'react';
import { Clock3, UserCheck, UserRound } from 'lucide-react';
import StatusBadge from '../../../components/ui/StatusBadge';

const statusVariantMap = {
  waiting: 'warning',
  pending: 'warning',
  confirmed: 'info',
  completed: 'success',
  cancelled: 'danger',
};

const getPatientId = (item) => item?.patientId || item?.patient?._id || item?.id || item?._id;
const getPatientName = (item) => item?.patientName || item?.patient?.fullName || 'Patient';
const getReason = (item) => item?.reason || item?.appointmentReason || 'General consultation';
const getStatus = (item) => (item?.status || 'waiting').toLowerCase();
const getStartTime = (item) => item?.startTime || item?.appointmentTime || '--:--';

export default function PatientQueue({ queue = [], selectedPatientId, onSelect }) {
  return (
    <section className="rounded-3xl border border-[#D9E6E2] bg-white p-5 shadow-clinixpulse-xs">
      <div className="flex items-center justify-between gap-3 border-b border-[#D9E6E2]/60 pb-3">
        <div>
          <h2 className="font-heading text-sm font-bold text-[#10201F]">
            Patient Waiting Queue
          </h2>
          <p className="text-[11px] text-[#7D908C]">Select a patient to begin consultation</p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full border border-[#287C75]/25 bg-[#287C75]/10 px-2.5 py-0.5 text-xs font-bold text-[#287C75]">
          {queue.length} in queue
        </span>
      </div>

      {queue.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-[#D9E6E2] bg-[#F7FAF8] p-6 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-[#287C75]">
            <UserRound size={18} />
          </div>
          <p className="mt-2 text-xs font-bold text-[#10201F]">No patients waiting</p>
          <p className="mt-0.5 text-[11px] text-[#7D908C]">
            Patients checked in at Reception will appear here immediately.
          </p>
        </div>
      ) : (
        <ul className="mt-3 space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
          {queue.map((item) => {
            const patientId = getPatientId(item);
            const patientName = getPatientName(item);
            const status = getStatus(item);
            const isSelected = selectedPatientId === patientId;

            return (
              <li key={item.id || item._id || patientId}>
                <button
                  type="button"
                  onClick={() => onSelect(item)}
                  className={`w-full text-left rounded-2xl border p-3.5 transition ${
                    isSelected
                      ? 'border-[#287C75] bg-[#F7FAF8] ring-2 ring-[#287C75]/20 shadow-xs'
                      : 'border-[#D9E6E2] bg-white hover:border-[#287C75]/40 hover:bg-[#F7FAF8]/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-heading text-sm font-bold text-[#10201F]">
                          {patientName}
                        </span>
                        {isSelected && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-[#123A3A] px-1.5 py-0.2 text-[9px] font-bold text-white">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 truncate text-xs text-[#4E6460]">{getReason(item)}</p>
                    </div>
                    <StatusBadge label={status} variant={statusVariantMap[status] || 'neutral'} className="capitalize shrink-0" />
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[11px] text-[#7D908C]">
                    <span className="flex items-center gap-1 font-mono">
                      <Clock3 size={11} />
                      {getStartTime(item)}
                    </span>
                    <span>Token #{item.id || item._id || 'N/A'}</span>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
