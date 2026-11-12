import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  Activity,
  CalendarDays,
  ClipboardList,
  FileText,
  LayoutDashboard,
  LogOut,
  Pill,
  Receipt,
  Settings,
  Users,
  MessageSquare,
  X,
} from 'lucide-react';
import NivaraLogo from '../common/NivaraLogo';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Grouped navigation structure for Nivara Outpatient Platform.
 * Supports Operations, Clinical Masters, Configuration, and Secondary Role Links.
 */
const navigationGroups = [
  {
    id: 'operations',
    title: 'Operations',
    items: [
      {
        label: 'Dashboard',
        to: '/dashboard',
        icon: LayoutDashboard,
        roles: ['CLINIC_OWNER', 'DOCTOR', 'RECEPTIONIST'],
      },
      {
        label: 'Patients',
        to: '/patients',
        icon: Users,
        roles: ['CLINIC_OWNER', 'DOCTOR', 'RECEPTIONIST'],
      },
      {
        label: 'Appointments',
        to: '/appointments',
        icon: CalendarDays,
        roles: ['CLINIC_OWNER', 'DOCTOR', 'RECEPTIONIST'],
      },
      {
        label: 'Patient Chat',
        to: '/chat',
        icon: MessageSquare,
        roles: ['CLINIC_OWNER', 'DOCTOR', 'RECEPTIONIST'],
      },
      {
        label: 'Prescriptions',
        to: '/prescriptions',
        icon: FileText,
        roles: ['CLINIC_OWNER', 'DOCTOR'],
      },
      {
        label: 'Doctor Console',
        to: '/doctor',
        icon: Activity,
        roles: ['CLINIC_OWNER', 'DOCTOR'],
      },
      {
        label: 'Reception Desk',
        to: '/reception',
        icon: ClipboardList,
        roles: ['CLINIC_OWNER', 'RECEPTIONIST'],
      },
      {
        label: 'Billing & Invoices',
        to: '/billing',
        icon: Receipt,
        roles: ['CLINIC_OWNER', 'RECEPTIONIST'],
      },
    ],
  },
  {
    id: 'clinical_masters',
    title: 'Clinical Masters',
    items: [
      {
        label: 'Master Formulary',
        to: '/medicines',
        icon: Pill,
        roles: ['CLINIC_OWNER', 'DOCTOR'],
      },
    ],
  },
  {
    id: 'configuration',
    title: 'Configuration',
    items: [
      {
        label: 'Settings & Calibration',
        to: '/settings',
        icon: Settings,
        roles: ['CLINIC_OWNER'],
      },
    ],
  },
];

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const role = user?.role || 'DOCTOR';

  // Compute user name and initials without redundant "Dr." prefixes
  const rawName = user?.name || (user?.email ? user.email.split('@')[0].replace(/[._-]/g, ' ') : 'Doctor');
  const cleanName = rawName.replace(/^dr\.?\s+/i, '');
  const formattedName = cleanName
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
  const displayName = role === 'DOCTOR' ? `Dr. ${formattedName}` : formattedName;
  const initials = formattedName
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || (role === 'DOCTOR' ? 'DR' : 'U');
  const roleLabel = role.replace(/_/g, ' ');

  // Filter groups according to user role
  const filteredGroups = navigationGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.roles.includes(role)),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs transition-opacity md:hidden"
          onClick={onClose}
          aria-label="Close menu overlay"
        />
      )}

      {/* Main Sidebar Shell */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[268px] shrink-0 flex-col bg-[#123A3A] p-4 text-slate-100 shadow-2xl transition-transform duration-300 ease-in-out md:sticky md:top-0 md:h-screen md:translate-x-0 md:shadow-none overflow-hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Main Navigation"
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 pt-1">
          <NivaraLogo theme="dark" size="md" />
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white transition md:hidden"
            aria-label="Close menu"
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>

        {/* Grouped Navigation */}
        <nav className="mt-4 flex-1 space-y-5 overflow-y-auto pr-1" aria-label="Sidebar">
          {filteredGroups.map((group) => (
            <div key={group.id} className="space-y-1">
              <p className="px-3 text-[11px] font-bold uppercase tracking-[0.16em] text-teal-200/50">
                {group.title}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `group relative flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-[#287C75] text-white shadow-sm font-semibold'
                          : 'text-slate-200/80 hover:bg-white/5 hover:text-white'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <div className="flex items-center gap-3 min-w-0">
                          <item.icon
                            size={18}
                            className={`shrink-0 transition-colors ${
                              isActive ? 'text-white' : 'text-slate-300 group-hover:text-white'
                            }`}
                          />
                          <span className="truncate">{item.label}</span>
                        </div>
                        {isActive && (
                          <span
                            className="h-2 w-2 shrink-0 rounded-full bg-[#C9A45C] shadow-[0_0_8px_#C9A45C]"
                            aria-hidden="true"
                          />
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Doctor Profile Pill & Logout */}
        <div className="mt-auto pt-4 border-t border-white/10">
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 p-2.5">
            <Link
              to="/profile"
              onClick={onClose}
              className="flex items-center gap-2.5 min-w-0 hover:opacity-90 transition group cursor-pointer"
              title="View & Edit Doctor Profile"
            >
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#287C75] text-xs font-bold text-white shadow-sm ring-1 ring-white/20 group-hover:ring-[#C9A45C]/50 transition">
                {initials}
              </span>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-white group-hover:text-teal-200 transition">
                  {displayName}
                </p>
                <span className="inline-block text-[10px] uppercase tracking-wider text-teal-200/80 font-medium">
                  {roleLabel}
                </span>
              </div>
            </Link>

            <button
              type="button"
              onClick={logout}
              title="Logout"
              aria-label="Logout"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-transparent text-slate-300 transition hover:border-rose-400/30 hover:bg-rose-500/15 hover:text-rose-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
