import React, { useState, useEffect, useRef, useId } from 'react';
import { localMedicines } from '../../../services/localStore';

/**
 * MedicineAutocomplete
 *
 * Fast, keyboard-accessible autocomplete component for medicine selection.
 * Integrates directly with localMedicines catalog.
 *
 * Props:
 * - value: string (initial/controlled query string)
 * - onChange: function(event) (standard input change handler)
 * - onSelect: function(selectedMedicine) (called with full medicine object)
 * - placeholder: string
 * - debounceMs: number (debounce in milliseconds, default 0 for instant local catalog search)
 * - disabled: boolean
 * - className: string
 * - autoFocus: boolean
 */
export default function MedicineAutocomplete({
  value = '',
  onChange,
  onSelect,
  placeholder = 'Medicine name',
  debounceMs = 0,
  disabled = false,
  className = '',
  autoFocus = false,
}) {
  const [query, setQuery] = useState(value || '');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const compId = useId();

  // Sync internal query when controlled value changes from outside
  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  // Debounced search against localMedicines
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2 || !isOpen) {
      setResults([]);
      setHighlightedIndex(-1);
      setIsSearching(false);
      return;
    }

    if (debounceMs <= 0) {
      const found = localMedicines.search(trimmed);
      setResults(found);
      setHighlightedIndex(-1);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(() => {
      const found = localMedicines.search(trimmed);
      setResults(found);
      setHighlightedIndex(-1);
      setIsSearching(false);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, isOpen, debounceMs]);

  // Click outside to dismiss dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleInputChange = (e) => {
    const nextVal = e.target.value;
    setQuery(nextVal);
    setIsOpen(nextVal.trim().length >= 2);
    if (onChange) {
      onChange(e);
    }
  };

  const handleSelect = (item) => {
    setQuery(item.name || '');
    setIsOpen(false);
    setResults([]);
    setHighlightedIndex(-1);
    if (onSelect) {
      onSelect(item);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      return;
    }

    if (!isOpen) {
      if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && query.trim().length >= 2) {
        setIsOpen(true);
        return;
      }
    }

    if (isOpen && results.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const targetIndex = highlightedIndex >= 0 ? highlightedIndex : 0;
        if (results[targetIndex]) {
          handleSelect(results[targetIndex]);
        }
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className={`med-autocomplete-container ${className}`.trim()}
    >
      <input
        ref={inputRef}
        type="text"
        role="combobox"
        aria-expanded={isOpen}
        aria-autocomplete="list"
        aria-controls={isOpen ? `med-autocomplete-listbox-${compId}` : undefined}
        aria-activedescendant={
          isOpen && highlightedIndex >= 0 ? `med-option-${compId}-${highlightedIndex}` : undefined
        }
        className="medicine-input med-autocomplete-input"
        placeholder={placeholder}
        value={query}
        disabled={disabled}
        autoFocus={autoFocus}
        onChange={handleInputChange}
        onFocus={() => {
          if (query.trim().length >= 2) {
            setIsOpen(true);
          }
        }}
        onKeyDown={handleKeyDown}
      />

      {isOpen && query.trim().length >= 2 && !isSearching && (
        <ul
          id={`med-autocomplete-listbox-${compId}`}
          role="listbox"
          className="med-autocomplete-dropdown"
        >
          {results.length > 0 ? (
            results.map((item, index) => {
              const isSelected = index === highlightedIndex;
              return (
                <li
                  key={item.id || `${item.name}-${index}`}
                  id={`med-option-${compId}-${index}`}
                  role="option"
                  aria-selected={isSelected}
                  className={`med-autocomplete-item ${isSelected ? 'highlighted' : ''}`}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelect(item);
                  }}
                >
                  <div className="med-autocomplete-main">
                    <span className="med-name">{item.name}</span>
                    {item.strength && <span className="med-strength">{item.strength}</span>}
                    {item.form && (
                      <span className={`med-badge med-badge-${String(item.form).toLowerCase()}`}>
                        {item.form}
                      </span>
                    )}
                  </div>
                  {(item.defaultDosage ||
                    item.defaultTiming ||
                    item.defaultDuration ||
                    item.defaultInstruction) && (
                    <div className="med-autocomplete-meta">
                      {item.defaultDosage && (
                        <span className="med-meta-dosage">{item.defaultDosage}</span>
                      )}
                      {item.defaultTiming && (
                        <span className="med-meta-timing">• {item.defaultTiming}</span>
                      )}
                      {item.defaultDuration && (
                        <span className="med-meta-duration">• {item.defaultDuration}</span>
                      )}
                      {item.defaultInstruction && (
                        <span className="med-meta-instruction">
                          ({item.defaultInstruction})
                        </span>
                      )}
                    </div>
                  )}
                </li>
              );
            })
          ) : (
            <li className="med-autocomplete-empty" role="option" aria-disabled="true">
              No matching medicines found
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
