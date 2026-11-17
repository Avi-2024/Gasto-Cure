import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import PrintSettingsTab from '../pages/Settings/tabs/PrintSettingsTab';
import PrescriptionPage from '../pages/Prescriptions/PrescriptionPage';
import PrintPreviewModal from '../pages/Prescriptions/components/PrintPreviewModal';
import { localSettings, localPatients } from '../services/localStore';

describe('Clinic Logo & Digital Header Customizer Tests', () => {
  const dummyBase64Logo = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  beforeEach(() => {
    localStorage.clear();
    localSettings.update({
      clinicName: 'Gastro Cure Digestive Centre',
      clinicTagline: 'Liver & Therapeutic Endoscopy Specialist',
      clinicLogo: '',
      watermarkEnabled: false,
      watermarkOpacity: 0.06,
      doctorName: 'Dr. Aarav Sharma',
      qualification: 'MBBS, MD, DM (Gastro)',
      regNumber: 'MCI-98765/2015',
      phone: '9876543210',
      address: 'Suite 101, Medical Enclave, Main Ring Road, New Delhi 110024',
      timing: '10:00 AM - 02:00 PM, 06:00 PM - 09:00 PM',
      print: { padMode: false, topOffsetMm: 60 },
    });
  });

  describe('1. Settings - Logo Upload, Watermark & Address Customization', () => {
    it('renders logo upload dropzone and custom address fields', () => {
      render(<PrintSettingsTab />);

      expect(screen.getByText(/Clinic Branding, Logo & Header Information/i)).toBeTruthy();
      expect(screen.getByText(/Click to Upload Clinic Logo/i)).toBeTruthy();
      expect(screen.getByLabelText(/Custom Clinic Address/i)).toBeTruthy();
      expect(screen.getByLabelText(/Clinic Tagline/i)).toBeTruthy();
    });

    it('handles logo file upload and displays active preview with remove option', async () => {
      render(<PrintSettingsTab />);

      const fileInput = screen.getByLabelText(/Upload Clinic Logo/i);
      const fakeFile = new File(['fake-png-content'], 'clinic-logo.png', { type: 'image/png' });

      fireEvent.change(fileInput, { target: { files: [fakeFile] } });

      // After FileReader processes the file
      await waitFor(() => {
        expect(screen.getByText(/Clinic Logo Configured/i)).toBeTruthy();
      });

      expect(screen.getByAltText(/Clinic Logo Preview/i)).toBeTruthy();
      expect(screen.getByRole('button', { name: /Remove Clinic Logo/i })).toBeTruthy();
    });

    it('allows toggling subtle watermark and saves settings to localSettings', async () => {
      render(<PrintSettingsTab />);

      // Fill custom tagline and address
      const taglineInput = screen.getByLabelText(/Clinic Tagline/i);
      fireEvent.change(taglineInput, { target: { value: 'Advanced Endoscopy & Hepato Clinic' } });

      const addressInput = screen.getByLabelText(/Custom Clinic Address/i);
      fireEvent.change(addressInput, { target: { value: 'Shop 12, Level 1, Health Hub, Delhi' } });

      // Toggle watermark checkbox
      const watermarkCheck = screen.getByLabelText(/Enable subtle clinic logo watermark on print/i);
      fireEvent.click(watermarkCheck);
      expect(watermarkCheck.checked).toBe(true);

      // Save settings
      const saveBtn = screen.getByRole('button', { name: /Save Settings/i });
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(screen.getByText(/Print configuration and clinic demographics saved successfully!/i)).toBeTruthy();
      });

      const saved = localSettings.get();
      expect(saved.clinicTagline).toBe('Advanced Endoscopy & Hepato Clinic');
      expect(saved.address).toBe('Shop 12, Level 1, Health Hub, Delhi');
      expect(saved.watermarkEnabled).toBe(true);
    });

    it('allows removing an active logo', async () => {
      localSettings.update({ clinicLogo: dummyBase64Logo });
      render(<PrintSettingsTab />);

      expect(screen.getByText(/Clinic Logo Configured/i)).toBeTruthy();

      const removeBtn = screen.getByRole('button', { name: /Remove Clinic Logo/i });
      fireEvent.click(removeBtn);

      expect(screen.queryByText(/Clinic Logo Configured/i)).toBeNull();
      expect(screen.getByText(/Click to Upload Clinic Logo/i)).toBeTruthy();
    });
  });

  describe('2. Digital Header & Watermark Rendering in Prescription Studio & Print Preview', () => {
    it('renders clinic logo, custom address, and watermark in Prescription Studio (Digital Header mode)', () => {
      localSettings.update({
        clinicLogo: dummyBase64Logo,
        clinicTagline: 'Advanced Endoscopy & Hepato Clinic',
        address: 'Shop 12, Level 1, Health Hub, Delhi',
        watermarkEnabled: true,
        print: { padMode: false },
      });

      const mockPatient = { id: 'PT-101', name: 'Rohan Verma', age: 38, gender: 'Male' };
      localPatients.add(mockPatient);

      render(
        <MemoryRouter initialEntries={[`/prescription/new?patientId=${mockPatient.id}`]}>
          <Routes>
            <Route path="/prescription/new" element={<PrescriptionPage />} />
          </Routes>
        </MemoryRouter>
      );

      // Verify digital letterhead displays logo
      const letterheadLogo = screen.getByAltText(/Gastro Cure Digestive Centre/i);
      expect(letterheadLogo).toBeTruthy();
      expect(letterheadLogo.getAttribute('src')).toBe(dummyBase64Logo);

      // Verify custom tagline and address
      expect(screen.getByText('Advanced Endoscopy & Hepato Clinic')).toBeTruthy();
      expect(screen.getByText('Shop 12, Level 1, Health Hub, Delhi')).toBeTruthy();

      // Verify watermark is rendered
      const watermarkEl = document.querySelector('.prescription-watermark-overlay');
      expect(watermarkEl).toBeTruthy();
    });

    it('renders clinic logo, custom address, and watermark in PrintPreviewModal', () => {
      const clinicSettings = {
        clinicName: 'Gastro Cure Digestive Centre',
        clinicTagline: 'Advanced Endoscopy Specialist',
        clinicLogo: dummyBase64Logo,
        watermarkEnabled: true,
        address: 'Shop 12, Level 1, Health Hub, Delhi',
        phone: '9876543210',
        doctorName: 'Dr. Aarav Sharma',
        qualification: 'MBBS, MD',
        regNumber: 'MCI-98765',
      };

      const printSettings = { padMode: false, topOffsetMm: 60 };

      render(
        <PrintPreviewModal
          isOpen={true}
          onClose={() => {}}
          patient={{ name: 'Rohan Verma', age: 38, gender: 'Male' }}
          prescriptionDate="2026-11-16"
          vitals={{}}
          symptoms=""
          diagnosis=""
          advice=""
          medicines={[]}
          followUpDate="14 Days"
          rxId="RX-2026-TEST"
          printSettings={printSettings}
          clinicSettings={clinicSettings}
          onPrint={() => {}}
          onShareWhatsApp={() => {}}
        />
      );

      // Verify logo in preview header
      const previewLogo = screen.getByAltText(/Gastro Cure Digestive Centre/i);
      expect(previewLogo).toBeTruthy();
      expect(previewLogo.getAttribute('src')).toBe(dummyBase64Logo);

      // Verify tagline and address
      expect(screen.getByText('Advanced Endoscopy Specialist')).toBeTruthy();
      expect(screen.getByText('Shop 12, Level 1, Health Hub, Delhi')).toBeTruthy();

      // Verify watermark in preview modal
      const previewWatermark = document.querySelector('.preview-watermark-overlay');
      expect(previewWatermark).toBeTruthy();
    });
  });
});
