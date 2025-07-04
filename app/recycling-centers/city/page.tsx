// Server component for city-specific recycling centers page
import { Suspense } from 'react';
import { getRecyclingStats, getAllMaterials, getAllCities } from '@/lib/data/recycling';
import QuickFilters from '@/components/recycling-centers/QuickFilters';
import StatisticsPanel from '@/components/recycling-centers/StatisticsPanel';
import CentersListWithFilters from '@/components/recycling-centers/CentersListWithFilters';
import RecyclingGuide from '@/components/recycling-centers/RecyclingGuide';
import CityHeroSearch from '@/components/recycling-centers/CityHeroSearch';
import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, Shield, Leaf } from 'lucide-react';

// Function to generate metadata for the city page
export async function generateMetadata({ params }: { params: { city: string } }): Promise<Metadata> {
  // Format city name from slug - ADD CHECK FOR params.city
  const citySlug = params?.city;
  const cityName = citySlug && typeof citySlug === 'string'
    ? citySlug
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    : 'Unbekannte Stadt'; // Default name if slug is missing

  return {
    title: `Recyclingcenter in ${cityName} | Finden Sie lokale Recyclingstellen`,
    description: `Finden Sie die besten Recyclingcenter in ${cityName}. Umfassende Liste von Recyclinganlagen mit Materialarten, Öffnungszeiten und Wegbeschreibungen.`,
    keywords: `Recyclingcenter ${cityName}, Recyclinganlagen ${cityName}, Abfallwirtschaft ${cityName}, Recycling-Abgabestellen ${cityName}`,
    openGraph: {
      title: `Recyclingcenter in ${cityName}`,
      description: `Entdecken Sie die besten Recyclinganlagen in ${cityName}. Finden Sie Standorte, akzeptierte Materialien und Öffnungszeiten.`,
      type: 'website',
      images: ['/images/recycling-city.jpg'],
    }
  };
}

