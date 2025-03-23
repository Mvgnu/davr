'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { CityStats } from '@/lib/data/recycling';
import { MapPin, Recycle, ArrowRight, ChevronDown } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

// Generate a consistent color based on city name
const getCityGradient = (cityName: string) => {
  // Generate a hash from the city name
  const hash = cityName.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  
  // Define a set of eco-friendly gradients
  const gradients = [
    'from-green-700 to-emerald-500',
    'from-teal-600 to-green-400',
    'from-emerald-700 to-teal-400',
    'from-green-800 to-green-600',
    'from-teal-700 to-emerald-500',
    'from-cyan-700 to-teal-500',
    'from-green-600 to-lime-400',
    'from-emerald-600 to-green-400'
  ];
  
  // Use the hash to select a gradient
  const index = Math.abs(hash) % gradients.length;
  return gradients[index];
};

interface PopularCitiesGridProps {
  cities: CityStats[];
}

const PopularCitiesGrid: React.FC<PopularCitiesGridProps> = ({ cities }) => {
  const [showAllCities, setShowAllCities] = useState(false);
  const initialCitiesCount = 6;
  
  const displayedCities = showAllCities ? cities : cities.slice(0, initialCitiesCount);
  const hasMoreCities = cities.length > initialCitiesCount;
  
  return (
    <section className="mb-16">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Beliebte Städte</h2>
          <p className="text-xl text-gray-600">Entdecken Sie Recyclingzentren in diesen Top-Städten</p>
        </div>
        <Link 
          href="/recycling-centers/cities" 
          className="mt-4 md:mt-0 text-green-600 hover:text-green-800 flex items-center text-lg font-medium"
        >
          Alle Städte anzeigen <ArrowRight className="w-5 h-5 ml-2" />
        </Link>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence>
          {displayedCities.map((city, index) => (
            <motion.div
              key={city.id || city.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <CityCard city={city} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      
      {hasMoreCities && (
        <div className="mt-10 text-center">
          <button
            onClick={() => setShowAllCities(!showAllCities)}
            className="inline-flex items-center px-6 py-3 bg-green-50 hover:bg-green-100 text-green-700 rounded-xl text-lg font-medium transition-all"
          >
            {showAllCities ? 'Weniger anzeigen' : 'Mehr Städte anzeigen'}
            <ChevronDown className={`w-5 h-5 ml-2 transition-transform ${showAllCities ? 'rotate-180' : ''}`} />
          </button>
        </div>
      )}
    </section>
  );
};

interface CityCardProps {
  city: CityStats;
}

const CityCard: React.FC<CityCardProps> = ({ city }) => {
  // Create gradient class based on city name
  const gradientClass = getCityGradient(city.name);
  
  // Generate city URL - ensure we use the name for the path
  const cityUrl = `/recycling-centers/${city.name.toLowerCase().replace(/\s+/g, '-')}`;
  
  // Centers count property
  const centersCount = city.centersCount || 0;
  
  return (
    <Link 
      href={cityUrl}
      className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 block h-64"
    >
      {/* Gradient background instead of image */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradientClass}`}></div>
      
      {/* Texture overlay */}
      <div className="absolute inset-0 opacity-10" style={{ 
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")` 
      }}></div>
      
      {/* Gradient overlay for better text contrast */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
      
      {/* Content */}
      <div className="relative p-8 h-full flex flex-col justify-between z-10">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-3xl font-bold text-white mb-2">{city.name}</h3>
            <p className="text-white/90 text-lg flex items-center">
              <Recycle className="w-5 h-5 mr-2" />
              {centersCount} Recyclingcenter
            </p>
          </div>
          <div className="bg-white p-3 rounded-full transform transition-transform group-hover:rotate-45">
            <ArrowRight className="w-6 h-6 text-green-600" />
          </div>
        </div>
        
        <div className="mt-4">
          <span className="inline-flex items-center px-4 py-2 bg-white/20 rounded-full text-white backdrop-blur-sm text-sm">
            <MapPin className="w-4 h-4 mr-1" />
            Standorte anzeigen
          </span>
        </div>
      </div>
    </Link>
  );
};

export default PopularCitiesGrid; 