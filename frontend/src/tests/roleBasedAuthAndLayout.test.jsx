import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import LoginPage from '../pages/Auth/LoginPage';
import ProtectedRoute from '../router/ProtectedRoute';
import BillingPage from '../pages/Billing/BillingPage';
import DoctorDashboardPage from '../pages/Doctor/DoctorDashboardPage';
import DashboardLayout from '../layouts/DashboardLayout';
import * as AuthContext from '../contexts/AuthContext';

describe('Phase 2: Role-Based Auth, Viewport Layout & Operational Views', () => {
  const mockLogin = vi.fn();
  const mockLogout = vi.fn();
  const mockSwitchClinic = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('LoginPage Component', () => {
    beforeEach(() => {
      vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
        isAuthenticated: false,
        user: null,
        login: mockLogin,
      });
    });

    it('renders Nivara brand identity and 3 distinct role presets', () => {
      render(
        <MemoryRouter initialEntries={['/auth/login']}>
          <LoginPage />
        </MemoryRouter>
      );

      expect(screen.getByText('Nivara')).toBeDefined();
      expect(screen.getByText(/Secure Clinic Gateway/i)).toBeDefined();
      expect(screen.getByText(/Sign in to Nivara/i)).toBeDefined();

      // 3 role selector options
      expect(screen.getAllByText('Doctor').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Clinic').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Reception').length).toBeGreaterThanOrEqual(1);
    });

    it('switches role and destination when clicking a role tab', () => {
      render(
        <MemoryRouter initialEntries={['/auth/login']}>
          <LoginPage />
        </MemoryRouter>
      );

      // Default role is Doctor -> /doctor
      expect(screen.getAllByText(/\/doctor/i).length).toBeGreaterThanOrEqual(1);

      // Click Receptionist preset
      fireEvent.click(screen.getAllByText('Reception')[0]);
      expect(screen.getAllByText(/\/reception/i).length).toBeGreaterThanOrEqual(1);

      // Click Clinic Owner preset
      fireEvent.click(screen.getAllByText('Clinic')[0]);
      expect(screen.getAllByText(/\/dashboard/i).length).toBeGreaterThanOrEqual(1);
    });

    it('submits login credentials and redirects to role destination', () => {
      render(
        <MemoryRouter initialEntries={['/auth/login']}>
          <LoginPage />
        </MemoryRouter>
      );

      // Select Doctor and submit
      fireEvent.click(screen.getAllByText('Doctor')[0]);
      const submitBtn = screen.getByRole('button', { name: /Enter Doctor Console/i });
      fireEvent.click(submitBtn);

      expect(mockLogin).toHaveBeenCalledTimes(1);
      const callArg = mockLogin.mock.calls[0][0];
      expect(callArg.accessToken).toContain('header.');
    });

    it('automatically routes to Reception Desk (/reception) when receptionist email is entered directly', () => {
      render(
        <MemoryRouter initialEntries={['/auth/login']}>
          <LoginPage />
        </MemoryRouter>
      );

      const emailInput = screen.getByLabelText(/Work Email/i);
      const passwordInput = screen.getByPlaceholderText('••••••••');

      // Type receptionist email and password directly
      fireEvent.change(emailInput, { target: { value: 'reception@nivara.health' } });
      fireEvent.change(passwordInput, { target: { value: 'demo1234' } });

      // Verify button dynamically changes to Reception Desk
      const submitBtn = screen.getByRole('button', { name: /Enter Reception Desk/i });
      fireEvent.click(submitBtn);

      expect(mockLogin).toHaveBeenCalledTimes(1);
      const callArg = mockLogin.mock.calls[0][0];
      const payloadBase64 = callArg.accessToken.split('.')[1];
      const payload = JSON.parse(atob(payloadBase64));
      expect(payload.role).toBe('STAFF');
      expect(payload.email).toBe('reception@nivara.health');
    });

    it('automatically routes to Clinic Dashboard (/dashboard) when clinic owner email is entered directly', () => {
      render(
        <MemoryRouter initialEntries={['/auth/login']}>
          <LoginPage />
        </MemoryRouter>
      );

      const emailInput = screen.getByLabelText(/Work Email/i);
      const passwordInput = screen.getByPlaceholderText('••••••••');

      // Type owner email and password directly
      fireEvent.change(emailInput, { target: { value: 'owner@nivara.health' } });
      fireEvent.change(passwordInput, { target: { value: 'demo1234' } });

      // Verify button dynamically changes to Clinic Owner / Admin
      const submitBtn = screen.getByRole('button', { name: /Enter Clinic Owner/i });
      fireEvent.click(submitBtn);

      expect(mockLogin).toHaveBeenCalledTimes(1);
      const callArg = mockLogin.mock.calls[0][0];
      const payloadBase64 = callArg.accessToken.split('.')[1];
      const payload = JSON.parse(atob(payloadBase64));
      expect(payload.role).toBe('CLINIC_OWNER');
      expect(payload.email).toBe('owner@nivara.health');
    });

    it('shows error when invalid password is provided for a known staff account', () => {
      render(
        <MemoryRouter initialEntries={['/auth/login']}>
          <LoginPage />
        </MemoryRouter>
      );

      const emailInput = screen.getByLabelText(/Work Email/i);
      const passwordInput = screen.getByPlaceholderText('••••••••');

      fireEvent.change(emailInput, { target: { value: 'dr.sharma@nivara.health' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpass' } });

      const submitBtn = screen.getByRole('button', { name: /Enter Doctor Console/i });
      fireEvent.click(submitBtn);

      expect(screen.getByText(/Invalid password for dr\.sharma@nivara\.health/i)).toBeDefined();
      expect(mockLogin).not.toHaveBeenCalled();
    });
  });

  describe('ProtectedRoute Role-Aware Redirection', () => {
    it('redirects unauthenticated users to /auth/login', () => {
      vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
        isAuthenticated: false,
        user: null,
      });

      render(
        <MemoryRouter initialEntries={['/doctor']}>
          <Routes>
            <Route path="/auth/login" element={<div>Login Page Mock</div>} />
            <Route element={<ProtectedRoute allowedRoles={['DOCTOR']} />}>
              <Route path="/doctor" element={<div>Doctor Panel</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText('Login Page Mock')).toBeDefined();
      expect(screen.queryByText('Doctor Panel')).toBeNull();
    });

    it('redirects unauthorized RECEPTIONIST away from /doctor to /reception', () => {
      vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
        isAuthenticated: true,
        user: { role: 'RECEPTIONIST' },
      });

      render(
        <MemoryRouter initialEntries={['/doctor']}>
          <Routes>
            <Route path="/reception" element={<div>Reception Desk Home</div>} />
            <Route path="/dashboard" element={<div>Admin Dashboard</div>} />
            <Route element={<ProtectedRoute allowedRoles={['CLINIC_OWNER', 'DOCTOR']} />}>
              <Route path="/doctor" element={<div>Doctor Panel</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText('Reception Desk Home')).toBeDefined();
      expect(screen.queryByText('Doctor Panel')).toBeNull();
    });

    it('redirects unauthorized DOCTOR away from /reception to /doctor', () => {
      vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
        isAuthenticated: true,
        user: { role: 'DOCTOR' },
      });

      render(
        <MemoryRouter initialEntries={['/reception']}>
          <Routes>
            <Route path="/doctor" element={<div>Doctor Console Home</div>} />
            <Route path="/dashboard" element={<div>Admin Dashboard</div>} />
            <Route element={<ProtectedRoute allowedRoles={['CLINIC_OWNER', 'RECEPTIONIST']} />}>
              <Route path="/reception" element={<div>Reception Desk</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText('Doctor Console Home')).toBeDefined();
      expect(screen.queryByText('Reception Desk')).toBeNull();
    });

    it('allows authorized role to render child route', () => {
      vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
        isAuthenticated: true,
        user: { role: 'DOCTOR' },
      });

      render(
        <MemoryRouter initialEntries={['/doctor']}>
          <Routes>
            <Route element={<ProtectedRoute allowedRoles={['CLINIC_OWNER', 'DOCTOR']} />}>
              <Route path="/doctor" element={<div>Doctor Console Content</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText('Doctor Console Content')).toBeDefined();
    });
  });

  describe('BillingPage Component', () => {
    it('renders financial KPIs and invoice table', () => {
      render(
        <MemoryRouter initialEntries={['/billing']}>
          <BillingPage />
        </MemoryRouter>
      );

      expect(screen.getByText('Billing & Invoices')).toBeDefined();
      expect(screen.getByText('Total Collected')).toBeDefined();
      expect(screen.getByText('Today\'s Revenue')).toBeDefined();
      expect(screen.getByText('Pending Dues')).toBeDefined();
      expect(screen.getByText('INV-2026-001')).toBeDefined();
      expect(screen.getByText('Anita Sharma')).toBeDefined();
    });

    it('allows creating a new patient invoice and persists it', () => {
      render(
        <MemoryRouter initialEntries={['/billing']}>
          <BillingPage />
        </MemoryRouter>
      );

      // Open modal
      fireEvent.click(screen.getByText(/Create Invoice/i));
      expect(screen.getByText('New Patient Invoice')).toBeDefined();

      // Enter patient name
      const nameInput = screen.getByPlaceholderText('Patient Name');
      fireEvent.change(nameInput, { target: { value: 'Deepak Chopra' } });

      // Submit form
      fireEvent.click(screen.getByText('Save & Issue'));

      // Verify invoice appears in table
      expect(screen.getByText('Deepak Chopra')).toBeDefined();
    });
  });

  describe('DoctorDashboardPage Component', () => {
    beforeEach(() => {
      vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
        user: {
          name: 'Abebe Bikila',
          email: 'dr.bikila@nivara.health',
          role: 'DOCTOR',
        },
        activeClinicId: 'clinic-1',
      });
    });

    it('renders doctor greeting, clinical KPIs, and direct action cards', () => {
      render(
        <MemoryRouter initialEntries={['/doctor']}>
          <DoctorDashboardPage />
        </MemoryRouter>
      );

      expect(screen.getByText(/Welcome back, Dr\. Abebe Bikila/i)).toBeDefined();
      expect(screen.getByText('Waiting Queue')).toBeDefined();
      expect(screen.getByText('Formulary Drugs')).toBeDefined();
      expect(screen.getByText('Start Consultation')).toBeDefined();
      expect(screen.getByText('Prescription Studio')).toBeDefined();
      expect(screen.getByText('Appointment Timeline')).toBeDefined();
      expect(screen.getByText('Patient Registry')).toBeDefined();
    });
  });

  describe('DashboardLayout Viewport Architecture', () => {
    beforeEach(() => {
      vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
        user: {
          name: 'Clinic Owner',
          email: 'owner@nivara.health',
          role: 'CLINIC_OWNER',
          clinicIds: ['clinic-1'],
        },
        activeClinicId: 'clinic-1',
        switchClinic: mockSwitchClinic,
        logout: mockLogout,
      });
    });

    it('structures root container with h-screen w-screen overflow-hidden to prevent body scroll', () => {
      const { container } = render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <DashboardLayout />
        </MemoryRouter>
      );

      const root = container.firstChild;
      expect(root.className).toContain('h-screen');
      expect(root.className).toContain('w-screen');
      expect(root.className).toContain('overflow-hidden');

      // Scrollable content area
      const main = container.querySelector('main');
      expect(main.className).toContain('overflow-y-auto');
      expect(main.className).toContain('overflow-x-hidden');
    });
  });
});
