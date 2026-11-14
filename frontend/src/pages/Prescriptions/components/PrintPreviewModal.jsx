import React, { useEffect } from 'react';
import { X, Printer, MessageCircle, FileText, CheckCircle2 } from 'lucide-react';
import './PrintPreviewModal.css';

/**
 * PrintPreviewModal Component
 *
 * Provides a realistic A4 preview of the Nivara prescription pad.
 * - Displays Pad Mode top offset spacer or Digital Header letterhead
 * - Shows Patient Demographics, 6-Point Vitals, Symptoms, Diagnosis, Rx Medicine Table, Advice, and Follow-up
 * - Allows 1-click Direct Print and WhatsApp sharing directly from preview
 * - Closes on Escape key press or clicking outside sheet
 */
function PrintPreviewModal({
  isOpen,
  onClose,
  patient,
  prescriptionDate,
  vitals = {},
  symptoms = '',
  diagnosis = '',
  advice = '',
  medicines = [],
  followUpDate = '',
  rxId = '',
  printSettings = {},
  clinicSettings = {},
  onPrint,
  onShareWhatsApp,
}) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const padMode = Boolean(printSettings?.padMode);
  const topOffsetMm = Number(printSettings?.topOffsetMm) || 60;
  const doctorName = clinicSettings?.doctorName || 'Dr. Aarav Sharma';
  const clinicName = clinicSettings?.clinicName || 'Nivara Clinic & Health Centre';

  let formattedDate = '';
  if (prescriptionDate) {
    if (prescriptionDate.includes('T')) {
      formattedDate = prescriptionDate.split('T')[0];
    } else {
      formattedDate = prescriptionDate;
    }
  } else {
    formattedDate = new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  const validMedicines = medicines.filter((m) => m && (m.name || m.dosage));

  const hasAnyVital = Boolean(
    vitals.bloodPressure ||
    vitals.weight ||
    vitals.bloodSugar ||
    vitals.temperature ||
    vitals.pulseRate ||
    vitals.spo2
  );

  return (
    <div
      className="preview-modal-overlay no-print"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="preview-modal-title"
    >
      <div className="preview-modal-window" onClick={(e) => e.stopPropagation()}>
        {/* Header Bar */}
        <div className="preview-modal-header">
          <div className="preview-header-left">
            <div className="w-9 h-9 rounded-xl bg-[#E8F3F1] flex items-center justify-center text-[#287C75]">
              <FileText size={18} />
            </div>
            <div>
              <h2 id="preview-modal-title" className="preview-header-title font-heading">
                Prescription Print Preview
              </h2>
              <p className="preview-header-sub">
                {padMode
                  ? `Pad Mode (Pre-printed pad offset: ${topOffsetMm}mm)`
                  : 'Digital Header Mode (Plain A4 paper)'}
              </p>
            </div>
          </div>

          <div className="preview-header-actions">
            {onShareWhatsApp && (
              <button
                type="button"
                className="btn-preview-wa"
                onClick={onShareWhatsApp}
                title="Share prescription via WhatsApp"
              >
                <MessageCircle size={15} />
                WhatsApp
              </button>
            )}
            {onPrint && (
              <button
                type="button"
                className="btn-preview-print"
                onClick={onPrint}
                title="Print prescription now"
              >
                <Printer size={15} />
                Print Now
              </button>
            )}
            <button
              type="button"
              className="btn-preview-close"
              onClick={onClose}
              aria-label="Close Preview"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Preview A4 Sheet Container */}
        <div className="preview-sheet-scroll">
          <div className="preview-sheet-a4 shadow-nivara-lg">
            {/* Top Offset Spacer (Pad Mode) OR Digital Letterhead Header */}
            {padMode ? (
              <div
                className="preview-pad-spacer"
                style={{ height: `${topOffsetMm}mm`, minHeight: '60px' }}
              >
                <div className="preview-pad-indicator">
                  <span className="preview-pad-indicator-label tabular-nums">
                    Pre-printed Letterhead Pad Area ({topOffsetMm}mm)
                  </span>
                  <span className="preview-pad-indicator-desc">
                    (Content will start printing below this boundary line)
                  </span>
                </div>
              </div>
            ) : (
              <div className="preview-letterhead">
                <div className="preview-letterhead-content">
                  <div className="preview-clinic-info">
                    <h1 className="preview-clinic-name font-heading">{clinicName}</h1>
                    <p className="preview-clinic-sub">{clinicSettings?.address || 'Medical Centre'}</p>
                    <p className="preview-clinic-sub">Phone: {clinicSettings?.phone || 'N/A'}</p>
                  </div>
                  <div className="preview-doctor-info">
                    <h2 className="preview-doctor-name font-heading">{doctorName}</h2>
                    <p className="preview-doctor-sub">{clinicSettings?.qualification || 'MBBS, MD'}</p>
                    <p className="preview-doctor-sub">Reg. No: {clinicSettings?.regNumber || 'MCI-REG'}</p>
                    {clinicSettings?.timing && (
                      <p className="preview-doctor-sub">Timings: {clinicSettings.timing}</p>
                    )}
                  </div>
                </div>
                <hr className="preview-letterhead-divider" />
              </div>
            )}

            {/* Patient Header Details */}
            <div className="preview-patient-card">
              <div className="preview-patient-grid">
                <div>
                  <span className="label">Patient Name:</span>
                  <span className="value font-semibold text-[#10201F]">{patient?.name || 'Walk-in Patient'}</span>
                </div>
                <div>
                  <span className="label">Age / Gender:</span>
                  <span className="value tabular-nums">
                    {patient?.age ? `${patient.age} Yrs` : 'N/A'} / {patient?.gender || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="label">Contact:</span>
                  <span className="value tabular-nums">{patient?.contact || patient?.mobile || 'N/A'}</span>
                </div>
                <div>
                  <span className="label">Date:</span>
                  <span className="value tabular-nums">{formattedDate}</span>
                </div>
                {rxId && (
                  <div>
                    <span className="label">Rx No:</span>
                    <span className="value font-mono text-xs tabular-nums font-semibold text-[#287C75]">{rxId}</span>
                  </div>
                )}
                {patient?.id && (
                  <div>
                    <span className="label">Patient ID:</span>
                    <span className="value font-mono text-xs tabular-nums text-[#4E6460]">{patient.id}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Vitals Section */}
            {hasAnyVital && (
              <div className="preview-section preview-vitals">
                <h3 className="preview-section-title font-heading">Vitals</h3>
                <div className="preview-vitals-grid">
                  {vitals.bloodPressure && (
                    <div className="preview-vital-item">
                      <span className="v-label">BP:</span>
                      <span className="v-value tabular-nums">{vitals.bloodPressure} mmHg</span>
                    </div>
                  )}
                  {vitals.weight && (
                    <div className="preview-vital-item">
                      <span className="v-label">Weight:</span>
                      <span className="v-value tabular-nums">{vitals.weight} kg</span>
                    </div>
                  )}
                  {vitals.bloodSugar && (
                    <div className="preview-vital-item">
                      <span className="v-label">Sugar:</span>
                      <span className="v-value tabular-nums">{vitals.bloodSugar} mg/dL</span>
                    </div>
                  )}
                  {vitals.temperature && (
                    <div className="preview-vital-item">
                      <span className="v-label">Temp:</span>
                      <span className="v-value tabular-nums">{vitals.temperature} °F</span>
                    </div>
                  )}
                  {vitals.pulseRate && (
                    <div className="preview-vital-item">
                      <span className="v-label">Pulse:</span>
                      <span className="v-value tabular-nums">{vitals.pulseRate} bpm</span>
                    </div>
                  )}
                  {vitals.spo2 && (
                    <div className="preview-vital-item">
                      <span className="v-label">SpO2:</span>
                      <span className="v-value tabular-nums">{vitals.spo2} %</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Symptoms / Complaints */}
            {symptoms && (
              <div className="preview-section">
                <h3 className="preview-section-title font-heading">Chief Complaints / Symptoms</h3>
                <p className="preview-text-block">{symptoms}</p>
              </div>
            )}

            {/* Diagnosis */}
            {diagnosis && (
              <div className="preview-section">
                <h3 className="preview-section-title font-heading">Diagnosis</h3>
                <p className="preview-text-block font-semibold text-[#10201F]">{diagnosis}</p>
              </div>
            )}

            {/* Rx Medicine Table */}
            <div className="preview-section preview-rx-section">
              <h3 className="preview-section-title rx-symbol font-heading">Rx (Medicines)</h3>
              {validMedicines.length > 0 ? (
                <table className="preview-med-table">
                  <thead>
                    <tr>
                      <th style={{ width: '5%' }}>#</th>
                      <th style={{ width: '30%' }}>Medicine</th>
                      <th style={{ width: '12%' }}>Dosage</th>
                      <th style={{ width: '15%' }}>Frequency</th>
                      <th style={{ width: '18%' }}>Timing</th>
                      <th style={{ width: '10%' }}>Duration</th>
                      <th style={{ width: '10%' }}>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {validMedicines.map((med, idx) => (
                      <tr key={med.id || idx}>
                        <td className="text-center tabular-nums text-slate-500">{idx + 1}</td>
                        <td className="font-semibold text-[#10201F]">{med.name}</td>
                        <td className="tabular-nums">{med.dosage || '-'}</td>
                        <td className="font-medium text-[#287C75]">{med.frequency || '-'}</td>
                        <td>{med.timing || '-'}</td>
                        <td className="tabular-nums">{med.duration || '-'}</td>
                        <td className="text-[#4E6460]">{med.remarks || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-sm italic text-[#7D908C] py-2">No medicines listed in this prescription.</p>
              )}
            </div>

            {/* Advice / Instructions */}
            {advice && (
              <div className="preview-section">
                <h3 className="preview-section-title font-heading">Advice & Instructions</h3>
                <p className="preview-text-block">{advice}</p>
              </div>
            )}

            {/* Next Follow-Up */}
            {followUpDate && (
              <div className="preview-section preview-followup">
                <span className="font-bold text-[#10201F] text-sm">Next Follow-Up: </span>
                <span className="font-semibold text-[#287C75] text-sm ml-1 tabular-nums">{followUpDate}</span>
              </div>
            )}

            {/* Doctor Signature Block */}
            <div className="preview-signature-block">
              <div className="preview-signature-line">
                {clinicSettings?.signatureUrl && (
                  <div className="preview-signature-img-wrap">
                    <img
                      src={clinicSettings.signatureUrl}
                      alt="Doctor Digital Signature"
                      className="preview-signature-img"
                    />
                  </div>
                )}
                <p className="preview-sign-doctor font-heading">{doctorName}</p>
                <p className="preview-sign-credentials">
                  {clinicSettings?.qualification || 'MBBS, MD (Medicine)'}
                  {clinicSettings?.regNumber ? ` • Reg. ${clinicSettings.regNumber}` : ''}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Bar */}
        <div className="preview-modal-footer">
          <div className="preview-footer-info">
            <CheckCircle2 size={16} className="text-[#2E7D5B] inline mr-1.5" />
            <span className="text-xs text-[#4E6460]">Ready for precision printing or patient WhatsApp sharing</span>
          </div>
          <div className="preview-footer-buttons">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Close
            </button>
            {onShareWhatsApp && (
              <button type="button" className="btn-preview-wa" onClick={onShareWhatsApp}>
                <MessageCircle size={15} />
                Send via WhatsApp
              </button>
            )}
            {onPrint && (
              <button type="button" className="btn-primary" onClick={onPrint}>
                <Printer size={15} />
                Print Prescription
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PrintPreviewModal;
