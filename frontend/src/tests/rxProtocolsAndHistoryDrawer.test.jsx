import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import PrescriptionPage from '../pages/Prescriptions/PrescriptionPage';
import { localPatients, localVisits, localMedicines, localSettings } from '../services/localStore';

describe('Prescription Studio - 1-Click Rx Protocols & Patient Past History Drawer', () => {
  const mockPatient = {
    id: 'PT-TEST-001',
    name: 'Amitabh Sharma',
    age: 45,
    gender: 'Male',
    contact: '9876543210',
    allergies: 'None',
  };

  const mockPastVisits = [
    {
      id: 'RX-PAST-101',
      visitId: 'RX-PAST-101',
      patientId: 'PT-TEST-001',
      patientName: 'Amitabh Sharma',
      date: '2026-10-15T10:00:00.000Z',
      visitDate: '2026-10-15T10:00:00.000Z',
      doctorName: 'Dr. Sharma',
      diagnosis: 'GERD / Acid Peptic Disease (APD)',
      symptoms: 'Severe Heartburn, Acid regurgitation',
      vitals: { bloodPressure: '128/84', weight: '76', pulseRate: '74' },
      medicines: [
        {
          name: 'Pantoprazole 40mg',
          frequency: '1-0-0',
          duration: '14 Days',
          remarks: 'Empty stomach',
        },
        {
          name: 'Domperidone 10mg',
          frequency: '1-0-1',
          duration: '5 Days',
          remarks: 'Before food',
        },
      ],
      advice: 'Avoid spicy, fried foods\nElevate head of bed by 6 inches',
    },
    {
      id: 'RX-PAST-102',
      visitId: 'RX-PAST-102',
      patientId: 'PT-TEST-001',
      patientName: 'Amitabh Sharma',
      date: '2026-08-10T11:00:00.000Z',
      visitDate: '2026-08-10T11:00:00.000Z',
      doctorName: 'Dr. Sharma',
      diagnosis: 'Acute Gastritis',
      symptoms: 'Epigastric burning pain',
      medicines: [
        {
          name: 'Rabeprazole 20mg',
          frequency: '1-0-0',
          duration: '7 Days',
          remarks: 'Empty stomach',
        },
      ],
      advice: 'Drink warm water, take small meals',
    },
  ];

  beforeEach(() => {
    localStorage.clear();
    localPatients.add(mockPatient);
    mockPastVisits.forEach((v) => localVisits.save(v));
    localSettings.update({
      clinicName: 'Gastro Cure Clinic',
      doctorName: 'Dr. Sharma',
      print: { padMode: true, topOffsetMm: 60 },
    });
  });

  const renderStudio = () => {
    return render(
      <MemoryRouter initialEntries={[`/prescription/new?patientId=${mockPatient.id}`]}>
        <Routes>
          <Route path="/prescription/new" element={<PrescriptionPage />} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('renders 1-Click Clinical Rx Protocols section and applies a protocol on click', async () => {
    renderStudio();

    // Verify 1-Click Clinical Rx Protocols section is rendered
    const protocolSection = screen.getByLabelText('Clinical Rx Protocols');
    expect(protocolSection).toBeTruthy();
    expect(screen.getByText(/1-Click Clinical Rx Protocols/i)).toBeTruthy();

    // Verify standard protocols are listed as buttons
    const gerdProtocolBtn = screen.getByRole('button', { name: /GERD & Acid Reflux/i });
    expect(gerdProtocolBtn).toBeTruthy();

    // Click to apply GERD protocol
    fireEvent.click(gerdProtocolBtn);

    // Verify symptoms and diagnosis were auto-populated
    const symptomsField = screen.getByPlaceholderText(/Enter patient symptoms and history/i);
    expect(symptomsField.value).toContain('Heartburn & Acidity');

    const diagnosisField = screen.getByPlaceholderText(/Enter Clinical diagnosis/i);
    expect(diagnosisField.value).toContain('GERD / Acid Peptic Disease');

    // Verify toast notification appears
    const toast = await screen.findByText(/Applied GERD & Acid Reflux Protocol/i);
    expect(toast).toBeTruthy();

    // Verify medicines were added to the prescription table
    expect(screen.getByDisplayValue('Pantoprazole 40mg')).toBeTruthy();
  });

  it('renders Past History trigger button with past visit count badge', () => {
    renderStudio();

    const pastHistoryBtn = screen.getByRole('button', { name: /Patient Past Visits History/i });
    expect(pastHistoryBtn).toBeTruthy();
    // 2 past visits loaded for PT-TEST-001
    expect(pastHistoryBtn.textContent).toContain('Past History');
    expect(pastHistoryBtn.textContent).toContain('2');
  });

  it('opens Patient Past History Drawer and allows 1-click repeating past Rx', async () => {
    renderStudio();

    // Open Past History Drawer
    const pastHistoryBtn = screen.getByRole('button', { name: /Patient Past Visits History/i });
    fireEvent.click(pastHistoryBtn);

    // Drawer should open and display previous visits
    const drawerHeader = await screen.findByText(/Past Visit Records/i);
    expect(drawerHeader).toBeTruthy();
    expect(screen.getByText(/RX-PAST-101/i)).toBeTruthy();
    expect(screen.getByText(/Severe Heartburn, Acid regurgitation/i)).toBeTruthy();

    // Click "Repeat This Rx" button for the first past visit
    const repeatBtns = screen.getAllByRole('button', { name: /Repeat This Rx/i });
    expect(repeatBtns.length).toBeGreaterThan(0);
    fireEvent.click(repeatBtns[0]);

    // Drawer should close and toast should appear
    await waitFor(() => {
      expect(screen.queryByText(/Past Visit Records/i)).toBeNull();
    });

    const repeatToast = await screen.findByText(/Repeated 2 medicines from visit/i);
    expect(repeatToast).toBeTruthy();

    // Verify medicines are loaded in table
    expect(screen.getByDisplayValue('Pantoprazole 40mg')).toBeTruthy();
    expect(screen.getByDisplayValue('Domperidone 10mg')).toBeTruthy();
  });
});
