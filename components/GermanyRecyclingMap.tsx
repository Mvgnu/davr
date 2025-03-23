'use client';

import React, { useState, useEffect } from 'react';

interface RecyclingStats {
  state: string;
  facilities: number;
  totalWaste: number;
  domesticWaste: number;
  foreignWaste: number;
}

// Map states to their GeoJSON IDs
const stateToId: Record<string, string> = {
  "Baden-Württemberg": "DE-BW",
  "Bayern": "DE-BY",
  "Berlin": "DE-BE",
  "Brandenburg": "DE-BB",
  "Bremen": "DE-HB",
  "Hamburg": "DE-HH",
  "Hessen": "DE-HE",
  "Mecklenburg-Vorpommern": "DE-MV",
  "Niedersachsen": "DE-NI",
  "Nordrhein-Westfalen": "DE-NW",
  "Rheinland-Pfalz": "DE-RP",
  "Saarland": "DE-SL",
  "Sachsen": "DE-SN",
  "Sachsen-Anhalt": "DE-ST",
  "Schleswig-Holstein": "DE-SH",
  "Thüringen": "DE-TH"
};

// Map GeoJSON IDs to their state names
const idToState: Record<string, string> = Object.entries(stateToId).reduce((acc, [state, id]) => {
  acc[id] = state;
  return acc;
}, {} as Record<string, string>);

const recyclingStats: Record<string, RecyclingStats> = {
  "Baden-Württemberg": {
    state: "Baden-Württemberg",
    facilities: 1701,
    totalWaste: 55047.2,
    domesticWaste: 52825.4,
    foreignWaste: 1253.6
  },
  "Bayern": {
    state: "Bayern",
    facilities: 3446,
    totalWaste: 64921.5,
    domesticWaste: 61614.3,
    foreignWaste: 373.0
  },
  "Berlin": {
    state: "Berlin",
    facilities: 121,
    totalWaste: 7685.3,
    domesticWaste: 7428.4,
    foreignWaste: 61.8
  },
  "Brandenburg": {
    state: "Brandenburg",
    facilities: 564,
    totalWaste: 18324.0,
    domesticWaste: 16361.9,
    foreignWaste: 404.6
  },
  "Bremen": {
    state: "Bremen",
    facilities: 66,
    totalWaste: 2821.5,
    domesticWaste: 2641.2,
    foreignWaste: 85.8
  },
  "Hamburg": {
    state: "Hamburg",
    facilities: 93,
    totalWaste: 5777.6,
    domesticWaste: 3812.5,
    foreignWaste: 102.6
  },
  "Hessen": {
    state: "Hessen",
    facilities: 772,
    totalWaste: 39812.9,
    domesticWaste: 22076.8,
    foreignWaste: 173.7
  },
  "Mecklenburg-Vorpommern": {
    state: "Mecklenburg-Vorpommern",
    facilities: 293,
    totalWaste: 8497.6,
    domesticWaste: 8004.5,
    foreignWaste: 84.0
  },
  "Niedersachsen": {
    state: "Niedersachsen",
    facilities: 1320,
    totalWaste: 33437.6,
    domesticWaste: 30016.5,
    foreignWaste: 1195.0
  },
  "Nordrhein-Westfalen": {
    state: "Nordrhein-Westfalen",
    facilities: 2075,
    totalWaste: 85179.5,
    domesticWaste: 73882.9,
    foreignWaste: 2529.3
  },
  "Rheinland-Pfalz": {
    state: "Rheinland-Pfalz",
    facilities: 710,
    totalWaste: 17991.8,
    domesticWaste: 16229.4,
    foreignWaste: 282.5
  },
  "Saarland": {
    state: "Saarland",
    facilities: 247,
    totalWaste: 4227.0,
    domesticWaste: 3432.4,
    foreignWaste: 366.1
  },
  "Sachsen": {
    state: "Sachsen",
    facilities: 722,
    totalWaste: 17812.5,
    domesticWaste: 17262.8,
    foreignWaste: 300.0
  },
  "Sachsen-Anhalt": {
    state: "Sachsen-Anhalt",
    facilities: 584,
    totalWaste: 31602.7,
    domesticWaste: 20120.4,
    foreignWaste: 258.6
  },
  "Schleswig-Holstein": {
    state: "Schleswig-Holstein",
    facilities: 444,
    totalWaste: 9627.8,
    domesticWaste: 8944.7,
    foreignWaste: 100.6
  },
  "Thüringen": {
    state: "Thüringen",
    facilities: 502,
    totalWaste: 11974.3,
    domesticWaste: 11456.4,
    foreignWaste: 206.2
  }
};

// Define GeoJSON interfaces
interface Geometry {
  type: string;
  coordinates: any[];
}