// Main page component
export default async function CityRecyclingCentersPage({
  params,
  searchParams
}: {
  params: { city: string };
  searchParams: { material?: string; search?: string; view?: string; materials?: string }
}) {
  // Format city name from slug - ADD CHECK FOR params.city
  const citySlug = params?.city;
  const cityName = citySlug && typeof citySlug === 'string'
    ? citySlug
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    : 'Unbekannte Stadt'; // Default name if slug is missing

  // Server-side data fetching
  const [recyclingStats, materials, allCities] = await Promise.all([
    getRecyclingStats(),
    getAllMaterials(),
    getAllCities()
  ]);

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-6">
        <Link 
          href="/recycling-centers"
          className="inline-flex items-center text-green-600 hover:text-green-800 font-medium"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Zurück zu allen Recyclingcentern
        </Link>
      </div>
      
      {/* Use the properly separated CityHeroSearch component */}
      <CityHeroSearch 
        cityName={cityName}
        stats={recyclingStats}
        initialCity={cityName}
        initialMaterial={searchParams.material || ''}
        initialSearch={searchParams.search || ''}
        materials={materials}
        cities={allCities}
      />
      
      {/* Main content with sidebar layout */}
      <div className="flex flex-col lg:flex-row gap-8 mt-10">
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
                <h2 className="text-2xl font-bold text-gray-900">Recyclingcenter in {cityName}</h2>
              </div>
              
              {/* Quick filters - Only visible on mobile */}
              <div className="lg:hidden mb-6">
                <QuickFilters materials={materials} />
              </div>
              
              <CentersListWithFilters
                initialCity={cityName}
                initialMaterial={searchParams.material || ''}
                initialSearch={searchParams.search || ''}
                materials={materials}
              />
            </div>
          </section>
          
          {/* Statistics panel */}
          <Suspense fallback={<div className="h-32 bg-gray-100 animate-pulse mb-8 rounded-xl"></div>}>
            <StatisticsPanel stats={recyclingStats} />
          </Suspense>
          
          {/* SEO Content - Improved with better content */}
          <div className="prose prose-green max-w-none bg-white p-8 rounded-lg shadow-md border border-gray-100 mb-8">
            <h2>Effizientes Recycling in {cityName} - Ihr umfassender Leitfaden</h2>
            <p>
              {cityName} nimmt eine führende Position im nachhaltigen Abfallmanagement ein. Mit einer wachsenden Anzahl 
              an spezialisierten Recyclingcentern bietet die Stadt eine hervorragende Infrastruktur für umweltbewusste 
              Bürger. Unsere Datenbank hilft Ihnen dabei, das passende Zentrum für Ihre speziellen Recyclingstoffe zu finden.
            </p>
            
            <h3>Umweltauswirkungen des Recyclings in {cityName}</h3>
            <p>
              Die lokalen Recyclingbemühungen in {cityName} haben einen messbaren Einfluss auf die Umweltqualität der Region:
            </p>
            <ul>
              <li><strong>CO₂-Reduktion:</strong> Durch effizientes Recycling werden jährlich tausende Tonnen CO₂-Emissionen eingespart.</li>
              <li><strong>Ressourcenschonung:</strong> Die Wiederverwendung von Materialien reduziert den Bedarf an neuen Rohstoffen erheblich.</li>
              <li><strong>Deponieentlastung:</strong> Weniger Abfall auf Deponien bedeutet weniger Umweltbelastung und mehr verfügbaren Raum.</li>
              <li><strong>Kreislaufwirtschaft:</strong> {cityName} fördert aktiv die Kreislaufwirtschaft durch innovative Recyclingprogramme.</li>
            </ul>
            
            <h3>Spezielle Recyclingoptionen in {cityName}</h3>
            <p>
              In {cityName} stehen Ihnen vielfältige Möglichkeiten zur Verfügung, um verschiedenste Materialien umweltgerecht zu entsorgen:
            </p>
            <ul>
              <li><strong>Elektronikrecycling:</strong> Spezialisierte Zentren für die fachgerechte Entsorgung von Elektrogeräten</li>
              <li><strong>Bioabfallverwertung:</strong> Moderne Kompostierungsanlagen für organische Abfälle</li>
              <li><strong>Batteriesammelstellen:</strong> Sichere Entsorgung von Batterien und Akkus</li>
              <li><strong>Textilrecycling:</strong> Sammelstellen für alte Kleidung und Textilien</li>
              <li><strong>Sperrmüllabholung:</strong> Bequeme Services für größere Gegenstände</li>
            </ul>
            
            <div className="bg-green-50 p-6 rounded-lg my-8 border border-green-200">
              <h3 className="flex items-center text-green-800">
                <Shield className="w-5 h-5 mr-2" /> Recycling-Initiative {cityName}
              </h3>
              <p>
                {cityName} hat im letzten Jahr ein ambitioniertes Programm gestartet, um die Recyclingquote bis 2025 auf 75% zu steigern. 
                Dieses Ziel wird durch Investitionen in neue Technologien, Bildungskampagnen und die Erweiterung der Recyclinginfrastruktur unterstützt. 
                Bürger können sich an lokalen Recycling-Workshops beteiligen und mehr über nachhaltige Abfallwirtschaft lernen.
              </p>
            </div>
            
            <h3>Praktische Recycling-Tipps für {cityName}-Bewohner</h3>
            <p>
              Um Ihr Recycling in {cityName} zu optimieren, beachten Sie bitte folgende Hinweise:
            </p>
            <ul>
              <li>Informieren Sie sich vorab über die akzeptierten Materialien des jeweiligen Recyclingcenters</li>
              <li>Reinigen Sie Verpackungen vor dem Recycling, um Kontaminationen zu vermeiden</li>
              <li>Trennen Sie verschiedene Materialtypen (z.B. Kunststoff von Papier) für eine effizientere Verarbeitung</li>
              <li>Nutzen Sie die städtischen Abfallkalender, um über Sonderaktionen und Abholtage informiert zu bleiben</li>
              <li>Erkundigen Sie sich nach Preisvergünstigungen oder Belohnungsprogrammen für regelmäßiges Recycling</li>
            </ul>
            
            <p>
              Durchsuchen Sie unsere umfassende Datenbank der Recyclingcenter in {cityName}, um den optimalen Standort 
              für Ihre spezifischen Recyclingbedürfnisse zu finden. Jedes Zentrum bietet unterschiedliche Dienstleistungen und Öffnungszeiten - 
              finden Sie das perfekte Recyclingcenter für Ihre individuellen Bedürfnisse.
            </p>
          </div>
        </div>
      </div>
      
      {/* Recycling guide */}
      <RecyclingGuide />
    </div>
  );
} 