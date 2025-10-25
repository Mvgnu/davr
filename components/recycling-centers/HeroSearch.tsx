'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  MapPin,
  Search,
  Recycle,
  ArrowRight,
  Info,
  X,
  Filter,
  List,
  Map as MapIcon,
  Clock,
  Calendar,
  CrosshairIcon,
  ChevronDown
} from 'lucide-react';
import { Material, RecyclingStats, groupMaterialsByCategory } from '@/lib/data/recycling';
import { AnimatePresence, motion } from 'framer-motion';
import { fetchCities } from '@/lib/api/recyclingCenters'; // Use the real API
import { useSearch } from '@/components/SearchProvider';

// We remove the hardcoded GERMAN_CITIES array and replace with database data
interface HeroSearchProps {
  stats: RecyclingStats;
  initialCity?: string;
  initialMaterial?: string;
  initialSearch?: string;
  materials: Material[];
  cities: string[]; // Add cities from database
}

const HeroSearch: React.FC<HeroSearchProps> = ({
  stats,
  initialCity = '',
  initialMaterial = '',
  initialSearch = '',
  materials,
  cities = [] // Use cities from database props
}) => {
  const router = useRouter();
  const searchContext = useSearch();
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [city, setCity] = useState(initialCity);
  const [material, setMaterial] = useState(initialMaterial);
  const [showMaterialSelector, setShowMaterialSelector] = useState(false);
  const [showCityAutocomplete, setShowCityAutocomplete] = useState(false);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [activeView, setActiveView] = useState<'list' | 'map'>('list');
  const [isOpenNow, setIsOpenNow] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filteredCities, setFilteredCities] = useState<string[]>([]);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const materialSelectorRef = useRef<HTMLDivElement>(null);
  const cityInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement | null>(null);
  
  // Group materials by category for the selector
  const materialsByCategory = groupMaterialsByCategory(materials);
  
  // Effect to filter cities when typing - using database cities
  useEffect(() => {
    if (city.length > 0 && cities.length > 0) {
      const filtered = cities.filter(c => 
        c.toLowerCase().includes(city.toLowerCase())
      ).slice(0, 10); // Limit to 10 results for better performance
      setFilteredCities(filtered);
      setShowCityAutocomplete(filtered.length > 0);
    } else {
      setFilteredCities([]);
      setShowCityAutocomplete(false);
    }
  }, [city, cities]);
  
  // Effects to handle clicking outside the selectors
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (materialSelectorRef.current && !materialSelectorRef.current.contains(event.target as Node)) {
        setShowMaterialSelector(false);
      }
      if (cityInputRef.current && !cityInputRef.current.contains(event.target as Node)) {
        setShowCityAutocomplete(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Function to get user location and save to SearchProvider
  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          // Save coordinates to SearchProvider immediately
          searchContext.setLocation({ lat: latitude, lng: longitude });

          try {
            // Reverse geocoding to get city name
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`
            );
            const data = await response.json();
            if (data.address && data.address.city) {
              setCity(data.address.city);
            } else if (data.address && data.address.town) {
              setCity(data.address.town);
            }

            // Apply filters to update URL with location
            searchContext.applyFilters();
          } catch (error) {
            console.error("Error getting location:", error);
            alert("Fehler beim Abrufen Ihres Standorts. Bitte geben Sie Ihre Stadt manuell ein.");
          }
        },
        (error) => {
          console.error("Error getting geolocation:", error);
          alert("Standortfreigabe wurde verweigert. Bitte geben Sie Ihre Stadt manuell ein.");
        }
      );
    } else {
      alert("Geolocation wird von Ihrem Browser nicht unterstützt.");
    }
  };
  
  // Handle search submission with smooth scroll
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Build the query params
    const params = new URLSearchParams();
    if (city) params.set('city', city);
    if (material) params.set('material', material);
    if (searchQuery) params.set('search', searchQuery);
    if (selectedMaterials.length > 0) {
      params.set('materials', selectedMaterials.join(','));
    }
    if (isOpenNow) params.set('openNow', 'true');
    
    // Set view mode (list or map)
    params.set('view', activeView);
    
    // Update URL without full navigation to enable smooth scrolling
    const url = `/recycling-centers?${params.toString()}`;
    window.history.pushState({}, '', url);
    
    // Smooth scroll to results
    if (resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const toggleMaterialSelection = (materialId: string) => {
    setSelectedMaterials(prev => 
      prev.includes(materialId)
        ? prev.filter(id => id !== materialId)
        : [...prev, materialId]
    );
  };
  
  return (
    <div className="rounded-3xl shadow-2xl mb-4 overflow-hidden relative bg-gradient-to-br from-green-800 to-green-700">
      {/* Improved geometric background pattern with better visibility */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_center,_white_1px,_transparent_1px)] bg-[length:20px_20px]"></div>
        
        <div className="absolute -top-20 -right-20 w-72 h-72 opacity-20">
          <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <path fill="#ffffff" d="M45.4,-59.3C60.6,-51.1,76.1,-39.8,83.1,-24.4C90.1,-9,88.6,10.6,80.5,25.8C72.4,41.1,57.8,52.1,42.2,58.7C26.7,65.4,10.3,67.7,-4.8,64.1C-19.9,60.5,-33.8,51,-44.5,39.3C-55.3,27.5,-62.9,13.8,-65.5,-1.5C-68.1,-16.8,-65.7,-33.7,-56.6,-43.9C-47.6,-54.1,-31.8,-57.7,-17.9,-56.7C-4,-55.7,8.1,-50.1,20.9,-50.4C33.8,-50.8,47.4,-57.1,45.4,-59.3Z" transform="translate(100 100)" />
          </svg>
        </div>
        <div className="absolute -bottom-20 -left-20 w-72 h-72 opacity-20 rotate-180">
          <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <path fill="#ffffff" d="M39.2,-57.2C51.8,-50.6,64,-41.6,71.7,-28.8C79.4,-16,82.6,0.5,79.3,16.1C76,31.7,66.3,46.3,53.5,56.3C40.8,66.2,25,71.5,8.2,73.7C-8.6,76,-26.4,75.3,-41.8,68.4C-57.1,61.5,-70.1,48.4,-76,32.8C-81.9,17.2,-80.9,-0.8,-75.9,-17.5C-70.9,-34.1,-61.9,-49.3,-48.8,-56.6C-35.8,-63.9,-18.4,-63.2,-2.6,-59.8C13.3,-56.4,26.5,-50.3,39.2,-57.2Z" transform="translate(100 100)" />
          </svg>
        </div>
        
        {/* Add subtle animated pattern for more visual interest */}
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(20,83,45,0.4)_0%,rgba(34,197,94,0.2)_100%)]"></div>
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" width="100%" height="100%">
            <pattern id="recycling-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="20" cy="20" r="2" fill="white" />
              <path d="M20,10 L25,17.5 L15,17.5 Z" fill="white" opacity="0.5" />
            </pattern>
            <rect x="0" y="0" width="100%" height="100%" fill="url(#recycling-pattern)" />
          </svg>
        </div>
      </div>
      
      <div className="relative z-10 p-6 md:p-10">
        <div className="max-w-5xl mx-auto">
          {/* Hero content - make it smaller */}
          <div className="mb-8 text-center md:text-left">
            <h1 className="text-3xl md:text-5xl font-bold mb-4 text-white leading-tight">
              Recyclingcenter in <span className="text-emerald-300">Deutschland</span> finden
            </h1>
            <div className="flex flex-col md:flex-row gap-4 justify-center md:justify-start">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 inline-flex items-center">
                <div className="bg-emerald-500 rounded-lg p-2 mr-3">
                  <MapPin className="h-4 w-4 text-white" />
                </div>
                <div>
                  <div className="text-xs text-emerald-200">Recyclingzentren</div>
                  <div className="text-xl font-bold text-white">{stats.totalCenters.toLocaleString()}</div>
                </div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 inline-flex items-center">
                <div className="bg-emerald-500 rounded-lg p-2 mr-3">
                  <Recycle className="h-4 w-4 text-white" />
                </div>
                <div>
                  <div className="text-xs text-emerald-200">Materialtypen</div>
                  <div className="text-xl font-bold text-white">{stats.totalMaterials.toLocaleString()}</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Search panel */}
          <div 
            ref={searchRef}
            className="bg-white rounded-2xl shadow-xl p-4 md:p-6 transition-all duration-300"
          >
            {/* View toggle */}
            <div className="flex justify-end mb-4">
              <div className="inline-flex bg-gray-100 rounded-lg p-1">
                <button
                  type="button"
                  className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center ${activeView === 'list' ? 'bg-white shadow-sm text-green-700' : 'text-gray-600 hover:bg-white/50'}`}
                  onClick={() => setActiveView('list')}
                >
                  <List size={16} className="mr-2" />
                  Listenansicht
                </button>
                <button
                  type="button"
                  className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center ${activeView === 'map' ? 'bg-white shadow-sm text-green-700' : 'text-gray-600 hover:bg-white/50'}`}
                  onClick={() => setActiveView('map')}
                >
                  <MapIcon size={16} className="mr-2" />
                  Kartenansicht
                </button>
              </div>
            </div>
            
            <form onSubmit={handleSearch} className="space-y-4">
              {/* Search controls */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="col-span-1 relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stadt</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MapPin className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      ref={cityInputRef}
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      onFocus={() => city.length > 0 && setShowCityAutocomplete(true)}
                      placeholder="Stadt eingeben..."
                      className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 placeholder-gray-400"
                    />
                    <button
                      type="button"
                      onClick={getUserLocation}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-green-700"
                      title="Meinen Standort verwenden"
                    >
                      <CrosshairIcon className="h-5 w-5" />
                    </button>
                  </div>
                  
                  {/* City autocomplete dropdown - using database cities */}
                  <AnimatePresence>
                    {showCityAutocomplete && filteredCities.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-60 overflow-auto"
                      >
                        <ul className="py-2">
                          {filteredCities.map((cityName) => (
                            <li 
                              key={cityName}
                              className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
                              onClick={() => {
                                setCity(cityName);
                                setShowCityAutocomplete(false);
                              }}
                            >
                              <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                              {cityName}
                            </li>
                          ))}
                        </ul>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Material</label>
                  <div className="relative" ref={materialSelectorRef}>
                    <div className="relative">
                      <div 
                        className="border border-gray-300 rounded-xl px-10 py-3 flex items-center justify-between cursor-pointer focus-within:ring-2 focus-within:ring-green-500 focus-within:border-green-500"
                        onClick={() => setShowMaterialSelector(!showMaterialSelector)}
                      >
                        <div className="flex items-center">
                          <Recycle className="h-5 w-5 text-gray-400 absolute left-3" />
                          <span className={selectedMaterials.length ? 'text-gray-900' : 'text-gray-400'}>
                            {selectedMaterials.length 
                              ? `${selectedMaterials.length} Material${selectedMaterials.length !== 1 ? 'ien' : ''} ausgewählt` 
                              : 'Material auswählen...'}
                          </span>
                        </div>
                        <ChevronDown className={`h-5 w-5 text-gray-400 absolute right-3 transition-transform ${showMaterialSelector ? 'rotate-180' : ''}`} />
                      </div>
                    </div>
                    
                    {/* Material selector dropdown - using database materials */}
                    <AnimatePresence>
                      {showMaterialSelector && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                          className="absolute mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-96 overflow-auto p-4"
                        >
                          {Object.entries(materialsByCategory).map(([category, categoryMaterials]) => (
                            <div key={category} className="mb-4">
                              <div className="text-sm font-medium text-gray-700 mb-2">{category}</div>
                              <div className="flex flex-wrap gap-2">
                                {categoryMaterials.map(material => (
                                  <button 
                                    key={material.id}
                                    type="button"
                                    onClick={() => toggleMaterialSelection(material.id.toString())}
                                    className={`px-3 py-1 rounded-full text-sm ${
                                      selectedMaterials.includes(material.id.toString()) 
                                        ? 'bg-green-100 text-green-800 border border-green-300'
                                        : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                                    }`}
                                  >
                                    {material.name}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
                
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stichwortsuche</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Stichwörter eingeben..."
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 placeholder-gray-400"
                    />
                  </div>
                </div>
              </div>
              
              {/* Advanced filters toggle */}
              <div className="flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="text-green-600 hover:text-green-800 text-sm font-medium flex items-center"
                >
                  <Filter className="w-4 h-4 mr-1" />
                  {showAdvancedFilters ? 'Weniger Filter anzeigen' : 'Mehr Filteroptionen'}
                  <ChevronDown className={`ml-1 w-4 h-4 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} />
                </button>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="openNow"
                    checked={isOpenNow}
                    onChange={() => setIsOpenNow(!isOpenNow)}
                    className="h-4 w-4 text-green-600 border-gray-300 rounded-sm focus:ring-green-500"
                  />
                  <label htmlFor="openNow" className="ml-2 text-sm text-gray-700 flex items-center">
                    <Clock className="w-4 h-4 mr-1 text-green-600" />
                    Jetzt geöffnet
                  </label>
                </div>
              </div>
              
              {/* Advanced filters section */}
              <AnimatePresence>
                {showAdvancedFilters && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Öffnungszeiten</label>
                          <div className="space-y-2">
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                id="openWeekends"
                                className="h-4 w-4 text-green-600 border-gray-300 rounded-sm focus:ring-green-500"
                              />
                              <label htmlFor="openWeekends" className="ml-2 text-sm text-gray-700">
                                Am Wochenende geöffnet
                              </label>
                            </div>
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                id="openLate"
                                className="h-4 w-4 text-green-600 border-gray-300 rounded-sm focus:ring-green-500"
                              />
                              <label htmlFor="openLate" className="ml-2 text-sm text-gray-700">
                                Abends geöffnet (nach 18 Uhr)
                              </label>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                          <div className="space-y-2">
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                id="verified"
                                className="h-4 w-4 text-green-600 border-gray-300 rounded-sm focus:ring-green-500"
                              />
                              <label htmlFor="verified" className="ml-2 text-sm text-gray-700">
                                Nur verifizierte Center
                              </label>
                            </div>
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                id="buysMaterials"
                                className="h-4 w-4 text-green-600 border-gray-300 rounded-sm focus:ring-green-500"
                              />
                              <label htmlFor="buysMaterials" className="ml-2 text-sm text-gray-700">
                                Kauft Materialien an
                              </label>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Sortieren nach</label>
                          <select className="w-full border border-gray-300 rounded-lg p-2 text-sm">
                            <option value="distance">Entfernung</option>
                            <option value="rating">Bewertung</option>
                            <option value="materials">Anzahl Materialien</option>
                            <option value="name">Name</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Selected tags display */}
              {selectedMaterials.length > 0 && (
                <div className="flex flex-wrap gap-2 items-center pt-2">
                  <span className="text-sm text-gray-500">Ausgewählte Materialien:</span>
                  {selectedMaterials.map(id => {
                    const material = materials.find(m => m.id.toString() === id);
                    return material ? (
                      <div 
                        key={`tag-${id}`}
                        className="flex items-center bg-green-50 text-green-700 rounded-full px-3 py-1 text-sm border border-green-200"
                      >
                        <span>{material.name}</span>
                        <button 
                          type="button"
                          onClick={() => toggleMaterialSelection(id)}
                          className="ml-1 text-green-500 hover:text-green-700 focus:outline-none"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : null;
                  })}
                  
                  <button 
                    type="button"
                    onClick={() => setSelectedMaterials([])}
                    className="text-xs text-gray-500 hover:text-gray-700 underline"
                  >
                    Alle löschen
                  </button>
                </div>
              )}
              
              {/* Submit button */}
              <div className="flex justify-center">
                <button 
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-6 rounded-xl flex items-center transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  <Search className="mr-2 h-5 w-5" />
                  Recyclingcenter finden
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Add ref for smooth scrolling to results */}
      <div id="centers-list" ref={resultsRef}></div>
    </div>
  );
};

export default HeroSearch; 