interface Feature {
  type: string;
  properties: {
    ID_0?: number;
    ISO?: string;
    NAME_0?: string;
    ID_1?: number;
    NAME_1?: string;
    HASC_1?: string;
    CCN_1?: number;
    CCA_1?: string;
    TYPE_1?: string;
    ENGTYPE_1?: string;
    NL_NAME_1?: string;
    VARNAME_1?: string;
  };
  geometry: Geometry;
}

interface GeoJSON {
  type: string;
  features: Feature[];
}

const GermanyRecyclingMap: React.FC = () => {
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [geoData, setGeoData] = useState<GeoJSON | null>(null);
  const [paths, setPaths] = useState<Record<string, string>>({});
  const [viewBox, setViewBox] = useState<string>("5 45 10 10");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load the GeoJSON data
  useEffect(() => {
    const loadGeoData = async () => {
      try {
        const response = await fetch('/data/4_niedrig.geo.json');
        if (!response.ok) {
          throw new Error(`Failed to load GeoJSON: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        setGeoData(data);
        
        // Process and convert GeoJSON features to SVG paths
        const pathData: Record<string, string> = {};
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        
        if (!data.features || !Array.isArray(data.features)) {
          throw new Error('Invalid GeoJSON: features array is missing or not an array');
        }
        
        data.features.forEach((feature: Feature) => {
          if (!feature || !feature.geometry) return;
          
          if (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon') {
            const geoId = feature.properties?.HASC_1;
            if (!geoId) return;
            
            let path = '';
            
            if (feature.geometry.type === 'Polygon') {
              // Process single polygon
              const coordinates = feature.geometry.coordinates?.[0];
              if (!coordinates || !Array.isArray(coordinates) || coordinates.length === 0) return;
              
              path = coordinates.map((coord: number[], index: number) => {
                if (!coord || !Array.isArray(coord) || coord.length < 2) return '';
                
                const [x, y] = coord;
                // Update viewBox bounds
                if (isFinite(x) && isFinite(y)) {
                  minX = Math.min(minX, x);
                  minY = Math.min(minY, y);
                  maxX = Math.max(maxX, x);
                  maxY = Math.max(maxY, y);
                }
                
                return `${index === 0 ? 'M' : 'L'} ${x},${y}`;
              }).join(' ');
            } else if (feature.geometry.type === 'MultiPolygon') {
              // Process multiple polygons
              if (!feature.geometry.coordinates || !Array.isArray(feature.geometry.coordinates)) return;
              
              path = feature.geometry.coordinates.map((polygon: number[][][]) => {
                if (!polygon || !Array.isArray(polygon) || polygon.length === 0) return '';
                
                const coords = polygon[0];
                if (!coords || !Array.isArray(coords) || coords.length === 0) return '';
                
                return coords.map((coord: number[], index: number) => {
                  if (!coord || !Array.isArray(coord) || coord.length < 2) return '';
                  
                  const [x, y] = coord;
                  // Update viewBox bounds
                  if (isFinite(x) && isFinite(y)) {
                    minX = Math.min(minX, x);
                    minY = Math.min(minY, y);
                    maxX = Math.max(maxX, x);
                    maxY = Math.max(maxY, y);
                  }
                  
                  return `${index === 0 ? 'M' : 'L'} ${x},${y}`;
                }).join(' ');
              }).join(' ');
            }
            
            if (path) {
              pathData[geoId] = path;
            }
          }
        });
        
        // Set calculated viewBox with some padding - handle Infinity
        if (!isFinite(minX) || !isFinite(minY) || !isFinite(maxX) || !isFinite(maxY)) {
          // Fallback to default Germany bounding box approximately
          setViewBox("5 45 10 15");
          console.warn("Using default viewBox as calculated values were invalid");
        } else {
          const width = maxX - minX;
          const height = maxY - minY;
          const padding = 0.5; // Add 0.5 degrees padding
          setViewBox(`${minX - padding} ${minY - padding} ${width + padding * 2} ${height + padding * 2}`);
        }
        
        setPaths(pathData);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading GeoJSON:', error);
        setIsLoading(false);
      }
    };
    
    loadGeoData();
  }, []);

  // Function to get color based on number of facilities
  const getStateColor = (stateName: string) => {
    const stats = recyclingStats[stateName];
    if (!stats) return '#e5e7eb'; // Default gray for unknown states
    
    // Color scale based on number of facilities
    if (stats.facilities > 2000) return '#047857';
    if (stats.facilities > 1000) return '#059669';
    if (stats.facilities > 500) return '#10b981';
    return '#34d399';
  };

  // Handle mouse events
  const handleMouseMove = (event: React.MouseEvent<SVGPathElement>) => {
    setTooltipPosition({
      x: event.clientX,
      y: event.clientY - 10
    });
  };

  return (
    <div className="relative bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          Recycling in Deutschland
        </h3>
        
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Map Container */}
          <div className="relative flex-1 min-h-[500px]">
            {isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-green-500 border-t-transparent rounded-full"></div>
                <span className="ml-3 text-gray-600">Karte wird geladen...</span>
              </div>
            ) : (
              <svg
                viewBox={viewBox}
                className="w-full h-full"
                style={{ filter: selectedState ? 'none' : 'grayscale(70%)' }}
              >
                {Object.entries(paths).map(([id, path]) => {
                  const stateName = idToState[id] || '';
                  if (!stateName) return null;
                  
                  return (
                    <path
                      key={id}
                      d={path}
                      fill={getStateColor(stateName)}
                      stroke="#fff"
                      strokeWidth="0.01"
                      opacity={selectedState && selectedState !== stateName ? 0.3 : 1}
                      onMouseEnter={() => setHoveredState(stateName)}
                      onMouseLeave={() => setHoveredState(null)}
                      onClick={() => setSelectedState(selectedState === stateName ? null : stateName)}
                      onMouseMove={handleMouseMove}
                      className="transition-all duration-300 hover:opacity-90 cursor-pointer"
                    />
                  );
                })}
              </svg>
            )}
            
            {/* Tooltip */}
            {hoveredState && recyclingStats[hoveredState] && (
              <div 
                className="absolute pointer-events-none bg-white rounded-lg shadow-lg border border-gray-100 p-4 min-w-[200px] z-10"
                style={{
                  left: `${tooltipPosition.x}px`,
                  top: `${tooltipPosition.y}px`,
                  transform: 'translate(-50%, -100%)'
                }}
              >
                <h4 className="font-semibold text-gray-800 mb-2">{hoveredState}</h4>
                <div className="space-y-1 text-sm">
                  <p className="text-gray-600">
                    Anlagen: <span className="font-medium text-gray-800">{recyclingStats[hoveredState].facilities}</span>
                  </p>
                  <p className="text-gray-600">
                    Gesamtabfall: <span className="font-medium text-gray-800">{recyclingStats[hoveredState].totalWaste.toLocaleString('de-DE')} kt</span>
                  </p>
                  <p className="text-gray-600">
                    Inlandsabfall: <span className="font-medium text-gray-800">{recyclingStats[hoveredState].domesticWaste.toLocaleString('de-DE')} kt</span>
                  </p>
                </div>
              </div>
            )}
          </div>
          
          {/* Stats Panel */}
          <div className="w-full lg:w-72 space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-800 mb-3">Gesamtstatistik</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Anlagen gesamt:</span>
                  <span className="font-semibold text-gray-800">13.660</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Gesamtabfall:</span>
                  <span className="font-semibold text-gray-800">414.740 kt</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Inlandsabfall:</span>
                  <span className="font-semibold text-gray-800">356.110 kt</span>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-white rounded-lg p-4 border border-green-100">
              <h4 className="font-medium text-gray-800 mb-2">Legende</h4>
              <div className="space-y-2">
                <div className="flex items-center">
                  <div className="w-4 h-4 rounded bg-[#047857] mr-2"></div>
                  <span className="text-sm text-gray-600">&gt; 2000 Anlagen</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 rounded bg-[#059669] mr-2"></div>
                  <span className="text-sm text-gray-600">&gt; 1000 Anlagen</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 rounded bg-[#10b981] mr-2"></div>
                  <span className="text-sm text-gray-600">&gt; 500 Anlagen</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 rounded bg-[#34d399] mr-2"></div>
                  <span className="text-sm text-gray-600">&lt; 500 Anlagen</span>
                </div>
              </div>
            </div>
            
            {selectedState && recyclingStats[selectedState] && (
              <div className="bg-gradient-to-br from-blue-50 to-white rounded-lg p-4 border border-blue-100">
                <h4 className="font-medium text-gray-800 mb-2">{selectedState}</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Anlagen:</span>
                    <span className="font-semibold text-gray-800">{recyclingStats[selectedState].facilities}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Gesamtabfall:</span>
                    <span className="font-semibold text-gray-800">{recyclingStats[selectedState].totalWaste.toLocaleString('de-DE')} kt</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Inlandsabfall:</span>
                    <span className="font-semibold text-gray-800">{recyclingStats[selectedState].domesticWaste.toLocaleString('de-DE')} kt</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Auslandsabfall:</span>
                    <span className="font-semibold text-gray-800">{recyclingStats[selectedState].foreignWaste.toLocaleString('de-DE')} kt</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GermanyRecyclingMap; 