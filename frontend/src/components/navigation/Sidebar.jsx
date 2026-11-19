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
import ClinixPulseLogo from '../common/ClinixPulseLogo';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Grouped navigation structure for ClinixPulse Outpatient Platform.
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

// Theme styles configuration for doctor customization (Previewable & Persistent)
export const SIDEBAR_THEMES = {
  classic: {
    id: 'classic',
    label: 'Classic Teal',
    asideClasses: 'bg-[#123A3A] text-slate-100',
    borderClasses: 'border-white/10',
    headerTheme: 'dark',
    sectionTitle: 'text-teal-200/50',
    navInactive: 'text-slate-200/80 hover:bg-white/5 hover:text-white',
    navActive: 'bg-[#287C75] text-white shadow-sm font-semibold',
    accentDot: 'bg-[#76C015] shadow-[0_0_8px_#76C015]',
    navIconInactive: 'text-slate-300 group-hover:text-white',
    navIconActive: 'text-white',
    profileBox: 'border-white/10 bg-white/5 text-white',
    profileSubtext: 'text-teal-200/80',
    profileHover: 'group-hover:text-teal-200',
    railItemInactive: 'text-slate-300 hover:bg-white/10 hover:text-white',
    railItemActive: 'bg-[#287C75] text-white shadow-sm ring-1 ring-white/20 font-semibold',
    tooltipBg: 'bg-[#0D2929] border-white/15 text-white',
    toggleBtn: 'bg-white text-slate-800 border-slate-300/90 shadow-[0_4px_14px_rgba(0,0,0,0.14)]',
  },
  light: {
    id: 'light',
    label: 'Light Luxury (Travigo)',
    asideClasses: 'bg-white text-slate-800 border-r border-slate-200/80 shadow-[4px_0_24px_rgba(0,0,0,0.03)]',
    borderClasses: 'border-slate-100',
    headerTheme: 'light',
    sectionTitle: 'text-slate-400 font-semibold tracking-wider',
    navInactive: 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
    navActive: 'bg-[#287C75] text-white shadow-sm font-semibold ring-1 ring-[#287C75]/20',
    accentDot: 'bg-[#76C015] shadow-[0_0_8px_#76C015]',
    navIconInactive: 'text-slate-400 group-hover:text-slate-700',
    navIconActive: 'text-white',
    profileBox: 'border-slate-200/90 bg-slate-50/80 text-slate-800',
    profileSubtext: 'text-slate-500',
    profileHover: 'group-hover:text-[#287C75]',
    railItemInactive: 'text-slate-500 hover:bg-slate-100 hover:text-slate-800',
    railItemActive: 'bg-[#287C75] text-white shadow-sm ring-1 ring-[#287C75]/20 font-semibold',
    tooltipBg: 'bg-slate-900 border-slate-700 text-white',
    toggleBtn: 'bg-white text-slate-800 border-slate-300 shadow-[0_4px_14px_rgba(0,0,0,0.12)] hover:border-slate-400',
  },
  navy: {
    id: 'navy',
    label: 'Royal Navy & Cyan',
    asideClasses: 'bg-[#071E33] text-slate-100 border-r border-[#00B4D8]/15 shadow-2xl',
    borderClasses: 'border-white/10',
    headerTheme: 'dark',
    sectionTitle: 'text-[#38BDF8]/80 font-bold tracking-widest text-[10px]',
    navInactive: 'text-slate-300 hover:bg-white/10 hover:text-white',
    navActive: 'bg-gradient-to-r from-[#0077B6] to-[#0096C7] text-white shadow-[0_4px_16px_rgba(0,180,216,0.25)] font-semibold ring-1 ring-cyan-400/40',
    accentDot: 'bg-[#76C015] shadow-[0_0_10px_#76C015]',
    navIconInactive: 'text-cyan-200/60 group-hover:text-cyan-200',
    navIconActive: 'text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.4)]',
    profileBox: 'border-cyan-500/20 bg-[#0B253D] text-white',
    profileSubtext: 'text-cyan-300/80',
    profileHover: 'group-hover:text-cyan-200',
    railItemInactive: 'text-slate-300 hover:bg-white/10 hover:text-white',
    railItemActive: 'bg-gradient-to-r from-[#0077B6] to-[#0096C7] text-white shadow-md ring-1 ring-cyan-400/50 font-semibold',
    tooltipBg: 'bg-[#061828] border-cyan-500/30 text-white',
    toggleBtn: 'bg-[#0B253D] text-cyan-300 border-cyan-500/40 shadow-md hover:bg-[#0E2E4B]',
  },
  pearl: {
    id: 'pearl',
    label: 'Warm Pearl Luxe',
    asideClasses: 'bg-[#FAF9F6] text-stone-800 border-r border-stone-200/80 shadow-[4px_0_24px_rgba(0,0,0,0.03)]',
    borderClasses: 'border-stone-200/70',
    headerTheme: 'light',
    sectionTitle: 'text-stone-400 font-bold tracking-wider text-[10px]',
    navInactive: 'text-stone-600 hover:bg-stone-200/50 hover:text-stone-900',
    navActive: 'bg-[#142A4A] text-white shadow-sm font-semibold ring-1 ring-[#142A4A]/20',
    accentDot: 'bg-[#76C015] shadow-[0_0_8px_#76C015]',
    navIconInactive: 'text-stone-400 group-hover:text-stone-700',
    navIconActive: 'text-white',
    profileBox: 'border-stone-200 bg-stone-100/80 text-stone-800',
    profileSubtext: 'text-stone-500',
    profileHover: 'group-hover:text-[#142A4A]',
    railItemInactive: 'text-stone-500 hover:bg-stone-200/60 hover:text-stone-800',
    railItemActive: 'bg-[#142A4A] text-white shadow-sm ring-1 ring-[#142A4A]/20 font-semibold',
    tooltipBg: 'bg-stone-900 border-stone-700 text-white',
    toggleBtn: 'bg-white text-stone-800 border-stone-300 shadow-[0_4px_14px_rgba(0,0,0,0.1)] hover:border-stone-400',
  },
  // Aliases for legacy state compatibility
  obsidian: {
    id: 'obsidian',
    label: 'Royal Navy & Cyan',
    asideClasses: 'bg-[#071E33] text-slate-100 border-r border-[#00B4D8]/15 shadow-2xl',
    borderClasses: 'border-white/10',
    headerTheme: 'dark',
    sectionTitle: 'text-[#38BDF8]/80 font-bold tracking-widest text-[10px]',
    navInactive: 'text-slate-300 hover:bg-white/10 hover:text-white',
    navActive: 'bg-gradient-to-r from-[#0077B6] to-[#0096C7] text-white shadow-[0_4px_16px_rgba(0,180,216,0.25)] font-semibold ring-1 ring-cyan-400/40',
    accentDot: 'bg-[#76C015] shadow-[0_0_10px_#76C015]',
    navIconInactive: 'text-cyan-200/60 group-hover:text-cyan-200',
    navIconActive: 'text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.4)]',
    profileBox: 'border-cyan-500/20 bg-[#0B253D] text-white',
    profileSubtext: 'text-cyan-300/80',
    profileHover: 'group-hover:text-cyan-200',
    railItemInactive: 'text-slate-300 hover:bg-white/10 hover:text-white',
    railItemActive: 'bg-gradient-to-r from-[#0077B6] to-[#0096C7] text-white shadow-md ring-1 ring-cyan-400/50 font-semibold',
    tooltipBg: 'bg-[#061828] border-cyan-500/30 text-white',
    toggleBtn: 'bg-[#0B253D] text-cyan-300 border-cyan-500/40 shadow-md hover:bg-[#0E2E4B]',
  },
  sage: {
    id: 'sage',
    label: 'Warm Pearl Luxe',
    asideClasses: 'bg-[#FAF9F6] text-stone-800 border-r border-stone-200/80 shadow-[4px_0_24px_rgba(0,0,0,0.03)]',
    borderClasses: 'border-stone-200/70',
    headerTheme: 'light',
    sectionTitle: 'text-stone-400 font-bold tracking-wider text-[10px]',
    navInactive: 'text-stone-600 hover:bg-stone-200/50 hover:text-stone-900',
    navActive: 'bg-[#142A4A] text-white shadow-sm font-semibold ring-1 ring-[#142A4A]/20',
    accentDot: 'bg-[#76C015] shadow-[0_0_8px_#76C015]',
    navIconInactive: 'text-stone-400 group-hover:text-stone-700',
    navIconActive: 'text-white',
    profileBox: 'border-stone-200 bg-stone-100/80 text-stone-800',
    profileSubtext: 'text-stone-500',
    profileHover: 'group-hover:text-[#142A4A]',
    railItemInactive: 'text-stone-500 hover:bg-stone-200/60 hover:text-stone-800',
    railItemActive: 'bg-[#142A4A] text-white shadow-sm ring-1 ring-[#142A4A]/20 font-semibold',
    tooltipBg: 'bg-stone-900 border-stone-700 text-white',
    toggleBtn: 'bg-white text-stone-800 border-stone-300 shadow-[0_4px_14px_rgba(0,0,0,0.1)] hover:border-stone-400',
  },
};

