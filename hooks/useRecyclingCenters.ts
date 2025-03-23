'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export interface RecyclingCenter {
  _id: string;
  name: string;
  address: string;
  city: string;
  phone?: string;
  rating?: number;
  latitude?: number;
  longitude?: number;
  coordinates?: {
    lat: number;
    lng: number;
  };
  services?: string[];
  operatingHours?: {
    day: string;
    openTime: string;
    closeTime: string;
  }[];
}

export function useRecyclingCenters(centers: RecyclingCenter[]) {
  const searchParams = useSearchParams();
  const [filteredCenters, setFilteredCenters] = useState<RecyclingCenter[]>(centers);
  const [sortOrder, setSortOrder] = useState<'rating' | 'name' | 'distance'>('rating');

  useEffect(() => {
    if (!searchParams) return;

    let filtered = [...centers];
    const query = searchParams.get('q')?.toLowerCase() || '';
    const materials = searchParams.get('materials')?.split(',').filter(Boolean) || [];
    const minRating = parseFloat(searchParams.get('rating') || '0');
    const openNow = searchParams.get('open') === 'true';
    const userLat = parseFloat(searchParams.get('lat') || '0');
    const userLng = parseFloat(searchParams.get('lng') || '0');

    // Apply filters
    if (query) {
      filtered = filtered.filter(center => 
        center.name.toLowerCase().includes(query) ||
        center.address.toLowerCase().includes(query) ||
        center.city.toLowerCase().includes(query)
      );
    }

    if (materials.length > 0) {
      filtered = filtered.filter(center =>
        materials.every(material =>
          center.services?.includes(material)
        )
      );
    }

    if (minRating > 0) {
      filtered = filtered.filter(center => (center.rating || 0) >= minRating);
    }

    if (openNow) {
      const now = new Date();
      const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
      const currentTime = now.getHours() * 60 + now.getMinutes();

      filtered = filtered.filter(center => {
        const todayHours = center.operatingHours?.find(h => h.day === currentDay);
        if (!todayHours) return false;

        const [openHour, openMinute] = todayHours.openTime.split(':').map(Number);
        const [closeHour, closeMinute] = todayHours.closeTime.split(':').map(Number);
        const openTime = openHour * 60 + openMinute;
        const closeTime = closeHour * 60 + closeMinute;

        return currentTime >= openTime && currentTime <= closeTime;
      });
    }

    // Sort centers
    switch (sortOrder) {
      case 'rating':
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'distance':
        if (userLat && userLng) {
          filtered.sort((a, b) => {
            const distA = calculateDistance(
              userLat,
              userLng,
              a.latitude || a.coordinates?.lat || 0,
              a.longitude || a.coordinates?.lng || 0
            );
            const distB = calculateDistance(
              userLat,
              userLng,
              b.latitude || b.coordinates?.lat || 0,
              b.longitude || b.coordinates?.lng || 0
            );
            return distA - distB;
          });
        }
        break;
    }

    setFilteredCenters(filtered);
  }, [centers, searchParams, sortOrder]);

  return {
    filteredCenters,
    sortOrder,
    setSortOrder
  };
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
} 