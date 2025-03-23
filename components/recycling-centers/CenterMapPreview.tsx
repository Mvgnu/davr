'use client';

import React, { useEffect, useRef, useState } from 'react';
import { NextResponse } from 'next/server';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Maximize2 } from 'lucide-react';

// Set cache headers for long-term caching
export function GET() {
  return NextResponse.json(
    { message: 'Map component available' },
    {
      headers: {
        'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
      },
    }
  );
}

// Define the component props interface
interface CenterMapPreviewProps {
  latitude: number;
  longitude: number;
  name: string;
  height?: string;
  width?: string;
  zoom?: number;
  showPopup?: boolean;
  interactive?: boolean;
  className?: string;
  onExpand?: () => void;
}

// Modal component for expanded map view
interface MapModalProps {
  isOpen: boolean;
  onClose: () => void;
  latitude: number;
  longitude: number;
  name: string;
}

const MapModal: React.FC<MapModalProps> = ({ isOpen, onClose, latitude, longitude, name }) => {
  const modalMapRef = useRef<L.Map | null>(null);
  const modalMapId = `expanded-map-${latitude}-${longitude}`.replace(/\./g, '-');

  useEffect(() => {
    if (!isOpen) return;
    
    // Fix the icon issue
    fixLeafletIcon();
    
    // Initialize the modal map
    const container = document.getElementById(modalMapId);
    if (!container) return;
    
    // Create and center the map
    modalMapRef.current = L.map(modalMapId, {
      center: [latitude, longitude],
      zoom: 14,
      zoomControl: true,
      dragging: true,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      boxZoom: true,
      keyboard: true,
      touchZoom: true,
    });
    
    // Add tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(modalMapRef.current);
    
    // Add marker with custom icon
    const marker = L.marker([latitude, longitude], { 
      icon: createCustomIcon(),
    }).addTo(modalMapRef.current);
    
    // Add a circle around the marker
    L.circle([latitude, longitude], {
      radius: 300,
      fillColor: '#16a34a',
      fillOpacity: 0.1,
      color: '#16a34a',
      weight: 1,
      opacity: 0.3,
    }).addTo(modalMapRef.current);
    
    // Add popup
    const popupContent = `<div style="text-align: center;">
      <strong style="font-size: 14px; color: #16a34a;">${name}</strong>
    </div>`;
    
    marker.bindPopup(popupContent, { 
      closeButton: true,
      className: 'custom-popup',
    }).openPopup();
    
    // Ensure proper map rendering
    setTimeout(() => {
      if (modalMapRef.current) {
        modalMapRef.current.invalidateSize();
      }
    }, 100);
    
    return () => {
      if (modalMapRef.current) {
        modalMapRef.current.remove();
        modalMapRef.current = null;
      }
    };
  }, [isOpen, latitude, longitude, name, modalMapId]);
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl overflow-hidden w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="p-4 flex justify-between items-center border-b">
          <h3 className="font-semibold text-lg">{name}</h3>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div id={modalMapId} className="w-full flex-grow" style={{ minHeight: '500px' }}></div>
      </div>
    </div>
  );
};

// Fix Leaflet's default icon path issues
const fixLeafletIcon = () => {
  // Fix Leaflet's icon path issues when using webpack
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  });
};

// Define custom marker icon using project colors
const createCustomIcon = () => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div style="background-color: #16a34a; width: 24px; height: 24px; 
                  border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                    width: 8px; height: 8px; background-color: white; border-radius: 50%;"></div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
};

