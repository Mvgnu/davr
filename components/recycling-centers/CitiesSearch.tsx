"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, ArrowRight, Loader2, MapPin } from 'lucide-react';
import { CityStats } from '@/lib/data/recycling';

interface CitiesSearchProps {
  initialCities: string[];
  popularCities: CityStats[];
}

export default function CitiesSearch({ initialCities, popularCities }: CitiesSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCities, setFilteredCities] = useState<string[]>(initialCities);
  const [isSearching, setIsSearching] = useState(false);
  
  // Filter cities when search query changes
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredCities(initialCities);
      return;
    }
    
    setIsSearching(true);
    
    // Debounce search
    const timer = setTimeout(() => {
      const filtered = initialCities.filter(city => 
        city.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredCities(filtered);
      setIsSearching(false);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchQuery, initialCities]);
  
  // Get first letter of each city for alphabetical grouping
  const alphabeticalGroups = filteredCities.reduce((acc, city) => {
    const firstLetter = city.charAt(0).toUpperCase();
    if (!acc[firstLetter]) {
      acc[firstLetter] = [];
    }
    acc[firstLetter].push(city);
    return acc;
  }, {} as Record<string, string[]>);
  
  // Sort letters alphabetically
  const sortedLetters = Object.keys(alphabeticalGroups).sort();
  
  return (
    <div>
      {/* Popular cities section */}
      <div className="mb-10">
        <h2 className="text-2xl font-bold mb-6">Beliebte Städte</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {popularCities.slice(0, 10).map(city => (
            <Link 
              key={city.id} 
              href={`/recycling-centers/${city.name.toLowerCase().replace(/\s+/g, '-')}`}
              className="block bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col h-full">
                <h3 className="font-semibold mb-2">{city.name}</h3>
                <div className="mt-auto flex items-center justify-between">
                  <span className="text-sm text-gray-600">{city.centersCount} Center</span>
                  <ArrowRight className="w-4 h-4 text-green-600" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
      
      {/* Search box */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Alle Städte durchsuchen</h2>
        <div className="relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Stadt suchen..."
            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900"
          />
        </div>
      </div>
      
      {/* Loading state */}
      {isSearching && (
        <div className="flex items-center justify-center p-10">
          <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
        </div>
      )}
      
      {/* City list with alphabetical grouping */}
      {!isSearching && filteredCities.length > 0 && (
        <div>
          {sortedLetters.map(letter => (
            <div key={letter} className="mb-8">
              <h3 className="bg-green-50 text-green-800 px-3 py-2 rounded-lg inline-block text-lg font-semibold mb-4">{letter}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {alphabeticalGroups[letter].map(city => (
                  <Link 
                    key={city} 
                    href={`/recycling-centers/${city.toLowerCase().replace(/\s+/g, '-')}`}
                    className="block bg-white border border-gray-200 rounded-lg p-3 hover:bg-green-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate">{city}</span>
                      <MapPin className="w-4 h-4 flex-shrink-0 text-gray-400" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* No results */}
      {!isSearching && filteredCities.length === 0 && (
        <div className="py-12 text-center">
          <div className="bg-gray-100 inline-block p-4 rounded-full mb-4">
            <Search className="w-6 h-6 text-gray-500" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Keine Städte gefunden</h3>
          <p className="text-gray-600">Es wurden keine Städte mit dem Suchbegriff "{searchQuery}" gefunden.</p>
        </div>
      )}
    </div>
  );
} 