import { localSettings } from '../services/localStore';

export const MIN_PRINT_OFFSET_MM = 10;
export const MAX_PRINT_OFFSET_MM = 150;

export const DEFAULT_PRINT_SETTINGS = {
  paperSize: 'A4',
  padMode: true,
  topOffsetMm: 60,
  bottomOffsetMm: 20,
  bottomMarginMm: 20,
  leftMarginMm: 15,
  rightMarginMm: 15,
};

/**
 * Clamps a numerical value between min and max mm.
 * Falls back to defaultVal if invalid or missing.
 */
function clamp(val, min = MIN_PRINT_OFFSET_MM, max = MAX_PRINT_OFFSET_MM, defaultVal = 15) {
  if (val === undefined || val === null || val === '') return defaultVal;
  const num = Number(val);
  if (isNaN(num)) return defaultVal;
  return Math.min(Math.max(num, min), max);
}

/**
 * Sanitizes print settings to guarantee valid values within safety bounds (10mm - 150mm).
 * Accepts either a full settings object or just the print sub-object.
 */
export function sanitizePrintSettings(raw = {}) {
  const source = raw && typeof raw === 'object' && raw.print ? raw.print : (raw || {});

  const topOffsetMm = clamp(source.topOffsetMm, MIN_PRINT_OFFSET_MM, MAX_PRINT_OFFSET_MM, 60);
  const leftMarginMm = clamp(source.leftMarginMm, MIN_PRINT_OFFSET_MM, MAX_PRINT_OFFSET_MM, 15);
  const rightMarginMm = clamp(source.rightMarginMm, MIN_PRINT_OFFSET_MM, MAX_PRINT_OFFSET_MM, 15);

  const rawBottom = source.bottomMarginMm !== undefined ? source.bottomMarginMm : source.bottomOffsetMm;
  const bottomMarginMm = clamp(rawBottom, MIN_PRINT_OFFSET_MM, MAX_PRINT_OFFSET_MM, 20);

  const padMode = source.padMode !== undefined ? Boolean(source.padMode) : true;
  const paperSize = source.paperSize || 'A4';

  return {
    paperSize,
    padMode,
    topOffsetMm,
    leftMarginMm,
    rightMarginMm,
    bottomMarginMm,
    bottomOffsetMm: bottomMarginMm,
  };
}

/**
 * Retrieves the effective print settings by merging stored localSettings with any overrides.
 */
export function getEffectivePrintSettings(customSettings = null) {
  let stored = {};
  try {
    const full = localSettings?.get?.();
    if (full?.print) {
      stored = full.print;
    }
  } catch {
    stored = {};
  }

  const merged = {
    ...DEFAULT_PRINT_SETTINGS,
    ...stored,
    ...(customSettings?.print ? customSettings.print : customSettings || {}),
  };

  return sanitizePrintSettings(merged);
}

/**
 * Applies print configuration by injecting dynamic CSS variables on document :root.
 * - --print-top-offset (e.g. 60mm)
 * - --print-left-margin (e.g. 15mm)
 * - --print-right-margin (e.g. 15mm)
 * - --print-bottom-margin (e.g. 20mm)
 * Also toggles data-pad-mode and .pad-mode class on :root.
 */
export function applyPrintSettings(settings) {
  const sanitized = sanitizePrintSettings(settings);

  if (typeof document !== 'undefined' && document.documentElement) {
    const root = document.documentElement;
    root.style.setProperty('--print-top-offset', `${sanitized.topOffsetMm}mm`);
    root.style.setProperty('--print-left-margin', `${sanitized.leftMarginMm}mm`);
    root.style.setProperty('--print-right-margin', `${sanitized.rightMarginMm}mm`);
    root.style.setProperty('--print-bottom-margin', `${sanitized.bottomMarginMm}mm`);

    root.setAttribute('data-pad-mode', String(sanitized.padMode));
    root.classList.toggle('pad-mode', sanitized.padMode);
  }

  return sanitized;
}

/**
 * Generates an isolated @media print CSS rule string with the configured millimeter variables.
 */
export function generatePrintCss(settings) {
  const sanitized = sanitizePrintSettings(settings);

  return `@media print {
  :root {
    --print-top-offset: ${sanitized.topOffsetMm}mm;
    --print-left-margin: ${sanitized.leftMarginMm}mm;
    --print-right-margin: ${sanitized.rightMarginMm}mm;
    --print-bottom-margin: ${sanitized.bottomMarginMm}mm;
  }
}`;
}
