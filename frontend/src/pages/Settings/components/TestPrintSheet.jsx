import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Printer, X, Info, Sparkles, Check } from 'lucide-react';

const CALIBRATION_MARKS = [30, 40, 50, 60, 70, 80, 90, 100, 110, 120];

/**
 * TestPrintSheet Component
 * 
 * Generates an exact millimeter calibration sheet for doctors to align their
 * pre-printed clinic letterhead pads without wasting expensive stationery.
 * 
 * CRITICAL ALIGNMENT ARCHITECTURE:
 * The calibration ruler area is positioned at top: 0 so each line (30mm - 120mm)
 * measures directly from the physical top edge of the A4 page (zero offset error).
 * Explanatory headers and instructions are placed below 130mm.
 */
export function TestPrintSheet({ onClose, onPrint }) {
  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  const sheetContent = (
    <div className="test-print-modal-overlay fixed inset-0 z-[9999] bg-[#123A3A]/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div
        className="test-print-modal bg-white rounded-2xl shadow-clinixpulse-lg max-w-4xl w-full border border-[#D9E6E2] overflow-hidden flex flex-col my-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="calibration-modal-title"
      >
        {/* Modal Controls (No Print) */}
        <div className="test-print-modal-header no-print flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 border-b border-[#D9E6E2] bg-white">
          <div>
            <h2 id="calibration-modal-title" className="font-heading text-lg font-bold tracking-tight text-[#10201F]">
              Print Alignment Calibration Sheet
            </h2>
            <p className="text-xs text-[#4E6460] mt-0.5">
              Print this sheet on plain A4 paper and hold it behind your doctor pad against light to find the exact top offset.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handlePrint}
              className="btn-primary inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl shadow-clinixpulse-xs"
            >
              <Printer size={15} />
              Print Calibration Sheet
            </button>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-[#7D908C] hover:text-[#10201F] rounded-xl hover:bg-slate-100 transition-colors"
                title="Close"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Printable Calibration Sheet (A4 Dimensions: 210 × 297 mm) */}
        <div className="test-print-sheet-wrapper p-4 sm:p-6 bg-[#F7FAF8] flex justify-center overflow-auto max-h-[calc(90vh-80px)]">
          <div
            className="test-print-sheet bg-white border border-[#D9E6E2] shadow-clinixpulse-md relative text-[#10201F]"
            id="calibration-sheet"
            style={{
              width: '210mm',
              minHeight: '297mm',
              height: '297mm',
              boxSizing: 'border-box',
              position: 'relative',
              backgroundColor: '#FFFFFF',
            }}
          >
            {/* Horizontal Alignment Ruler Lines - MUST measure from top: 0 of physical sheet */}
            <div
              className="calibration-ruler-area relative w-full"
              data-testid="calibration-ruler-area"
              style={{ position: 'absolute', top: 0, left: 0, right: 0 }}
            >
              {/* Zero reference marker at page top edge */}
              <div
                className="calibration-top-edge-marker"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  backgroundColor: '#E6F0ED',
                  borderBottom: '1.5px solid #287C75',
                  padding: '3px 8px',
                  textAlign: 'center',
                  fontSize: '9.5px',
                  fontWeight: '700',
                  color: '#123A3A',
                  letterSpacing: '0.06em',
                }}
              >
                <span>▲ 0 mm — PHYSICAL TOP EDGE OF A4 PAPER ▲</span>
              </div>

              {CALIBRATION_MARKS.map((mm) => {
                const isDefault = mm === 60;
                return (
                  <div
                    key={mm}
                    className={`calibration-line-marker ${isDefault ? 'is-default' : ''}`}
                    style={{
                      position: 'absolute',
                      top: `${mm}mm`,
                      left: 0,
                      right: 0,
                      height: '1px',
                    }}
                    data-mm={mm}
                  >
                    {/* Left Caliper Badge */}
                    <div
                      className="marker-badge marker-badge-left"
                      style={{
                        position: 'absolute',
                        left: '6mm',
                        top: '-10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        backgroundColor: isDefault ? '#287C75' : '#FFFFFF',
                        color: isDefault ? '#FFFFFF' : '#123A3A',
                        border: isDefault ? '1px solid #1f635d' : '1px solid #D9E6E2',
                        borderRadius: '4px',
                        padding: '1px 6px',
                        fontSize: '9.5px',
                        fontWeight: '700',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                        zIndex: 2,
                      }}
                    >
                      <span className="marker-val">{mm} mm</span>
                      {isDefault && (
                        <span
                          className="marker-tag"
                          style={{
                            backgroundColor: '#C9A45C',
                            color: '#FFFFFF',
                            fontSize: '8px',
                            fontWeight: '800',
                            padding: '0.5px 3.5px',
                            borderRadius: '3px',
                            marginLeft: '2px',
                            letterSpacing: '0.04em',
                          }}
                        >
                          RECOMMENDED
                        </span>
                      )}
                    </div>

                    {/* Horizontal Ruler Hairline */}
                    <div
                      className="marker-rule"
                      style={{
                        position: 'absolute',
                        left: '30mm',
                        right: '30mm',
                        top: 0,
                        borderTop: isDefault ? '1.5px dashed #287C75' : '1px dashed #94A3B8',
                        height: 0,
                      }}
                    >
                      <div
                        className="marker-center-crosshair"
                        style={{
                          position: 'absolute',
                          left: '50%',
                          top: '-8px',
                          transform: 'translateX(-50%)',
                          backgroundColor: '#FFFFFF',
                          padding: '0 6px',
                          fontSize: '8.5px',
                          fontWeight: '600',
                          color: isDefault ? '#287C75' : '#64748B',
                          whiteSpace: 'nowrap',
                          border: isDefault ? '1px solid #287C75' : '1px solid #CBD5E1',
                          borderRadius: '3px',
                        }}
                      >
                        <span>{mm} mm ({((mm / 25.4)).toFixed(2)} in)</span>
                      </div>
                    </div>

                    {/* Right Caliper Badge */}
                    <div
                      className="marker-badge marker-badge-right"
                      style={{
                        position: 'absolute',
                        right: '6mm',
                        top: '-10px',
                        backgroundColor: isDefault ? '#287C75' : '#FFFFFF',
                        color: isDefault ? '#FFFFFF' : '#123A3A',
                        border: isDefault ? '1px solid #1f635d' : '1px solid #D9E6E2',
                        borderRadius: '4px',
                        padding: '1px 6px',
                        fontSize: '9.5px',
                        fontWeight: '700',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                        zIndex: 2,
                      }}
                    >
                      <span className="marker-val">{mm} mm</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Explanatory Header & Instructions Section (Positioned below the 120mm ruler marks) */}
            <div
              className="calibration-info-section"
              style={{
                position: 'absolute',
                top: '136mm',
                left: '12mm',
                right: '12mm',
              }}
            >
              {/* Sheet Header Information */}
              <div
                className="calibration-header"
                style={{
                  borderBottom: '1.5px solid #D9E6E2',
                  paddingBottom: '10px',
                  marginBottom: '12px',
                }}
              >
                <div
                  className="calibration-title-row"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '4px',
                  }}
                >
                  <span
                    className="calibration-badge"
                    style={{
                      fontSize: '9px',
                      fontWeight: '800',
                      letterSpacing: '0.08em',
                      color: '#287C75',
                      backgroundColor: '#E6F0ED',
                      padding: '2px 8px',
                      borderRadius: '4px',
                    }}
                  >
                    CLINICRX CALIBRATION ENGINE
                  </span>
                  <span
                    className="calibration-paper-badge"
                    style={{
                      fontSize: '9px',
                      fontWeight: '700',
                      color: '#4E6460',
                      backgroundColor: '#F1F5F4',
                      padding: '2px 8px',
                      borderRadius: '4px',
                    }}
                  >
                    A4 (210 × 297 mm)
                  </span>
                </div>
                <h1
                  className="calibration-main-title font-heading"
                  style={{
                    fontSize: '18px',
                    fontWeight: '800',
                    color: '#10201F',
                    letterSpacing: '-0.02em',
                    margin: '4px 0 2px 0',
                  }}
                >
                  Doctor Letterhead Stationery Alignment Sheet
                </h1>
                <p
                  className="calibration-subtitle"
                  style={{
                    fontSize: '10.5px',
                    color: '#4E6460',
                    margin: 0,
                  }}
                >
                  Accurate physical millimeter ruler for pre-printed letterheads and RX pads
                </p>
              </div>

              {/* Step-by-Step Instructions Box */}
              <div
                className="calibration-guide-box"
                style={{
                  backgroundColor: '#F7FAF8',
                  border: '1px solid #D9E6E2',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  marginBottom: '16px',
                }}
              >
                <div
                  className="font-bold text-slate-700 mb-1.5 flex items-center gap-1.5"
                  style={{ fontSize: '11px', color: '#10201F' }}
                >
                  <Info size={14} className="text-[#287C75]" />
                  <span>How to Calibrate in 3 Easy Steps:</span>
                </div>
                <ol
                  className="calibration-steps"
                  style={{
                    margin: 0,
                    paddingLeft: '6px',
                    listStyle: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    fontSize: '10px',
                    color: '#4E6460',
                    lineHeight: '1.45',
                  }}
                >
                  <li>1. Print this sheet on plain blank A4 paper (set scale to 100% / Actual Size).</li>
                  <li>2. Place your pre-printed clinic letterhead over this sheet and hold them against a light source.</li>
                  <li>3. Note the millimeter line immediately below your clinic logo, then set that number as your Top Offset.</li>
                </ol>
              </div>

              {/* Technical Specifications Callout */}
              <div
                style={{
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '8px',
                  textAlign: 'center',
                  fontSize: '9px',
                  color: '#4E6460',
                  backgroundColor: '#FFFFFF',
                }}
              >
                <div>
                  <div style={{ fontWeight: '700', color: '#10201F' }}>Scale Accuracy</div>
                  <div>1:1 True Physical Scale</div>
                </div>
                <div>
                  <div style={{ fontWeight: '700', color: '#10201F' }}>Ruler Range</div>
                  <div>30 mm – 120 mm</div>
                </div>
                <div>
                  <div style={{ fontWeight: '700', color: '#10201F' }}>Factory Default</div>
                  <div style={{ color: '#287C75', fontWeight: '700' }}>60 mm (Standard Pad)</div>
                </div>
              </div>
            </div>

            {/* Footer Notice */}
            <div
              className="calibration-footer"
              style={{
                position: 'absolute',
                bottom: '12mm',
                left: '12mm',
                right: '12mm',
                borderTop: '1px solid #D9E6E2',
                paddingTop: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '9px',
                color: '#7D908C',
              }}
            >
              <div
                className="calibration-footer-left"
                style={{ display: 'flex', gap: '6px', alignItems: 'center' }}
              >
                <span>ClinicRx Medical Office Suite</span>
                <span>•</span>
                <span>Zero Stationery Waste Guarantee</span>
              </div>
              <div className="calibration-footer-right">
                <span>Default Recommended Top Offset: <strong style={{ color: '#10201F' }}>60 mm</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scoped Print Media Styles to ensure 100% scale A4 output */}
      <style>{`
        @media print {
          body.printing-calibration * {
            visibility: hidden !important;
          }
          body.printing-calibration #calibration-sheet,
          body.printing-calibration #calibration-sheet * {
            visibility: visible !important;
          }
          body.printing-calibration #calibration-sheet {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 210mm !important;
            height: 297mm !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
          }
          .no-print {
            display: none !important;
          }
          @page {
            size: A4 portrait;
            margin: 0;
          }
        }
      `}</style>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(sheetContent, document.body) : sheetContent;
}

export default TestPrintSheet;
