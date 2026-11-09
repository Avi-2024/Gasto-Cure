import React from 'react';
import { X, Printer, MessageCircle, FileText, CheckCircle2 } from 'lucide-react';
import './PrintPreviewModal.css';

/**
 * PrintPreviewModal Component
 *
 * Provides a realistic A4 preview of the prescription exactly as it will appear on paper.
 * - Displays Pad Mode top offset spacer or Digital Header letterhead
 * - Shows Patient Info, Vitals, Symptoms, Diagnosis, Rx Medicine Table, Advice, and Follow-up
 * - Allows 1-click Print and WhatsApp sharing directly from preview
 */
function PrintPreviewModal({
  isOpen,
  onClose,
  patient,
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
  if (!isOpen) return null;

  const padMode = Boolean(printSettings?.padMode);
  const topOffsetMm = Number(printSettings?.topOffsetMm) || 60;
  const doctorName = clinicSettings?.doctorName || 'Dr. Aarav Sharma';
  const clinicName = clinicSettings?.clinicName || 'ClinicRx Medical Centre';
  const todayFormatted = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

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
    <div className="preview-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="preview-modal-window" onClick={(e) => e.stopPropagation()}>
        {/* Header Bar */}
        <div className="preview-modal-header">
          <div className="preview-header-left">
            <FileText size={20} className="text-blue-600" />
            <div>
              <h2 className="preview-header-title">Prescription Print Preview</h2>
              <p className="preview-header-sub">
                {padMode ? `Pad Mode (Pre-printed pad • ${topOffsetMm}mm margin)` : 'Digital Header Mode (Plain A4 paper)'}
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
                <MessageCircle size={16} />
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
                <Printer size={16} />
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
          <div className="preview-sheet-a4">
            {/* Top Offset Spacer (Pad Mode) OR Digital Letterhead Header */}
            {padMode ? (
              <div
                className="preview-pad-spacer"
                style={{ height: `${topOffsetMm}mm`, minHeight: '60px' }}
              >
                <div className="preview-pad-indicator">
                  <span className="preview-pad-indicator-label">
                    Pre-printed Letterhead Pad Area ({topOffsetMm}mm)
                  </span>
                  <span className="preview-pad-indicator-desc">
                    (Content will start printing below this boundary)
                  </span>
                </div>
              </div>
            ) : (
              <div className="preview-letterhead">
                <div className="preview-letterhead-content">
                  <div className="preview-clinic-info">
                    <h1 className="preview-clinic-name">{clinicName}</h1>
                    <p className="preview-clinic-sub">{clinicSettings?.address || 'Medical Centre'}</p>
                    <p className="preview-clinic-sub">Phone: {clinicSettings?.phone || 'N/A'}</p>
                  </div>
                  <div className="preview-doctor-info">
                    <h2 className="preview-doctor-name">{doctorName}</h2>
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
                  <span className="value font-semibold">{patient?.name || 'Walk-in Patient'}</span>
                </div>
                <div>
                  <span className="label">Age / Gender:</span>
                  <span className="value">
                    {patient?.age ? `${patient.age} Yrs` : 'N/A'} / {patient?.gender || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="label">Contact:</span>
                  <span className="value">{patient?.contact || patient?.mobile || 'N/A'}</span>
                </div>
                <div>
                  <span className="label">Date:</span>
                  <span className="value">{todayFormatted}</span>
                </div>
                {rxId && (
                  <div>
                    <span className="label">Rx No:</span>
                    <span className="value font-mono text-xs">{rxId}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Vitals Section */}
            {hasAnyVital && (
              <div className="preview-section preview-vitals">
                <h3 className="preview-section-title">Vitals</h3>
                <div className="preview-vitals-grid">
                  {vitals.bloodPressure && (
                    <div className="preview-vital-item">
                      <span className="v-label">BP:</span>
                      <span className="v-value">{vitals.bloodPressure}</span>
                    </div>
                  )}
                  {vitals.weight && (
                    <div className="preview-vital-item">
                      <span className="v-label">Weight:</span>
                      <span className="v-value">{vitals.weight} kg</span>
                    </div>
                  )}
                  {vitals.bloodSugar && (
                    <div className="preview-vital-item">
                      <span className="v-label">Sugar:</span>
                      <span className="v-value">{vitals.bloodSugar}</span>
                    </div>
                  )}
                  {vitals.temperature && (
                    <div className="preview-vital-item">
                      <span className="v-label">Temp:</span>
                      <span className="v-value">{vitals.temperature} °F</span>
                    </div>
                  )}
                  {vitals.pulseRate && (
                    <div className="preview-vital-item">
                      <span className="v-label">Pulse:</span>
                      <span className="v-value">{vitals.pulseRate} bpm</span>
                    </div>
                  )}
                  {vitals.spo2 && (
                    <div className="preview-vital-item">
                      <span className="v-label">SpO2:</span>
                      <span className="v-value">{vitals.spo2} %</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Symptoms / Complaints */}
            {symptoms && (
              <div className="preview-section">
                <h3 className="preview-section-title">Chief Complaints / Symptoms</h3>
                <p className="preview-text-block">{symptoms}</p>
              </div>
            )}

            {/* Diagnosis */}
            {diagnosis && (
              <div className="preview-section">
                <h3 className="preview-section-title">Diagnosis</h3>
                <p className="preview-text-block font-medium">{diagnosis}</p>
              </div>
            )}

            {/* Rx Medicine Table */}
            <div className="preview-section preview-rx-section">
              <h3 className="preview-section-title rx-symbol">Rx (Medicines)</h3>
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
                        <td className="text-center">{idx + 1}</td>
                        <td className="font-semibold text-slate-900">{med.name}</td>
                        <td>{med.dosage || '-'}</td>
                        <td className="font-medium text-blue-700">{med.frequency || '-'}</td>
                        <td>{med.timing || '-'}</td>
                        <td>{med.duration || '-'}</td>
                        <td className="text-slate-600">{med.remarks || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-sm italic text-slate-400 py-2">No medicines listed in this prescription.</p>
              )}
            </div>

            {/* Advice / Instructions */}
            {advice && (
              <div className="preview-section">
                <h3 className="preview-section-title">Advice & Instructions</h3>
                <p className="preview-text-block">{advice}</p>
              </div>
            )}

            {/* Next Follow-Up */}
            {followUpDate && (
              <div className="preview-section preview-followup">
                <span className="font-bold text-slate-800 text-sm">Next Follow-Up: </span>
                <span className="font-semibold text-blue-700 text-sm ml-1">{followUpDate}</span>
              </div>
            )}

            {/* Doctor Signature Block */}
            <div className="preview-signature-block">
              <div className="preview-signature-line">
                <p className="preview-sign-doctor">{doctorName}</p>
                <p className="preview-sign-clinic">{clinicName}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Bar */}
        <div className="preview-modal-footer">
          <div className="preview-footer-info">
            <CheckCircle2 size={15} className="text-emerald-600 inline mr-1" />
            <span>Ready for printing or sending via WhatsApp</span>
          </div>
          <div className="preview-footer-buttons">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Close
            </button>
            {onShareWhatsApp && (
              <button type="button" className="btn-preview-wa" onClick={onShareWhatsApp}>
                <MessageCircle size={16} />
                Send via WhatsApp
              </button>
            )}
            {onPrint && (
              <button type="button" className="btn-primary" onClick={onPrint}>
                <Printer size={16} />
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
