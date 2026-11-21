import React, { useState, useEffect, useRef, useId, useCallback } from 'react';
import { Search, X, Check, User, Phone, ArrowRight, UserPlus, Loader2 } from 'lucide-react';
import PatientAvatar from './PatientAvatar';
import { patientApi } from '../../services/patientApi';
import { localPatients } from '../../services/localStore';

/**
 * PatientSearchSelector
 *
 * Senior-grade searchable combobox for patient selection.
 * Handles thousands of patients seamlessly with local cache + debounced API search.
 *
 * Features:
 * - Search by Name, Mobile Number, or Patient ID / MRN
 * - Highlighting of matched terms
 * - Keyboard navigation (ArrowDown, ArrowUp, Enter, Escape)
 * - Selected Patient Card with 1-click change
 * - Empty state with 1-click switch to Walk-in Registration
 */
export default function PatientSearchSelector({
  selectedPatientId = '',
  selectedPatient = null,
  onSelectPatient,
  onClearPatient,
  onSwitchToWalkIn,
  placeholder = 'Search by Name, Mobile (10-digit), or Patient ID (e.g. Aarav, 9876..., PT-001)...',
  className = '',
  disabled = false,
  autoFocus = false,
}) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activePatient, setActivePatient] = useState(selectedPatient);

  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const compId = useId();
  const searchTimeoutRef = useRef(null);

  // Sync activePatient when prop changes or resolve from local/API
  useEffect(() => {
    if (selectedPatient) {
      setActivePatient(selectedPatient);
    } else if (selectedPatientId) {
      const found = localPatients.getById(selectedPatientId);
      if (found) {
        setActivePatient(found);
      }
    } else {
      setActivePatient(null);
    }
  }, [selectedPatient, selectedPatientId]);

  // Initial load of recent patients from localStore
  const getInitialPatients = useCallback(() => {
    const all = localPatients.getAll() || [];
    return all.slice(0, 15);
  }, []);

  // Search logic (local filtering + debounced backend API search)
  const performSearch = useCallback((searchTerm) => {
    const trimmed = (searchTerm || '').trim();
    if (!trimmed) {
      setResults(getInitialPatients());
      setIsSearching(false);
      return;
    }

    // 1. Fast immediate local search
    const localMatches = localPatients.search(trimmed) || [];
    setResults(localMatches.slice(0, 20));

    // 2. Debounced API search for large remote databases (1000+ patients)
    if (import.meta.env.MODE !== 'test') {
      setIsSearching(true);
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const res = await patientApi.getPatients({ search: trimmed, limit: 25 });
          if (res?.patients) {
            // Merge local and API results avoiding duplicates by ID
            const seenIds = new Set(localMatches.map((p) => p.id));
            const merged = [...localMatches];
            for (const p of res.patients) {
              if (!seenIds.has(p.id)) {
                seenIds.add(p.id);
                merged.push(p);
              }
            }
            setResults(merged.slice(0, 30));
          }
        } catch (err) {
          console.warn('API search error in PatientSearchSelector:', err);
        } finally {
          setIsSearching(false);
        }
      }, 200);
    }
  }, [getInitialPatients]);

  // Handle Input Change
  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    setHighlightedIndex(-1);
    setIsOpen(true);
    performSearch(val);
  };

  // Select a patient
  const handleSelect = (patient) => {
    setActivePatient(patient);
    setIsOpen(false);
    setQuery('');
    setHighlightedIndex(-1);
    if (onSelectPatient) {
      onSelectPatient(patient);
    }
  };

  // Clear selected patient
  const handleClear = () => {
    setActivePatient(null);
    setQuery('');
    setHighlightedIndex(-1);
    if (onClearPatient) {
      onClearPatient();
    }
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        setIsOpen(true);
        setResults(getInitialPatients());
      }
    }, 50);
  };

  // Keyboard Navigation
  const handleKeyDown = (e) => {
    if (disabled || activePatient) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        performSearch(query);
        return;
      }
      setHighlightedIndex((prev) => {
        const next = prev < results.length - 1 ? prev + 1 : 0;
        scrollIndexIntoView(next);
        return next;
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        return;
      }
      setHighlightedIndex((prev) => {
        const next = prev > 0 ? prev - 1 : results.length - 1;
        scrollIndexIntoView(next);
        return next;
      });
    } else if (e.key === 'Enter') {
      if (isOpen && highlightedIndex >= 0 && results[highlightedIndex]) {
        e.preventDefault();
        handleSelect(results[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  };

  const scrollIndexIntoView = (index) => {
    if (listRef.current) {
      const items = listRef.current.querySelectorAll('[data-patient-item]');
      if (items[index] && typeof items[index].scrollIntoView === 'function') {
        items[index].scrollIntoView({ block: 'nearest' });
      }
    }
  };

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, []);

  // Highlight matching text helper
  const highlightMatch = (text, term) => {
    if (!text || !term || !term.trim()) return text;
    const cleanTerm = term.trim();
    const regex = new RegExp(`(${cleanTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = String(text).split(regex);
    return parts.map((part, i) =>
      part.toLowerCase() === cleanTerm.toLowerCase() ? (
        <span key={i} className="bg-amber-100 font-bold text-amber-900 rounded-xs px-0.5">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* State 1: Active Selected Patient Card */}
      {activePatient ? (
        <div className="flex items-center justify-between gap-3 rounded-2xl border-2 border-[#287C75]/40 bg-[#F2F7F6] p-3 text-xs shadow-2xs transition animate-fadeIn">
          <div className="flex items-center gap-3 min-w-0">
            <PatientAvatar
              gender={activePatient.gender}
              name={activePatient.name}
              className="h-10 w-10 shrink-0 border border-[#287C75]/30 ring-2 ring-white"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-heading text-sm font-bold text-[#10201F] truncate">
                  {activePatient.name}
                </span>
                <span className="inline-flex items-center rounded-md border border-[#287C75]/30 bg-white px-1.5 py-0.5 font-mono text-[11px] font-bold text-[#123A3A]">
                  {activePatient.mrn || activePatient.id}
                </span>
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-[#4E6460]">
                {activePatient.phone || activePatient.contact ? (
                  <span className="flex items-center gap-1 font-mono">
                    <Phone size={11} className="text-[#287C75]" />
                    {activePatient.phone || activePatient.contact}
                  </span>
                ) : null}
                {activePatient.age ? (
                  <span>
                    • {activePatient.age} Yrs
                    {activePatient.gender ? ` / ${activePatient.gender}` : ''}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClear}
            disabled={disabled}
            className="shrink-0 flex items-center gap-1 rounded-xl border border-[#D9E6E2] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#4E6460] hover:border-[#287C75] hover:text-[#123A3A] hover:bg-[#F7FAF8] transition shadow-xs cursor-pointer"
            title="Change or select a different patient"
          >
            <X size={14} />
            <span>Change</span>
          </button>
        </div>
      ) : (
        /* State 2: Search Input & Autocomplete Dropdown */
        <div>
          <div className="relative">
            <Search
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7D908C]"
            />
            <input
              ref={inputRef}
              id={`patient-search-${compId}`}
              type="text"
              role="combobox"
              aria-expanded={isOpen}
              aria-autocomplete="list"
              aria-controls={`patient-listbox-${compId}`}
              autoFocus={autoFocus}
              disabled={disabled}
              value={query}
              onChange={handleInputChange}
              onFocus={() => {
                setIsOpen(true);
                performSearch(query);
              }}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              autoComplete="off"
              className="w-full rounded-xl border border-[#D9E6E2] bg-[#F7FAF8] py-2.5 pl-10 pr-10 text-xs font-medium text-[#10201F] placeholder:text-[#7D908C] focus:border-[#287C75] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#287C75]/15 transition"
            />

            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {isSearching && <Loader2 size={14} className="animate-spin text-[#287C75]" />}
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    performSearch('');
                    if (inputRef.current) inputRef.current.focus();
                  }}
                  className="rounded-full p-0.5 text-[#7D908C] hover:bg-[#D9E6E2]/50 hover:text-[#10201F]"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Autocomplete Dropdown */}
          {isOpen && (
            <div
              id={`patient-listbox-${compId}`}
              role="listbox"
              ref={listRef}
              className="absolute left-0 right-0 z-50 mt-1 max-h-72 overflow-y-auto rounded-2xl border border-[#D9E6E2] bg-white p-1.5 shadow-xl"
            >
              <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[#7D908C] border-b border-[#D9E6E2]/50 flex items-center justify-between">
                <span>
                  {query ? `Search Results (${results.length})` : `Clinic Registry (Recent)`}
                </span>
                <span className="text-[10px] lowercase font-normal">Use ↑↓ keys + Enter</span>
              </div>

              {results.length > 0 ? (
                <div className="mt-1 space-y-0.5">
                  {results.map((p, idx) => {
                    const isHighlighted = idx === highlightedIndex;
                    const contact = p.phone || p.contact || 'No phone';
                    const mrn = p.mrn || p.id;

                    return (
                      <button
                        key={p.id || idx}
                        type="button"
                        role="option"
                        aria-selected={isHighlighted}
                        data-patient-item
                        onClick={() => handleSelect(p)}
                        onMouseEnter={() => setHighlightedIndex(idx)}
                        className={`w-full flex items-center justify-between gap-3 rounded-xl px-3 py-2 text-left transition ${
                          isHighlighted
                            ? 'bg-[#287C75]/10 text-[#123A3A]'
                            : 'hover:bg-[#F7FAF8] text-[#10201F]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <PatientAvatar
                            gender={p.gender}
                            name={p.name}
                            className="h-8 w-8 shrink-0 border border-slate-200"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-heading text-xs font-bold text-[#10201F] truncate">
                                {highlightMatch(p.name, query)}
                              </span>
                              <span className="inline-flex rounded-md border border-[#D9E6E2] bg-[#F7FAF8] px-1.5 py-0.2 font-mono text-[10px] font-bold text-[#287C75]">
                                {highlightMatch(mrn, query)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-[#4E6460]">
                              <span className="font-mono flex items-center gap-1">
                                <Phone size={10} className="text-[#287C75]" />
                                {highlightMatch(contact, query)}
                              </span>
                              {p.age && (
                                <span>
                                  • {p.age}y {p.gender ? `(${p.gender})` : ''}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0">
                          <span
                            className={`rounded-lg px-2 py-1 text-[11px] font-semibold transition ${
                              isHighlighted
                                ? 'bg-[#287C75] text-white shadow-xs'
                                : 'text-[#7D908C]'
                            }`}
                          >
                            Select
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                /* Empty state when query yields zero results */
                <div className="p-4 text-center">
                  <p className="text-xs font-medium text-[#4E6460]">
                    No registered patient found for <span className="font-bold text-[#10201F]">"{query}"</span>
                  </p>
                  <p className="mt-0.5 text-[11px] text-[#7D908C]">
                    Check spelling or register directly as a walk-in patient.
                  </p>

                  {onSwitchToWalkIn && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        onSwitchToWalkIn(query);
                      }}
                      className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-[#287C75]/10 px-3.5 py-1.5 text-xs font-bold text-[#287C75] hover:bg-[#287C75] hover:text-white transition cursor-pointer"
                    >
                      <UserPlus size={14} />
                      <span>Register "{query}" as Walk-in Patient</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
