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
      <div className="flex flex-col sm:flex-row gap-3 items-stretch">
        {/* Prominent Search Input Box */}
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            size={20}
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              if (query.trim()) setIsOpen(true);
            }}
            placeholder="Search patient by name, mobile, or ID (e.g. PT-001)..."
            className="w-full h-12 pl-12 pr-10 text-base font-medium rounded-2xl border-2 border-slate-200 bg-white placeholder:text-slate-400 focus:border-medical-primary focus:outline-none focus:ring-4 focus:ring-medical-primary/10 transition shadow-sm"
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Quick Add Patient Button */}
        <button
          type="button"
          onClick={handleNewPatient}
          className="h-12 px-5 inline-flex items-center justify-center gap-2 rounded-2xl bg-medical-primary text-white font-semibold shadow-sm hover:bg-medical-secondary active:scale-[0.98] transition whitespace-nowrap"
        >
          <UserPlus size={18} />
          + New Patient
        </button>
      </div>

      {/* Instant Dropdown Results */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-96 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
          <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-100 flex justify-between items-center">
            <span>Patient Search Results</span>
            <span>{results.length} found</span>
          </div>

          {results.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-sm font-semibold text-slate-700">No patients found</p>
              <p className="mt-1 text-xs text-slate-500">
                No matching records for "{query}". You can register this patient now.
              </p>
              <button
                type="button"
                onClick={handleNewPatient}
                className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-medical-primary/10 text-medical-primary px-3 py-1.5 text-xs font-semibold hover:bg-medical-primary hover:text-white transition"
              >
                <UserPlus size={14} />
                + Register New Patient
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {results.map((patient) => {
                const contact = patient.contact || patient.mobile || '-';
                return (
                  <li
                    key={patient.id}
                    className="p-3 transition rounded-xl hover:bg-slate-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                  >
                    {/* Patient Info */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">{patient.name}</span>
                        <span className="text-xs font-mono font-medium rounded bg-slate-100 px-1.5 py-0.5 text-slate-600">
                          {patient.id}
                        </span>
                        {patient.status && (
                          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            {patient.status}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                        {(patient.age || patient.gender) && (
                          <span>
                            {patient.age ? `${patient.age} Y` : ''}
                            {patient.age && patient.gender ? ' / ' : ''}
                            {patient.gender}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 font-mono">
                          <Phone size={12} className="text-slate-400" />
                          {contact}
                        </span>
                        {patient.nextFollowUp && (
                          <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded text-[11px]">
                            <Calendar size={11} />
                            Follow-up: {patient.nextFollowUp}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleNewPrescription(patient.id)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-medical-primary bg-medical-primary/10 px-3 py-1.5 text-xs font-semibold text-medical-primary hover:bg-medical-primary hover:text-white transition"
                      >
                        <FilePlus size={14} />
                        New Prescription
                      </button>

                      <button
                        type="button"
                        onClick={() => handleViewProfile(patient.id)}
                        className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
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
