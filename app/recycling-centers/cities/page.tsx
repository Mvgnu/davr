import React from 'react';
import { MapPin } from 'lucide-react';
import { Metadata } from 'next';

import { getAllCities, getRecyclingStats, getPopularCities } from '@/lib/data/recycling';
import CitySearch from '@/components/recycling-centers/CitiesSearch';

export const metadata: Metadata = {
  title: 'Alle Städte mit Recyclingzentren | Recycling Deutschland',
  description: 'Durchsuchen Sie alle Städte mit Recyclingzentren in Deutschland und finden Sie Recyclingmöglichkeiten in Ihrer Nähe.'
};

export default async function CitiesPage() {
  // Fetch all cities from the database
  const allCities = await getAllCities();
  const stats = await getRecyclingStats();
  const popularCities = await getPopularCities();
  
  return (
    <div className="container-custom py-12">
      <h1 className="text-3xl md:text-4xl font-bold mb-6">Alle Städte mit Recyclingzentren</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div className="col-span-1 md:col-span-2">
          <p className="text-lg text-gray-700 mb-4">
            Finden Sie Recyclingcenter in jeder Stadt Deutschlands. Unsere Datenbank umfasst {stats.totalCenters.toLocaleString()} Recyclingzentren in {allCities.length.toLocaleString()} Städten.
          </p>
          <p className="text-gray-600">
            Wählen Sie eine Stadt aus, um alle verfügbaren Recyclingzentren, akzeptierte Materialien und Öffnungszeiten zu sehen.
          </p>
        </div>
        
        <div className="col-span-1 bg-green-50 rounded-xl p-6 border border-green-100">
          <h2 className="font-semibold text-lg mb-4 flex items-center text-green-800">
            <MapPin className="w-5 h-5 mr-2" />
            Recycling-Statistiken
          </h2>
          <ul className="space-y-3">
            <li className="flex justify-between items-center pb-2 border-b border-green-100">
              <span className="text-gray-700">Erfasste Städte:</span>
              <span className="font-bold">{allCities.length.toLocaleString()}</span>
            </li>
            <li className="flex justify-between items-center pb-2 border-b border-green-100">
              <span className="text-gray-700">Recyclingcenter:</span>
              <span className="font-bold">{stats.totalCenters.toLocaleString()}</span>
            </li>
            <li className="flex justify-between items-center pb-2 border-b border-green-100">
              <span className="text-gray-700">Materialarten:</span>
              <span className="font-bold">{stats.totalMaterials.toLocaleString()}</span>
            </li>
            <li className="flex justify-between items-center">
              <span className="text-gray-700">Recyclingquote:</span>
              <span className="font-bold text-green-600">67%</span>
            </li>
          </ul>
        </div>
      </div>
      
      {/* City search & filter - Client Component */}
      <CitySearch initialCities={allCities} popularCities={popularCities} />
    </div>
  );
} 