export default function Sidebar({ isOpen, onClose, onToggle }) {
  const { user, logout, activeClinic } = useAuth();
  const role = user?.role || 'DOCTOR';

  // Finalized Spruce Teal Theme (Gastro Cure Official)
  const activeTheme = SIDEBAR_THEMES.classic;

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

      {/* Main Sidebar Shell (Collapsible between Expanded 268px and Mini Icon Rail) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 md:z-[120] flex shrink-0 flex-col ${activeTheme.asideClasses} shadow-2xl transition-all duration-300 ease-in-out md:sticky md:top-0 md:h-screen md:shadow-none relative md:overflow-visible ${
          isOpen
            ? 'w-[268px] p-4 translate-x-0 opacity-100 pointer-events-auto'
            : 'w-0 p-0 -translate-x-full md:w-[76px] md:px-2 md:py-3.5 md:translate-x-0 md:opacity-100 md:pointer-events-auto'
        }`}
        aria-label="Main Navigation"
      >
        {/* Border Toggle Button - Premium Elevated Light Pill with generous hit area and high z-index */}
        <button
          type="button"
          onClick={onToggle}
          className="hidden md:flex absolute top-[24px] -right-5 z-[130] h-8 w-8 items-center justify-center rounded-full border border-slate-300/90 bg-white text-slate-800 shadow-[0_4px_14px_rgba(0,0,0,0.14),0_1px_3px_rgba(0,0,0,0.08)] hover:bg-slate-50 hover:text-[#123A3A] hover:border-slate-400 hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer group before:absolute before:-inset-2.5 before:content-[''] before:rounded-full"
          title={isOpen ? "Collapse sidebar (Ctrl+B)" : "Expand sidebar (Ctrl+B)"}
          aria-label={isOpen ? "Close menu" : "Open menu"}
        >
          {isOpen ? (
            <ChevronLeft size={16} strokeWidth={2.5} className="transition-transform group-hover:-translate-x-0.5 pointer-events-none" />
          ) : (
            <ChevronRight size={16} strokeWidth={2.5} className="transition-transform group-hover:translate-x-0.5 pointer-events-none" />
          )}
        </button>

        {isOpen ? (
          /* ═══════════════════════════════════════════════════════════════
             1. EXPANDED SIDEBAR CONTENT (268px)
             ═══════════════════════════════════════════════════════════════ */
          <div className="w-[236px] flex flex-col flex-1 min-h-0">
            {/* Brand Header */}
            <div className={`flex items-center justify-between border-b ${activeTheme.borderClasses} pb-4 pt-1 w-full`}>
              <ClinixPulseLogo
                theme={activeTheme.headerTheme}
                size="md"
                brandName={activeClinic?.shortName || 'ClinixPulse'}
                subtitle={activeClinic?.tagline ? activeClinic.tagline.slice(0, 22) : 'Outpatient Platform'}
                imageSrc={activeClinic?.logoUrl || undefined}
              />
              {/* Mobile drawer close button */}
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
            <nav className="mt-4 flex-1 space-y-4 overflow-y-auto pr-1" aria-label="Sidebar">
              {filteredGroups.map((group) => (
                <div key={group.id} className="space-y-1">
                  <p className={`px-3 text-[11px] font-bold uppercase tracking-[0.16em] ${activeTheme.sectionTitle}`}>
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
                            isActive ? activeTheme.navActive : activeTheme.navInactive
                          }`
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <div className="flex items-center gap-3 min-w-0">
                              <item.icon
                                size={18}
                                className={`shrink-0 transition-colors ${
                                  isActive ? activeTheme.navIconActive : activeTheme.navIconInactive
                                }`}
                              />
                              <span className="truncate">{item.label}</span>
                            </div>
                            {isActive && (
                              <span
                                className={`h-2 w-2 shrink-0 rounded-full ${activeTheme.accentDot}`}
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
            <div className={`mt-auto pt-3 border-t ${activeTheme.borderClasses}`}>
              <div className={`flex items-center justify-between gap-3 rounded-2xl border ${activeTheme.profileBox} p-2.5`}>
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
                    <p className={`truncate text-xs font-semibold ${activeTheme.profileHover} transition`}>
                      {displayName}
                    </p>
                    <span className={`inline-block text-[10px] uppercase tracking-wider ${activeTheme.profileSubtext} font-medium`}>
                      {roleLabel}
                    </span>
                  </div>
                </Link>

                <button
                  type="button"
                  onClick={logout}
                  title="Logout"
                  aria-label="Logout"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-transparent text-slate-400 transition hover:border-rose-400/30 hover:bg-rose-500/15 hover:text-rose-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 cursor-pointer"
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
            <div className={`flex items-center justify-center border-b ${activeTheme.borderClasses} pb-3.5 pt-1 w-full`}>
              <ClinixPulseLogo variant="compact" theme={activeTheme.headerTheme} size="sm" />
            </div>

            {/* Navigation: Centered Icon Rail with Senior UX Hover Tooltips */}
            <nav className="mt-3 flex-1 space-y-1.5 overflow-y-auto w-full flex flex-col items-center pr-0.5" aria-label="Sidebar icons">
              {filteredGroups
                .filter((group) => group.id !== 'configuration')
                .map((group, groupIdx) => (
                  <React.Fragment key={group.id}>
                    {groupIdx > 0 && <div className={`w-8 border-t ${activeTheme.borderClasses} my-1.5 shrink-0`} />}
                    {group.items.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={handleLinkClick}
                        className={({ isActive }) =>
                          `group relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all ${
                            isActive ? activeTheme.railItemActive : activeTheme.railItemInactive
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
                                isActive ? activeTheme.navIconActive : activeTheme.navIconInactive
                              }`}
                            />
                            {isActive && (
                              <span
                                className={`absolute right-1 top-1 h-2 w-2 rounded-full ${activeTheme.accentDot}`}
                                aria-hidden="true"
                              />
                            )}
                            {/* Senior UX Floating Tooltip */}
                            <span className={`pointer-events-none absolute left-full ml-3 z-50 hidden md:group-hover:flex items-center rounded-lg ${activeTheme.tooltipBg} border px-2.5 py-1 text-xs font-semibold whitespace-nowrap shadow-2xl`}>
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
            <div className={`mt-auto pt-2.5 border-t ${activeTheme.borderClasses} w-full flex flex-col items-center gap-1.5 pb-1`}>
              <Link
                to="/profile"
                onClick={handleLinkClick}
                className="group relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#287C75] text-xs font-bold text-white shadow-sm ring-1 ring-white/20 hover:ring-[#C9A45C]/50 transition cursor-pointer"
                aria-label={displayName}
                title={displayName}
              >
                <span>{initials}</span>
                <span className={`pointer-events-none absolute left-full ml-3 z-50 hidden md:group-hover:flex items-center rounded-lg ${activeTheme.tooltipBg} border px-2.5 py-1 text-xs font-semibold whitespace-nowrap shadow-2xl`}>
                  {displayName} ({roleLabel})
                </span>
              </Link>

              {/* Settings Gear Icon */}
              <NavLink
                to="/settings"
                onClick={handleLinkClick}
                className={({ isActive }) =>
                  `group relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all ${
                    isActive ? activeTheme.railItemActive : activeTheme.railItemInactive
                  }`
                }
                aria-label="Settings & Calibration"
                title="Settings & Calibration"
              >
                <Settings size={18} />
                <span className={`pointer-events-none absolute left-full ml-3 z-50 hidden md:group-hover:flex items-center rounded-lg ${activeTheme.tooltipBg} border px-2.5 py-1 text-xs font-semibold whitespace-nowrap shadow-2xl`}>
                  Settings & Calibration
                </span>
              </NavLink>

              {/* Red/Rose Logout Button */}
              <button
                type="button"
                onClick={logout}
                title="Logout"
                aria-label="Logout"
                className="group relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-rose-400 hover:bg-rose-500/20 transition cursor-pointer"
              >
                <LogOut size={16} />
                <span className={`pointer-events-none absolute left-full ml-3 z-50 hidden md:group-hover:flex items-center rounded-lg ${activeTheme.tooltipBg} border px-2.5 py-1 text-xs font-semibold text-rose-300 whitespace-nowrap shadow-2xl`}>
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
