import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import FollowUpRemindersWidget from '../pages/Dashboard/components/FollowUpRemindersWidget';
import QuickPatientSearch from '../pages/Dashboard/components/QuickPatientSearch';
import DashboardPage from '../pages/Dashboard/DashboardPage';
import { localPatients, localVisits, localSettings } from '../services/localStore';

// Helper to create YYYY-MM-DD strings relative to today
const getRelativeDateStr = (dayOffset) => {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const mockedNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockedNavigate,
  };
});

// Mock AuthContext for DashboardPage
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { email: 'doctor@clinicrx.com' },
  }),
}));

describe('Follow-Up Reminders & Quick Patient Search - Task 7 Tests', () => {
  const todayStr = getRelativeDateStr(0);
  const tomorrowStr = getRelativeDateStr(1);
  const in2DaysStr = getRelativeDateStr(2);
  const overdueStr = getRelativeDateStr(-2);
  const farFutureStr = getRelativeDateStr(7);

  const mockPatients = [
    {
      id: 'PT-101',
      name: 'Rohan Verma',
      age: 35,
      gender: 'Male',
      contact: '9876543210',
      nextFollowUp: todayStr,
      status: 'Active',
    },
    {
      id: 'PT-102',
      name: 'Pooja Hegde',
      age: 28,
      gender: 'Female',
      contact: '9876543211',
      nextFollowUp: tomorrowStr,
      status: 'Follow-up',
    },
    {
      id: 'PT-103',
      name: 'Amitabh Roy',
      age: 62,
      gender: 'Male',
      contact: '9876543212',
      nextFollowUp: in2DaysStr,
      status: 'Active',
    },
    {
      id: 'PT-104',
      name: 'Sunita Mehra',
      age: 48,
      gender: 'Female',
      contact: '9876543213',
      nextFollowUp: overdueStr,
      status: 'Active',
    },
    {
      id: 'PT-105',
      name: 'Karan Singhania',
      age: 40,
      gender: 'Male',
      contact: '9876543214',
      nextFollowUp: farFutureStr, // In 7 days, should NOT appear in widget
      status: 'Active',
    },
  ];

  const mockVisits = [
    {
      id: 'RX-101',
      patientId: 'PT-101',
      patientName: 'Rohan Verma',
      patientAge: 35,
      patientGender: 'Male',
      patientMobile: '9876543210',
      diagnosis: 'Acute Gastritis',
      symptoms: 'Stomach pain, nausea',
      followUpDate: todayStr,
      nextFollowUp: todayStr,
      date: getRelativeDateStr(-5),
    },
    {
      id: 'RX-102',
      patientId: 'PT-102',
      patientName: 'Pooja Hegde',
      patientAge: 28,
      patientGender: 'Female',
      patientMobile: '9876543211',
      diagnosis: 'GERD & Acidity',
      symptoms: 'Heartburn',
      followUpDate: tomorrowStr,
      nextFollowUp: tomorrowStr,
      date: getRelativeDateStr(-4),
    },
    {
      id: 'RX-103',
      patientId: 'PT-103',
      patientName: 'Amitabh Roy',
      patientAge: 62,
      patientGender: 'Male',
      patientMobile: '9876543212',
      diagnosis: 'Hypertension Check',
      symptoms: 'Headache',
      followUpDate: in2DaysStr,
      nextFollowUp: in2DaysStr,
      date: getRelativeDateStr(-7),
    },
    {
      id: 'RX-104',
      patientId: 'PT-104',
      patientName: 'Sunita Mehra',
      patientAge: 48,
      patientGender: 'Female',
      patientMobile: '9876543213',
      diagnosis: 'Peptic Ulcer',
      symptoms: 'Epigastric pain',
      followUpDate: overdueStr,
      nextFollowUp: overdueStr,
      date: getRelativeDateStr(-10),
    },
  ];

  beforeEach(() => {
    localStorage.clear();
    mockedNavigate.mockReset();
    window.open = vi.fn();

    // Populate localStore
    mockPatients.forEach((p) => localPatients.add(p));
    mockVisits.forEach((v) => localVisits.save(v));
  });

  describe('FollowUpRemindersWidget Component', () => {
    it('correctly filters patients with follow-ups scheduled for today, tomorrow, in 2 days, and overdue', () => {
      render(
        <MemoryRouter>
          <FollowUpRemindersWidget />
        </MemoryRouter>
      );

      // Included patients
      expect(screen.getByText(/Rohan Verma/i)).toBeTruthy();
      expect(screen.getByText(/Pooja Hegde/i)).toBeTruthy();
      expect(screen.getByText(/Amitabh Roy/i)).toBeTruthy();
      expect(screen.getByText(/Sunita Mehra/i)).toBeTruthy();

      // Excluded patient (due in 7 days)
      expect(screen.queryByText(/Karan Singhania/i)).toBeNull();
    });

    it('displays appropriate status badges: Today, Tomorrow, In 2 Days, and Overdue', () => {
      render(
        <MemoryRouter>
          <FollowUpRemindersWidget />
        </MemoryRouter>
      );

      expect(screen.getByText('Today')).toBeTruthy();
      expect(screen.getByText('Tomorrow')).toBeTruthy();
      expect(screen.getByText('In 2 Days')).toBeTruthy();
      expect(screen.getByText('Overdue')).toBeTruthy();
    });

    it('displays patient contact, age/gender, and chief complaint/diagnosis', () => {
      render(
        <MemoryRouter>
          <FollowUpRemindersWidget />
        </MemoryRouter>
      );

      // Contact numbers
      expect(screen.getByText(/9876543210/i)).toBeTruthy();
      expect(screen.getByText(/9876543211/i)).toBeTruthy();

      // Diagnoses
      expect(screen.getByText(/Acute Gastritis/i)).toBeTruthy();
      expect(screen.getByText(/GERD & Acidity/i)).toBeTruthy();
    });

    it('clicking WhatsApp Reminder opens wa.me URL with patient name, clinic name, and follow-up info', () => {
      render(
        <MemoryRouter>
          <FollowUpRemindersWidget />
        </MemoryRouter>
      );

      const waButtons = screen.getAllByRole('button', { name: /WhatsApp Reminder/i });
      expect(waButtons.length).toBeGreaterThanOrEqual(4);

      // Click for first patient (Sunita Mehra - overdue)
      fireEvent.click(waButtons[0]);

      expect(window.open).toHaveBeenCalledTimes(1);
      const [openedUrl, target, windowFeatures] = window.open.mock.calls[0];

      expect(openedUrl).toContain('https://wa.me/919876543213');
      expect(target).toBe('_blank');
      expect(windowFeatures).toBe('noopener,noreferrer');

      const urlObj = new URL(openedUrl);
      const textParam = urlObj.searchParams.get('text');
      expect(textParam).toContain('Sunita Mehra');
      expect(textParam).toContain('ClinicRx');
      expect(textParam).toContain('follow-up');
    });

    it('toggles Mark Reminded status indicator when clicked', () => {
      render(
        <MemoryRouter>
          <FollowUpRemindersWidget />
        </MemoryRouter>
      );

      const markButtons = screen.getAllByRole('button', { name: /Mark Reminded/i });
      expect(markButtons.length).toBeGreaterThanOrEqual(4);

      // Click first button
      fireEvent.click(markButtons[0]);

      // Should now show Reminded indicator / toggle
      expect(screen.getByRole('button', { name: /Reminded ✓/i })).toBeTruthy();
    });

    it('displays empty state when no patients have follow-ups due', () => {
      localStorage.clear(); // Clear all patients and visits

      render(
        <MemoryRouter>
          <FollowUpRemindersWidget />
        </MemoryRouter>
      );

      expect(screen.getByText(/No Follow-up Reminders Due/i)).toBeTruthy();
    });
  });

  describe('QuickPatientSearch Component', () => {
    it('renders prominent search input and "+ New Patient" button', () => {
      render(
        <MemoryRouter>
          <QuickPatientSearch />
        </MemoryRouter>
      );

      expect(
        screen.getByPlaceholderText(/Search patient by name, mobile, or ID/i)
      ).toBeTruthy();
      expect(screen.getByRole('button', { name: /\+ New Patient|\+ Add Patient/i })).toBeTruthy();
    });

    it('filters dropdown instantly when typing patient name', () => {
      render(
        <MemoryRouter>
          <QuickPatientSearch />
        </MemoryRouter>
      );

      const input = screen.getByPlaceholderText(/Search patient by name, mobile, or ID/i);
      fireEvent.change(input, { target: { value: 'Rohan' } });

      expect(screen.getByText(/Rohan Verma/i)).toBeTruthy();
      expect(screen.queryByText(/Pooja Hegde/i)).toBeNull();
    });

    it('filters dropdown instantly when typing patient mobile number', () => {
      render(
        <MemoryRouter>
          <QuickPatientSearch />
        </MemoryRouter>
      );

      const input = screen.getByPlaceholderText(/Search patient by name, mobile, or ID/i);
      fireEvent.change(input, { target: { value: '9876543211' } });

      expect(screen.getByText(/Pooja Hegde/i)).toBeTruthy();
      expect(screen.queryByText(/Rohan Verma/i)).toBeNull();
    });

    it('filters dropdown instantly when typing patient ID', () => {
      render(
        <MemoryRouter>
          <QuickPatientSearch />
        </MemoryRouter>
      );

      const input = screen.getByPlaceholderText(/Search patient by name, mobile, or ID/i);
      fireEvent.change(input, { target: { value: 'PT-103' } });

      expect(screen.getByText(/Amitabh Roy/i)).toBeTruthy();
      expect(screen.queryByText(/Rohan Verma/i)).toBeNull();
    });

    it('navigates to /prescription/new?patientId=... when "New Prescription" clicked', () => {
      render(
        <MemoryRouter>
          <QuickPatientSearch />
        </MemoryRouter>
      );

      const input = screen.getByPlaceholderText(/Search patient by name, mobile, or ID/i);
      fireEvent.change(input, { target: { value: 'Rohan' } });

      const newRxBtn = screen.getByRole('button', { name: /New Prescription/i });
      fireEvent.click(newRxBtn);

      expect(mockedNavigate).toHaveBeenCalledWith('/prescription/new?patientId=PT-101');
    });

    it('navigates to patient profile/list when "View Profile" clicked', () => {
      render(
        <MemoryRouter>
          <QuickPatientSearch />
        </MemoryRouter>
      );

      const input = screen.getByPlaceholderText(/Search patient by name, mobile, or ID/i);
      fireEvent.change(input, { target: { value: 'Rohan' } });

      const viewProfileBtn = screen.getByRole('button', { name: /View Profile|Profile/i });
      fireEvent.click(viewProfileBtn);

      expect(mockedNavigate).toHaveBeenCalledWith('/patients?patientId=PT-101');
    });

    it('navigates to /patients?action=new when "+ New Patient" button is clicked', () => {
      render(
        <MemoryRouter>
          <QuickPatientSearch />
        </MemoryRouter>
      );

      const newPatientBtn = screen.getByRole('button', { name: /\+ New Patient|\+ Add Patient/i });
      fireEvent.click(newPatientBtn);

      expect(mockedNavigate).toHaveBeenCalledWith('/patients?action=new');
    });

    it('shows "No patients found" empty state when search query has no match', () => {
      render(
        <MemoryRouter>
          <QuickPatientSearch />
        </MemoryRouter>
      );

      const input = screen.getByPlaceholderText(/Search patient by name, mobile, or ID/i);
      fireEvent.change(input, { target: { value: 'NonexistentPatientXYZ' } });

      expect(screen.getByText(/No patients found/i)).toBeTruthy();
    });
  });

  describe('DashboardPage Integration', () => {
    it('mounts QuickPatientSearch and FollowUpRemindersWidget on the Dashboard', () => {
      render(
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      );

      // Search bar
      expect(
        screen.getByPlaceholderText(/Search patient by name, mobile, or ID/i)
      ).toBeTruthy();

      // Follow-up Reminders Widget header
      expect(screen.getByText(/Follow-Up Reminders/i)).toBeTruthy();
    });
  });
});
