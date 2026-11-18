import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  UserPlus,
  FilePlus,
  User,
  Phone,
  Calendar,
  X,
} from 'lucide-react';
import { localPatients } from '../../../services/localStore';

export default function QuickPatientSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState([]);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const matches = localPatients.search(query.trim());
    setResults(matches);
    setIsOpen(true);
  }, [query]);

  // Click outside and Escape key listener to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  const handleNewPatient = () => {
    navigate('/patients?action=new');
  };

  const handleNewPrescription = (patientId) => {
    navigate(`/prescription/new?patientId=${patientId}`);
  };

  const handleViewProfile = (patientId) => {
    navigate(`/patients?patientId=${patientId}`);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Prominent Full-Width Spotlight Search Input Box */}
      <div className="relative w-full">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#7D908C]"
          size={20}
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (query.trim()) setIsOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const trimmed = query.trim();
              if (trimmed) {
                navigate(`/patients?search=${encodeURIComponent(trimmed)}`);
                setIsOpen(false);
              }
            }
          }}
          placeholder="Search patient by name, mobile, or ID (e.g. PT-001)..."
          aria-label="Search patient by name, mobile, or ID"
          className="w-full h-12 pl-12 pr-10 text-base font-medium rounded-2xl border-2 border-[#D9E6E2] bg-white placeholder:text-[#7D908C] text-[#10201F] focus:border-[#287C75] focus:outline-none focus:ring-4 focus:ring-[#287C75]/10 transition shadow-clinixpulse-xs"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-[#7D908C] hover:text-[#10201F] rounded-full hover:bg-slate-100 transition"
            aria-label="Clear search"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Instant Dropdown Results */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-96 overflow-y-auto rounded-2xl border border-[#D9E6E2] bg-white p-2 shadow-clinixpulse-lg">
          <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-[#7D908C] border-b border-[#D9E6E2] flex justify-between items-center">
            <span>Patient Search Results</span>
            <span className="font-mono text-xs">{results.length} found</span>
          </div>

          {results.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-sm font-semibold text-[#10201F]">No patients found</p>
              <p className="mt-1 text-xs text-[#4E6460]">
                No matching records for "{query}". You can register this patient now.
              </p>
              <button
                type="button"
                onClick={handleNewPatient}
                className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-teal-50 text-[#287C75] border border-teal-200 px-3 py-1.5 text-xs font-semibold hover:bg-[#287C75] hover:text-white transition"
              >
                <UserPlus size={14} />
                + Register New Patient
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-[#D9E6E2]/60">
              {results.map((patient) => {
                const contact = patient.contact || patient.mobile || '-';
                const initial = (patient.name || 'P').charAt(0).toUpperCase();

                return (
                  <li
                    key={patient.id}
                    onClick={() => handleViewProfile(patient.id)}
                    className="p-3 transition rounded-xl hover:bg-[#F7FAF8] cursor-pointer flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                  >
                    {/* Patient Info */}
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-[#287C75] font-heading font-bold text-sm border border-teal-100">
                        {initial}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-[#10201F]">{patient.name}</span>
                          <span className="text-xs font-mono font-medium rounded bg-[#F7FAF8] border border-[#D9E6E2] px-1.5 py-0.5 text-[#4E6460]">
                            {patient.id}
                          </span>
                          {patient.status && (
                            <span className="text-[11px] font-semibold text-[#2E7D5B] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              {patient.status}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#4E6460]">
                          {(patient.age || patient.gender) && (
                            <span>
                              {patient.age ? `${patient.age} Y` : ''}
                              {patient.age && patient.gender ? ' / ' : ''}
                              {patient.gender}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1 font-mono">
                            <Phone size={12} className="text-[#7D908C]" />
                            {contact}
                          </span>
                          {patient.nextFollowUp && (
                            <span className="inline-flex items-center gap-1 text-[#B7791F] bg-amber-50 px-1.5 py-0.5 rounded text-[11px] border border-amber-200">
                              <Calendar size={11} />
                              Follow-up: {patient.nextFollowUp}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => handleNewPrescription(patient.id)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-[#287C75] bg-teal-50 px-3 py-1.5 text-xs font-semibold text-[#287C75] hover:bg-[#287C75] hover:text-white transition"
                      >
                        <FilePlus size={14} />
                        New Prescription
                      </button>

                      <button
                        type="button"
                        onClick={() => handleViewProfile(patient.id)}
                        className="inline-flex items-center gap-1 rounded-xl border border-[#D9E6E2] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#4E6460] hover:bg-[#F7FAF8] hover:text-[#10201F] transition"
                      >
                        <User size={14} />
                        View Profile
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
