import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import NivaraLogo from '../components/common/NivaraLogo';
import Sidebar from '../components/navigation/Sidebar';
import AppHeader from '../components/layout/AppHeader';
import DashboardLayout from '../layouts/DashboardLayout';
import * as AuthContext from '../contexts/AuthContext';

describe('Task 2: Global Navigation Shell & Brand Identity', () => {
  const mockLogout = vi.fn();
  const mockSwitchClinic = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: {
        id: 'doc-1',
        name: 'Abebe Bikila',
        email: 'dr.bikila@nivara.health',
        role: 'DOCTOR',
        clinicIds: ['clinic-1', 'clinic-2'],
      },
      activeClinicId: 'clinic-1',
      switchClinic: mockSwitchClinic,
      logout: mockLogout,
    });
  });

  describe('NivaraLogo Component', () => {
    it('renders default brandmark with hexagonal mark, S-curve flow, nodes, and wordmark', () => {
      const { container } = render(<NivaraLogo />);

      expect(screen.getByText('Nivara')).toBeDefined();
      expect(screen.getByText('Outpatient Platform')).toBeDefined();

      const svg = container.querySelector('svg');
      expect(svg).toBeDefined();

      // Hexagonal boundary polygon
      const polygon = container.querySelector('polygon');
      expect(polygon).toBeDefined();

      // Continuous S-curve flow path
      const path = container.querySelector('path');
      expect(path).toBeDefined();
      expect(path.getAttribute('d')).toContain('M 14 16 C 19 16');

      // 3 stage nodes (Entry, Consultation, Closure)
      const circles = container.querySelectorAll('circle');
      expect(circles.length).toBe(3);
    });

    it('renders compact variant containing only the icon without wordmark', () => {
      const { container } = render(<NivaraLogo variant="compact" />);
      expect(screen.queryByText('Nivara')).toBeNull();
      expect(screen.queryByText('Outpatient Platform')).toBeNull();
      expect(container.querySelector('svg')).toBeDefined();
    });

    it('renders monochrome variant with currentColor applied', () => {
      const { container } = render(<NivaraLogo variant="monochrome" />);
      expect(screen.getByText('Nivara')).toBeDefined();
      const polygon = container.querySelector('polygon');
      expect(polygon.getAttribute('stroke')).toBe('currentColor');
    });

    it('supports dark theme styling', () => {
      render(<NivaraLogo theme="dark" />);
      const wordmark = screen.getByText('Nivara');
      expect(wordmark.className).toContain('text-white');
    });
  });

  describe('Sidebar Component', () => {
    it('renders deep spruce teal background and Nivara brand header', () => {
      const { container } = render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <Sidebar isOpen={true} onClose={vi.fn()} />
        </MemoryRouter>
      );

      const aside = container.querySelector('aside');
      expect(aside.className).toContain('bg-[#123A3A]');
      expect(screen.getByText('Nivara')).toBeDefined();
    });

    it('displays grouped navigation for Operations and Clinical Masters for DOCTOR', () => {
      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <Sidebar isOpen={true} onClose={vi.fn()} />
        </MemoryRouter>
      );

      // Section titles
      expect(screen.getByText('Operations')).toBeDefined();
      expect(screen.getByText('Clinical Masters')).toBeDefined();

      // Nav Links
      expect(screen.getByText('Dashboard')).toBeDefined();
      expect(screen.getByText('Patients')).toBeDefined();
      expect(screen.getByText('Prescriptions')).toBeDefined();
      expect(screen.getByText('Doctor Console')).toBeDefined();
      expect(screen.getByText('Master Formulary')).toBeDefined();

      // Redundant action links should not appear in sidebar
      expect(screen.queryByText('New Prescription')).toBeNull();
      expect(screen.queryByText('Consultation')).toBeNull();

      // Configuration should not appear for DOCTOR
      expect(screen.queryByText('Configuration')).toBeNull();
      expect(screen.queryByText('Settings & Calibration')).toBeNull();
    });

    it('shows Configuration section when role is CLINIC_OWNER', () => {
      vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
        user: {
          id: 'owner-1',
          name: 'Clinic Owner',
          email: 'owner@nivara.health',
          role: 'CLINIC_OWNER',
          clinicIds: ['clinic-1'],
        },
        activeClinicId: 'clinic-1',
        switchClinic: mockSwitchClinic,
        logout: mockLogout,
      });

      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <Sidebar isOpen={true} onClose={vi.fn()} />
        </MemoryRouter>
      );

      expect(screen.getByText('Configuration')).toBeDefined();
      expect(screen.getByText('Settings & Calibration')).toBeDefined();
    });

    it('highlights active NavLink with #287C75 background and warm gold accent dot', () => {
      const { container } = render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <Sidebar isOpen={true} onClose={vi.fn()} />
        </MemoryRouter>
      );

      const dashboardLink = screen.getByText('Dashboard').closest('a');
      expect(dashboardLink.className).toContain('bg-[#287C75]');
      expect(dashboardLink.className).toContain('text-white');

      // Accent dot
      const goldDot = dashboardLink.querySelector('.bg-\\[\\#C9A45C\\]');
      expect(goldDot).toBeDefined();
    });

    it('renders doctor profile pill with initials avatar, name, role, and logout trigger', () => {
      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <Sidebar isOpen={true} onClose={vi.fn()} />
        </MemoryRouter>
      );

      expect(screen.getByText('AB')).toBeDefined();
      expect(screen.getByText(/Dr\. Abebe Bikila/i)).toBeDefined();
      expect(screen.getByText('DOCTOR')).toBeDefined();

      const logoutBtn = screen.getByLabelText('Logout');
      fireEvent.click(logoutBtn);
      expect(mockLogout).toHaveBeenCalledTimes(1);
    });

    it('filters navigation items for RECEPTIONIST role and does not prepend Dr. to non-doctors', () => {
      vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
        user: {
          id: 'rec-1',
          name: 'Pooja Sharma',
          email: 'pooja.sharma@nivara.health',
          role: 'RECEPTIONIST',
          clinicIds: ['clinic-1'],
        },
        activeClinicId: 'clinic-1',
        switchClinic: mockSwitchClinic,
        logout: mockLogout,
      });

      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <Sidebar isOpen={true} onClose={vi.fn()} />
        </MemoryRouter>
      );

      // Permitted items for receptionist
      expect(screen.getByText('Dashboard')).toBeDefined();
      expect(screen.getByText('Patients')).toBeDefined();
      expect(screen.getByText('Appointments')).toBeDefined();
      expect(screen.getByText('Billing & Invoices')).toBeDefined();
      expect(screen.getByText('Reception Desk')).toBeDefined();

      // Clinical items must be hidden
      expect(screen.queryByText('Prescriptions')).toBeNull();
      expect(screen.queryByText('New Prescription')).toBeNull();
      expect(screen.queryByText('Master Formulary')).toBeNull();
      expect(screen.queryByText('Settings & Calibration')).toBeNull();

      // Non-doctor profile displays without "Dr."
      expect(screen.getByText('Pooja Sharma')).toBeDefined();
      expect(screen.queryByText(/Dr\. Pooja Sharma/i)).toBeNull();
    });

    it('safely handles doctor emails starting with dr. without repeating Dr. title', () => {
      vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
        user: {
          id: 'doc-2',
          email: 'dr.aarav.sharma@nivara.health',
          role: 'DOCTOR',
          clinicIds: ['clinic-1'],
        },
        activeClinicId: 'clinic-1',
        switchClinic: mockSwitchClinic,
        logout: mockLogout,
      });

      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <Sidebar isOpen={true} onClose={vi.fn()} />
        </MemoryRouter>
      );

      // Must be "Dr. Aarav Sharma", never "Dr. Dr Aarav Sharma"
      expect(screen.getByText('Dr. Aarav Sharma')).toBeDefined();
      expect(screen.queryByText(/Dr\. Dr/i)).toBeNull();
    });
  });

  describe('AppHeader Component', () => {
    it('renders floating frosted card with border-[#D9E6E2] and shadow-nivara-xs', () => {
      const { container } = render(<AppHeader onMenuClick={vi.fn()} />);
      const header = container.querySelector('header');
      expect(header.className).toContain('bg-white/85');
      expect(header.className).toContain('backdrop-blur-md');
      expect(header.className).toContain('border-[#D9E6E2]');
      expect(header.className).toContain('shadow-nivara-xs');
    });

    it('renders search input with ⌘K shortcut cue and focuses on ⌘K press', () => {
      const { container } = render(<AppHeader onMenuClick={vi.fn()} />);

      const searchInput = screen.getByPlaceholderText(/Search patients, prescriptions/i);
      expect(searchInput).toBeDefined();
      expect(screen.getByText('⌘K')).toBeDefined();

      // Trigger shortcut Cmd+K
      fireEvent.keyDown(window, { key: 'k', metaKey: true });
      expect(document.activeElement).toBe(searchInput);
    });

    it('renders contextual clinic switcher with status dot and switch handler', () => {
      render(<AppHeader onMenuClick={vi.fn()} />);

      const clinicSelect = screen.getByLabelText('Select clinic');
      expect(clinicSelect.value).toBe('clinic-1');

      fireEvent.change(clinicSelect, { target: { value: 'clinic-2' } });
      expect(mockSwitchClinic).toHaveBeenCalledWith('clinic-2');
    });

    it('renders doctor badge and mobile menu button', () => {
      const onMenuClick = vi.fn();
      render(<AppHeader onMenuClick={onMenuClick} />);

      expect(screen.getByText(/Dr\. Abebe Bikila/i)).toBeDefined();
      const menuBtn = screen.getByLabelText('Open menu');
      fireEvent.click(menuBtn);
      expect(onMenuClick).toHaveBeenCalledTimes(1);
    });

    it('navigates to /patients?search=... on Enter keypress when query is non-empty', () => {
      const mockNav = vi.fn();
      render(<AppHeader onMenuClick={vi.fn()} navigate={mockNav} />);

      const searchInput = screen.getByPlaceholderText(/Search patients, prescriptions/i);

      // Whitespace only - should not navigate
      fireEvent.change(searchInput, { target: { value: '   ' } });
      fireEvent.keyDown(searchInput, { key: 'Enter' });
      expect(mockNav).not.toHaveBeenCalled();

      // Non-empty query - should navigate to /patients?search=...
      fireEvent.change(searchInput, { target: { value: 'Anita' } });
      fireEvent.keyDown(searchInput, { key: 'Enter' });
      expect(mockNav).toHaveBeenCalledWith('/patients?search=Anita');
    });
  });

  describe('DashboardLayout Component', () => {
    it('sets main background to bg-[#F7FAF8] and embeds Sidebar and AppHeader', () => {
      const { container } = render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <DashboardLayout />
        </MemoryRouter>
      );

      const root = container.firstChild;
      expect(root.className).toContain('bg-[#F7FAF8]');
      expect(container.querySelector('aside')).toBeDefined();
      expect(container.querySelector('header')).toBeDefined();
    });

    it('omits AppHeader when route is prescription editor to eliminate double header and maximize vertical writing space', () => {
      const { container } = render(
        <MemoryRouter initialEntries={['/prescription/new']}>
          <DashboardLayout />
        </MemoryRouter>
      );

      expect(container.querySelector('header')).toBeNull();
      expect(container.querySelector('aside')).toBeDefined();
    });

    it('renders AppHeader on /prescriptions list history table', () => {
      const { container } = render(
        <MemoryRouter initialEntries={['/prescriptions']}>
          <DashboardLayout />
        </MemoryRouter>
      );

      expect(container.querySelector('header')).toBeDefined();
      expect(container.querySelector('aside')).toBeDefined();
    });
  });
});
