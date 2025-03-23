'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useRecyclingCenters, RecyclingCenterFilters } from '@/lib/hooks/useRecyclingCenters';
import { Material, groupMaterialsByCategory } from '@/lib/data/recycling';
import PaginationControls from '@/components/PaginationControls';
import RecyclingCenterCard from '@/components/recycling-centers/RecyclingCenterCard';
import { 
  MapPin, 
  Search, 
  Filter, 
  Clock, 
  Star,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Calendar,
  List,
  LayoutGrid,
  ArrowUpDown,
  MapIcon,
} from 'lucide-react';
import { debounce } from 'lodash';

// Dynamically import the map component to avoid server-side rendering issues
const CenterMapPreview = dynamic(() => import('./CenterMapPreview'), 
  { ssr: false, loading: () => <div className="h-full w-full bg-gray-100 animate-pulse rounded-lg flex items-center justify-center"><MapIcon className="text-gray-300 w-8 h-8" /></div> }
);

const CenterMapView = dynamic(() => import('./CenterMapView'), 
  { ssr: false, loading: () => <div className="h-[600px] bg-gray-100 animate-pulse rounded-lg flex items-center justify-center"><MapIcon className="text-gray-300 w-12 h-12" /></div> }
);

// Fixing the duplicated RecyclingCenter interface issue
// We'll use the imported one from the API 
import type { RecyclingCenter as ApiRecyclingCenter } from '@/app/api/recycling-centers/route';

// Using a type alias to avoid conflicts
type RecyclingCenterType = ApiRecyclingCenter;

interface CentersListWithFiltersProps {
  initialCity?: string;
  initialMaterial?: string;
  initialSearch?: string;
  materials: Material[];
}

