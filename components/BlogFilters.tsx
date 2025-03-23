'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MagnifyingGlassIcon, XMarkIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';

// Define blog categories
export const BLOG_CATEGORIES = [
  { name: 'Alle Kategorien', value: 'all' },
  { name: 'Technologie', value: 'Technologie' },
  { name: 'Tipps & Tricks', value: 'Tipps & Tricks' },
  { name: 'Politik', value: 'Politik' },
  { name: 'Wirtschaft', value: 'Wirtschaft' },
  { name: 'Nachhaltigkeit', value: 'Nachhaltigkeit' },
  { name: 'Umwelt', value: 'Umwelt' },
  { name: 'Kreislaufwirtschaft', value: 'Kreislaufwirtschaft' }
];

// Define sort options
export const SORT_OPTIONS = [
  { name: 'Neueste zuerst', value: 'newest' },
  { name: 'Älteste zuerst', value: 'oldest' },
  { name: 'A-Z', value: 'az' },
  { name: 'Z-A', value: 'za' },
  { name: 'Beliebteste', value: 'popular' }
];

interface BlogFiltersProps {
  onSearch: (params: {
    search: string;
    category: string;
    sort: string;
  }) => void;
  initialFilters?: {
    search?: string;
    category?: string;
    sort?: string;
  };
}

