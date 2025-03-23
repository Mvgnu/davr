'use client';

import React from 'react';
import Link from 'next/link';
import { MapPin, Clock, Star, ChevronRight, ArrowRight } from 'lucide-react';

// Generate a consistent color based on center name/ID
const getCenterGradient = (centerId: number, city?: string) => {
  // Define a list of eco-friendly gradients
  const gradients = [
    'from-green-700 to-emerald-500',
    'from-teal-600 to-green-400', 
    'from-emerald-700 to-teal-500',
    'from-green-800 to-green-600',
    'from-teal-700 to-emerald-500',
    'from-blue-600 to-cyan-500',
    'from-green-600 to-lime-400',
    'from-emerald-600 to-green-400'
  ];
  
  // Use the center ID or generate a hash from the city name if provided
  let index = centerId % gradients.length;
  
  if (city) {
    const cityHash = city.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    
    // Combine center ID and city hash for more variation
    index = Math.abs((centerId * 31 + cityHash)) % gradients.length;
  }
  
  return gradients[index];
};

// Create a URL-friendly slug from a string
const createSlug = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-'); // Remove consecutive hyphens
};

export interface RecyclingCenterCardProps {
  center: {
    id: number;
    name: string;
    address?: string;
    city?: string;
    state?: string;
    isOpen?: boolean;
    openUntil?: string;
    distance?: number;
    rating?: number;
    materials?: Array<{id: number; name: string}>;
    slug?: string;
  };
  showDistance?: boolean;
}

const RecyclingCenterCard: React.FC<RecyclingCenterCardProps> = ({ 
  center,
  showDistance = false
}) => {
  const { 
    id, 
    name, 
    city = '', 
    state = '',
    address = '',
    isOpen = false,
    openUntil = '',
    distance, 
    rating = 0,
    materials = [],
    slug
  } = center;

  // Get the gradient for this center
  const gradientClass = getCenterGradient(id, city);
  
  // Format hours
  const hourDisplay = isOpen 
    ? `Geöffnet bis ${openUntil}` 
    : 'Geschlossen';
  
  // Format distance
  const distanceDisplay = distance
    ? `${distance < 1 ? (distance * 1000).toFixed(0) + ' m' : distance.toFixed(1) + ' km'}`
    : '';
    
  // Format address
  const locationDisplay = address || `${city}${state ? `, ${state}` : ''}`;
  
  // Generate URL-friendly slugs for the center URL
  const citySlug = city ? createSlug(city) : 'unbekannt';
  const nameSlug = slug || createSlug(name);
  
  // Center URL - using the correct URL structure
  const centerUrl = `/recycling-centers/${citySlug}/${nameSlug}`;
  
  // Generate star rating
  const ratingStars = Array.from({ length: 5 }).map((_, i) => (
    <Star 
      key={i} 
      className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
    />
  ));

  return (
    <Link 
      href={centerUrl}
      className="group block overflow-hidden rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 bg-white h-full"
    >
      {/* Header with gradient */}
      <div className={`h-24 relative bg-gradient-to-r ${gradientClass} p-5`}>
        {/* Pattern overlay */}
        <div className="absolute inset-0 opacity-10" style={{ 
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")` 
        }}></div>
        
        <div className="absolute bottom-3 right-3 bg-white rounded-full p-1.5 transform transition-transform group-hover:rotate-45">
          <ArrowRight className="w-5 h-5 text-green-600" />
        </div>
      </div>
      
      {/* Content */}
      <div className="p-5">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900 truncate">{name}</h3>
          
          {showDistance && distanceDisplay && (
            <span className="flex items-center text-sm text-gray-600 font-medium">
              <MapPin className="w-3.5 h-3.5 mr-1" />
              {distanceDisplay}
            </span>
          )}
        </div>
        
        <div className="mb-3 flex items-center text-gray-500">
          <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
          <span className="text-sm truncate">{locationDisplay}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm">
            <Clock className={`w-4 h-4 mr-1 ${isOpen ? 'text-green-600' : 'text-red-500'}`} />
            <span className={isOpen ? 'text-green-600 font-medium' : 'text-gray-500'}>
              {hourDisplay}
            </span>
          </div>
          
          <div className="flex items-center">
            {rating > 0 && (
              <div className="flex items-center">
                {ratingStars}
              </div>
            )}
          </div>
        </div>
        
        {/* Materials - show up to 3 */}
        {materials.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1">
            {materials.slice(0, 3).map(material => (
              <span 
                key={material.id} 
                className="px-2 py-1 text-xs bg-gray-100 rounded-full text-gray-700"
              >
                {material.name}
              </span>
            ))}
            
            {materials.length > 3 && (
              <span className="px-2 py-1 text-xs bg-gray-100 rounded-full text-gray-700">
                +{materials.length - 3} mehr
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
};

export default RecyclingCenterCard;