'use client';

import React, { useState, useEffect } from 'react';
import { Search, Filter, MapPin, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface MaterialSearchProps {
  initialQuery?: string;
  initialCity?: string;
  onSearch?: (query: string, city: string) => void;
  className?: string;
}

export function MaterialSearch({ 
  initialQuery = '', 
  initialCity = '',
  onSearch,
  className = ''
}: MaterialSearchProps) {
  const [query, setQuery] = useState(initialQuery);
  const [city, setCity] = useState(initialCity);
  const [showFilter, setShowFilter] = useState(false);
  const router = useRouter();

  // Reset fields when props change
  useEffect(() => {
    setQuery(initialQuery);
    setCity(initialCity);
  }, [initialQuery, initialCity]);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    if (onSearch) {
      onSearch(query, city);
    } else {
      // Default behavior - navigate to search results page
      const searchParams = new URLSearchParams();
      if (query) searchParams.set('q', query);
      if (city) searchParams.set('city', city);
      
      router.push(`/search?${searchParams.toString()}`);
    }
  };

  const clearSearch = () => {
    setQuery('');
    setCity('');
    if (!onSearch) {
      router.push('/materials');
    }
  };

  return (
    <div className={`w-full ${className}`}>
      <form onSubmit={handleSearch} className="relative">
        <div className="flex flex-col space-y-2">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            
            <input
              type="text"
              placeholder="Nach Material suchen (z.B. Aluminium, Kupfer, Papier)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-20 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            
            <div className="absolute inset-y-0 right-0 flex items-center">
              {(query || city) && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              
              <button
                type="button"
                onClick={() => setShowFilter(!showFilter)}
                className="p-2 mr-1 text-gray-500 hover:text-gray-700"
              >
                <Filter className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          {showFilter && (
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MapPin className="h-5 w-5 text-gray-400" />
              </div>
              
              <input
                type="text"
                placeholder="Stadt oder PLZ eingeben"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          )}
        </div>
        
        <div className="mt-2 flex justify-end">
          <Button 
            type="submit"
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
          >
            <Search className="h-4 w-4 mr-2" />
            Suchen
          </Button>
        </div>
      </form>
    </div>
  );
} 