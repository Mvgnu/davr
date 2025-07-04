'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, X, Filter, MapPin } from 'lucide-react'; // Added MapPin
import { useDebouncedCallback } from 'use-debounce';

// Type for fetched materials
type Material = {
  id: string;
  name: string;
};

export default function CenterFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [cityFilter, setCityFilter] = useState(searchParams.get('city') || '');
  const [materialFilter, setMaterialFilter] = useState(searchParams.get('material') || ''); 
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [isClient, setIsClient] = useState(false); // Client-side check

  // State for materials dropdown
  const [materials, setMaterials] = useState<Material[]>([]);
  const [materialsLoading, setMaterialsLoading] = useState(true);
  const [materialsError, setMaterialsError] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true); // Mounted
    const fetchMaterials = async () => {
      setMaterialsLoading(true);
      setMaterialsError(null);
      try {
        const response = await fetch('/api/materials'); 
        if (!response.ok) throw new Error('Failed to fetch materials');
        const data: Material[] = await response.json();
        setMaterials(data);
      } catch (error) {
        console.error("Failed to fetch materials:", error);
        setMaterialsError("Could not load materials.");
        setMaterials([]);
      } finally {
        setMaterialsLoading(false);
      }
    };
    fetchMaterials();
  }, []); // Empty dependency array ensures this runs once on mount

  // Function to update URL search parameters
  const updateSearchParams = useCallback(
    (params: Record<string, string>) => {
      const current = new URLSearchParams(Array.from(searchParams.entries()));

      // Set or remove parameters based on value
      Object.entries(params).forEach(([key, value]) => {
        if (value) {
          current.set(key, value);
        } else {
          current.delete(key);
        }
      });

      // Remove page param when filters change
      current.delete('page');

      const search = current.toString();
      const query = search ? `?${search}` : '';

      // Use router.push to navigate, triggering a page refresh with new params
      router.push(`/recycling-centers${query}`);
    },
    [searchParams, router]
  );

  // --- Debounced handlers --- 
  const debouncedSearchUpdate = useDebouncedCallback((term: string) => {
      updateSearchParams({ search: term });
  }, 500);

  const debouncedCityUpdate = useDebouncedCallback((term: string) => {
      updateSearchParams({ city: term });
  }, 500);
  // -------------------------

  // Handle search input change
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchTerm = event.target.value;
    setSearchTerm(newSearchTerm);
    debouncedSearchUpdate(newSearchTerm);
  };

  // Handle city input change
  const handleCityChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const newCityTerm = event.target.value;
      setCityFilter(newCityTerm);
      debouncedCityUpdate(newCityTerm);
  };

  // Handle Material select change (immediate update)
  const handleMaterialChange = (value: string) => {
    const actualValue = value === 'all' ? '' : value;
    setMaterialFilter(actualValue); 
    updateSearchParams({ material: actualValue });
  };

  // Effect to sync state if URL changes externally (e.g., browser back/forward)
  useEffect(() => {
    setCityFilter(searchParams.get('city') || '');
    setMaterialFilter(searchParams.get('material') || '');
    setSearchTerm(searchParams.get('search') || '');
  }, [searchParams]);

  const clearFilters = () => {
     setCityFilter('');
     setMaterialFilter(''); // Clear material state
     setSearchTerm('');
     updateSearchParams({ city: '', material: '', search: '' });
  };

  const hasActiveFilters = isClient && (!!cityFilter || !!materialFilter || !!searchTerm);

  return (
    // Enhanced container
    <div className="p-4 md:p-6 mb-8 bg-card border border-border/60 rounded-lg shadow-sm transition-all duration-300">
       <h3 className="text-lg font-semibold mb-4 flex items-center text-foreground">
          <Filter className="w-5 h-5 mr-2 text-accent" /> 
          Recyclinghöfe filtern
       </h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
        {/* Enhanced Search Input */}
        <div>
          <Label htmlFor="search-filter" className="text-sm font-medium text-muted-foreground">Suche</Label>
          <div className="relative mt-1">
            <Input 
              id="search-filter"
              type="text"
              placeholder="Name, PLZ..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-10 transition-colors duration-200 focus:border-primary focus:ring-primary/20"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        {/* Enhanced City Filter Input */}
        <div>
          <Label htmlFor="city-filter" className="text-sm font-medium text-muted-foreground">Stadt</Label>
           <div className="relative mt-1">
             <Input 
                id="city-filter"
                type="text"
                placeholder="z.B. Berlin"
                value={cityFilter}
                onChange={handleCityChange}
                className="pl-10 transition-colors duration-200 focus:border-primary focus:ring-primary/20"
             />
             <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        {/* Enhanced Material Filter Select */}
        <div>
          <Label htmlFor="material-filter" className="text-sm font-medium text-muted-foreground">Akzeptiert Material</Label>
          <Select
              value={materialFilter}
              onValueChange={handleMaterialChange}
              disabled={materialsLoading || !!materialsError}
            >
            <SelectTrigger 
              id="material-filter" 
              className="mt-1 transition-colors duration-200 focus:border-primary focus:ring-primary/20"
            >
               <SelectValue placeholder={materialsLoading ? "Lade..." : "Alle Materialien"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Materialien</SelectItem>
              {materialsError ? (
                  <SelectItem value="error" disabled className="text-destructive">{materialsError}</SelectItem>
              ) : (
                  materials.map((material) => (
                      <SelectItem key={material.id} value={material.name}> 
                          {material.name}
                      </SelectItem>
                  ))
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Enhanced Clear Button */}
      {hasActiveFilters && (
        <div className="flex justify-end mt-5 pt-4 border-t border-border/60">
          <Button 
             variant="ghost" 
             size="sm" 
             onClick={clearFilters}
             className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
          >
            <X className="w-4 h-4 mr-1"/> Filter zurücksetzen
          </Button>
        </div>
      )}
    </div>
  );
} 