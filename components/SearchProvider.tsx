'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';

// Define interface for RecyclingCenter
export interface RecyclingCenter {
  _id: string;
  name: string;
  address: string;
  city: string;
  postalCode?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  location?: {
    lat: number;
    lng: number;
  };
  latitude?: number;
  longitude?: number;
  phone?: string;
  website?: string;
  email?: string;
  acceptedMaterials?: string[];
  materials?: string[];
  services?: string[];
  operatingHours?: {
    day: string;
    openTime: string;
    closeTime: string;
  }[];
  openingHours?: {
    isOpen24Hours: boolean;
    isOpenWeekends: boolean;
    isOpenNow: boolean;
  };
  rating: number;
  ratingCount?: number;
  reviewCount?: number;
  isPremium?: boolean;
  image?: string;
  ownerId?: string;
  claimRequests?: string[];
  slug?: string;
}

interface SearchContextType {
  query: string;
  setQuery: (query: string) => void;
  materials: string[];
  setMaterials: (materials: string[]) => void;
  distance: number;
  setDistance: (distance: number) => void;
  rating: number;
  setRating: (rating: number) => void;
  openNow: boolean;
  setOpenNow: (openNow: boolean) => void;
  location: { lat: number; lng: number } | null;
  setLocation: (location: { lat: number; lng: number } | null) => void;
  applyFilters: () => void;
  resetFilters: () => void;
  isFilterActive: boolean;
  filterCenters: (centers: RecyclingCenter[]) => RecyclingCenter[];
}

// Create context
const SearchContext = createContext<SearchContextType | undefined>(undefined);

