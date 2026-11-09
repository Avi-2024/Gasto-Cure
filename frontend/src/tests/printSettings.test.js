import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { localSettings } from '../services/localStore';
import {
  applyPrintSettings,
  getEffectivePrintSettings,
  sanitizePrintSettings,
  generatePrintCss,
  MIN_PRINT_OFFSET_MM,
  MAX_PRINT_OFFSET_MM,
} from '../utils/printStyles';
import TestPrintSheet from '../pages/Settings/components/TestPrintSheet';
import PrintSettingsTab from '../pages/Settings/tabs/PrintSettingsTab';
import SettingsPage from '../pages/Settings/SettingsPage';

// In-memory localStorage polyfill for test environment
if (typeof globalThis.localStorage === 'undefined' || !globalThis.localStorage.getItem) {
  let store = {};
  globalThis.localStorage = {
    getItem: (key) => (Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null),
    setItem: (key, val) => {
      store[key] = String(val);
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
}

describe('Print Settings & Alignment Engine', () => {
  beforeEach(() => {
    localStorage.clear();
    // Reset root CSS variables
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.style.removeProperty('--print-top-offset');
      document.documentElement.style.removeProperty('--print-left-margin');
      document.documentElement.style.removeProperty('--print-right-margin');
      document.documentElement.style.removeProperty('--print-bottom-margin');
      document.documentElement.removeAttribute('data-pad-mode');
      document.documentElement.classList.remove('pad-mode');
    }
  });

  describe('1. Persistence via localSettings', () => {
    it('persists top offset, margins, and pad mode toggle', () => {
      const updated = localSettings.update({
        print: {
          topOffsetMm: 80,
          leftMarginMm: 20,
          rightMarginMm: 20,
          bottomOffsetMm: 25,
          padMode: false,
        },
      });

      expect(updated.print.topOffsetMm).toBe(80);
      expect(updated.print.leftMarginMm).toBe(20);
      expect(updated.print.rightMarginMm).toBe(20);
      expect(updated.print.bottomOffsetMm).toBe(25);
      expect(updated.print.padMode).toBe(false);

      // Verify persistence on reload
      const loaded = localSettings.get();
      expect(loaded.print.topOffsetMm).toBe(80);
      expect(loaded.print.leftMarginMm).toBe(20);
      expect(loaded.print.rightMarginMm).toBe(20);
      expect(loaded.print.bottomOffsetMm).toBe(25);
      expect(loaded.print.padMode).toBe(false);
    });

    it('toggles padMode between pre-printed pad and digital letterhead', () => {
      localSettings.update({ print: { padMode: true } });
      expect(localSettings.get().print.padMode).toBe(true);

      localSettings.update({ print: { padMode: false } });
      expect(localSettings.get().print.padMode).toBe(false);
    });
  });

  describe('2. Sanitization & Clamping (10mm - 150mm)', () => {
    it('clamps values below 10mm to 10mm', () => {
      const sanitized = sanitizePrintSettings({
        topOffsetMm: 4,
        leftMarginMm: -5,
        rightMarginMm: 0,
        bottomMarginMm: 2,
      });

      expect(sanitized.topOffsetMm).toBe(MIN_PRINT_OFFSET_MM);
      expect(sanitized.leftMarginMm).toBe(MIN_PRINT_OFFSET_MM);
      expect(sanitized.rightMarginMm).toBe(MIN_PRINT_OFFSET_MM);
      expect(sanitized.bottomMarginMm).toBe(MIN_PRINT_OFFSET_MM);
    });

    it('clamps values above 150mm to 150mm', () => {
      const sanitized = sanitizePrintSettings({
        topOffsetMm: 220,
        leftMarginMm: 180,
        rightMarginMm: 300,
        bottomMarginMm: 160,
      });

      expect(sanitized.topOffsetMm).toBe(MAX_PRINT_OFFSET_MM);
      expect(sanitized.leftMarginMm).toBe(MAX_PRINT_OFFSET_MM);
      expect(sanitized.rightMarginMm).toBe(MAX_PRINT_OFFSET_MM);
      expect(sanitized.bottomMarginMm).toBe(MAX_PRINT_OFFSET_MM);
    });

    it('handles numeric strings and invalid inputs with safe defaults', () => {
      const sanitized = sanitizePrintSettings({
        topOffsetMm: '65',
        leftMarginMm: 'invalid',
        rightMarginMm: null,
      });

      expect(sanitized.topOffsetMm).toBe(65);
      expect(sanitized.leftMarginMm).toBe(15); // default fallback
      expect(sanitized.rightMarginMm).toBe(15); // default fallback
    });
  });

  describe('3. applyPrintSettings CSS Variable Injection', () => {
    it('updates root CSS variables --print-top-offset, --print-left-margin, --print-right-margin, --print-bottom-margin', () => {
      const settings = {
        topOffsetMm: 75,
        leftMarginMm: 18,
        rightMarginMm: 18,
        bottomMarginMm: 22,
        padMode: true,
      };

      const result = applyPrintSettings(settings);

      expect(result.topOffsetMm).toBe(75);
      expect(document.documentElement.style.getPropertyValue('--print-top-offset')).toBe('75mm');
      expect(document.documentElement.style.getPropertyValue('--print-left-margin')).toBe('18mm');
      expect(document.documentElement.style.getPropertyValue('--print-right-margin')).toBe('18mm');
      expect(document.documentElement.style.getPropertyValue('--print-bottom-margin')).toBe('22mm');
      expect(document.documentElement.getAttribute('data-pad-mode')).toBe('true');
      expect(document.documentElement.classList.contains('pad-mode')).toBe(true);
    });

    it('works when passed full clinic settings object containing print property', () => {
      const fullSettings = {
        clinicName: 'Test Clinic',
        print: {
          topOffsetMm: 90,
          leftMarginMm: 25,
          rightMarginMm: 25,
          bottomOffsetMm: 30,
          padMode: false,
        },
      };

      applyPrintSettings(fullSettings);

      expect(document.documentElement.style.getPropertyValue('--print-top-offset')).toBe('90mm');
      expect(document.documentElement.style.getPropertyValue('--print-left-margin')).toBe('25mm');
      expect(document.documentElement.style.getPropertyValue('--print-right-margin')).toBe('25mm');
      expect(document.documentElement.style.getPropertyValue('--print-bottom-margin')).toBe('30mm');
      expect(document.documentElement.getAttribute('data-pad-mode')).toBe('false');
      expect(document.documentElement.classList.contains('pad-mode')).toBe(false);
    });

    it('sanitizes and clamps values before injecting into root CSS variables', () => {
      applyPrintSettings({
        topOffsetMm: 5,
        leftMarginMm: 200,
        rightMarginMm: -10,
        bottomMarginMm: 300,
      });

      expect(document.documentElement.style.getPropertyValue('--print-top-offset')).toBe('10mm');
      expect(document.documentElement.style.getPropertyValue('--print-left-margin')).toBe('150mm');
      expect(document.documentElement.style.getPropertyValue('--print-right-margin')).toBe('10mm');
      expect(document.documentElement.style.getPropertyValue('--print-bottom-margin')).toBe('150mm');
    });
  });

  describe('4. generatePrintCss & getEffectivePrintSettings', () => {
    it('generates valid @media print CSS string with millimeter units', () => {
      const css = generatePrintCss({
        topOffsetMm: 60,
        leftMarginMm: 15,
        rightMarginMm: 15,
        bottomMarginMm: 20,
      });

      expect(css).toContain('@media print');
      expect(css).toContain('--print-top-offset: 60mm;');
      expect(css).toContain('--print-left-margin: 15mm;');
      expect(css).toContain('--print-right-margin: 15mm;');
      expect(css).toContain('--print-bottom-margin: 20mm;');
    });

    it('retrieves effective print settings falling back to localSettings when none provided', () => {
      localSettings.update({
        print: {
          topOffsetMm: 68,
          padMode: true,
        },
      });

      const effective = getEffectivePrintSettings();
      expect(effective.topOffsetMm).toBe(68);
      expect(effective.padMode).toBe(true);
      expect(effective.leftMarginMm).toBe(15);
      expect(effective.bottomMarginMm).toBe(20);
    });
  });

  describe('5. TestPrintSheet Component', () => {
    it('renders calibration marks at 30mm, 40mm, 50mm, 60mm, 70mm, 80mm, 90mm, 100mm, 110mm, 120mm measuring from page top (0mm)', () => {
      const onPrint = vi.fn();
      const onClose = vi.fn();

      render(React.createElement(TestPrintSheet, { onPrint, onClose }));

      // Verify calibration heading and instructions
      expect(screen.getByText(/Print Alignment Calibration Sheet/i)).toBeTruthy();
      expect(screen.getByText(/Doctor Letterhead Stationery Alignment Sheet/i)).toBeTruthy();

      // Verify physical zero reference marker
      expect(screen.getByText(/PHYSICAL TOP EDGE OF A4 PAPER/i)).toBeTruthy();

      // Verify ruler area is present and properly positioned
      const rulerArea = screen.getByTestId('calibration-ruler-area');
      expect(rulerArea).toBeTruthy();
      expect(rulerArea.className).toContain('calibration-ruler-area');

      // Check all calibration millimeter lines are rendered with exact millimeter styles
      const requiredMarks = [30, 40, 50, 60, 70, 80, 90, 100, 110, 120];
      requiredMarks.forEach((mm) => {
        const matches = screen.getAllByText(new RegExp(`${mm}\\s*mm`, 'i'));
        expect(matches.length).toBeGreaterThan(0);

        const markerEl = document.querySelector(`.calibration-line-marker[data-mm="${mm}"]`);
        expect(markerEl).toBeTruthy();
        expect(markerEl.style.top).toBe(`${mm}mm`);
      });

      // Check trigger print button
      const printBtn = screen.getByRole('button', { name: /Print Calibration Sheet/i });
      fireEvent.click(printBtn);
      expect(onPrint).toHaveBeenCalledTimes(1);

      // Check close button
      const closeBtn = screen.getByTitle(/Close/i);
      fireEvent.click(closeBtn);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('closes TestPrintSheet on Escape key press', () => {
      const onClose = vi.fn();
      render(React.createElement(TestPrintSheet, { onClose }));

      fireEvent.keyDown(window, { key: 'Escape' });
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('6. PrintSettingsTab & SettingsPage Integration', () => {
    it('renders clinic demographics inputs, print configuration sliders, and live preview', () => {
      render(React.createElement(PrintSettingsTab));

      // Verify Demographics inputs
      expect(screen.getByPlaceholderText(/ClinicRx Gastro Centre/i)).toBeTruthy();
      expect(screen.getByPlaceholderText(/Dr\. Aarav Sharma/i)).toBeTruthy();
      expect(screen.getByPlaceholderText(/MBBS, MD/i)).toBeTruthy();
      expect(screen.getByPlaceholderText(/MCI-12345/i)).toBeTruthy();

      // Verify Print Mode buttons
      expect(screen.getByRole('button', { name: /Pre-printed Pad Mode/i })).toBeTruthy();
      expect(screen.getByRole('button', { name: /Plain Paper Letterhead/i })).toBeTruthy();

      // Verify Top Header Offset Slider & number input
      expect(screen.getByLabelText(/Top Header Offset/i)).toBeTruthy();
      expect(screen.getByLabelText(/Left Margin/i)).toBeTruthy();
      expect(screen.getByLabelText(/Right Margin/i)).toBeTruthy();
      expect(screen.getByLabelText(/Bottom Margin/i)).toBeTruthy();

      // Verify Live A4 diagram
      expect(screen.getByText(/Live A4 Paper Preview/i)).toBeTruthy();
      expect(screen.getByText(/Doctor Letterhead Area/i)).toBeTruthy();
    });

    it('updates top offset when moving slider and updates root CSS variables', () => {
      render(React.createElement(PrintSettingsTab));

      const topOffsetSlider = screen.getByLabelText(/Top Header Offset/i);
      fireEvent.change(topOffsetSlider, { target: { value: '85' } });

      // CSS variable should have been applied live
      expect(document.documentElement.style.getPropertyValue('--print-top-offset')).toBe('85mm');
    });

    it('resets print margins to default in a single batch when clicking Reset Defaults', () => {
      render(React.createElement(PrintSettingsTab));

      const topOffsetSlider = screen.getByLabelText(/Top Header Offset/i);
      fireEvent.change(topOffsetSlider, { target: { value: '95' } });
      expect(document.documentElement.style.getPropertyValue('--print-top-offset')).toBe('95mm');

      const resetBtn = screen.getByTitle(/Reset to 60mm default/i);
      fireEvent.click(resetBtn);

      expect(document.documentElement.style.getPropertyValue('--print-top-offset')).toBe('60mm');
    });

    it('toggles to digital letterhead mode and back to pad mode', () => {
      render(React.createElement(PrintSettingsTab));

      const plainPaperBtn = screen.getByRole('button', { name: /Plain Paper Letterhead/i });
      fireEvent.click(plainPaperBtn);

      expect(document.documentElement.getAttribute('data-pad-mode')).toBe('false');

      const padModeBtn = screen.getByRole('button', { name: /Pre-printed Pad Mode/i });
      fireEvent.click(padModeBtn);

      expect(document.documentElement.getAttribute('data-pad-mode')).toBe('true');
    });

    it('saves clinic demographics and print settings when clicking Save Settings', () => {
      render(React.createElement(PrintSettingsTab));

      const clinicInput = screen.getByPlaceholderText(/ClinicRx Gastro Centre/i);
      fireEvent.change(clinicInput, { target: { value: 'Medanta Care Clinic' } });

      const doctorInput = screen.getByPlaceholderText(/Dr\. Aarav Sharma/i);
      fireEvent.change(doctorInput, { target: { value: 'Dr. Neha Kapoor' } });

      const saveBtn = screen.getByRole('button', { name: /Save Settings/i });
      fireEvent.click(saveBtn);

      // Verify saved in localSettings
      const saved = localSettings.get();
      expect(saved.clinicName).toBe('Medanta Care Clinic');
      expect(saved.doctorName).toBe('Dr. Neha Kapoor');

      // Verify confirmation message appears
      expect(screen.getByText(/saved successfully/i)).toBeTruthy();
    });

    it('opens TestPrintSheet modal when clicking Test Print Alignment Sheet', () => {
      render(React.createElement(PrintSettingsTab));

      const testSheetBtn = screen.getByRole('button', { name: /Test Print Alignment Sheet/i });
      fireEvent.click(testSheetBtn);

      expect(screen.getByText(/Doctor Letterhead Stationery Alignment Sheet/i)).toBeTruthy();
      expect(screen.getByText(/How to Calibrate in 3 Easy Steps/i)).toBeTruthy();
    });

    it('renders SettingsPage tabs and switches between Print and Backup', () => {
      render(React.createElement(SettingsPage));

      expect(screen.getByText(/System & Clinic Settings/i)).toBeTruthy();
      expect(screen.getByRole('button', { name: /Print Alignment & Demographics/i })).toBeTruthy();
      expect(screen.getByRole('button', { name: /Data Backup & Restore/i })).toBeTruthy();

      // Switch to backup tab
      const backupTab = screen.getByRole('button', { name: /Data Backup & Restore/i });
      fireEvent.click(backupTab);

      expect(screen.getByText(/Offline Data Backup & Restore/i)).toBeTruthy();
      expect(screen.getByText(/Download JSON Backup/i)).toBeTruthy();
    });
  });
});
