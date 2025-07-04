'use client';

import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// IMPORTANT: Leaflet CSS must be imported globally for styles to work.
// Typically in layout.tsx or the root page component:
// import 'leaflet/dist/leaflet.css';

// --- Custom Marker Icon --- 
// Simple green map pin SVG - uses fill="currentColor" so color can be influenced by CSS if needed, but defaults work well.
const customIconSVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style="color: #059669;" width="28" height="28">
  <path fill-rule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041A16.975 16.975 0 0012 21c-.266 0-.525-.01-.785-.03a16.975 16.975 0 00-1.928-1.617l-.071.041zM12 1.5A16.975 16.975 0 0122.215 6.03a16.975 16.975 0 01-1.928 1.617l.071-.04c.104-.058.21-.112.318-.169l.13-.081a.758.758 0 01.806-.01l.004.002a18.47 18.47 0 01.087.049l.004.002a18.47 18.47 0 01.087.049l.13.08a.75.75 0 11-.715 1.248l-.13-.081a16.975 16.975 0 01-3.03 1.514.75.75 0 01-.897-.376A17.01 17.01 0 0112 3.75c-.396 0-.787.036-1.17.105a17.01 17.01 0 01-3.03 1.514.75.75 0 01-.897.376A16.975 16.975 0 016.03 7.468l-.13.08a.75.75 0 11-.715-1.248l.13-.081a18.47 18.47 0 01.087-.049l.004-.002a18.47 18.47 0 01.087-.049l.004-.002a.758.758 0 01.806.01l.13.08a16.975 16.975 0 013.03-1.514A17.01 17.01 0 0112 1.5z" clip-rule="evenodd" />
  <path d="M12 8.25a3.75 3.75 0 100 7.5 3.75 3.75 0 000-7.5z" />
</svg>
`;

// Use L.divIcon to render the SVG as the icon
const customMarkerIcon = L.divIcon({
  html: customIconSVG,
  className: 'custom-leaflet-div-icon', // Add a class for potential targetted styling (optional)
  iconSize: [28, 28],       // Size of the icon
  iconAnchor: [14, 28],      // Point of the icon which will correspond to marker's location (bottom center)
  popupAnchor: [0, -28]     // Point from which the popup should open relative to the iconAnchor
});

// Fix default Leaflet icon path issue if not using custom icon consistently
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});
// --- End Custom Marker Icon ---

interface RecyclingCenterMapProps {
  latitude: number;
  longitude: number;
  centerName?: string;
  zoomLevel?: number;
  className?: string;
}

const RecyclingCenterMap: React.FC<RecyclingCenterMapProps> = ({
  latitude,
  longitude,
  centerName = 'Recycling Center Location',
  zoomLevel = 14, 
  className = 'h-80 w-full rounded-md border border-border' // Default styling
}) => {

  // Handle cases where leaflet might be loaded dynamically or in SSR context
  // This ensures MapContainer only renders client-side where window is available
  if (typeof window === 'undefined') {
    return <div className={`${className} flex items-center justify-center bg-muted text-muted-foreground`}>Loading map...</div>;
  }

  return (
    <MapContainer 
      center={[latitude, longitude]} 
      zoom={zoomLevel} 
      scrollWheelZoom={false} // Disable scroll wheel zoom by default
      className={className} // Apply the passed className for dimensions and styling
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[latitude, longitude]} icon={customMarkerIcon}>
        <Popup>
          {centerName}
        </Popup>
      </Marker>
    </MapContainer>
  );
};

export default RecyclingCenterMap; 