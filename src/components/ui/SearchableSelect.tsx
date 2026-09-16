import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  subLabel?: string;
  badge?: string;
}

export interface ActionOption {
  label: string;
  onAction: () => void;
  icon?: React.ReactNode;
}

interface SearchableSelectProps {
  options: SelectOption[];
  value: string | undefined | null;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  actionOption?: ActionOption;
  disabled?: boolean;
  error?: string;
  className?: string;
  id?: string;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select option...',
  searchPlaceholder = 'Search...',
  actionOption,
  disabled = false,
  error,
  className = '',
  id,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  const filteredOptions = options.filter((opt) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      opt.label.toLowerCase().includes(term) ||
      opt.value.toLowerCase().includes(term) ||
      (opt.subLabel && opt.subLabel.toLowerCase().includes(term))
    );
  });

  // Handle outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input on open
  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setHighlightedIndex(0);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (isOpen && listRef.current) {
      const items = listRef.current.querySelectorAll('li');
      if (items[highlightedIndex]) {
        items[highlightedIndex].scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    const totalItems = filteredOptions.length + (actionOption ? 1 : 0);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1 < totalItems ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : Math.max(0, totalItems - 1)));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (actionOption && highlightedIndex === filteredOptions.length) {
        setIsOpen(false);
        actionOption.onAction();
      } else if (filteredOptions[highlightedIndex]) {
        onChange(filteredOptions[highlightedIndex].value);
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Control button */}
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className={`w-full flex items-center justify-between px-3 py-2 text-left bg-white border rounded-md shadow-sm text-sm focus:outline-none focus:ring-1 transition-colors ${
          disabled
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
            : error
            ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
            : 'border-gray-300 hover:border-gray-400 focus:border-indigo-500 focus:ring-indigo-500'
        }`}
      >
        <span className="truncate block mr-2">
          {selectedOption ? (
            <span className="text-gray-900 font-medium">
              {selectedOption.label}
              {selectedOption.badge && (
                <span className="ml-2 px-1.5 py-0.5 text-xs rounded bg-gray-100 text-gray-600 font-normal">
                  {selectedOption.badge}
                </span>
              )}
            </span>
          ) : (
            <span className="text-gray-400">{placeholder}</span>
          )}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-gray-400 flex-shrink-0 transition-transform duration-200 ${
            isOpen ? 'transform rotate-180 text-indigo-600' : ''
          }`}
        />
      </button>

      {/* Error message */}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-72 flex flex-col overflow-hidden text-sm animate-in fade-in-50 duration-150">
          {/* Search box */}
          <div className="p-2 border-b border-gray-100 bg-gray-50 flex items-center space-x-2">
            <Search className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setHighlightedIndex(0);
              }}
              onKeyDown={handleKeyDown}
              placeholder={searchPlaceholder}
              className="w-full bg-transparent border-none text-xs text-gray-900 focus:outline-none focus:ring-0 p-0"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="text-gray-400 hover:text-gray-600 p-0.5"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Options list */}
          <ul
            ref={listRef}
            className="overflow-y-auto max-h-52 divide-y divide-gray-50 focus:outline-none"
            role="listbox"
          >
            {filteredOptions.length === 0 ? (
              <li className="p-3 text-xs text-center text-gray-400">No matching results</li>
            ) : (
              filteredOptions.map((option, index) => {
                const isSelected = option.value === value;
                const isHighlighted = index === highlightedIndex;

                return (
                  <li
                    key={option.value}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`px-3 py-2 cursor-pointer transition-colors flex flex-col ${
                      isSelected
                        ? 'bg-indigo-50 font-medium text-indigo-900'
                        : isHighlighted
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate">{option.label}</span>
                      {option.badge && (
                        <span className="ml-2 px-1.5 py-0.2 text-[10px] uppercase tracking-wider rounded bg-indigo-100 text-indigo-700 font-semibold">
                          {option.badge}
                        </span>
                      )}
                    </div>
                    {option.subLabel && (
                      <span className="text-[11px] text-gray-500 truncate mt-0.5">
                        {option.subLabel}
                      </span>
                    )}
                  </li>
                );
              })
            )}

            {/* Action option (+ Add New ...) */}
            {actionOption && (
              <li
                role="option"
                aria-selected={false}
                onClick={() => {
                  setIsOpen(false);
                  actionOption.onAction();
                }}
                onMouseEnter={() => setHighlightedIndex(filteredOptions.length)}
                className={`px-3 py-2.5 cursor-pointer font-medium text-indigo-600 hover:bg-indigo-50 border-t border-gray-100 flex items-center space-x-1.5 text-xs ${
                  highlightedIndex === filteredOptions.length ? 'bg-indigo-50' : ''
                }`}
              >
                {actionOption.icon}
                <span>{actionOption.label}</span>
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};
