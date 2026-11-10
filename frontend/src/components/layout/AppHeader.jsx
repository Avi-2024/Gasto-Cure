import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Menu, Search } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

/**
 * AppHeader Component
 * Floating frosted card with global search, keyboard shortcut cue (⌘K / Ctrl+K),
 * contextual clinic selector pill with active status dot, and doctor profile badge.
 */
export default function AppHeader({ onMenuClick, navigate: customNavigate }) {
  const { activeClinicId, user, switchClinic } = useAuth();
  const searchInputRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');

  let routerNavigate = null;
  try {
    routerNavigate = useNavigate();
  } catch (err) {
    // Graceful fallback when rendered in isolated test harnesses without a Router
  }
  const navigate = customNavigate || routerNavigate || ((path) => {
    if (typeof window !== 'undefined') {
      window.location.href = path;
    }
  });

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      const trimmed = searchQuery.trim();
      if (trimmed) {
        navigate(`/patients?search=${encodeURIComponent(trimmed)}`);
      }
    }
  };

  const clinicIds = user?.clinicIds || [];
  const role = user?.role || 'DOCTOR';
  const rawName = user?.name || (user?.email ? user.email.split('@')[0].replace(/[._-]/g, ' ') : 'Doctor');
  const cleanName = rawName.replace(/^dr\.?\s+/i, '');
  const formattedName = cleanName
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
  const displayName = role === 'DOCTOR' ? `Dr. ${formattedName}` : formattedName;
  const doctorInitial = formattedName.charAt(0).toUpperCase() || (role === 'DOCTOR' ? 'D' : 'U');
  const roleLabel = user?.role ? user.role.replace(/_/g, ' ') : 'Doctor';
  const clinicValue = activeClinicId && clinicIds.includes(activeClinicId) ? activeClinicId : clinicIds[0] || '';

  // Keyboard shortcut (⌘K / Ctrl+K) to focus search
  useEffect(() => {
    function handleKeyDown(event) {
      if ((event.metaKey || event.ctrlKey) && event.key?.toLowerCase() === 'k') {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <header className="mb-6 rounded-2xl border border-[#D9E6E2] bg-white/85 p-3.5 shadow-nivara-xs backdrop-blur-md transition-all sm:p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Left: Mobile Menu Toggle & Global Search */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#D9E6E2] bg-white text-[#4E6460] hover:bg-[#F7FAF8] hover:text-[#10201F] transition md:hidden"
            aria-label="Open menu"
            onClick={onMenuClick}
          >
            <Menu size={18} />
          </button>

          <label
            htmlFor="global-search"
            className="group relative flex flex-1 items-center rounded-xl border border-[#D9E6E2] bg-[#F7FAF8]/80 px-3 py-1.5 transition-all focus-within:border-[#287C75] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#287C75]/15 lg:w-[420px]"
          >
            <Search
              className="mr-2 text-[#7D908C] transition-colors group-focus-within:text-[#287C75]"
              size={16}
            />
            <input
              ref={searchInputRef}
              id="global-search"
              type="search"
              placeholder="Search patients, prescriptions, master drugs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="w-full border-0 bg-transparent p-0 text-xs font-medium text-[#10201F] placeholder-[#7D908C] focus:outline-none focus:ring-0 sm:text-sm"
            />
            <span className="hidden sm:inline-flex items-center rounded border border-[#D9E6E2] bg-white px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-[#4E6460] shadow-2xs">
              ⌘K
            </span>
          </label>
        </div>

        {/* Right: Clinic Switcher, Notifications, Doctor Badge */}
        <div className="flex flex-wrap items-center justify-end gap-2.5 sm:gap-3">
          {/* Contextual Clinic Selector Pill with Status Dot */}
          <div className="flex items-center gap-2 rounded-xl border border-[#D9E6E2] bg-[#F7FAF8] px-3 py-1.5 shadow-nivara-xs">
            <span
              className="h-2 w-2 shrink-0 rounded-full bg-[#2E7D5B] shadow-[0_0_6px_#2E7D5B]"
              title="Clinic operational & synced"
              aria-hidden="true"
            />
            <select
              value={clinicValue}
              onChange={(event) => switchClinic(event.target.value)}
              disabled={clinicIds.length === 0}
              aria-label="Select clinic"
              className="cursor-pointer border-0 bg-transparent p-0 pr-6 text-xs font-semibold text-[#10201F] focus:outline-none focus:ring-0"
            >
              {clinicIds.length === 0 ? (
                <option value="">No clinic available</option>
              ) : null}
              {clinicIds.map((clinicId) => (
                <option key={clinicId} value={clinicId}>
                  Clinic #{clinicId}
                </option>
              ))}
            </select>
          </div>

          {/* Notifications Button */}
          <button
            type="button"
            className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-[#D9E6E2] bg-white text-[#4E6460] transition hover:bg-[#F7FAF8] hover:text-[#10201F] shadow-nivara-xs"
            aria-label="Notifications"
          >
            <Bell size={16} />
            <span
              className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#C9A45C]"
              aria-hidden="true"
            />
          </button>

          {/* Doctor Avatar Badge */}
          <div className="flex items-center gap-2.5 rounded-xl border border-[#D9E6E2] bg-white px-2.5 py-1.5 shadow-nivara-xs">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#123A3A] text-xs font-bold text-white shadow-sm">
              {doctorInitial}
            </span>
            <div className="hidden pr-1 sm:block text-left">
              <p className="text-xs font-bold capitalize text-[#10201F]">
                {displayName}
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#4E6460]">
                {roleLabel}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
