// Server component for recycling centers page
import { Suspense } from 'react';
import { getPopularCities, getRecyclingStats, getAllMaterials, getAllCities } from '@/lib/data/recycling';
import HeroSearch from '@/components/recycling-centers/HeroSearch';
import QuickFilters from '@/components/recycling-centers/QuickFilters';
import StatisticsPanel from '@/components/recycling-centers/StatisticsPanel';
import PopularCitiesGrid from '@/components/recycling-centers/PopularCitiesGrid';
import CentersListWithFilters from '@/components/recycling-centers/CentersListWithFilters';
import RecyclingGuide from '@/components/recycling-centers/RecyclingGuide';
import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

// Proper metadata configuration using Next.js metadata API
export const metadata: Metadata = {
  title: 'Recyclingcenter in Deutschland | Finden Sie lokale Recyclingstellen',
  description: 'Finden Sie Recyclingcenter in ganz Deutschland mit unserer umfassenden Datenbank. Suchen Sie nach Stadt, akzeptierten Materialien und mehr für nachhaltige Recyclinglösungen in Ihrer Nähe.',
  keywords: 'Recyclingcenter, Deutschland, Abfallwirtschaft, nachhaltiges Recycling, Umweltlösungen, Elektroschrott, Entsorgung von Sondermüll, Recyclinganlagen',
  openGraph: {
    title: 'Recyclingcenter in Deutschland | Finden Sie lokale Recyclingstellen',
    description: 'Finden Sie Recyclingcenter in ganz Deutschland mit unserer umfassenden Datenbank. Suchen Sie nach Stadt, akzeptierten Materialien und mehr.',
    type: 'website',
    images: ['/images/recycling-hero.jpg'],
  }
};

export default async function RecyclingCentersPage({
  searchParams
}: {
  searchParams: { city?: string; material?: string; search?: string; view?: string; materials?: string }
}) {
  // Server-side data fetching
  const [popularCities, recyclingStats, materials, allCities] = await Promise.all([
    getPopularCities(),
    getRecyclingStats(),
    getAllMaterials(),
    getAllCities()
  ]);

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Hero with integrated search */}
      <HeroSearch 
        stats={recyclingStats}
        initialCity={searchParams.city || ''}
        initialMaterial={searchParams.material || ''}
        initialSearch={searchParams.search || ''}
        materials={materials}
        cities={allCities}
      />
      
      {/* Main content with sidebar layout */}
      <div className="flex flex-col lg:flex-row gap-8 mt-8">
        {/* Sidebar with filters - Only visible on desktop */}
        <div className="hidden lg:block lg:w-1/4 space-y-6">
          <QuickFilters materials={materials} />
          
          {/* Link to all cities page */}
          <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
            <h3 className="text-lg font-bold mb-4">Finden Sie Recyclingzentren nach Stadt</h3>
            <p className="text-gray-600 mb-4 text-sm">
              Durchsuchen Sie alle {allCities.length.toLocaleString()} Städte in unserer Datenbank und finden Sie Recyclingzentren in Ihrer Nähe.
            </p>
            <Link 
              href="/recycling-centers/cities" 
              className="flex items-center justify-between text-green-600 hover:text-green-800 font-medium"
            >
              <span>Alle Städte anzeigen</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
        
        {/* Main content area */}
        <div className="flex-1">
          {/* Centers list with integrated filter panel - Right at the top */}
          <section id="centers-list" className="mb-8">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Recyclingcenter Verzeichnis</h2>
              </div>
              
              {/* Quick filters - Only visible on mobile */}
              <div className="lg:hidden mb-6">
                <QuickFilters materials={materials} />
              </div>
              
              <CentersListWithFilters
                initialCity={searchParams.city || ''}
                initialMaterial={searchParams.material || ''}
                initialSearch={searchParams.search || ''}
                materials={materials}
              />
            </div>
          </section>
          
          {/* Statistics panel - Moved below the results */}
          <Suspense fallback={<div className="h-32 bg-gray-100 animate-pulse mb-8 rounded-xl"></div>}>
            <StatisticsPanel stats={recyclingStats} />
          </Suspense>
          
          {/* Popular cities grid */}
          <Suspense fallback={<div className="h-64 bg-gray-100 animate-pulse mb-8 rounded-xl"></div>}>
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Beliebte Städte</h2>
                <Link 
                  href="/recycling-centers/cities" 
                  className="text-green-600 hover:text-green-800 font-medium flex items-center"
                >
                  <span>Alle Städte</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
              <PopularCitiesGrid cities={popularCities} />
            </div>
          </Suspense>
        </div>
      </div>
      
      {/* Recycling guide */}
      <RecyclingGuide />
    </div>
  );
} 