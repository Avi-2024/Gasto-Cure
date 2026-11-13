import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Menu, Search, UserPlus, FileText, Pill, User, X, Plus, ChevronRight, Stethoscope, CheckCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { localPatients, localVisits, localMedicines } from '../../services/localStore';
import { notificationsService } from '../../services/notificationsService';

/**
 * AppHeader Component
 * Floating frosted card with omni-search spotlight, keyboard shortcut cue (⌘K / Ctrl+K),
 * contextual clinic selector pill with active status dot, + Patient quick action, and doctor profile badge.
 */
export default function AppHeader({ onMenuClick, navigate: customNavigate }) {
  const { activeClinicId, user, switchClinic } = useAuth();
  const searchInputRef = useRef(null);
  const searchContainerRef = useRef(null);
  const notifContainerRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifList, setNotifList] = useState([]);

  const refreshNotifications = () => {
    try {
      setNotifList(notificationsService.getAll());
    } catch {
      setNotifList([]);
    }
  };

  useEffect(() => {
    refreshNotifications();
  }, []);

  const unreadNotifsCount = notifList.filter((n) => !n.read).length;

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
        setIsSearchOpen(false);
        navigate(`/patients?search=${encodeURIComponent(trimmed)}`);
      }
    } else if (e.key === 'Escape') {
      setIsSearchOpen(false);
    }
  };

  // Close omni-search & notifications dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsSearchOpen(false);
      }
      if (notifContainerRef.current && !notifContainerRef.current.contains(e.target)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Live multi-entity search results
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return { patients: [], visits: [], medicines: [], total: 0 };

    try {
      // 1. Patients
      const allPts = localPatients.search(q);
      const patients = (allPts || []).slice(0, 4);

      // 2. Prescriptions / Visits
      const allVisits = localVisits.getAll() || [];
      const visits = allVisits
        .filter((v) => {
          const str = `${v.id || ''} ${v.patientName || ''} ${v.diagnosis || ''}`.toLowerCase();
          return str.includes(q);
        })
        .slice(0, 3);

      // 3. Formulary Medicines
      const allMeds = localMedicines.search(q);
      const medicines = (allMeds || []).slice(0, 3);

      return {
        patients,
        visits,
        medicines,
        total: patients.length + visits.length + medicines.length,
      };
    } catch (err) {
      return { patients: [], visits: [], medicines: [], total: 0 };
    }
  }, [searchQuery]);

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
        setIsSearchOpen(true);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <header className="mb-0 rounded-2xl border border-[#D9E6E2] bg-white/85 p-3.5 shadow-nivara-xs backdrop-blur-md transition-all sm:p-4 relative z-[100]">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Left: Mobile Menu Toggle & Global Search Spotlight */}
        <div ref={searchContainerRef} className="relative flex items-center gap-3">
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#D9E6E2] bg-white text-[#4E6460] hover:bg-[#F7FAF8] hover:text-[#10201F] transition md:hidden"
            aria-label="Open menu"
            onClick={onMenuClick}
          >
            <Menu size={18} />
          </button>

          <div className="relative flex-1 lg:w-[420px]">
            <label
              htmlFor="global-search"
              className="group relative flex w-full items-center rounded-xl border border-[#D9E6E2] bg-[#F7FAF8]/80 px-3 py-1.5 transition-all focus-within:border-[#287C75] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#287C75]/15"
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
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchOpen(true);
                }}
                onFocus={() => {
                  if (searchQuery.trim()) setIsSearchOpen(true);
                }}
                onKeyDown={handleSearchKeyDown}
                className="w-full border-0 bg-transparent p-0 text-xs font-medium text-[#10201F] placeholder-[#7D908C] focus:outline-none focus:ring-0 sm:text-sm"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setIsSearchOpen(false);
                  }}
                  className="p-1 text-[#7D908C] hover:text-[#10201F]"
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              ) : (
                <span className="hidden sm:inline-flex items-center rounded border border-[#D9E6E2] bg-white px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-[#4E6460] shadow-2xs">
                  ⌘K
                </span>
              )}
            </label>

            {/* Omni-search Live Results Dropdown */}
            {isSearchOpen && searchQuery.trim().length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-2 max-h-[440px] overflow-y-auto rounded-2xl border border-[#D9E6E2] bg-white p-2.5 shadow-nivara-lg z-50 animate-in fade-in zoom-in-95 duration-100">
                {searchResults.total === 0 ? (
                  <div className="p-4 text-center">
                    <p className="text-xs font-semibold text-[#10201F]">No records found for "{searchQuery}"</p>
                    <p className="mt-1 text-[11px] text-[#7D908C]">Try searching by patient name, mobile, prescription ID, or medicine name</p>
                    <button
                      type="button"
                      onClick={() => {
                        setIsSearchOpen(false);
                        navigate(`/patients?action=new&name=${encodeURIComponent(searchQuery.trim())}`);
                      }}
                      className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-teal-50 text-[#287C75] border border-teal-200 px-3 py-1.5 text-xs font-semibold hover:bg-[#287C75] hover:text-white transition"
                    >
                      <UserPlus size={13} />
                      + Register "{searchQuery.trim()}"
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Patients Group */}
                    {searchResults.patients.length > 0 && (
                      <div>
                        <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#7D908C] flex items-center gap-1.5">
                          <User size={11} className="text-[#287C75]" />
                          <span>Patients ({searchResults.patients.length})</span>
                        </div>
                        <ul className="mt-1 space-y-1">
                          {searchResults.patients.map((pt) => (
                            <li
                              key={pt.id}
                              onClick={() => {
                                setIsSearchOpen(false);
                                navigate(`/patients?patientId=${pt.id}`);
                              }}
                              className="group flex items-center justify-between p-2 rounded-xl hover:bg-[#F7FAF8] cursor-pointer transition border border-transparent hover:border-[#D9E6E2]"
                            >
                              <div className="flex items-center gap-2.5">
                                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-[#287C75] font-bold text-xs border border-teal-100">
                                  {(pt.name || 'P').charAt(0).toUpperCase()}
                                </span>
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-semibold text-[#10201F] group-hover:text-[#287C75] transition">
                                      {pt.name}
                                    </span>
                                    <span className="text-[10px] font-mono text-[#7D908C]">({pt.id})</span>
                                  </div>
                                  <p className="text-[11px] text-[#4E6460]">
                                    {pt.gender || 'Patient'} • {pt.contact || pt.mobile || 'No contact'}
                                  </p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setIsSearchOpen(false);
                                  navigate(`/prescription/new?patientId=${pt.id}`);
                                }}
                                className="px-2 py-1 rounded-lg text-[11px] font-semibold text-[#287C75] bg-teal-50 hover:bg-[#287C75] hover:text-white transition shrink-0"
                              >
                                + New Rx
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Prescriptions Group */}
                    {searchResults.visits.length > 0 && (
                      <div className="border-t border-[#D9E6E2]/60 pt-2">
                        <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#7D908C] flex items-center gap-1.5">
                          <FileText size={11} className="text-[#C9A45C]" />
                          <span>Prescriptions ({searchResults.visits.length})</span>
                        </div>
                        <ul className="mt-1 space-y-1">
                          {searchResults.visits.map((rx) => (
                            <li
                              key={rx.id}
                              onClick={() => {
                                setIsSearchOpen(false);
                                navigate(`/prescriptions`);
                              }}
                              className="group flex items-center justify-between p-2 rounded-xl hover:bg-[#F7FAF8] cursor-pointer transition border border-transparent hover:border-[#D9E6E2]"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-mono font-semibold text-[#287C75]">{rx.id}</span>
                                <span className="text-xs text-[#10201F] font-medium">{rx.patientName}</span>
                                {rx.diagnosis && (
                                  <span className="text-[11px] text-[#7D908C] truncate max-w-[140px] italic">
                                    • {rx.diagnosis}
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] font-mono text-[#7D908C]">
                                {rx.date ? (rx.date.includes('T') ? rx.date.split('T')[0] : rx.date) : ''}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Formulary Medicines Group */}
                    {searchResults.medicines.length > 0 && (
                      <div className="border-t border-[#D9E6E2]/60 pt-2">
                        <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#7D908C] flex items-center gap-1.5">
                          <Pill size={11} className="text-[#2E7D5B]" />
                          <span>Formulary Drugs ({searchResults.medicines.length})</span>
                        </div>
                        <ul className="mt-1 space-y-1">
                          {searchResults.medicines.map((med) => (
                            <li
                              key={med.id || med.name}
                              onClick={() => {
                                setIsSearchOpen(false);
                                navigate(`/medicines`);
                              }}
                              className="flex items-center justify-between p-2 rounded-xl hover:bg-[#F7FAF8] cursor-pointer transition border border-transparent hover:border-[#D9E6E2]"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-[#10201F]">{med.name}</span>
                                {med.strength && (
                                  <span className="text-[10px] font-mono text-[#287C75] bg-teal-50 px-1 py-0.5 rounded">
                                    {med.strength}
                                  </span>
                                )}
                              </div>
                              {med.form && (
                                <span className="text-[10px] text-[#7D908C] uppercase font-bold">{med.form}</span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Footer cue */}
                    <div className="border-t border-[#D9E6E2] pt-2 px-2 flex items-center justify-between text-[11px] text-[#7D908C]">
                      <span
                        onClick={() => {
                          setIsSearchOpen(false);
                          navigate(`/patients?search=${encodeURIComponent(searchQuery.trim())}`);
                        }}
                        className="hover:text-[#287C75] cursor-pointer font-semibold flex items-center gap-1"
                      >
                        Press Enter to search all patients directory
                        <ChevronRight size={12} />
                      </span>
                      <span>ESC to close</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: + Add Patient, Clinic Switcher, Notifications, Doctor Badge */}
        <div className="flex flex-wrap items-center justify-end gap-2.5 sm:gap-3">
          {/* Global "+ Add Patient" Button Accessible Everywhere */}
          <button
            type="button"
            onClick={() => navigate('/patients?action=new')}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#287C75] px-3.5 py-1.5 text-xs font-semibold text-white shadow-nivara-xs hover:bg-[#1f635d] active:scale-[0.98] transition cursor-pointer"
            title="Register new patient"
            aria-label="Add New Patient"
          >
            <UserPlus size={15} />
            <span className="font-semibold">+ Add Patient</span>
          </button>

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

          {/* Notifications Dropdown Container */}
          <div className="relative" ref={notifContainerRef}>
            <button
              type="button"
              onClick={() => {
                refreshNotifications();
                setIsNotifOpen((prev) => !prev);
              }}
              className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-[#D9E6E2] bg-white text-[#4E6460] transition hover:bg-[#F7FAF8] hover:text-[#10201F] shadow-nivara-xs cursor-pointer"
              aria-label="Notifications"
              title="Clinical Notifications & Alerts"
            >
              <Bell size={16} />
              {unreadNotifsCount > 0 ? (
                <span
                  className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white px-1 shadow-xs"
                  aria-hidden="true"
                >
                  {unreadNotifsCount > 9 ? '9+' : unreadNotifsCount}
                </span>
              ) : (
                <span
                  className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#C9A45C]"
                  aria-hidden="true"
                />
              )}
            </button>

            {/* Notifications Popover Dropdown */}
            {isNotifOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-[#D9E6E2] bg-white shadow-2xl z-[9999] overflow-hidden animate-in fade-in duration-150">
                <div className="flex items-center justify-between border-b border-[#D9E6E2] px-4 py-3 bg-[#F7FAF8]">
                  <div className="flex items-center gap-2">
                    <span className="font-heading text-xs font-bold text-[#10201F]">
                      Notifications
                    </span>
                    {unreadNotifsCount > 0 && (
                      <span className="rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 border border-amber-200">
                        {unreadNotifsCount} new
                      </span>
                    )}
                  </div>
                  {unreadNotifsCount > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        notificationsService.markAllAsRead();
                        refreshNotifications();
                      }}
                      className="text-[11px] font-semibold text-[#287C75] hover:underline cursor-pointer"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-[#EBF1EE]">
                  {notifList.length === 0 ? (
                    <div className="p-6 text-center text-xs text-[#7D908C]">
                      No notifications right now. All caught up!
                    </div>
                  ) : (
                    notifList.slice(0, 5).map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          notificationsService.markAsRead(item.id);
                          setIsNotifOpen(false);
                          if (item.actionUrl) navigate(item.actionUrl);
                        }}
                        className={`p-3 text-left transition cursor-pointer hover:bg-teal-50/40 ${
                          !item.read ? 'bg-teal-50/20' : 'bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-xs font-heading ${!item.read ? 'font-bold text-[#10201F]' : 'font-medium text-[#4E6460]'}`}>
                            {item.title}
                          </p>
                          {!item.read && (
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0 mt-1" />
                          )}
                        </div>
                        <p className="mt-0.5 text-[11px] text-[#4E6460] line-clamp-2">
                          {item.message}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                <div className="border-t border-[#D9E6E2] p-2 bg-[#F7FAF8] text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setIsNotifOpen(false);
                      navigate('/notifications');
                    }}
                    className="w-full py-1 text-xs font-semibold text-[#287C75] hover:underline cursor-pointer"
                  >
                    View All Notifications & History →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Doctor Avatar Badge */}
          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="flex items-center gap-2.5 rounded-xl border border-[#D9E6E2] bg-white px-2.5 py-1.5 shadow-nivara-xs hover:border-[#287C75]/50 hover:bg-[#F7FAF8] transition cursor-pointer text-left"
            title="View & Edit Doctor Profile"
            aria-label="Doctor Profile"
          >
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
          </button>
        </div>
      </div>
    </header>
  );
}
