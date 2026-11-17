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
  PanelLeftClose,
  PanelLeftOpen,
  ChevronLeft,
  ChevronRight,
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
        roles: ['CLINIC_OWNER', 'DOCTOR'],
      },
    ],
  },
];

export default function Sidebar({ isOpen, onClose, onToggle }) {
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

  const handleLinkClick = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 768 && onClose) {
      onClose();
    }
  };

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

      {/* Main Sidebar Shell (Collapsible between Expanded 268px and Mini Icon Rail 72px) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex shrink-0 flex-col bg-[#123A3A] text-slate-100 shadow-2xl transition-all duration-300 ease-in-out md:sticky md:top-0 md:h-screen md:shadow-none relative md:overflow-visible ${
          isOpen
            ? 'w-[268px] p-4 translate-x-0 opacity-100 pointer-events-auto'
            : 'w-0 p-0 -translate-x-full md:w-[72px] md:p-3 md:translate-x-0 md:opacity-100 md:pointer-events-auto'
        }`}
        aria-label="Main Navigation"
      >
        {/* Border Center Toggle Button (Centered at vertical middle of sidebar right border) */}
        <button
          type="button"
          onClick={onToggle}
          className="hidden md:flex absolute top-1/2 -right-3.5 -translate-y-1/2 z-50 h-7 w-7 items-center justify-center rounded-full border border-white/20 bg-[#123A3A] text-slate-200 shadow-md hover:bg-[#287C75] hover:text-white hover:border-[#287C75] hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer group"
          title={isOpen ? "Collapse sidebar (Ctrl+B)" : "Expand sidebar (Ctrl+B)"}
          aria-label={isOpen ? "Close menu" : "Open menu"}
        >
          {isOpen ? (
            <ChevronLeft size={14} className="transition-transform group-hover:-translate-x-0.5" />
          ) : (
            <ChevronRight size={14} className="transition-transform group-hover:translate-x-0.5" />
          )}
        </button>

        {isOpen ? (
          /* ═══════════════════════════════════════════════════════════════
             1. EXPANDED SIDEBAR CONTENT (268px)
             ═══════════════════════════════════════════════════════════════ */
          <div className="w-[236px] flex flex-col flex-1 min-h-0">
            {/* Brand Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4 pt-1">
              <NivaraLogo theme="dark" size="md" />
              <button
                type="button"
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white transition cursor-pointer md:hidden"
                aria-label="Close mobile menu"
                title="Close menu drawer"
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
                        onClick={handleLinkClick}
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
                  onClick={handleLinkClick}
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
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-transparent text-slate-300 transition hover:border-rose-400/30 hover:bg-rose-500/15 hover:text-rose-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 cursor-pointer"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ═══════════════════════════════════════════════════════════════
             2. COLLAPSED MINI ICON RAIL (72px) - Matching Reference
             ═══════════════════════════════════════════════════════════════ */
          <div className="w-full flex flex-col flex-1 min-h-0 items-center">
            {/* Header: Centered Brand Mark */}
            <div className="flex items-center justify-center border-b border-white/10 pb-3.5 pt-1 w-full">
              <NivaraLogo variant="compact" theme="dark" size="sm" />
            </div>

            {/* Navigation: Centered Icon Rail with Senior UX Hover Tooltips */}
            <nav className="mt-3 flex-1 space-y-1.5 overflow-y-auto w-full flex flex-col items-center pr-0.5" aria-label="Sidebar icons">
              {filteredGroups
                .filter((group) => group.id !== 'configuration')
                .map((group, groupIdx) => (
                  <React.Fragment key={group.id}>
                    {groupIdx > 0 && <div className="w-8 border-t border-white/10 my-1.5 shrink-0" />}
                    {group.items.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={handleLinkClick}
                        className={({ isActive }) =>
                          `group relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all ${
                            isActive
                              ? 'bg-[#287C75] text-white shadow-sm ring-1 ring-white/20 font-semibold'
                              : 'text-slate-300 hover:bg-white/10 hover:text-white'
                          }`
                        }
                        aria-label={item.label}
                        title={item.label}
                      >
                        {({ isActive }) => (
                          <>
                            <item.icon
                              size={18}
                              className={`shrink-0 transition-transform group-hover:scale-110 ${
                                isActive ? 'text-white' : 'text-slate-300 group-hover:text-white'
                              }`}
                            />
                            {isActive && (
                              <span
                                className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[#C9A45C] shadow-[0_0_6px_#C9A45C]"
                                aria-hidden="true"
                              />
                            )}
                            {/* Senior UX Floating Tooltip */}
                            <span className="pointer-events-none absolute left-full ml-3 z-50 hidden md:group-hover:flex items-center rounded-lg bg-[#0D2929] border border-white/15 px-2.5 py-1 text-xs font-semibold text-white whitespace-nowrap shadow-2xl">
                              {item.label}
                            </span>
                          </>
                        )}
                      </NavLink>
                    ))}
                  </React.Fragment>
                ))}
            </nav>

            {/* Doctor Profile Footer: Centered Avatar Circle, Settings & Logout (Matching Reference) */}
            <div className="mt-auto pt-2.5 border-t border-white/10 w-full flex flex-col items-center gap-1.5 pb-1">
              <Link
                to="/profile"
                onClick={handleLinkClick}
                className="group relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#287C75] text-xs font-bold text-white shadow-sm ring-1 ring-white/20 hover:ring-[#C9A45C]/50 transition cursor-pointer"
                aria-label={displayName}
                title={displayName}
              >
                <span>{initials}</span>
                <span className="pointer-events-none absolute left-full ml-3 z-50 hidden md:group-hover:flex items-center rounded-lg bg-[#0D2929] border border-white/15 px-2.5 py-1 text-xs font-semibold text-white whitespace-nowrap shadow-2xl">
                  {displayName} ({roleLabel})
                </span>
              </Link>

              {/* Settings Gear Icon */}
              <NavLink
                to="/settings"
                onClick={handleLinkClick}
                className={({ isActive }) =>
                  `group relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all ${
                    isActive
                      ? 'bg-[#287C75] text-white shadow-sm ring-1 ring-white/20'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`
                }
                aria-label="Settings & Calibration"
                title="Settings & Calibration"
              >
                <Settings size={18} />
                <span className="pointer-events-none absolute left-full ml-3 z-50 hidden md:group-hover:flex items-center rounded-lg bg-[#0D2929] border border-white/15 px-2.5 py-1 text-xs font-semibold text-white whitespace-nowrap shadow-2xl">
                  Settings & Calibration
                </span>
              </NavLink>

              {/* Red/Rose Logout Button */}
              <button
                type="button"
                onClick={logout}
                title="Logout"
                aria-label="Logout"
                className="group relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-rose-300 hover:bg-rose-500/20 hover:text-rose-200 transition cursor-pointer"
              >
                <LogOut size={16} />
                <span className="pointer-events-none absolute left-full ml-3 z-50 hidden md:group-hover:flex items-center rounded-lg bg-[#0D2929] border border-white/15 px-2.5 py-1 text-xs font-semibold text-rose-200 whitespace-nowrap shadow-2xl">
                  Logout
                </span>
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
