'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, AlertTriangle, Recycle, X } from 'lucide-react';

interface MaterialQuickFiltersProps {
  selectedDifficulty: string | null;
  selectedRecyclability: string | null;
  onDifficultyChange: (difficulty: string | null) => void;
  onRecyclabilityChange: (recyclability: string | null) => void;
}

export default function MaterialQuickFilters({
  selectedDifficulty,
  selectedRecyclability,
  onDifficultyChange,
  onRecyclabilityChange,
}: MaterialQuickFiltersProps) {
  const difficultyFilters = [
    {
      value: 'EASY',
      label: 'Einfach zu recyceln',
      icon: CheckCircle2,
      color: 'green',
      bgClass: 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700 text-green-700 dark:text-green-300',
      selectedClass: 'bg-green-600 dark:bg-green-500 text-white border-green-600 dark:border-green-500',
    },
    {
      value: 'MEDIUM',
      label: 'Mittel',
      icon: AlertCircle,
      color: 'yellow',
      bgClass: 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700 text-yellow-700 dark:text-yellow-300',
      selectedClass: 'bg-yellow-600 dark:bg-yellow-500 text-white border-yellow-600 dark:border-yellow-500',
    },
    {
      value: 'HARD',
      label: 'Schwierig',
      icon: AlertTriangle,
      color: 'red',
      bgClass: 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700 text-red-700 dark:text-red-300',
      selectedClass: 'bg-red-600 dark:bg-red-500 text-white border-red-600 dark:border-red-500',
    },
  ];

  const recyclabilityFilters = [
    {
      value: '80',
      label: 'Hoch recycelbar (≥80%)',
      icon: Recycle,
    },
    {
      value: '50',
      label: 'Mittel (≥50%)',
      icon: Recycle,
    },
  ];

  const hasActiveFilters = selectedDifficulty || selectedRecyclability;

  const clearAllFilters = () => {
    onDifficultyChange(null);
    onRecyclabilityChange(null);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 md:p-5 space-y-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Schnellfilter
        </h3>
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            Alle löschen
          </button>
        )}
      </div>

      {/* Difficulty Filters */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Recycling-Schwierigkeit
        </label>
        <div className="flex flex-wrap gap-2">
          {difficultyFilters.map((filter) => {
            const Icon = filter.icon;
            const isSelected = selectedDifficulty === filter.value;

            return (
              <button
                key={filter.value}
                onClick={() => onDifficultyChange(isSelected ? null : filter.value)}
                className={`
                  px-3 py-2 rounded-lg border text-sm font-medium transition-all duration-200
                  flex items-center gap-1.5
                  ${isSelected ? filter.selectedClass : filter.bgClass}
                  hover:shadow-sm active:scale-95
                `}
              >
                <Icon className="w-4 h-4" />
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Recyclability Filters */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Recycelbarkeit
        </label>
        <div className="flex flex-wrap gap-2">
          {recyclabilityFilters.map((filter) => {
            const Icon = filter.icon;
            const isSelected = selectedRecyclability === filter.value;

            return (
              <button
                key={filter.value}
                onClick={() => onRecyclabilityChange(isSelected ? null : filter.value)}
                className={`
                  px-3 py-2 rounded-lg border text-sm font-medium transition-all duration-200
                  flex items-center gap-1.5
                  ${
                    isSelected
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                  }
                  hover:shadow-sm active:scale-95
                `}
              >
                <Icon className="w-4 h-4" />
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground">Aktive Filter:</span>
            {selectedDifficulty && (
              <Badge variant="secondary" className="text-xs">
                Schwierigkeit: {difficultyFilters.find(f => f.value === selectedDifficulty)?.label}
              </Badge>
            )}
            {selectedRecyclability && (
              <Badge variant="secondary" className="text-xs">
                Recycelbarkeit: ≥{selectedRecyclability}%
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
