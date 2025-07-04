'use client';

import React, { useState, useEffect } from 'react';
import { Search, Filter, MapPin, X, Locate } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

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
  const [showFilters, setShowFilters] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
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
      if (verifiedOnly) searchParams.set('verified', 'true');
      if (selectedMaterials.length > 0) {
        searchParams.set('materials', selectedMaterials.join(','));
      }
      
      router.push(`/search?${searchParams.toString()}`);
    }
  };

  const clearSearch = () => {
    setQuery('');
    setCity('');
    setVerifiedOnly(false);
    setSelectedMaterials([]);
    if (!onSearch) {
      router.push('/materials');
    }
  };

  const handleLocateMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        // This would typically call a reverse geocoding service
        // For now, we'll just set a placeholder
        setCity('Current location');
      }, (error) => {
        console.error('Error getting location:', error);
      });
    }
  };

  // Sample materials for the filter
  const commonMaterials = [
    'Aluminium',
    'Papier',
    'Metall',
    'Elektronik',
    'Kunststoff'
  ];

  const toggleMaterial = (material: string) => {
    setSelectedMaterials(prev => 
      prev.includes(material)
        ? prev.filter(m => m !== material)
        : [...prev, material]
    );
  };

  return (
    <div className={`w-full ${className}`}>
      <form onSubmit={handleSearch} className="relative">
        <div className="flex flex-col space-y-3">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-muted-foreground" />
            </div>
            
            <Input
              type="text"
              placeholder="Nach Material suchen (z.B. Aluminium, Kupfer, Papier)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-20"
            />
            
            <div className="absolute inset-y-0 right-0 flex items-center">
              {(query || city || verifiedOnly || selectedMaterials.length > 0) && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="p-2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="p-2 mr-1 text-muted-foreground hover:text-foreground"
                aria-expanded={showFilters}
                aria-label="Toggle filters"
              >
                <Filter className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          {showFilters && (
            <div className="space-y-3 p-4 bg-card rounded-md border border-border">
              <div className="space-y-3">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                  </div>
                  
                  <div className="flex space-x-2">
                    <Input
                      type="text"
                      placeholder="Stadt oder PLZ eingeben"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full pl-10"
                    />
                    <Button 
                      type="button" 
                      size="icon" 
                      variant="outline" 
                      onClick={handleLocateMe}
                      className="flex-shrink-0"
                      title="Meinen Standort verwenden"
                    >
                      <Locate className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="verified-only" 
                    checked={verifiedOnly} 
                    onCheckedChange={() => setVerifiedOnly(!verifiedOnly)} 
                  />
                  <Label htmlFor="verified-only">Nur verifizierte Recyclinghöfe</Label>
                </div>

                <div className="space-y-2">
                  <Label>Materialien</Label>
                  <div className="flex flex-wrap gap-2">
                    {commonMaterials.map(material => (
                      <Button
                        key={material}
                        type="button"
                        variant={selectedMaterials.includes(material) ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleMaterial(material)}
                        className="text-xs"
                      >
                        {material}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-3 flex justify-end">
          <Button 
            type="submit"
            variant="default"
          >
            <Search className="h-4 w-4 mr-2" />
            Suchen
          </Button>
        </div>
      </form>
    </div>
  );
} 