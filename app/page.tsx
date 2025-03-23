import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Recycle, MapPin, Package, Search, ArrowRight, Award, Globe, Zap, ArrowDown, Euro, Info } from 'lucide-react';
import { Metadata } from 'next';
import { slugify } from '@/lib/utils';
import { JsonLd } from '@/components/JsonLd';
import { ButtonLink } from '@/components/ui/button-link';
import { MaterialSearch } from '@/components/MaterialSearch';

export const metadata: Metadata = {
  title: 'Recycling-Marktplatz | Wertstoffpreise vergleichen & Recyclinghöfe finden',
  description: 'Vergleichen Sie aktuelle Wertstoffpreise in Deutschland und finden Sie Recyclinghöfe in Ihrer Nähe. Aluminium, Metall, Papier & mehr recyceln und verkaufen.',
  keywords: 'Recycling, Wertstoff, Ankaufspreis, Schrottpreis, Recyclinghof, Wertstoffe verkaufen, Nachhaltigkeit',
};

// Popular material categories
const popularMaterials = [
  {
    id: 'aluminum',
    name: 'Aluminium',
    description: 'Getränkedosen, Alufolien, Profile und mehr',
    icon: '/images/materials/aluminum.jpg',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  {
    id: 'paper',
    name: 'Papier',
    description: 'Zeitungen, Kartonagen, Bücher und mehr',
    icon: '/images/materials/paper.jpg',
    color: 'bg-green-100 text-green-800 border-green-200',
  },
  {
    id: 'metal',
    name: 'Metall',
    description: 'Stahl, Kupfer, Messing, Zink und mehr',
    icon: '/images/materials/metal.jpg',
    color: 'bg-gray-100 text-gray-800 border-gray-200',
  },
  {
    id: 'electronics',
    name: 'Elektronik',
    description: 'Computer, Handys, Kabel und mehr',
    icon: '/images/materials/electronics.jpg',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
  },
  {
    id: 'glass',
    name: 'Glas',
    description: 'Flaschen, Behälter, Fenster und mehr',
    icon: '/images/materials/glass.jpg',
    color: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  },
  {
    id: 'plastic',
    name: 'Kunststoff',
    description: 'PET-Flaschen, Folien, Verpackungen und mehr',
    icon: '/images/materials/plastic.jpg',
    color: 'bg-red-100 text-red-800 border-red-200',
  },
];

// Popular German cities
const popularCities = [
  'Berlin',
  'Hamburg',
  'München',
  'Köln',
  'Frankfurt',
  'Stuttgart',
  'Düsseldorf',
  'Leipzig',
  'Dortmund',
  'Essen',
  'Dresden',
  'Hannover',
];

export default function HomePage() {
  // Structured data for the website
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    url: 'https://www.recycling-marktplatz.de/',
    name: 'Recycling-Marktplatz',
    description: 'Vergleichen Sie aktuelle Wertstoffpreise in Deutschland und finden Sie Recyclinghöfe in Ihrer Nähe.',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://www.recycling-marktplatz.de/search?q={search_term_string}',
      'query-input': 'required name=search_term_string'
    }
  };

  return (
    <>
      <JsonLd data={structuredData} />
      
      <div className="bg-white">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-green-50 to-white py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center">
              <div className="md:w-1/2 mb-10 md:mb-0 md:pr-10">
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                  Aluminium recyceln leicht gemacht
                </h1>
                <p className="text-lg text-gray-700 mb-8">
                  Finden Sie Recyclinghöfe in Ihrer Nähe und vergleichen Sie Preise für Aluminium-Abfälle. 
                  Tragen Sie zum Umweltschutz bei und verdienen Sie dabei!
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/recycling-centers">
                    <Button size="lg" className="w-full sm:w-auto">
                      <MapPin className="mr-2 h-5 w-5" />
                      Recyclinghof finden
                    </Button>
                  </Link>
                  <Link href="/materials">
                    <Button variant="outline" size="lg" className="w-full sm:w-auto">
                      <Package className="mr-2 h-5 w-5" />
                      Materialien ansehen
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="md:w-1/2">
                <div className="relative h-80 w-full md:h-96 rounded-lg overflow-hidden shadow-xl">
                  <Image
                    src="/images/recycling-hero.jpg"
                    alt="Aluminium Recycling"
                    fill
                    style={{ objectFit: 'cover' }}
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Search Box */}
        <section className="py-12 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg p-6 md:p-8 -mt-20 relative z-10">
              <h2 className="text-2xl font-bold text-center mb-6">
                Finden Sie Recyclinghöfe für Aluminium in Ihrer Nähe
              </h2>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-grow">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MapPin className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="PLZ oder Ort eingeben"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <Button size="lg" className="w-full md:w-auto whitespace-nowrap">
                    <Search className="mr-2 h-5 w-5" />
                    Suchen
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Warum Aluminium recyceln?</h2>
              <p className="text-lg text-gray-700 max-w-3xl mx-auto">
                Aluminium-Recycling schont Ressourcen, spart Energie und reduziert CO₂-Emissionen. 
                Entdecken Sie die Vorteile des Recyclings mit unserer Plattform.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <Zap className="h-7 w-7 text-green-600" />
                </div>
                <h3 className="text-xl font-bold mb-3">Energieeinsparung</h3>
                <p className="text-gray-700">
                  Recycling von Aluminium verbraucht bis zu 95% weniger Energie als die Neuproduktion aus Bauxit-Erz.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <Globe className="h-7 w-7 text-green-600" />
                </div>
                <h3 className="text-xl font-bold mb-3">Umweltschutz</h3>
                <p className="text-gray-700">
                  Durch Recycling werden CO₂-Emissionen reduziert und natürliche Ressourcen geschont.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <Award className="h-7 w-7 text-green-600" />
                </div>
                <h3 className="text-xl font-bold mb-3">Wertschöpfung</h3>
                <p className="text-gray-700">
                  Aluminium ist ein wertvolles Material, das immer wieder recycelt werden kann, ohne an Qualität zu verlieren.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">So funktioniert es</h2>
              <p className="text-lg text-gray-700 max-w-3xl mx-auto">
                In wenigen einfachen Schritten zum Recycling Ihrer Aluminium-Abfälle
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="relative">
                  <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-xl">
                    1
                  </div>
                  <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-green-200 -z-10"></div>
                </div>
                <h3 className="text-xl font-bold mb-3">Recyclinghof finden</h3>
                <p className="text-gray-700">
                  Suchen Sie nach Recyclinghöfen in Ihrer Nähe und vergleichen Sie die angebotenen Preise.
                </p>
              </div>
              
              <div className="text-center">
                <div className="relative">
                  <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-xl">
                    2
                  </div>
                  <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-green-200 -z-10"></div>
                </div>
                <h3 className="text-xl font-bold mb-3">Material vorbereiten</h3>
                <p className="text-gray-700">
                  Sortieren und reinigen Sie Ihr Aluminium entsprechend den Anforderungen des Recyclinghofs.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-xl">
                  3
                </div>
                <h3 className="text-xl font-bold mb-3">Abgeben und profitieren</h3>
                <p className="text-gray-700">
                  Bringen Sie Ihr Material zum Recyclinghof und erhalten Sie den bestmöglichen Preis dafür.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-green-700 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-6">Bereit, mit dem Recycling zu beginnen?</h2>
            <p className="text-xl mb-8 max-w-3xl mx-auto">
              Registrieren Sie sich jetzt kostenlos und entdecken Sie alle Vorteile unserer Plattform.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/auth/register">
                <Button
                  size="lg"
                  className="bg-white text-green-700 hover:bg-gray-100 w-full sm:w-auto"
                >
                  Jetzt kostenlos registrieren
                </Button>
              </Link>
              <Link href="/recycling-centers">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-white text-white hover:bg-green-600 w-full sm:w-auto"
                >
                  Recyclinghöfe erkunden <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Materials Preview */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-center mb-10">
              <h2 className="text-3xl font-bold">Materialien im Überblick</h2>
              <Link 
                href="/materials" 
                className="text-green-700 hover:text-green-800 font-medium flex items-center mt-4 md:mt-0"
              >
                Alle Materialien ansehen <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {['Aluminiumdosen', 'Alufolie', 'Aluprofile', 'Aluguss'].map((material, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-6 text-center hover:shadow-md transition-shadow">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Recycle className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{material}</h3>
                  <p className="text-sm text-gray-600">Erfahren Sie mehr über das Recycling von {material}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </>
  );
} 