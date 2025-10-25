'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { X as ClearIcon, SlidersHorizontal, MapPin, Navigation } from 'lucide-react';
import { useDebouncedCallback } from 'use-debounce';
import { Material, ListingType } from '@prisma/client';

const ALL_VALUE = 'ALL';

export default function MarketplaceFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // State for filter inputs
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState(
    searchParams.get('materialId') || ALL_VALUE
  );
  const [selectedType, setSelectedType] = useState<string>(
    searchParams.get('type') || ALL_VALUE
  );
  const [locationInput, setLocationInput] = useState(
    searchParams.get('location') || ''
  );
  const [minPriceInput, setMinPriceInput] = useState(
    searchParams.get('minPrice') || ''
  );
  const [maxPriceInput, setMaxPriceInput] = useState(
    searchParams.get('maxPrice') || ''
  );
  const [distanceRange, setDistanceRange] = useState<number[]>(
    searchParams.get('maxDistance') ? [parseInt(searchParams.get('maxDistance') || '50', 10)] : [50]
  );
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Fetch materials for the dropdown
  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const response = await fetch('/api/materials');
        if (!response.ok) throw new Error('Failed to fetch materials');
        const data = await response.json();

        if (Array.isArray(data)) {
          setMaterials(data);
        } else {
          console.error('Received non-array data for materials:', data);
          setMaterials([]);
        }
      } catch (error) {
        console.error('Failed to load materials for filters:', error);
        setMaterials([]);
      }
    };
    fetchMaterials();
  }, []);

  // Get user's location using browser geolocation API
  useEffect(() => {
    const getUserLocation = () => {
      if (navigator.geolocation && locationInput) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setUserLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude
            });
          },
          (error) => {
            console.error('Error getting user location:', error);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000 // 5 minutes
          }
        );
      }
    };

    getUserLocation();
  }, [locationInput]);

  // Update URL Search Parameters
  const updateSearchParams = (paramsToUpdate: Record<string, string>) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));

    Object.entries(paramsToUpdate).forEach(([key, value]) => {
      if (value && value !== ALL_VALUE) {
        current.set(key, value);
      } else {
        current.delete(key);
      }
    });

    // Always reset page to 1 when filters change
    current.set('page', '1');

    const search = current.toString();
    const query = search ? `?${search}` : '';
    router.push(`${pathname}${query}`);
  };

  // Debounced handler for text inputs
  const debouncedLocationUpdate = useDebouncedCallback((value: string) => {
    updateSearchParams({ location: value });
  }, 500);

  const debouncedPriceUpdate = useDebouncedCallback(
    (min: string, max: string) => {
      updateSearchParams({ minPrice: min, maxPrice: max });
    },
    500
  );

  // Handler for distance range change
  const handleDistanceChange = (value: number[]) => {
    setDistanceRange(value);
    updateSearchParams({ maxDistance: value[0].toString() });
  };

  // Handlers for filter changes
  const handleMaterialChange = (value: string) => {
    setSelectedMaterial(value);
    updateSearchParams({ materialId: value });
  };

  const handleTypeChange = (value: string) => {
    setSelectedType(value);
    updateSearchParams({ type: value });
  };

  const handleLocationChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setLocationInput(value);
    debouncedLocationUpdate(value);
  };

  const handleMinPriceChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setMinPriceInput(value);
    debouncedPriceUpdate(value, maxPriceInput);
  };

  const handleMaxPriceChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setMaxPriceInput(value);
    debouncedPriceUpdate(minPriceInput, value);
  };

  const clearFilters = () => {
    setSelectedMaterial(ALL_VALUE);
    setSelectedType(ALL_VALUE);
    setLocationInput('');
    setMinPriceInput('');
    setMaxPriceInput('');
    setDistanceRange([50]);  // Reset to default distance

    // Keep search query if it exists
    const current = new URLSearchParams();
    const existingSearch = searchParams.get('search');
    if (existingSearch) {
      current.set('search', existingSearch);
    }
    current.set('page', '1');
    const search = current.toString();
    const query = search ? `?${search}` : '';
    router.push(`${pathname}${query}`);
  };

  const hasActiveFilters =
    selectedMaterial !== ALL_VALUE ||
    selectedType !== ALL_VALUE ||
    locationInput !== '' ||
    minPriceInput !== '' ||
    maxPriceInput !== '' ||
    distanceRange[0] !== 50;

  return (
    <Card className="mb-8">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold">Filter</h3>
          </div>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              onClick={clearFilters}
              size="sm"
              className="text-xs"
            >
              <ClearIcon className="mr-1 h-3.5 w-3.5" />
              Alle zurücksetzen
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Type Filter (BUY/SELL) */}
          <div className="space-y-1.5">
            <Label htmlFor="type-filter">Typ</Label>
            <Select value={selectedType} onValueChange={handleTypeChange}>
              <SelectTrigger id="type-filter">
                <SelectValue placeholder="Alle Typen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_VALUE}>Alle Typen</SelectItem>
                <SelectItem value={ListingType.SELL}>Verkaufen</SelectItem>
                <SelectItem value={ListingType.BUY}>Kaufen</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Material Filter */}
          <div className="space-y-1.5">
            <Label htmlFor="material-filter">Material</Label>
            <Select
              value={selectedMaterial}
              onValueChange={handleMaterialChange}
              disabled={materials.length === 0}
            >
              <SelectTrigger id="material-filter">
                <SelectValue placeholder="Alle Materialien" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_VALUE}>Alle Materialien</SelectItem>
                {materials.map((material) => (
                  <SelectItem key={material.id} value={material.id}>
                    {material.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Location Filter */}
          <div className="space-y-1.5">
            <Label htmlFor="location-filter">Standort</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="location-filter"
                placeholder="PLZ, Stadt oder Ort"
                value={locationInput}
                onChange={handleLocationChange}
                className="pl-10"
              />
              {userLocation && (
                <button 
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => navigator.geolocation.getCurrentPosition(
                    (position) => {
                      setUserLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                      });
                    },
                    (error) => {
                      console.error('Error getting user location:', error);
                    }
                  )}
                  title="Aktuellen Standort verwenden"
                >
                  <Navigation className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Distance Filter */}
          <div className="space-y-1.5">
            <Label htmlFor="distance-slider">
              Entfernung: {distanceRange[0]} km
            </Label>
            <div className="space-y-2">
              <Slider
                id="distance-slider"
                min={1}
                max={100}
                step={1}
                value={distanceRange}
                onValueChange={handleDistanceChange}
                className="py-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1 km</span>
                <span>100 km</span>
              </div>
            </div>
          </div>

          {/* Price Range Filter (Placeholder for future schema updates) */}
          <div className="space-y-1.5">
            <Label htmlFor="price-filter">Preis (EUR)</Label>
            <div className="flex gap-2">
              <Input
                id="price-filter"
                type="number"
                placeholder="Min"
                value={minPriceInput}
                onChange={handleMinPriceChange}
                min="0"
                step="0.01"
                className="w-1/2"
                disabled
                title="Preisfilter wird nach Schema-Aktualisierung verfügbar sein"
              />
              <Input
                type="number"
                placeholder="Max"
                value={maxPriceInput}
                onChange={handleMaxPriceChange}
                min="0"
                step="0.01"
                className="w-1/2"
                disabled
                title="Preisfilter wird nach Schema-Aktualisierung verfügbar sein"
              />
            </div>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="mt-4 flex flex-wrap gap-2">
            {selectedType !== ALL_VALUE && (
              <div className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded-md">
                Typ: {selectedType === ListingType.SELL ? 'Verkaufen' : 'Kaufen'}
                <button
                  onClick={() => handleTypeChange(ALL_VALUE)}
                  className="hover:bg-primary/20 rounded-full p-0.5"
                >
                  <ClearIcon className="h-3 w-3" />
                </button>
              </div>
            )}
            {selectedMaterial !== ALL_VALUE && (
              <div className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded-md">
                Material:{' '}
                {materials.find((m) => m.id === selectedMaterial)?.name}
                <button
                  onClick={() => handleMaterialChange(ALL_VALUE)}
                  className="hover:bg-primary/20 rounded-full p-0.5"
                >
                  <ClearIcon className="h-3 w-3" />
                </button>
              </div>
            )}
            {locationInput && (
              <div className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded-md">
                Ort: {locationInput}
                <button
                  onClick={() => {
                    setLocationInput('');
                    updateSearchParams({ location: '' });
                  }}
                  className="hover:bg-primary/20 rounded-full p-0.5"
                >
                  <ClearIcon className="h-3 w-3" />
                </button>
              </div>
            )}
            {distanceRange[0] !== 50 && (
              <div className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded-md">
                Entfernung: {distanceRange[0]} km
                <button
                  onClick={() => {
                    setDistanceRange([50]);
                    updateSearchParams({ maxDistance: '50' });
                  }}
                  className="hover:bg-primary/20 rounded-full p-0.5"
                >
                  <ClearIcon className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
