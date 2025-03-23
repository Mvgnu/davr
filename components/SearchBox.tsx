'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { MagnifyingGlassIcon, MapPinIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';
import { useSearch } from '@/components/SearchProvider';
import FilterModal from './FilterModal';
import { useGeolocation } from '@/hooks/useGeolocation';

interface SearchBoxProps {
  placeholder?: string;
  darkMode?: boolean;
  showLocationButton?: boolean;
  showFilterButton?: boolean;
  showAdvancedSearch?: boolean;
  className?: string;
  onFilterClick?: () => void;
}

// Simple inline FilterTags component
const FilterTags = ({ darkMode = false }: { darkMode?: boolean }) => {
  const { materials, setMaterials, applyFilters } = useSearch();

  // Material options for recycling centers
  const materialOptions = [
    { id: 'aluminium', label: 'Aluminium' },
    { id: 'paper', label: 'Papier' },
    { id: 'glass', label: 'Glas' },
    { id: 'plastic', label: 'Plastik' },
    { id: 'electronics', label: 'Elektronik' },
    { id: 'hazardous', label: 'Sondermüll' },
    { id: 'bulky', label: 'Sperrmüll' },
    { id: 'bio', label: 'Bioabfall' },
  ];

  const toggleMaterial = (materialId: string) => {
    const updatedMaterials = materials.includes(materialId)
      ? materials.filter(id => id !== materialId)
      : [...materials, materialId];
    
    setMaterials(updatedMaterials);
    applyFilters();
  };

  return (
    <div className="w-full">
      <div className="flex items-center mb-2">
        <span className={`text-sm font-medium ${darkMode ? 'text-white/90' : 'text-gray-700'}`}>
          Material filtern:
        </span>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {materialOptions.map((material) => {
          const isSelected = materials.includes(material.id);
          return (
            <button
              key={material.id}
              onClick={() => toggleMaterial(material.id)}
              className={`
                px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200
                ${isSelected 
                  ? (darkMode 
                      ? 'bg-green-500 text-white' 
                      : 'bg-green-100 text-green-800 border-green-300')
                  : (darkMode 
                      ? 'bg-white/10 text-white/90 hover:bg-white/20' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200')
                }
                ${darkMode ? 'border border-transparent' : 'border'}
              `}
            >
              {material.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default function SearchBox({
  placeholder = 'Suchen...',
  darkMode = false,
  showLocationButton = false,
  showFilterButton = false,
  showAdvancedSearch = false,
  className = '',
  onFilterClick
}: SearchBoxProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams?.get('query') || '');
  const { getCurrentPosition, isLoading: isLoadingLocation } = useGeolocation();
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  
  const pathname = usePathname();

  useEffect(() => {
    setSearchTerm(searchParams?.get('query') || '');
  }, [searchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const current = new URLSearchParams(Array.from(searchParams?.entries() || []));
    
    if (searchTerm) {
      current.set('query', searchTerm);
    } else {
      current.delete('query');
    }

    const search = current.toString();
    const query = search ? `?${search}` : '';
    router.push(`${window.location.pathname}${query}`, { scroll: false });
  };

  const handleLocationSearch = async () => {
    try {
      const position = await getCurrentPosition();
      const current = new URLSearchParams(Array.from(searchParams?.entries() || []));
      current.set('lat', position.coords.latitude.toString());
      current.set('lng', position.coords.longitude.toString());
      
      const search = current.toString();
      const query = search ? `?${search}` : '';
      router.push(`${window.location.pathname}${query}`, { scroll: false });
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const handleOpenFilters = () => {
    if (onFilterClick) {
      onFilterClick();
    } else {
      setIsFilterModalOpen(true);
    }
  };

  const baseInputClasses = `
    w-full py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-green-500
    ${darkMode
      ? 'bg-white/10 text-white placeholder-white/60 backdrop-blur-sm border-white/20'
      : 'bg-white text-gray-900 placeholder-gray-500 border-gray-300'
    }
    ${showLocationButton ? 'rounded-l-lg' : 'rounded-l-lg rounded-r-lg'}
  `;

  const baseButtonClasses = `
    p-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
    ${darkMode
      ? 'text-white hover:bg-white/10'
      : 'text-gray-700 hover:bg-gray-50'
    }
  `;

  return (
    <div className={`flex flex-col w-full ${className}`}>
      {/* Search row */}
      <div className="relative flex w-full rounded-lg shadow-sm">
        <form onSubmit={handleSearch} className="relative flex-grow">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            <MagnifyingGlassIcon
              className={`h-5 w-5 ${darkMode ? 'text-white/60' : 'text-gray-400'}`}
              aria-hidden="true"
            />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={placeholder}
            className={baseInputClasses}
          />
        </form>

        {showLocationButton && (
          <button
            type="button"
            onClick={handleLocationSearch}
            disabled={isLoadingLocation}
            className={`${baseButtonClasses} border-l ${
              darkMode ? 'border-white/20' : 'border-gray-300'
            } ${showFilterButton ? '' : 'rounded-r-lg'}`}
          >
            <MapPinIcon className={`h-5 w-5 ${darkMode ? 'text-white/60' : 'text-gray-400'}`} />
            <span className="sr-only">Standort verwenden</span>
          </button>
        )}

        {showFilterButton && (
          <button
            type="button"
            onClick={handleOpenFilters}
            className={`${baseButtonClasses} rounded-r-lg border-l ${
              darkMode ? 'border-white/20' : 'border-gray-300'
            }`}
          >
            <AdjustmentsHorizontalIcon
              className={`h-5 w-5 ${darkMode ? 'text-white/60' : 'text-gray-400'}`}
            />
            <span className="sr-only">Filter öffnen</span>
          </button>
        )}
      </div>

      {/* Material filters row */}
      {showAdvancedSearch && (
        <div className={`mt-3 px-1 ${darkMode ? 'text-white/90' : 'text-gray-700'}`}>
          <FilterTags darkMode={darkMode} />
        </div>
      )}

      <FilterModal 
        isOpen={isFilterModalOpen} 
        onClose={() => setIsFilterModalOpen(false)}
      />
    </div>
  );
} 