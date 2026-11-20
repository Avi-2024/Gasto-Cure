import React from 'react';
import { Clock3, UserCheck, CheckCircle2 } from 'lucide-react';

function QueueStatusPanel({
  appointmentId,
  setAppointmentId,
  onMarkWaiting,
  onMarkConsulted,
  loading,
  queue = [],
  onSelectPatient,
}) {
  return (
    <section className="panel space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="panel-title">Queue Status & Triage</h3>
        <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2 py-0.5 text-[11px] font-bold text-[#287C75] border border-teal-200">
          <Clock3 size={11} />
          {queue.length} in Queue
        </span>
      </div>

      {queue.length > 0 && (
        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
          {queue.map((item, idx) => {
            const isSelected = (item.id || item.appointmentId) === appointmentId;
            const token = item.tokenNumber || idx + 1;
            const name = item.patientName || item.patient?.name || 'Patient';

            return (
              <div
                key={item.id || idx}
                onClick={() => {
                  setAppointmentId(item.id || item.appointmentId);
                  onSelectPatient?.(item);
                }}
                className={`p-2 rounded-xl border text-xs cursor-pointer transition flex items-center justify-between ${
                  isSelected
                    ? 'border-[#287C75] bg-teal-50/70 ring-1 ring-[#287C75]'
                    : 'border-[#D9E6E2] bg-[#F7FAF8] hover:bg-white hover:border-[#287C75]/40'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="inline-flex items-center justify-center h-5 px-1.5 rounded-md bg-[#123A3A] text-white font-mono text-[10px] font-bold">
                    #{token}
                  </span>
                  <div className="truncate">
                    <p className="font-bold text-[#10201F] truncate">{name}</p>
                    <p className="text-[10px] text-[#7D908C] truncate">{item.reason || item.chiefComplaint || 'Consultation'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                      item.status === 'COMPLETED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {item.status || 'WAITING'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="field-stack">
        <label className="field-label" htmlFor="queue-appointment-id">
          Appointment ID
        </label>
        <input
          id="queue-appointment-id"
          placeholder="Appointment ID or select above"
          value={appointmentId}
          onChange={(e) => setAppointmentId(e.target.value)}
        />
      </div>

      <div className="action-row">
        <button accessKey="w" type="button" onClick={onMarkWaiting} disabled={loading || !appointmentId}>
          Mark Waiting (Alt+W)
        </button>
        <button accessKey="c" type="button" className="btn-outline" onClick={onMarkConsulted} disabled={loading || !appointmentId}>
          Mark Consulted (Alt+C)
        </button>
      </div>
    </section>
  );
}

export default QueueStatusPanel;