const CenterMapPreview: React.FC<CenterMapPreviewProps> = ({
  latitude,
  longitude,
  name,
  height = '240px',
  width = '100%',
  zoom = 13,
  showPopup = true,
  interactive = false, // Default to non-interactive
  className = '',
  onExpand,
}) => {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerId = `map-${latitude}-${longitude}`.replace(/\./g, '-');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Handle expand button click
  const handleExpand = () => {
    if (onExpand) {
      onExpand();
    } else {
      setIsModalOpen(true);
    }
  };
  
  useEffect(() => {
    // Fix the icon issue before creating the map
    fixLeafletIcon();
    
    // Clean up any existing map instance
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }
    
    // Check if the map container exists and if we're in a browser environment
    if (typeof window !== 'undefined') {
      const container = document.getElementById(mapContainerId);
      if (!container) return;
      
      // Explicitly handle touch events to prevent issues
      if (!interactive) {
        container.ontouchstart = (e) => { e.preventDefault(); };
        container.ontouchmove = (e) => { e.preventDefault(); };
        container.ontouchend = (e) => { e.preventDefault(); };
        container.style.touchAction = 'none';
      }
      
      // Initialize map with minimalist styling and disable ALL interaction
      try {
        const mapOptions: L.MapOptions = {
          center: [latitude, longitude],
          zoom: zoom,
          zoomControl: false, // Always disable zoom controls
          dragging: false,    // Always disable dragging
          scrollWheelZoom: false,
          doubleClickZoom: false,
          boxZoom: false,
          keyboard: false,
          touchZoom: false,
          attributionControl: false,
        };
        
        // Create the map
        mapRef.current = L.map(mapContainerId, mapOptions);
        
        // Disable tap handler after map creation using type assertion to avoid TypeScript errors
        // @ts-ignore - Leaflet's typings don't include tap but it exists at runtime
        const mapInstance = mapRef.current as any;
        if (mapInstance.tap) {
          mapInstance.tap.disable();
        }
        
        // Create a custom minimalist tile layer with modern styling
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          subdomains: 'abcd',
          maxZoom: 19,
          className: 'map-tiles-minimalist',
        }).addTo(mapRef.current);
        
        // Add custom marker with project-themed styling
        const marker = L.marker([latitude, longitude], { 
          icon: createCustomIcon(),
          interactive: false // Disable marker interaction
        }).addTo(mapRef.current);
        
        // Add a subtle circle radius around the marker
        L.circle([latitude, longitude], {
          radius: 300,
          fillColor: '#16a34a',
          fillOpacity: 0.1,
          color: '#16a34a',
          weight: 1,
          opacity: 0.3,
          interactive: false // Disable circle interaction
        }).addTo(mapRef.current);
        
        // Show a styled popup if enabled
        if (showPopup) {
          const popupContent = `<div style="text-align: center;">
            <strong style="font-size: 14px; color: #16a34a;">${name}</strong>
          </div>`;
          
          // Always show popup without interaction
          marker.bindPopup(popupContent, { 
            closeButton: false,
            className: 'custom-popup',
            offset: [0, -8],
            closeOnClick: false,
            autoClose: false
          }).openPopup();
        }
        
        // Ensure map is properly centered on the marker
        setTimeout(() => {
          if (mapRef.current) {
            mapRef.current.setView([latitude, longitude], zoom);
          }
        }, 100);
        
        // Apply custom CSS for proper z-index stacking and prevent interaction issues
        const styleId = `map-style-${mapContainerId}`;
        let styleElement = document.getElementById(styleId) as HTMLStyleElement;
        
        if (!styleElement) {
          styleElement = document.createElement('style');
          styleElement.id = styleId;
          document.head.appendChild(styleElement);
        }
        
        styleElement.textContent = `
          #${mapContainerId} {
            pointer-events: ${interactive ? 'auto' : 'none'};
            touch-action: none;
          }
          #${mapContainerId} .leaflet-pane {
            z-index: 1;
          }
          #${mapContainerId} .leaflet-top, 
          #${mapContainerId} .leaflet-bottom {
            z-index: 2;
          }
          #${mapContainerId} .custom-popup .leaflet-popup-content-wrapper {
            background-color: white;
            border-radius: 6px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
            padding: 4px 10px;
            border: none;
          }
          #${mapContainerId} .custom-popup .leaflet-popup-tip {
            background-color: white;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
          }
          #${mapContainerId} .map-tiles-minimalist {
            filter: saturate(0.9) contrast(0.85);
          }
        `;
        
        // Disable all mouse/touch events on map elements if not interactive
        if (!interactive) {
          setTimeout(() => {
            const mapContainer = document.getElementById(mapContainerId);
            if (mapContainer) {
              const interactiveElements = mapContainer.querySelectorAll('.leaflet-interactive');
              interactiveElements.forEach(el => {
                (el as HTMLElement).style.pointerEvents = 'none';
              });
            }
          }, 100);
        }
        
      } catch (error) {
        console.error("Error initializing map:", error);
        // Provide a fallback display if map fails
        if (container) {
          container.innerHTML = `
            <div class="flex items-center justify-center h-full w-full bg-gray-100 rounded-lg">
              <div class="text-center p-4">
                <div class="text-gray-500">Kartenvorschau nicht verfügbar</div>
                <div class="text-gray-400 text-sm">${name}</div>
              </div>
            </div>
          `;
        }
      }
    }
    
    return () => {
      // Clean up
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      
      // Remove the style element
      const styleId = `map-style-${mapContainerId}`;
      const styleElement = document.getElementById(styleId);
      if (styleElement && styleElement.parentNode) {
        styleElement.parentNode.removeChild(styleElement);
      }
    };
  }, [latitude, longitude, name, zoom, showPopup, interactive, mapContainerId]);
  
  return (
    <div className="relative">
      <div 
        id={mapContainerId} 
        className={`rounded-lg overflow-hidden ${className}`}
        style={{ height, width }}
      ></div>
      
      {/* Expand button */}
      <button
        onClick={handleExpand}
        className="absolute bottom-2 right-2 p-1.5 bg-white rounded-md shadow-md hover:bg-gray-50 transition-colors z-10"
        title="Karte vergrößern"
      >
        <Maximize2 className="w-4 h-4 text-gray-600" />
      </button>
      
      {/* Map modal */}
      <MapModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        latitude={latitude}
        longitude={longitude}
        name={name}
      />
    </div>
  );
};

export default CenterMapPreview; 