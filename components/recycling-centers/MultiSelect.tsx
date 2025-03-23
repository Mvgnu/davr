'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Option {
  id: string | number;
  name: string;
  category?: string;
}

interface MultiSelectProps {
  options: Option[];
  selectedValues: (string | number)[];
  onChange: (values: (string | number)[]) => void;
  placeholder?: string;
  groupByCategory?: boolean;
  className?: string;
  maxVisible?: number;
  disabled?: boolean;
}

const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  selectedValues,
  onChange,
  placeholder = 'Select options',
  groupByCategory = false,
  className = '',
  maxVisible = 3,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Group options by category if needed
  const groupedOptions = groupByCategory
    ? options.reduce((groups, option) => {
        const category = option.category || 'Other';
        if (!groups[category]) {
          groups[category] = [];
        }
        groups[category].push(option);
        return groups;
      }, {} as Record<string, Option[]>)
    : { 'All': options };

  // Filter options based on search term
  const filteredGroupedOptions = Object.entries(groupedOptions).reduce((acc, [category, categoryOptions]) => {
    const filtered = categoryOptions.filter(option => 
      option.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (filtered.length > 0) {
      acc[category] = filtered;
    }
    
    return acc;
  }, {} as Record<string, Option[]>);

  // Handle toggling the dropdown
  const toggleDropdown = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      if (!isOpen && inputRef.current) {
        setTimeout(() => {
          inputRef.current?.focus();
        }, 10);
      }
    }
  };

  // Handle clicking outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle selecting/deselecting an option
  const toggleOption = (id: string | number) => {
    if (selectedValues.includes(id)) {
      onChange(selectedValues.filter(value => value !== id));
    } else {
      onChange([...selectedValues, id]);
    }
  };

  // Remove a selected option
  const removeOption = (e: React.MouseEvent, id: string | number) => {
    e.stopPropagation();
    onChange(selectedValues.filter(value => value !== id));
  };

  // Get selected options with details
  const selectedOptions = options.filter(option => selectedValues.includes(option.id));
  
  // Visible selected options
  const visibleSelectedOptions = selectedOptions.slice(0, maxVisible);
  const remainingCount = selectedOptions.length - maxVisible;

  return (
    <div 
      className={cn(
        "relative w-full",
        className
      )} 
      ref={containerRef}
    >
      <div
        onClick={toggleDropdown}
        className={cn(
          "flex min-h-[40px] w-full flex-wrap items-center gap-1 rounded-md border bg-white px-3 py-2 text-sm ring-offset-white focus-within:ring-2 focus-within:ring-green-500",
          isOpen && "border-green-500 ring-2 ring-green-500",
          disabled && "cursor-not-allowed opacity-50",
          !disabled && "cursor-pointer"
        )}
      >
        {selectedOptions.length === 0 ? (
          <span className="text-gray-500">{placeholder}</span>
        ) : (
          <>
            {visibleSelectedOptions.map(option => (
              <span
                key={option.id}
                className="inline-flex items-center gap-1 rounded-md bg-green-50 px-2 py-1 text-xs font-semibold text-green-700"
              >
                {option.name}
                <button
                  type="button"
                  onClick={(e) => removeOption(e, option.id)}
                  className="text-green-700 hover:text-green-900"
                >
                  <X className="h-3 w-3" />
                  <span className="sr-only">Remove {option.name}</span>
                </button>
              </span>
            ))}
            {remainingCount > 0 && (
              <span className="text-xs text-gray-500">+{remainingCount} more</span>
            )}
          </>
        )}
        <ChevronDown className={cn(
          "ml-auto h-4 w-4 flex-shrink-0 opacity-50 transition-transform",
          isOpen && "rotate-180 transform"
        )} />
      </div>
      
      {isOpen && (
        <div className="absolute z-50 mt-1 max-h-80 w-full overflow-auto rounded-md border border-gray-200 bg-white p-1 text-sm shadow-lg">
          <div className="sticky top-0 z-10 bg-white p-2">
            <input
              ref={inputRef}
              type="text"
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="mt-2 max-h-60 overflow-auto py-1">
            {Object.keys(filteredGroupedOptions).length > 0 ? (
              Object.entries(filteredGroupedOptions).map(([category, categoryOptions]) => (
                <div key={category} className="mb-2">
                  {groupByCategory && Object.keys(groupedOptions).length > 1 && (
                    <div className="px-3 py-1.5 text-xs font-semibold text-gray-500">
                      {category}
                    </div>
                  )}
                  {categoryOptions.map(option => (
                    <div
                      key={option.id}
                      onClick={() => toggleOption(option.id)}
                      className={cn(
                        "flex cursor-pointer items-center justify-between rounded-md px-3 py-1.5 hover:bg-green-50",
                        selectedValues.includes(option.id) && "bg-green-50"
                      )}
                    >
                      <span>{option.name}</span>
                      {selectedValues.includes(option.id) && (
                        <Check className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                  ))}
                </div>
              ))
            ) : (
              <div className="px-3 py-2 text-center text-gray-500">
                No options found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiSelect; 