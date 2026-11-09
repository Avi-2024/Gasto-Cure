import React from 'react';
import { Printer, X, CheckCircle, Info } from 'lucide-react';

const CALIBRATION_MARKS = [30, 40, 50, 60, 70, 80, 90, 100, 110, 120];

/**
 * TestPrintSheet Component
 * 
 * Generates an exact millimeter calibration sheet for doctors to align their
 * pre-printed clinic letterhead pads without wasting expensive stationery.
 */
export function TestPrintSheet({ onClose, onPrint }) {
  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  return (
    <div className="test-print-modal-overlay">
      <div className="test-print-modal">
        {/* Modal Controls (No Print) */}
        <div className="test-print-modal-header no-print">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Print Alignment Calibration Sheet</h2>
            <p className="text-xs text-slate-500 mt-1">
              Print this sheet on plain A4 paper and hold it behind your doctor pad against light to find the exact top offset.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
            >
              <Printer size={16} />
              Print Calibration Sheet
            </button>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                title="Close"
              >
                <X size={20} />
              </button>
            )}
          </div>
        </div>

        {/* Printable Calibration Sheet (A4 Dimensions) */}
        <div className="test-print-sheet-wrapper">
          <div className="test-print-sheet" id="calibration-sheet">
            {/* Sheet Header Information */}
            <div className="calibration-header">
              <div className="calibration-title-row">
                <span className="calibration-badge">CLINICRX CALIBRATION ENGINE</span>
                <span className="calibration-paper-badge">A4 (210 × 297 mm)</span>
              </div>
              <h1 className="calibration-main-title">Doctor Letterhead Stationery Alignment Sheet</h1>
              <p className="calibration-subtitle">
                Accurate physical millimeter ruler for pre-printed letterheads and RX pads
              </p>
            </div>

            {/* Step-by-Step Instructions Box */}
            <div className="calibration-guide-box">
              <div className="font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Info size={14} className="text-blue-600" />
                How to Calibrate in 3 Easy Steps:
              </div>
              <ol className="calibration-steps">
                <li>1. Print this sheet on plain blank A4 paper (set scale to 100% / Actual Size).</li>
                <li>2. Place your pre-printed clinic letterhead over this sheet and hold them against a light source.</li>
                <li>3. Note the millimeter line immediately below your clinic logo, then set that number as your Top Offset.</li>
              </ol>
            </div>

            {/* Horizontal Alignment Ruler Lines */}
            <div className="calibration-ruler-area">
              {CALIBRATION_MARKS.map((mm) => {
                const isDefault = mm === 60;
                return (
                  <div
                    key={mm}
                    className={`calibration-line-marker ${isDefault ? 'is-default' : ''}`}
                    style={{ top: `${mm}mm` }}
                    data-mm={mm}
                  >
                    <div className="marker-badge marker-badge-left">
                      <span className="marker-val">{mm} mm</span>
                      {isDefault && <span className="marker-tag">RECOMMENDED</span>}
                    </div>

                    <div className="marker-rule">
                      <div className="marker-center-crosshair">
                        <span>{mm} mm ({((mm / 25.4)).toFixed(2)} in)</span>
                      </div>
                    </div>

                    <div className="marker-badge marker-badge-right">
                      <span className="marker-val">{mm} mm</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer Notice */}
            <div className="calibration-footer">
              <div className="calibration-footer-left">
                <span>ClinicRx Medical Office Suite</span>
                <span>•</span>
                <span>Zero Stationery Waste Guarantee</span>
              </div>
              <div className="calibration-footer-right">
                <span>Default Recommended Top Offset: <strong>60 mm</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TestPrintSheet;
