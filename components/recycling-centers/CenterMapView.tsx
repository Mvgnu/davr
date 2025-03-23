'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation, List, Search, Layers, Info, X } from 'lucide-react';

interface Location {
  latitude: number;
  longitude: number;
  city: string;
  address?: string;
  zipCode?: string;
}

interface RecyclingCenter {
  id: string;
  name: string;
  slug: string;
  location: Location;
  isVerified: boolean;
  rating: {
    average: number;
    count: number;
  };
  buysMaterials?: boolean;
  materialCount?: number;
}

interface CenterMapViewProps {
  centers: RecyclingCenter[];
  userLocation?: { latitude: number; longitude: number } | null;
  initialZoom?: number;
  onCenterSelect?: (center: RecyclingCenter) => void;
  onViewModeChange?: (mode: 'map' | 'list') => void;
}

const CenterMapView: React.FC<CenterMapViewProps> = ({
  centers,
  userLocation = null,
  initialZoom = 10,
  onCenterSelect,
  onViewModeChange,
}) => {
  const router = useRouter();
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerId = 'recycling-centers-map';
  const markersRef = useRef<L.Marker[]>([]);
  const [selectedCenter, setSelectedCenter] = useState<RecyclingCenter | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Fix Leaflet's default icon path issues
  const fixLeafletIcon = () => {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    });
  };

  // Define custom marker icons
  const createCenterIcon = (isVerified: boolean) => {
    return L.divIcon({
      className: `custom-center-marker ${isVerified ? 'verified' : ''}`,
      html: `
        <div style="
          background-color: ${isVerified ? '#2563eb' : '#16a34a'}; 
          width: 28px; 
          height: 28px; 
          border-radius: 50%; 
          border: 2px solid white; 
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="
            color: white; 
            font-size: 14px;
            line-height: 1;
            font-weight: bold;
          ">${isVerified ? '✓' : 'R'}</div>
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
      popupAnchor: [0, -14],
    });
  };

  const createUserLocationIcon = () => {
    return L.divIcon({
      className: 'custom-user-location',
      html: `
        <div style="
          background-color: #6366f1; 
          width: 18px; 
          height: 18px; 
          border-radius: 50%; 
          border: 2px solid white; 
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          position: relative;
        ">
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 6px;
            height: 6px;
            background-color: white;
            border-radius: 50%;
          "></div>
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 30px;
            height: 30px;
            border-radius: 50%;
            background-color: rgba(99, 102, 241, 0.25);
            animation: pulse 2s infinite;
          "></div>
        </div>
      `,
      iconSize: [18, 18],
      iconAnchor: [9, 9],
    });
  };

  // Initialize and manage the map
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const mapContainer = document.getElementById(mapContainerId);
    if (!mapContainer) return;
    
    // Fix Leaflet's icon paths issue
    fixLeafletIcon();
    
    // Clean up any existing map instance
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
      markersRef.current = [];
    }
    
    try {
      // Initialize map
      mapRef.current = L.map(mapContainerId, {
        center: userLocation 
          ? [userLocation.latitude, userLocation.longitude]
          : centers.length > 0 
            ? [centers[0].location.latitude, centers[0].location.longitude] 
            : [51.1657, 10.4515], // Germany center
        zoom: initialZoom,
        zoomControl: true,
        scrollWheelZoom: true,
      });
      
      // Add custom tile layer with modern styling
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(mapRef.current);
      
      // Add recycling centers markers
      const bounds = L.latLngBounds([]);
      
      centers.forEach(center => {
        const { latitude, longitude } = center.location;
        if (!latitude || !longitude) return;
        
        const marker = L.marker([latitude, longitude], {
          icon: createCenterIcon(center.isVerified),
          title: center.name,
        }).addTo(mapRef.current!);
        
        // Create popup content
        const popupContent = `
          <div class="recycling-center-popup">
            <h3 class="text-sm font-bold mb-1">${center.name}</h3>
            <div class="text-xs mb-1 flex items-center">
              <span class="mr-1">⭐</span> 
              ${center.rating.average.toFixed(1)} (${center.rating.count})
            </div>
            <div class="text-xs text-gray-600">${center.location.city}</div>
            ${center.materialCount ? `<div class="text-xs mt-1 text-green-700">${center.materialCount} Materialien</div>` : ''}
            <div class="mt-2">
              <a href="/recycling-centers/${center.location.city.toLowerCase().replace(/\s+/g, '-')}/${center.slug}" 
                 class="text-xs text-white bg-green-600 hover:bg-green-700 rounded px-2 py-1 inline-block">
                Details ansehen
              </a>
            </div>
          </div>
        `;
        
        // Bind popup to marker
        marker.bindPopup(popupContent, {
          className: 'recycling-center-popup-container',
          maxWidth: 200,
        });
        
        // Handle click event
        marker.on('click', () => {
          setSelectedCenter(center);
          if (onCenterSelect) onCenterSelect(center);
        });
        
        // Add marker to ref for later cleanup
        markersRef.current.push(marker);
        
        // Extend bounds
        bounds.extend([latitude, longitude]);
      });
      
      // Add user location marker if available
      if (userLocation) {
        const { latitude, longitude } = userLocation;
        
        // Add user location marker
        const userMarker = L.marker([latitude, longitude], {
          icon: createUserLocationIcon(),
          zIndexOffset: 1000, // Make sure user marker is on top
        }).addTo(mapRef.current);
        
        userMarker.bindPopup('Ihr Standort', {
          closeButton: false,
        });
        
        // Add user location accuracy circle
        L.circle([latitude, longitude], {
          radius: 1000, // 1km accuracy example
          fillColor: '#6366f1',
          fillOpacity: 0.05,
          color: '#6366f1',
          weight: 1,
          opacity: 0.3,
        }).addTo(mapRef.current);
        
        // Extend bounds to include user location
        bounds.extend([latitude, longitude]);
      }
      
      // Fit map to bounds if there are centers
      if (centers.length > 0) {
        mapRef.current.fitBounds(bounds, {
          padding: [50, 50],
          maxZoom: 15,
        });
      }
      
      // Add custom CSS for better styling
      const styleId = 'map-view-styles';
      let styleElement = document.getElementById(styleId) as HTMLStyleElement;
      
      if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = styleId;
        document.head.appendChild(styleElement);
      }
      
      styleElement.textContent = `
        .recycling-center-popup-container {
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .recycling-center-popup-container .leaflet-popup-content-wrapper {
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .recycling-center-popup-container .leaflet-popup-tip {
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        @keyframes pulse {
          0% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) scale(1.5);
            opacity: 0;
          }
        }
        .leaflet-control-attribution {
          font-size: 10px;
          background: rgba(255,255,255,0.7);
          padding: 2px 5px;
        }
      `;
      
    } catch (error) {
      console.error('Error initializing map:', error);
      
      // Provide a fallback message
      if (mapContainer) {
        mapContainer.innerHTML = `
          <div class="h-full w-full flex items-center justify-center p-6 bg-gray-100 rounded-lg text-center">
            <div>
              <div class="text-gray-500 mb-2">
                <MapPin className="h-10 w-10 mx-auto mb-2 text-gray-400" />
                Kartenansicht konnte nicht geladen werden
              </div>
              <div class="text-sm text-gray-400">
                Bitte versuchen Sie es später erneut oder verwenden Sie die Listenansicht
              </div>
              <button 
                class="mt-4 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm"
                onClick={() => onViewModeChange && onViewModeChange('list')}
              >
                Zur Listenansicht
              </button>
            </div>
          </div>
        `;
      }
    }
    
    // Cleanup function
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markersRef.current = [];
      }
      
      const styleElement = document.getElementById('map-view-styles');
      if (styleElement && styleElement.parentNode) {
        styleElement.parentNode.removeChild(styleElement);
      }
    };
  }, [centers, userLocation, initialZoom, onCenterSelect]);
  
  // Handle fullscreen toggle
  useEffect(() => {
    const mapContainer = document.getElementById(mapContainerId);
    if (!mapContainer) return;
    
    if (isFullscreen) {
      mapContainer.classList.add('fixed', 'inset-0', 'z-50', 'h-screen', 'w-screen');
      document.body.classList.add('overflow-hidden');
    } else {
      mapContainer.classList.remove('fixed', 'inset-0', 'z-50', 'h-screen', 'w-screen');
      document.body.classList.remove('overflow-hidden');
    }
    
    // Update map size when toggling fullscreen
    if (mapRef.current) {
      setTimeout(() => {
        mapRef.current?.invalidateSize();
      }, 100);
    }
  }, [isFullscreen]);
  
  // Get user location
  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          
          // Center map on user location
          if (mapRef.current) {
            mapRef.current.setView([latitude, longitude], 13);
            
            // Add user location marker if not already on the map
            const userIcon = createUserLocationIcon();
            const userMarker = L.marker([latitude, longitude], {
              icon: userIcon,
              zIndexOffset: 1000,
            }).addTo(mapRef.current);
            
            userMarker.bindPopup('Ihr Standort', {
              closeButton: false,
            }).openPopup();
            
            // Add accuracy circle
            L.circle([latitude, longitude], {
              radius: 1000, // 1km accuracy example
              fillColor: '#6366f1',
              fillOpacity: 0.05,
              color: '#6366f1',
              weight: 1,
              opacity: 0.3,
            }).addTo(mapRef.current);
          }
        },
        (error) => {
          console.error('Error getting user location:', error);
          // Show error message
          alert('Standort konnte nicht ermittelt werden. Bitte überprüfen Sie Ihre Standorteinstellungen.');
        }
      );
    } else {
      alert('Ihr Browser unterstützt keine Geolokalisierung.');
    }
  };
  
  // Calculate distance from user location to center
  const calculateDistance = (center: RecyclingCenter): string => {
    if (!userLocation || !center.location.latitude || !center.location.longitude) return '-';
    
    const R = 6371; // Radius of the Earth in km
    const dLat = (center.location.latitude - userLocation.latitude) * Math.PI / 180;
    const dLon = (center.location.longitude - userLocation.longitude) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(userLocation.latitude * Math.PI / 180) * Math.cos(center.location.latitude * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const distance = R * c; // Distance in km
    
    // Format distance
    if (distance < 1) {
      return `${Math.round(distance * 1000)} m`;
    } else {
      return `${distance.toFixed(1)} km`;
    }
  };
  
  return (
    <div className="relative flex flex-col h-[600px] bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Map toolbar */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between z-10 bg-white">
        <div className="flex items-center">
          <h3 className="text-lg font-semibold text-gray-800 mr-4">
            Kartenansicht
            <span className="ml-2 text-sm font-normal text-gray-500">
              {centers.length} Zentren
            </span>
          </h3>
          {userLocation && (
            <span className="text-sm text-blue-600 flex items-center">
              <Navigation className="h-4 w-4 mr-1" />
              Standort erkannt
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <button 
            onClick={getUserLocation}
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            title="Meinen Standort anzeigen"
          >
            <Navigation className="w-5 h-5" />
          </button>
          <button 
            onClick={() => onViewModeChange && onViewModeChange('list')}
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            title="Listenansicht"
          >
            <List className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            title={isFullscreen ? "Vollbildmodus beenden" : "Vollbildmodus"}
          >
            {isFullscreen ? (
              <X className="w-5 h-5" />
            ) : (
              <Layers className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
      
      {/* Map container */}
      <div 
        id={mapContainerId} 
        className="flex-grow relative z-0"
        aria-label="Karte mit Recyclingzentren"
      />
      
      {/* Selected center info panel */}
      {selectedCenter && (
        <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-10 animate-slide-up">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-bold text-gray-900">{selectedCenter.name}</h4>
              <div className="flex items-center mt-1 text-sm text-gray-600">
                <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                <span>
                  {selectedCenter.location.address || selectedCenter.location.city}
                  {selectedCenter.location.zipCode && `, ${selectedCenter.location.zipCode}`}
                </span>
              </div>
              <div className="flex items-center mt-2">
                <div className="mr-4 flex items-center">
                  <span className="text-amber-500 mr-1">★</span>
                  <span>{selectedCenter.rating.average.toFixed(1)}</span>
                </div>
                {userLocation && (
                  <div className="text-sm text-gray-600 flex items-center">
                    <Navigation className="w-3 h-3 mr-1" />
                    <span>{calculateDistance(selectedCenter)}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              {selectedCenter.isVerified && (
                <span className="bg-blue-100 text-blue-700 px-2 py-1 text-xs font-semibold rounded-full">
                  Verifiziert
                </span>
              )}
              {selectedCenter.buysMaterials && (
                <span className="bg-purple-50 text-purple-700 px-2 py-1 text-xs font-semibold rounded-full">
                  Kauft Materialien
                </span>
              )}
            </div>
          </div>
          <div className="mt-4 flex justify-between">
            <button
              onClick={() => setSelectedCenter(null)}
              className="text-gray-600 hover:text-gray-800 text-sm"
            >
              <X className="w-4 h-4 inline mr-1" />
              Schließen
            </button>
            <a
              href={`/recycling-centers/${selectedCenter.location.city.toLowerCase().replace(/\s+/g, '-')}/${selectedCenter.slug}`}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm"
            >
              <Info className="w-4 h-4 inline mr-1" />
              Details ansehen
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default CenterMapView; 