// Provider component
export function SearchProvider({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // State for search params
  const [query, setQuery] = useState('');
  const [materials, setMaterials] = useState<string[]>([]);
  const [distance, setDistance] = useState(10); // 10km default
  const [rating, setRating] = useState(0);
  const [openNow, setOpenNow] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isFilterActive, setIsFilterActive] = useState(false);

  // Update state from URL params when they change
  useEffect(() => {
    if (!searchParams) return;
    
    const queryFromUrl = searchParams.get('q') || '';
    const materialsFromUrl = searchParams.get('materials')
      ? searchParams.get('materials')?.split(',').filter(Boolean) || []
      : [];
    const distanceFromUrl = searchParams.get('distance')
      ? parseInt(searchParams.get('distance') || '10', 10)
      : 10;
    const ratingFromUrl = searchParams.get('rating')
      ? parseInt(searchParams.get('rating') || '0', 10)
      : 0;
    const openNowFromUrl = searchParams.get('openNow') === 'true';
    const lat = searchParams.get('lat')
      ? parseFloat(searchParams.get('lat') || '0')
      : null;
    const lng = searchParams.get('lng')
      ? parseFloat(searchParams.get('lng') || '0')
      : null;
    
    // Update state
    setQuery(queryFromUrl);
    setMaterials(materialsFromUrl);
    setDistance(distanceFromUrl);
    setRating(ratingFromUrl);
    setOpenNow(openNowFromUrl);
    setLocation(lat !== null && lng !== null ? { lat, lng } : null);
    
    // Check if any filter is active
    setIsFilterActive(
      queryFromUrl !== '' || 
      materialsFromUrl.length > 0 || 
      ratingFromUrl > 0 || 
      openNowFromUrl || 
      (lat !== null && lng !== null)
    );
  }, [searchParams]);

  // Apply filters function
  const applyFilters = () => {
    if (!searchParams) return;
    
    const params = new URLSearchParams(searchParams.toString());
    
    if (query) params.set('q', query);
    else params.delete('q');
    
    if (materials.length > 0) params.set('materials', materials.join(','));
    else params.delete('materials');
    
    if (distance !== 10) params.set('distance', distance.toString());
    else params.delete('distance');
    
    if (rating > 0) params.set('rating', rating.toString());
    else params.delete('rating');
    
    if (openNow) params.set('openNow', 'true');
    else params.delete('openNow');
    
    if (location) {
      params.set('lat', location.lat.toString());
      params.set('lng', location.lng.toString());
    } else {
      params.delete('lat');
      params.delete('lng');
    }
    
    const paramsString = params.toString();
    const newPath = paramsString ? `${pathname}?${paramsString}` : pathname || '/';
    router.push(newPath, { scroll: false });
  };

  // Reset filters function
  const resetFilters = () => {
    setQuery('');
    setMaterials([]);
    setDistance(10);
    setRating(0);
    setOpenNow(false);
    setLocation(null);
    router.push(pathname || '/', { scroll: false });
  };

  // Filter centers based on search params
  const filterCenters = (centers: RecyclingCenter[]) => {
    if (!isFilterActive) return centers;
    
    return centers.filter(center => {
      // Filter by query (name, address, city, postal code)
      const matchesQuery = !query || 
        center.name.toLowerCase().includes(query.toLowerCase()) ||
        center.address.toLowerCase().includes(query.toLowerCase()) ||
        center.city.toLowerCase().includes(query.toLowerCase()) ||
        (center.postalCode && center.postalCode.toLowerCase().includes(query.toLowerCase()));
      
      // Filter by materials
      const materialsList = center.services || center.acceptedMaterials || center.materials || [];
      const matchesMaterials = materials.length === 0 || 
        materials.every(material => 
          materialsList.some(m => 
            m.toLowerCase().includes(material.toLowerCase())
          )
        );
      
      // Filter by rating
      const matchesRating = rating === 0 || center.rating >= rating;
      
      // Filter by opening hours (open now)
      let matchesOpenNow = true;
      if (openNow && center.openingHours) {
        matchesOpenNow = center.openingHours.isOpenNow;
      } else if (openNow && center.operatingHours) {
        const now = new Date();
        const day = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getDay()];
        const currentHour = now.getHours();
        const currentMinutes = now.getMinutes();
        
        // Find if center is open now
        matchesOpenNow = center.operatingHours?.some(hours => {
          if (hours.day.toLowerCase() !== day) return false;
          
          const [openHour, openMinute] = hours.openTime.split(':').map(Number);
          const [closeHour, closeMinute] = hours.closeTime.split(':').map(Number);
          
          const isAfterOpen = currentHour > openHour || 
            (currentHour === openHour && currentMinutes >= openMinute);
          
          const isBeforeClose = currentHour < closeHour || 
            (currentHour === closeHour && currentMinutes <= closeMinute);
          
          return isAfterOpen && isBeforeClose;
        }) || false;
      }
      
      // Filter by distance (if location is available)
      let matchesDistance = true;
      if (location) {
        const centerLat = center.latitude || 
                          (center.coordinates?.lat) || 
                          (center.location?.lat) || 
                          0;
        const centerLng = center.longitude || 
                          (center.coordinates?.lng) || 
                          (center.location?.lng) || 
                          0;
        
        const distanceInKm = calculateDistance(
          location.lat, 
          location.lng, 
          centerLat, 
          centerLng
        );
        matchesDistance = distanceInKm <= distance;
      }
      
      return matchesQuery && matchesMaterials && matchesRating && matchesOpenNow && matchesDistance;
    });
  };

  // Function to calculate distance between two coordinates using the Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    return R * c; // Distance in km
  };

  const deg2rad = (deg: number) => {
    return deg * (Math.PI/180);
  };

  // Provide the context value
  const contextValue: SearchContextType = {
    query,
    setQuery,
    materials,
    setMaterials,
    distance,
    setDistance,
    rating,
    setRating,
    openNow,
    setOpenNow,
    location,
    setLocation,
    applyFilters,
    resetFilters,
    isFilterActive,
    filterCenters,
  };

  return (
    <SearchContext.Provider value={contextValue}>
      {children}
    </SearchContext.Provider>
  );
}

// Custom hook to use the search context
export function useSearch() {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
}

export default SearchProvider; 