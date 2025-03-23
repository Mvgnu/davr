'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useRecyclingCenters } from '@/lib/hooks/useRecyclingCenters';
import { Button } from '@/components/ui/button';
import { 
  Star, 
  Check, 
  Phone, 
  Mail, 
  ExternalLink, 
  ChevronRight,
  MapPin,
  Clock,
  Filter,
  Recycle,
  Search,
  AlertTriangle,
  RefreshCw,
  Shield,
  Calendar,
  CheckCircle,
  Map
} from 'lucide-react';
import PaginationControls from '@/components/PaginationControls';
import { RecyclingCenter } from '@/app/api/recycling-centers/route';

// Dynamically import the map component to avoid SSR issues with Leaflet
const CenterMapPreview = dynamic(
  () => import('./CenterMapPreview'),
  { ssr: false }
);

interface RecyclingCentersListProps {
  initialCity?: string;
  showSearch?: boolean;
  filterByMaterial?: string;
  searchTerm?: string;
  filterTab?: string;
  onPageChange?: (page: number) => void;
  showMapPreviews?: boolean;
}

const RecyclingCentersList: React.FC<RecyclingCentersListProps> = ({
  initialCity,
  showSearch = true,
  filterByMaterial,
  searchTerm,
  filterTab = 'all',
  onPageChange,
  showMapPreviews = false
}) => {
  // State management
  const [searchQuery, setSearchQuery] = useState(searchTerm || '');
  const [cityFilter, setCityFilter] = useState(initialCity || '');
  const [materialFilter, setMaterialFilter] = useState(filterByMaterial || '');
  const [sortBy, setSortBy] = useState('rating');
  const [viewMode, setViewMode] = useState<'card' | 'list' | 'map'>('card');
  
  // Fetch centers using our hook
  const {
    centers,
    loading,
    error,
    pagination,
    fetchCenters
  } = useRecyclingCenters({
    city: cityFilter,
    material: materialFilter,
    limit: 12,
    search: searchQuery,
    ...(filterTab === 'top-rated' && { minRating: 4 }),
    ...(filterTab === 'verified' && { verified: true }),
    ...(filterTab === 'recently-added' && { sortBy: 'created_at', sortOrder: 'desc' })
  });

  useEffect(() => {
    // Update filters when props change
    if (initialCity !== undefined) setCityFilter(initialCity);
    if (filterByMaterial !== undefined) setMaterialFilter(filterByMaterial);
    if (searchTerm !== undefined) setSearchQuery(searchTerm);
  }, [initialCity, filterByMaterial, searchTerm]);

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    // Pass filters to API
    fetchCenters(1);
  }, [fetchCenters]);

  const handlePageChange = useCallback((page: number) => {
    fetchCenters(page);
    if (onPageChange) {
      onPageChange(page);
    }
  }, [fetchCenters, onPageChange]);

  // Sort centers based on sortBy option
  const sortedCenters = [...(centers || [])].sort((a, b) => {
    if (sortBy === 'rating') {
      return b.rating.average - a.rating.average;
    } else if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    } else if (sortBy === 'offers') {
      return b.offersCount - a.offersCount;
    }
    return 0;
  });

  // Function to get material badges
  const getMaterialCount = (center: RecyclingCenter): { category: string, count: number }[] => {
    // This is a placeholder - in a real app, you'd have this data
    return [
      { category: 'Metalle', count: Math.floor(Math.random() * 15) + 1 },
      { category: 'Papier', count: Math.floor(Math.random() * 10) + 1 },
      { category: 'Elektronik', count: Math.floor(Math.random() * 8) + 1 }
    ].filter(item => item.count > 0).slice(0, 3);
  };

  // Generate placeholder rating items for display
  const renderRating = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating - fullStars >= 0.5;
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400 opacity-50" />);
      } else {
        stars.push(<Star key={i} className="w-4 h-4 text-gray-300" />);
      }
    }
    
    return (
      <div className="flex items-center">
        {stars}
        <span className="ml-2 text-gray-700 font-medium">{rating.toFixed(1)}</span>
      </div>
    );
  };

  if (loading && (!centers || centers.length === 0)) {
    return (
      <div className="py-12 flex flex-col items-center justify-center">
        <div className="animate-spin mb-4">
          <RefreshCw size={32} className="text-green-600" />
        </div>
        <p className="text-lg text-gray-600">Recyclingcenter werden geladen...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 flex flex-col items-center justify-center">
        <AlertTriangle size={48} className="text-red-500 mb-4" />
        <h3 className="text-xl font-semibold text-red-600 mb-2">Fehler beim Laden der Daten</h3>
        <p className="text-gray-600">{error}</p>
        <button 
          onClick={() => fetchCenters(1)}
          className="mt-6 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          Erneut versuchen
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {showSearch && (
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Recyclingcenter suchen</h3>
          
          <form onSubmit={handleSearch} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label htmlFor="city" className="block text-sm font-medium text-gray-700">Stadt</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="city"
                    value={cityFilter}
                    onChange={(e) => setCityFilter(e.target.value)}
                    placeholder="Nach Stadt filtern"
                    className="pl-10 block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="material" className="block text-sm font-medium text-gray-700">Material</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Recycle className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="material"
                    value={materialFilter}
                    onChange={(e) => setMaterialFilter(e.target.value)}
                    placeholder="Nach Material filtern"
                    className="pl-10 block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="search" className="block text-sm font-medium text-gray-700">Stichwortsuche</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Recyclingcenter durchsuchen"
                    className="pl-10 block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium text-gray-700">Sortieren nach:</label>
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="rating">Bewertung</option>
                  <option value="name">Name</option>
                  <option value="offers">Materialangebote</option>
                </select>
                
                <div className="border-l border-gray-200 h-8 mx-2"></div>
                
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setViewMode('card')}
                    className={`p-2 rounded-md ${viewMode === 'card' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}
                    title="Kartenansicht"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}
                    title="Listenansicht"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                  {showMapPreviews && (
                    <button
                      type="button"
                      onClick={() => setViewMode('map')}
                      className={`p-2 rounded-md ${viewMode === 'map' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}
                      title="Kartenansicht"
                    >
                      <Map className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setCityFilter('');
                    setMaterialFilter('');
                    setSearchQuery('');
                    fetchCenters(1);
                  }}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Zurücksetzen
                </button>
                
                <button
                  type="submit"
                  className="inline-flex items-center justify-center px-6 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filter anwenden
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {!centers || centers.length === 0 ? (
        <div className="py-12 text-center bg-white rounded-xl shadow-md border border-gray-100">
          <div className="inline-flex items-center justify-center p-4 bg-yellow-50 rounded-full mb-4">
            <AlertTriangle className="h-8 w-8 text-yellow-500" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Keine Recyclingcenter gefunden</h3>
          <p className="text-gray-600 mb-6">Versuchen Sie es mit anderen Suchkriterien oder einer anderen Stadt.</p>
          <button
            onClick={() => {
              setCityFilter('');
              setMaterialFilter('');
              setSearchQuery('');
              fetchCenters(1);
            }}
            className="inline-flex items-center px-6 py-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
          >
            <RefreshCw className="h-5 w-5 mr-2" />
            Filter zurücksetzen
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {pagination && (
                <span>Zeige {centers.length} von {pagination.total} Recyclingcentern</span>
              )}
            </h2>
          </div>
          
          {viewMode === 'map' && showMapPreviews ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {sortedCenters.map((center) => (
                <Link
                  href={`/recycling-centers/${center.location.city.toLowerCase().replace(/\s+/g, '-')}/${center.slug}`}
                  key={center.id}
                  className="group block h-full"
                >
                  <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all h-80 border border-gray-100 group-hover:border-green-200 relative overflow-hidden flex flex-col">
                    <div className="h-40 relative">
                      <CenterMapPreview 
                        latitude={center.location.latitude || 52.520008} 
                        longitude={center.location.longitude || 13.404954}
                        name={center.name}
                      />
                    </div>
                    
                    <div className="p-4 flex flex-col flex-grow">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-green-700 transition-colors pr-4">
                          {center.name}
                        </h3>
                        {center.isVerified && (
                          <span className="bg-blue-100 text-blue-700 px-2 py-1 text-xs font-semibold rounded-full">
                            Verifiziert
                          </span>
                        )}
                      </div>
                      
                      <div className="mb-2 flex items-center text-gray-600">
                        <MapPin className="w-4 h-4 mr-2 flex-shrink-0 text-gray-500" />
                        <span>{center.location.city}, {center.location.zipCode}</span>
                      </div>
                      
                      <div className="mb-2">
                        {renderRating(center.rating.average)}
                      </div>
                      
                      <div className="mt-auto flex items-center pt-2 text-sm text-green-600 font-medium">
                        <span>Details anzeigen</span>
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : viewMode === 'card' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {sortedCenters.map((center) => {
                const materialCounts = getMaterialCount(center);
                
                return (
                  <Link
                    href={`/recycling-centers/${center.location.city.toLowerCase().replace(/\s+/g, '-')}/${center.slug}`}
                    key={center.id}
                    className="group block h-full"
                  >
                    <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all p-6 h-full border border-gray-100 group-hover:border-green-200 relative overflow-hidden">
                      {center.isVerified && (
                        <div className="absolute top-0 right-0">
                          <div className="bg-blue-600 text-white px-4 py-1 text-xs font-semibold transform rotate-45 translate-x-2 translate-y-4">
                            Verifiziert
                          </div>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-green-700 transition-colors pr-4">
                          {center.name}
                        </h3>
                        <div className="bg-green-50 p-2 rounded-full group-hover:bg-green-100 transition-colors">
                          <ChevronRight className="w-5 h-5 text-green-600" />
                        </div>
                      </div>
                      
                      <div className="mb-4 flex items-center text-gray-600">
                        <MapPin className="w-4 h-4 mr-2 flex-shrink-0 text-gray-500" />
                        <span>{center.location.city}, {center.location.zipCode}</span>
                      </div>
                      
                      <div className="mb-4">
                        {renderRating(center.rating.average)}
                        <span className="text-sm text-gray-500 ml-2">({center.rating.count} Bewertungen)</span>
                      </div>
                      
                      {showMapPreviews && (
                        <div className="h-28 mb-4 rounded-md overflow-hidden">
                          <CenterMapPreview 
                            latitude={center.location.latitude || 52.520008} 
                            longitude={center.location.longitude || 13.404954}
                            name={center.name}
                          />
                        </div>
                      )}
                      
                      <div className="border-t border-gray-100 pt-4 mb-4">
                        <div className="flex items-center mb-2">
                          <Recycle className="w-4 h-4 mr-2 text-green-600" />
                          <span className="text-sm font-medium text-gray-700">Akzeptierte Materialien</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {materialCounts.map((material, idx) => (
                            <span 
                              key={idx} 
                              className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded-full"
                            >
                              {material.category} ({material.count})
                            </span>
                          ))}
                          {center.offersCount > materialCounts.length && (
                            <span className="text-xs px-2 py-1 bg-gray-50 text-gray-700 rounded-full">
                              +{center.offersCount - materialCounts.length} weitere
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="w-4 h-4 mr-1 text-gray-400" />
                        <span>Mo-Fr: 08:00-18:00, Sa: 09:00-14:00</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4">
              {sortedCenters.map((center) => {
                const materialCounts = getMaterialCount(center);
                
                return (
                  <Link
                    href={`/recycling-centers/${center.location.city.toLowerCase().replace(/\s+/g, '-')}/${center.slug}`}
                    key={center.id}
                    className="block group"
                  >
                    <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all p-6 border border-gray-100 group-hover:border-green-200">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                        <div className="mb-4 lg:mb-0">
                          <div className="flex items-center">
                            <h3 className="text-xl font-bold text-gray-900 group-hover:text-green-700 transition-colors mr-3">
                              {center.name}
                            </h3>
                            {center.isVerified && (
                              <span className="bg-blue-100 text-blue-700 px-2 py-1 text-xs font-semibold rounded-full">
                                Verifiziert
                              </span>
                            )}
                          </div>
                          
                          <div className="mt-2 flex items-center text-gray-600">
                            <MapPin className="w-4 h-4 mr-2 flex-shrink-0 text-gray-500" />
                            <span>{center.location.city}, {center.location.zipCode}</span>
                          </div>
                          
                          <div className="mt-2 flex items-center">
                            {renderRating(center.rating.average)}
                            <span className="text-sm text-gray-500 ml-2">({center.rating.count} Bewertungen)</span>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-3 items-center">
                          {showMapPreviews && (
                            <div className="h-20 w-28 rounded-md overflow-hidden">
                              <CenterMapPreview 
                                latitude={center.location.latitude || 52.520008} 
                                longitude={center.location.longitude || 13.404954}
                                name={center.name}
                              />
                            </div>
                          )}
                          
                          <div>
                            <div className="text-sm font-medium text-gray-700 mb-1">Materialien</div>
                            <div className="flex flex-wrap gap-1">
                              {materialCounts.map((material, idx) => (
                                <span 
                                  key={idx} 
                                  className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded-full"
                                >
                                  {material.category}
                                </span>
                              ))}
                              {center.offersCount > materialCounts.length && (
                                <span className="text-xs px-2 py-1 bg-gray-50 text-gray-700 rounded-full">
                                  +{center.offersCount - materialCounts.length}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="bg-green-50 p-2 rounded-full group-hover:bg-green-100 transition-colors">
                            <ChevronRight className="w-5 h-5 text-green-600" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
          
          {pagination && pagination.totalPages > 1 && (
            <div className="mt-10 flex justify-center">
              <PaginationControls 
                currentPage={pagination.page} 
                totalPages={pagination.totalPages}
                hasNextPage={pagination.hasNext}
                hasPrevPage={pagination.hasPrev}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default RecyclingCentersList; 