const BlogFilters: React.FC<BlogFiltersProps> = ({
  onSearch,
  initialFilters = {}
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // State for filters
  const [searchTerm, setSearchTerm] = useState(
    initialFilters.search || ''
  );
  const [selectedCategory, setSelectedCategory] = useState(
    initialFilters.category || 'all'
  );
  const [sortBy, setSortBy] = useState(
    initialFilters.sort || 'newest'
  );
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [filtersChanged, setFiltersChanged] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  
  // Check if device has touch support - client-side only
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsTouchDevice('ontouchstart' in window);
    }
  }, []);
  
  // Memoized function to apply filters
  const applyFilters = useCallback(() => {
    if (isSearching) return; // Prevent concurrent filter applications
    
    try {
      setIsSearching(true);
      console.log('Applying filters:', { search: searchTerm, category: selectedCategory, sort: sortBy });
      
      // Update URL parameters
      const params = new URLSearchParams();
      if (searchTerm) params.set('search', searchTerm);
      if (selectedCategory !== 'all') params.set('category', selectedCategory);
      if (sortBy !== 'newest') params.set('sort', sortBy);
      
      // Update the URL without refreshing the page
      const newUrl = `/blog${params.toString() ? '?' + params.toString() : ''}`;
      window.history.pushState({}, '', newUrl);
      
      // Trigger search
      onSearch({ search: searchTerm, category: selectedCategory, sort: sortBy });
      
      // Reset filters changed flag
      setFiltersChanged(false);
      
      // Close mobile filters if open
      setIsFilterOpen(false);
    } catch (error) {
      console.error('Error applying filters:', error);
    } finally {
      // Small delay before allowing new search to prevent rapid re-filtering
      setTimeout(() => {
        setIsSearching(false);
      }, 300);
    }
  }, [searchTerm, selectedCategory, sortBy, onSearch, isSearching]);
  
  // Apply URL parameters only on initial load or external URL change
  useEffect(() => {
    // Skip if no searchParams
    if (!searchParams) return;
    
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || 'all';
    const sort = searchParams.get('sort') || 'newest';
    
    // Only update if values are different to prevent unnecessary re-renders
    const needsUpdate = 
      search !== searchTerm || 
      category !== selectedCategory || 
      sort !== sortBy;
    
    if (needsUpdate) {
      console.log('Updating from URL params:', { search, category, sort });
      setSearchTerm(search);
      setSelectedCategory(category);
      setSortBy(sort);
      setFiltersChanged(false);
    }
  }, [searchParams]);
  
  // Handle search form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSearching && filtersChanged) {
      applyFilters();
    }
  };
  
  // Clear all filters
  const clearFilters = useCallback(() => {
    if (isSearching) return;
    
    setSearchTerm('');
    setSelectedCategory('all');
    setSortBy('newest');
    setFiltersChanged(false);
    
    // Update the URL
    window.history.pushState({}, '', '/blog');
    
    // Trigger search with cleared filters
    onSearch({ search: '', category: 'all', sort: 'newest' });
    
    // Close mobile filters if open
    setIsFilterOpen(false);
  }, [onSearch, isSearching]);
  
  // Handle category change 
  const handleCategoryChange = useCallback((categoryValue: string) => {
    if (categoryValue === selectedCategory || isSearching) return;
    
    setSelectedCategory(categoryValue);
    setFiltersChanged(true);
    
    // Don't auto-apply immediately to prevent multiple API calls
  }, [selectedCategory, isSearching]);
  
  // Handle sort change
  const handleSortChange = useCallback((sortValue: string) => {
    if (sortValue === sortBy || isSearching) return;
    
    setSortBy(sortValue);
    setFiltersChanged(true);
    
    // Apply after a delay for sort changes
    const timer = setTimeout(() => {
      applyFilters();
    }, 300);
    
    return () => clearTimeout(timer);
  }, [sortBy, applyFilters, isSearching]);
  
  // Toggle mobile filters visibility
  const toggleFilters = useCallback(() => {
    setIsFilterOpen(prev => !prev);
  }, []);
  
  // Search input change handler with debounce
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    setFiltersChanged(true);
  }, []);
  
  return (
    <div className="bg-white p-6 rounded-xl shadow-md mb-16">
      {/* Mobile filter toggle */}
      <div className="lg:hidden mb-4">
        <button
          type="button"
          onClick={toggleFilters}
          className="flex items-center justify-between w-full bg-gray-100 px-4 py-3 rounded-lg text-gray-700"
          aria-expanded={isFilterOpen}
        >
          <span className="flex items-center">
            <AdjustmentsHorizontalIcon className="h-5 w-5 mr-2" />
            Filter und Suche
          </span>
          <span className="text-sm">
            {isFilterOpen ? (
              <XMarkIcon className="h-5 w-5" />
            ) : (
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                {selectedCategory !== 'all' || searchTerm || sortBy !== 'newest' ? 'Aktiv' : 'Inaktiv'}
              </span>
            )}
          </span>
        </button>
      </div>

      <div className={`${isFilterOpen || !isTouchDevice ? 'block' : 'hidden lg:block'}`}>
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-grow">
              <input
                type="text"
                placeholder="Suchen Sie nach Artikeln..."
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:ring-green-500 focus:border-green-500"
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                aria-label="Artikel suchen"
              />
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" aria-hidden="true" />
            </div>
            <div className="flex-shrink-0">
              <select
                className="w-full py-3 pl-4 pr-10 rounded-lg border border-gray-200 focus:ring-green-500 focus:border-green-500 text-gray-700"
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                aria-label="Sortieren nach"
              >
                {SORT_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        
          {/* Category Filter */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-3">Filtern nach Kategorie:</h3>
            <div className="flex flex-wrap gap-2">
              {BLOG_CATEGORIES.map((category) => (
                <button
                  key={category.value}
                  type="button"
                  onClick={() => handleCategoryChange(category.value)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    category.value === selectedCategory
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                  aria-pressed={category.value === selectedCategory}
                  disabled={isSearching}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
          
          {/* Action buttons for mobile */}
          <div className="mt-6 flex flex-wrap gap-3 md:hidden">
            <button
              type="submit"
              className={`flex-1 ${filtersChanged ? 'bg-green-600' : 'bg-gray-400'} text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors`}
              disabled={!filtersChanged || isSearching}
            >
              {isSearching ? 'Wird angewendet...' : 'Anwenden'}
            </button>
            <button
              type="button"
              onClick={clearFilters}
              className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={isSearching}
            >
              Zurücksetzen
            </button>
          </div>
        </form>
        
        {/* Show active filters and clear button for desktop */}
        {(selectedCategory !== 'all' || searchTerm || sortBy !== 'newest') && (
          <div className="hidden md:flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
            <div className="text-sm text-gray-600">
              <strong>Aktive Filter:</strong>{' '}
              {selectedCategory !== 'all' && (
                <span className="inline-flex items-center bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs mr-2">
                  Kategorie: {BLOG_CATEGORIES.find(c => c.value === selectedCategory)?.name}{' '}
                </span>
              )}
              {searchTerm && (
                <span className="inline-flex items-center bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs mr-2">
                  Suche: "{searchTerm}"{' '}
                </span>
              )}
              {sortBy !== 'newest' && (
                <span className="inline-flex items-center bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                  Sortierung: {SORT_OPTIONS.find(s => s.value === sortBy)?.name}{' '}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={clearFilters}
              className="text-sm text-red-600 hover:text-red-700 flex items-center"
              disabled={isSearching}
            >
              <XMarkIcon className="h-4 w-4 mr-1" aria-hidden="true" />
              Filter zurücksetzen
            </button>
          </div>
        )}
        
        {/* Apply filters button for desktop */}
        {filtersChanged && (
          <div className="hidden md:flex justify-end mt-4">
            <button
              type="button"
              onClick={applyFilters}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              disabled={isSearching}
            >
              {isSearching ? 'Wird angewendet...' : 'Filter anwenden'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogFilters; 