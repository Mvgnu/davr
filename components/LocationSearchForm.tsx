'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { MapPin, Search } from 'lucide-react';

export function LocationSearchForm() {
  const router = useRouter();
  const [locationQuery, setLocationQuery] = useState('');

  const handleLocationSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (locationQuery.trim()) {
      router.push(`/recycling-centers?location=${encodeURIComponent(locationQuery.trim())}`);
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg p-6 md:p-8 -mt-20 relative z-10">
      <h2 className="text-2xl font-bold text-center mb-6">
        Finden Sie Recyclinghöfe in Ihrer Nähe
      </h2>
      <form onSubmit={handleLocationSearch} className="flex flex-col md:flex-row gap-4">
        <div className="flex-grow">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MapPin className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="PLZ oder Ort eingeben"
              value={locationQuery}
              onChange={(e) => setLocationQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>
        <div>
          <Button type="submit" size="lg" className="w-full md:w-auto whitespace-nowrap">
            <Search className="mr-2 h-5 w-5" />
            Suchen
          </Button>
        </div>
      </form>
    </div>
  );
} 