const CentersListWithFilters: React.FC<CentersListWithFiltersProps> = ({
  initialCity = '',
  initialMaterial = '',
  initialSearch = '',
  materials
}) => {
  // State for filters
  const [city, setCity] = useState(initialCity);
  const [material, setMaterial] = useState(initialMaterial);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [sortBy, setSortBy] = useState('rating');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [minRating, setMinRating] = useState<number | undefined>(undefined);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [showOnlyOpenNow, setShowOnlyOpenNow] = useState(false);
  const [materialFilters, setMaterialFilters] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'card' | 'map'>('card');
  const [currentPage, setCurrentPage] = useState(1);
  
  // User location state (with default values for Berlin)
  const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number}>({
    latitude: 52.520008, // Default latitude (Berlin)
    longitude: 13.404954 // Default longitude (Berlin)
  });
  
  // Settings for pagination
  const itemsPerPage = 9;
  
  // Data fetching state
  const [centers, setCenters] = useState<RecyclingCenterType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    page: number;
    totalPages: number;
    totalItems: number;
    hasNext: boolean;
    hasPrev: boolean;
  } | null>(null);
  
  const router = useRouter();
  
  // Group materials by category for the selector
  const materialsByCategory = groupMaterialsByCategory(materials);
  
  // Create filter object for hook
  const filterParams: RecyclingCenterFilters = {
    city: city,
    material: material,
    materials: materialFilters.length > 0 ? materialFilters.join(',') : undefined,
    limit: itemsPerPage,
    search: searchQuery || undefined,
    minRating: minRating,
    verified: verifiedOnly,
    sortBy: sortBy,
    sortOrder: sortOrder,
    page: currentPage
  };
  
  // Use the recycling centers hook
  const {
    centers: centersFromHook,
    loading: loadingFromHook,
    error: errorFromHook,
    pagination: paginationFromHook,
    fetchCenters
  } = useRecyclingCenters(filterParams);
  
  // Sync data from the hook
  useEffect(() => {
    if (!loadingFromHook) {
      setCenters(centersFromHook || []);
      setLoading(loadingFromHook);
      setError(errorFromHook);
      if (paginationFromHook) {
        setPagination(paginationFromHook);
      }
    }
  }, [centersFromHook, loadingFromHook, errorFromHook, paginationFromHook]);
  
  // Debounced search handler
  const debouncedSearch = useCallback(
    debounce((value: string) => {
      setSearchQuery(value);
    }, 500),
    []
  );
  
  // Handle search input
  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(e.target.value);
  };
  
  // Handle filter change
  const applyFilters = () => {
    setLoading(true);
    setCurrentPage(1); // Reset to page 1 when applying new filters
    fetchCenters(1);
  };
  
  // Reset filters
  const resetFilters = () => {
    setCity('');
    setMaterial('');
    setSearchQuery('');
    setMaterialFilters([]);
    setMinRating(undefined);
    setVerifiedOnly(false);
    setShowOnlyOpenNow(false);
    setCurrentPage(1);
    
    fetchCenters(1);
    router.push('/recycling-centers');
  };
  
  // Handle page change - this is the fix for pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchCenters(page);
  };
  
  // Handle material selection
  const toggleMaterial = (materialId: string) => {
    setMaterialFilters(prev => 
      prev.includes(materialId)
        ? prev.filter(id => id !== materialId)
        : [...prev, materialId]
    );
  };
  
  // Get user location function
  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          // Keep the default location
        }
      );
    }
  };

  // Try to get user location on component mount
  useEffect(() => {
    getUserLocation();
  }, []);

  // Convert API center to RecyclingCenterCard props format
  const mapCenterToCardProps = (center: RecyclingCenterType) => {
    // Get the current time to determine if the center is open (simplified example)
    const now = new Date();
    const hour = now.getHours();
    const isWeekday = now.getDay() >= 1 && now.getDay() <= 5;
    const isOpen = isWeekday && hour >= 8 && hour < 18;

    return {
      id: typeof center.id === 'string' ? parseInt(center.id, 10) : center.id,
      name: center.name,
      city: center.location?.city,
      state: center.location?.state,
      address: `${center.location?.zipCode || ''} ${center.location?.city || ''}`,
      isOpen: isOpen, // Use our calculated value
      openUntil: "18:00", // This would be dynamically determined in a real app
      rating: center.rating?.average || 0,
      materials: center.acceptedMaterials || []
    };
  };
  
  return (
    <div className="space-y-8">
      {/* Filter controls */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <div className="flex items-center">
            <Filter className="w-5 h-5 text-green-600 mr-2" />
            <h3 className="text-xl font-semibold text-gray-800">Filter & Suche</h3>
          </div>
          
          <div className="flex mt-4 md:mt-0 space-x-3">
            <div className="bg-gray-100 rounded-lg flex p-1">
              <button
                onClick={() => setViewMode('card')}
                className={`p-2 rounded ${viewMode === 'card' ? 'bg-white shadow-sm text-green-600' : 'text-gray-500'}`}
                title="Rasteransicht"
              >
                <LayoutGrid size={18} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow-sm text-green-600' : 'text-gray-500'}`}
                title="Listenansicht"
              >
                <List size={18} />
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`p-2 rounded ${viewMode === 'map' ? 'bg-white shadow-sm text-green-600' : 'text-gray-500'}`}
                title="Kartenansicht"
              >
                <MapIcon size={18} />
              </button>
            </div>
            
            <button
              onClick={() => setShowOnlyOpenNow(!showOnlyOpenNow)}
              className="flex items-center px-4 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition-colors"
            >
              <Clock size={16} className="mr-2" />
              {showOnlyOpenNow ? 'Nur geöffnete Center' : 'Alle Center anzeigen'}
            </button>
          </div>
        </div>
        
        {/* Basic search */}
        <div className="mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Suchen Sie nach Recyclingcentern, Materialien oder Standorten..."
              defaultValue={searchQuery}
              onChange={handleSearchInput}
              className="w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-800"
            />
          </div>
        </div>
            
            {/* Action buttons */}
            <div className="flex justify-end space-x-4">
              <button
                onClick={resetFilters}
                className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-all"
              >
                <RefreshCw className="w-4 h-4 mr-2 inline" />
                Alle Filter zurücksetzen
              </button>
              
              <button
                onClick={applyFilters}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all"
              >
                Filter anwenden
              </button>
            </div>
      </div>
      
      {/* Loading state */}
      {loading && (!centers || centers.length === 0) && (
        <div className="py-12 flex flex-col items-center justify-center">
          <div className="animate-spin mb-4">
            <RefreshCw size={32} className="text-green-600" />
          </div>
          <p className="text-lg text-gray-600">Recyclingcenter werden geladen...</p>
        </div>
      )}
      
      {/* Error state */}
      {error && (
        <div className="py-12 flex flex-col items-center justify-center">
          <AlertTriangle size={48} className="text-red-500 mb-4" />
          <h3 className="text-xl font-semibold text-red-600 mb-2">Fehler beim Laden der Daten</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={() => fetchCenters(1)}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Erneut versuchen
          </button>
        </div>
      )}
      
      {/* Empty state */}
      {!loading && (!centers || centers.length === 0) && !error && (
        <div className="py-12 text-center bg-white rounded-xl shadow-md border border-gray-100">
          <div className="inline-flex items-center justify-center p-4 bg-yellow-50 rounded-full mb-4">
            <AlertTriangle className="h-8 w-8 text-yellow-500" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Keine Recyclingcenter gefunden</h3>
          <p className="text-gray-600 mb-6">Versuchen Sie es mit anderen Suchkriterien oder einer anderen Stadt.</p>
          <button
            onClick={resetFilters}
            className="inline-flex items-center px-6 py-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
          >
            <RefreshCw className="h-5 w-5 mr-2" />
            Filter zurücksetzen
          </button>
        </div>
      )}
      
      {/* Results */}
      {!loading && centers && centers.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {pagination && (
                <span>Zeige {centers.length} von {pagination.totalItems} Recyclingcentern</span>
              )}
            </h2>
          </div>
          
          {/* Grid view */}
          {viewMode === 'card' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {centers.map((center) => (
                <RecyclingCenterCard 
                    key={center.id}
                  center={mapCenterToCardProps(center)} 
                  showDistance={Boolean(userLocation)}
                />
              ))}
            </div>
          )}
          
          {/* List view */}
          {viewMode === 'list' && (
            <div className="space-y-4">
              {centers.map((center) => (
                <RecyclingCenterCard 
                    key={center.id}
                  center={mapCenterToCardProps(center)} 
                  showDistance={Boolean(userLocation)}
                />
              ))}
            </div>
          )}
          
          {/* Map view */}
          {viewMode === 'map' && userLocation && (
            <CenterMapView 
              centers={centers as any[]}
              onViewModeChange={(mode) => setViewMode(mode as any)}
              userLocation={userLocation}
              onCenterSelect={(center) => {
                // You could implement additional functionality here
                console.log('Selected center:', center);
              }}
            />
          )}
          
          {/* Pagination */}
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
};

export default CentersListWithFilters; 