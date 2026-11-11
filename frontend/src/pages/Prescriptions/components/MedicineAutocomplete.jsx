import React, { useState, useEffect, useRef, useId, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { localMedicines } from '../../../services/localStore';

/**
 * MedicineAutocomplete
 *
 * Fast, keyboard-accessible autocomplete component for Nivara prescription studio.
 * Integrates directly with master formulary catalog (localMedicines).
 *
 * Keyboard Accessibility:
 * - ArrowDown / ArrowUp moves through matching options
 * - Enter selects highlighted option OR preserves typed query when none highlighted
 * - Escape closes dropdown
 * - Click outside closes dropdown
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
  const dropdownRef = useRef(null);
  const compId = useId();
  const [dropdownCoords, setDropdownCoords] = useState({ top: 0, left: 0, width: 380 });

  const updateCoords = useCallback(() => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
      const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
      const spaceBelow = viewportHeight - rect.bottom;
      const dropdownHeight = 280;
      const showAbove = spaceBelow < dropdownHeight && rect.top > dropdownHeight;
      const targetWidth = Math.max(rect.width, 380);
      const targetLeft = Math.max(10, Math.min(rect.left, viewportWidth - targetWidth - 10));

      setDropdownCoords({
        top: showAbove ? Math.max(10, rect.top - dropdownHeight - 4) : rect.bottom + 4,
        left: targetLeft,
        width: targetWidth,
      });
    }
  }, []);

  // Update coordinates when opened or when window resizes/scrolls
  useEffect(() => {
    if (!isOpen) return;
    updateCoords();

    const handleScrollOrResize = () => {
      updateCoords();
    };

    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);
    return () => {
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
    };
  }, [isOpen, updateCoords]);

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

  // Click outside to dismiss dropdown (checks container and portal dropdown)
  useEffect(() => {
    const handleClickOutside = (event) => {
      const clickedInsideContainer = containerRef.current && containerRef.current.contains(event.target);
      const clickedInsideDropdown = dropdownRef.current && dropdownRef.current.contains(event.target);
      if (!clickedInsideContainer && !clickedInsideDropdown) {
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
        if (highlightedIndex >= 0 && results[highlightedIndex]) {
          e.preventDefault();
          handleSelect(results[highlightedIndex]);
        } else {
          // If no option highlighted, close dropdown and preserve what the doctor typed
          setIsOpen(false);
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

      {isOpen && query.trim().length >= 2 && !isSearching && typeof document !== 'undefined' &&
        createPortal(
          <ul
            ref={dropdownRef}
            id={`med-autocomplete-listbox-${compId}`}
            role="listbox"
            className="med-autocomplete-dropdown shadow-nivara-lg"
            style={{
              position: 'fixed',
              top: `${dropdownCoords.top}px`,
              left: `${dropdownCoords.left}px`,
              width: `${dropdownCoords.width}px`,
              zIndex: 99999,
            }}
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
                      <span className="med-name font-semibold text-[#10201F]">{item.name}</span>
                      {item.strength && (
                        <span className="med-strength text-xs bg-[#E8F3F1] text-[#287C75] font-medium px-1.5 py-0.5 rounded tabular-nums">
                          {item.strength}
                        </span>
                      )}
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
                      <div className="med-autocomplete-meta text-xs text-[#4E6460]">
                        {item.defaultDosage && (
                          <span className="med-meta-dosage font-semibold text-[#287C75]">
                            {item.defaultDosage}
                          </span>
                        )}
                        {item.defaultTiming && (
                          <span className="med-meta-timing">• {item.defaultTiming}</span>
                        )}
                        {item.defaultDuration && (
                          <span className="med-meta-duration tabular-nums">• {item.defaultDuration}</span>
                        )}
                        {item.defaultInstruction && (
                          <span className="med-meta-instruction italic text-[#7D908C]">
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
                No matching medicines found in formulary
              </li>
            )}
          </ul>,
          document.body
        )}
    </div>
  );
}
