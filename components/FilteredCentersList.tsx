'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { StarIcon, PhoneIcon, MapPinIcon, AdjustmentsHorizontalIcon, ArrowsUpDownIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/20/solid';
import SearchFilters from './SearchFilters';
import QuickFilters from './QuickFilters';
import CenterSkeleton from './CenterSkeleton';
import { useSearch, RecyclingCenter } from '@/components/SearchProvider';

interface FilteredCentersListProps {
  centers: RecyclingCenter[];
  isLoading?: boolean;
}

type SortOption = 'rating' | 'name' | 'distance';

export default function FilteredCentersList({ centers, isLoading = false }: FilteredCentersListProps) {
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>('rating');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const { filterCenters, isFilterActive, resetFilters } = useSearch();

  const filteredCenters = filterCenters(centers);

  // Get sort option from URL on component mount
  useEffect(() => {
    const sort = searchParams?.get('sort') as SortOption | null;
    if (sort && ['rating', 'name', 'distance'].includes(sort)) {
      setSortOption(sort);
    }
  }, [searchParams]);

  // Helper function to get materials from any available property
  const getMaterials = (center: RecyclingCenter): string[] => {
    return center.materials || center.acceptedMaterials || center.services || [];
  };

  // Apply sorting to centers - ensure we're dealing with a valid array
  const sortedCenters = Array.isArray(filteredCenters) ? [...filteredCenters].sort((a, b) => {
    switch (sortOption) {
      case 'rating':
        return b.rating - a.rating;
      case 'name':
        return a.name.localeCompare(b.name);
      case 'distance':
        // Would use actual distance calculation if user location is available
        // For now, just keep original order
        return 0;
      default:
        return 0;
    }
  }) : [];

  // Update URL with sort parameter
  const handleSortChange = (option: SortOption) => {
    setSortOption(option);
    setShowSortDropdown(false);
    
    const current = new URLSearchParams(Array.from(searchParams?.entries() || []));
    current.set('sort', option);
    
    const search = current.toString();
    const query = search ? `?${search}` : '';
    // Use the scroll:false option to prevent scroll reset
    router.push(`${window.location.pathname}${query}`, {
      scroll: false
    });
  };

  // Rendering skeletons during loading
  const renderSkeletons = () => {
    return Array(6).fill(0).map((_, index) => (
      <CenterSkeleton key={`skeleton-${index}`} />
    ));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters sidebar */}
        <div className="lg:w-64">
          <div className="sticky top-4">
            <div className="flex lg:hidden items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Filter</h2>
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                onClick={() => setMobileFiltersOpen(true)}
              >
                <AdjustmentsHorizontalIcon className="h-5 w-5 mr-2" />
                Filter
              </button>
            </div>
            
            <SearchFilters
              mobileFiltersOpen={mobileFiltersOpen}
              setMobileFiltersOpen={setMobileFiltersOpen}
              className="hidden lg:block"
            />
          </div>
        </div>

        {/* Centers list */}
        <div className="flex-1">
          <div className="mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <QuickFilters className="flex-grow" />
              
              {/* Sort dropdown */}
              <div className="relative">
                <button
                  type="button"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  onClick={() => setShowSortDropdown(!showSortDropdown)}
                >
                  <ArrowsUpDownIcon className="h-5 w-5 mr-2 text-gray-500" />
                  <span>
                    Sortieren nach: 
                    <span className="font-semibold ml-1">
                      {sortOption === 'rating' && 'Bewertung'}
                      {sortOption === 'name' && 'Name'}
                      {sortOption === 'distance' && 'Entfernung'}
                    </span>
                  </span>
                </button>
                
                {showSortDropdown && (
                  <div className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5">
                    <div className="py-1">
                      <button
                        className={`block px-4 py-2 text-sm w-full text-left ${sortOption === 'rating' ? 'bg-gray-100 text-gray-900' : 'text-gray-700'} hover:bg-gray-100`}
                        onClick={() => handleSortChange('rating')}
                      >
                        Bewertung
                      </button>
                      <button
                        className={`block px-4 py-2 text-sm w-full text-left ${sortOption === 'name' ? 'bg-gray-100 text-gray-900' : 'text-gray-700'} hover:bg-gray-100`}
                        onClick={() => handleSortChange('name')}
                      >
                        Name
                      </button>
                      <button
                        className={`block px-4 py-2 text-sm w-full text-left ${sortOption === 'distance' ? 'bg-gray-100 text-gray-900' : 'text-gray-700'} hover:bg-gray-100`}
                        onClick={() => handleSortChange('distance')}
                      >
                        Entfernung
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">
                {filteredCenters.length} {filteredCenters.length === 1 ? 'Standort' : 'Standorte'} gefunden
              </p>
              {isFilterActive && (
                <button
                  onClick={resetFilters}
                  className="text-green-600 hover:text-green-700 text-sm font-medium"
                >
                  Filter zurücksetzen
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
            {isLoading ? (
              renderSkeletons()
            ) : (
              sortedCenters.map((center) => {
                const locationLat = center.location?.lat || center.coordinates?.lat || center.latitude || 0;
                const locationLng = center.location?.lng || center.coordinates?.lng || center.longitude || 0;
                const materials = getMaterials(center);
                
                return (
                  <Link
                    key={center._id}
                    href={`/recycling-centers/${center.city.toLowerCase()}/${center.slug || center._id}`}
                    className="group relative bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-200"
                  >
                    <div className="relative h-48 bg-gray-200">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      <img
                        src={`https://maps.googleapis.com/maps/api/staticmap?center=${locationLat},${locationLng}&zoom=14&size=600x300&maptype=roadmap&markers=color:red%7C${locationLat},${locationLng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`}
                        alt={`Standort von ${center.name}`}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <h3 className="text-lg font-semibold text-white mb-1">{center.name}</h3>
                        <p className="text-sm text-white/90">{center.city}</p>
                      </div>
                      {center.rating >= 4.5 && (
                        <div className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-medium flex items-center">
                          <StarIconSolid className="h-4 w-4 mr-1" />
                          Premium
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="flex items-center text-sm text-gray-500 mb-2">
                        <MapPinIcon className="h-4 w-4 mr-1" />
                        {center.address}
                      </div>
                      {center.phone && (
                        <div className="flex items-center text-sm text-gray-500 mb-2">
                          <PhoneIcon className="h-4 w-4 mr-1" />
                          {center.phone}
                        </div>
                      )}
                      <div className="flex items-center text-sm text-gray-500">
                        <StarIcon className="h-4 w-4 mr-1" />
                        {center.rating.toFixed(1)} von 5
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1">
                        {materials.map((material, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800"
                          >
                            {material}
                          </span>
                        ))}
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>

          {!isLoading && filteredCenters.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                Keine Wertstoffhöfe gefunden, die Ihren Filterkriterien entsprechen.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 