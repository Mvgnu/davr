'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X as ClearIcon } from 'lucide-react';
import { useDebouncedCallback } from 'use-debounce';
import { Material } from '@prisma/client';

const ALL_MATERIALS_VALUE = "ALL"; // Define constant for clarity

export default function MarketplaceFilters() {
    const router = useRouter();
    const pathname = usePathname(); // Should be /marketplace
    const searchParams = useSearchParams();

    // State for filter inputs
    const [materials, setMaterials] = useState<Material[]>([]);
    const [selectedMaterial, setSelectedMaterial] = useState(searchParams.get('materialId') || ALL_MATERIALS_VALUE);
    const [locationInput, setLocationInput] = useState(searchParams.get('location') || '');

    // Fetch materials for the dropdown
    useEffect(() => {
        const fetchMaterials = async () => {
            try {
                // Assuming an endpoint exists to fetch all materials
                const response = await fetch('/api/materials'); 
                if (!response.ok) throw new Error('Failed to fetch materials');
                const data = await response.json();
                // Ensure data is an array before setting
                if (Array.isArray(data)) {
                     setMaterials(data);
                } else {
                     console.error("Received non-array data for materials:", data);
                     setMaterials([]); // Set empty array on error/unexpected data
                }
            } catch (error) {
                console.error("Failed to load materials for filters:", error);
                setMaterials([]); // Set empty on fetch error
            }
        };
        fetchMaterials();
    }, []);

    // Update URL Search Parameters
    const updateSearchParams = useCallback((paramsToUpdate: Record<string, string>) => {
        const current = new URLSearchParams(Array.from(searchParams.entries()));
        
        Object.entries(paramsToUpdate).forEach(([key, value]) => {
            if (value) {
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
    }, [searchParams, router, pathname]);

     // Debounced handler for location input
    const debouncedLocationUpdate = useDebouncedCallback((value: string) => {
        updateSearchParams({ location: value });
    }, 500);

    // Handlers for filter changes
    const handleMaterialChange = (value: string) => {
        setSelectedMaterial(value);
        const paramValue = value === ALL_MATERIALS_VALUE ? '' : value;
        updateSearchParams({ materialId: paramValue });
    };

    const handleLocationChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setLocationInput(value);
        debouncedLocationUpdate(value);
    };

    const clearFilters = () => {
        setSelectedMaterial(ALL_MATERIALS_VALUE);
        setLocationInput('');
        // Update URL, removing filters and resetting page
         const current = new URLSearchParams(); // Start fresh
         const existingSearch = searchParams.get('search');
         if (existingSearch) {
             current.set('search', existingSearch);
         }
         current.set('page', '1');
         const search = current.toString();
         const query = search ? `?${search}` : '';
         router.push(`${pathname}${query}`);
    };

    const hasActiveFilters = selectedMaterial !== ALL_MATERIALS_VALUE || locationInput !== '';

    return (
        <Card className="mb-8">
            <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
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
                                <SelectItem value={ALL_MATERIALS_VALUE}>Alle Materialien</SelectItem>
                                {materials.map((material) => (
                                    <SelectItem key={material.id} value={material.id}>{material.name}</SelectItem>
                                ))}
                            </SelectContent>
                         </Select>
                    </div>

                    {/* Location Filter */}
                    <div className="space-y-1.5">
                        <Label htmlFor="location-filter">Standort</Label>
                        <Input 
                            id="location-filter"
                            placeholder="Nach Standort filtern..."
                            value={locationInput}
                            onChange={handleLocationChange}
                        />
                    </div>

                     {/* Clear Button */}
                     <div className="md:col-start-3 flex justify-end">
                         <Button 
                             variant="ghost" 
                             onClick={clearFilters}
                             disabled={!hasActiveFilters}
                             size="sm"
                             className="text-xs"
                         >
                             <ClearIcon className="mr-1 h-3.5 w-3.5"/>
                             Filter zurücksetzen
                         </Button>
                     </div>
                </div>
            </CardContent>
        </Card>
    );
} 