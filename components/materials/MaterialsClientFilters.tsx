'use client';

import React, { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';
import MaterialQuickFilters from './MaterialQuickFilters';

interface MaterialsClientFiltersProps {
  initialQuery: string;
  initialDifficulty: string | null;
  initialRecyclability: string | null;
}

export default function MaterialsClientFilters({
  initialQuery,
  initialDifficulty,
  initialRecyclability,
}: MaterialsClientFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [difficulty, setDifficulty] = useState<string | null>(initialDifficulty);
  const [recyclability, setRecyclability] = useState<string | null>(initialRecyclability);

  const updateFilters = (newDifficulty: string | null, newRecyclability: string | null, newQuery?: string) => {
    const params = new URLSearchParams(searchParams.toString());

    // Update query
    const queryValue = newQuery !== undefined ? newQuery : searchQuery;
    if (queryValue) {
      params.set('q', queryValue);
    } else {
      params.delete('q');
    }

    // Update difficulty
    if (newDifficulty) {
      params.set('difficulty', newDifficulty);
    } else {
      params.delete('difficulty');
    }

    // Update recyclability
    if (newRecyclability) {
      params.set('min_recyclability', newRecyclability);
    } else {
      params.delete('min_recyclability');
    }

    // Reset to page 1 when filters change
    params.delete('page');

    startTransition(() => {
      router.push(`/materials?${params.toString()}`);
    });
  };

  const handleDifficultyChange = (newDifficulty: string | null) => {
    setDifficulty(newDifficulty);
    updateFilters(newDifficulty, recyclability);
  };

  const handleRecyclabilityChange = (newRecyclability: string | null) => {
    setRecyclability(newRecyclability);
    updateFilters(difficulty, newRecyclability);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters(difficulty, recyclability, searchQuery);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    updateFilters(difficulty, recyclability, '');
  };

  return (
    <div className="mb-8 space-y-6">
      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="relative max-w-2xl">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Materialien durchsuchen..."
            className="w-full pl-12 pr-12 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        {isPending && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </form>

      {/* Quick Filters */}
      <MaterialQuickFilters
        selectedDifficulty={difficulty}
        selectedRecyclability={recyclability}
        onDifficultyChange={handleDifficultyChange}
        onRecyclabilityChange={handleRecyclabilityChange}
      />
    </div>
  );
}
