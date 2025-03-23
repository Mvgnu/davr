'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  ChevronRight, 
  Search, 
  MapPin, 
  Star, 
  Info, 
  Clock, 
  ShoppingBag 
} from 'lucide-react';
import { JsonLd } from '@/components/JsonLd';
import { generateMarketplaceSchema, generateMaterialPricesSchema } from './schema';

// Material price interface from API
interface MaterialPrice {
  id: string;
  materialId: string;
  materialName: string;
  price: number;
  unit: string;
  recyclingCenterId: string;
  recyclingCenterName: string;
  city: string;
  postalCode: string;
  date: string;
  trend: 'up' | 'down' | 'stable';
  previousPrice?: number;
}

// Marketplace listing interface from API
interface MarketplaceListing {
  id: string;
  title: string;
  description: string;
  price: number;
  unit: string;
  location: {
    city: string;
    postalCode: string;
  };
  image?: string;
  seller: {
    id: string;
    name: string;
    rating: number;
    isVerified: boolean;
    totalListings: number;
  };
  isNew: boolean;
  createdAt: string;
  category: string;
  materialType: string;
}

export default function MarketplacePage() {
  const [materialPrices, setMaterialPrices] = useState<MaterialPrice[]>([]);
  const [marketplaceListings, setMarketplaceListings] = useState<MarketplaceListing[]>([]);
  const [isLoadingPrices, setIsLoadingPrices] = useState(true);
  const [isLoadingListings, setIsLoadingListings] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Fetch material prices from recycling centers
    async function fetchMaterialPrices() {
      setIsLoadingPrices(true);
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/market/prices`, {
          cache: 'no-store'
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch material prices');
        }
        
        const data = await response.json();
        setMaterialPrices(data.success ? data.data : []);
      } catch (error) {
        console.error('Error fetching material prices:', error);
        setError('Failed to fetch material prices. Please try again later.');
        setMaterialPrices([]);
      } finally {
        setIsLoadingPrices(false);
      }
    }
    
    // Fetch marketplace listings
    async function fetchMarketplaceListings() {
      setIsLoadingListings(true);
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/market/listings`, {
          cache: 'no-store'
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch marketplace listings');
        }
        
        const data = await response.json();
        setMarketplaceListings(data.success ? data.data : []);
      } catch (error) {
        console.error('Error fetching marketplace listings:', error);
        setError('Failed to fetch marketplace listings. Please try again later.');
        setMarketplaceListings([]);
      } finally {
        setIsLoadingListings(false);
      }
    }
    
    fetchMaterialPrices();
    fetchMarketplaceListings();
  }, []);
  
  // Group prices by material name
  const pricesByMaterial = materialPrices.reduce((acc, price) => {
    if (!acc[price.materialName]) {
      acc[price.materialName] = [];
    }
    acc[price.materialName].push(price);
    return acc;
  }, {} as Record<string, MaterialPrice[]>);
  
  // Calculate average price per material
  const averagePrices = Object.entries(pricesByMaterial).map(([materialName, prices]) => {
    const sum = prices.reduce((acc, price) => acc + price.price, 0);
    const avgPrice = sum / prices.length;
    // Determine trend based on majority
    const upCount = prices.filter(p => p.trend === 'up').length;
    const downCount = prices.filter(p => p.trend === 'down').length;
    const stableCount = prices.filter(p => p.trend === 'stable').length;
    let trend: 'up' | 'down' | 'stable' = 'stable';
    
    if (upCount > downCount && upCount > stableCount) trend = 'up';
    else if (downCount > upCount && downCount > stableCount) trend = 'down';
    
    return {
      name: materialName,
      price: avgPrice,
      trend
    };
  });
  
  return (
    <div className="bg-white">
      {/* Add structured data */}
      <JsonLd data={generateMaterialPricesSchema(window.location.origin, averagePrices)} />
      {marketplaceListings.length > 0 && (
        <JsonLd data={generateMarketplaceSchema(window.location.origin, marketplaceListings.map(listing => ({
          id: listing.id,
          title: listing.title,
          price: listing.price,
          unit: listing.unit,
          location: `${listing.location.city}, ${listing.location.postalCode}`,
          image: listing.image,
          seller: {
            name: listing.seller.name,
            rating: listing.seller.rating,
            isVerified: listing.seller.isVerified
          },
          isNew: listing.isNew,
          createdAt: new Date(listing.createdAt)
        })))} />
      )}
      
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-green-50 to-white py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Recycling-Marktplatz für Wertstoffe
            </h1>
            <p className="text-lg text-gray-700 mb-8">
              Aktuelle Ankaufspreise von Recyclinghöfen und Angebote von Privatpersonen
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/marketplace/sell">
                <Button className="w-full sm:w-auto">
                  <ShoppingBag className="mr-2 h-5 w-5" />
                  Material verkaufen
                </Button>
              </Link>
              <Link href="/recycling-centers">
                <Button variant="outline" className="w-full sm:w-auto">
                  Recyclinghof finden
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
      
      {/* Material Prices Section */}
      <section className="py-12 border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">Aktuelle Materialpreise</h2>
              <Link href="/materials">
                <Button variant="link" className="text-green-700">
                  Alle Materialien
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
            
            {isLoadingPrices ? (
              <div className="flex justify-center items-center py-10">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-green-500"></div>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-red-500">{error}</p>
              </div>
            ) : averagePrices.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Keine Materialpreise verfügbar.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {averagePrices.slice(0, 6).map((material, index) => (
                  <div
                    key={index}
                    className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-all"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{material.name}</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-green-700">
                        {material.price.toFixed(2)} €/kg
                      </span>
                      <span className={`flex items-center text-sm font-medium ${
                        material.trend === 'up' ? 'text-green-600' : 
                        material.trend === 'down' ? 'text-red-600' : 
                        'text-gray-600'
                      }`}>
                        {material.trend === 'up' ? (
                          <TrendingUp className="mr-1 h-4 w-4" />
                        ) : material.trend === 'down' ? (
                          <TrendingDown className="mr-1 h-4 w-4" />
                        ) : (
                          '→'
                        )}
                        {material.trend === 'up' ? '+' : material.trend === 'down' ? '-' : ''}5%
                      </span>
                    </div>
                    <Link href={`/materials/${encodeURIComponent(material.name.toLowerCase())}`}>
                      <Button variant="ghost" className="w-full mt-4 text-green-700">
                        Details ansehen
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
            
            <div className="mt-8 text-center">
              <Link href="/materials">
                <Button>
                  Alle Materialien und Preise
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
      
      {/* Marketplace Listings Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">Aktuelle Angebote</h2>
              <Link href="/marketplace/listings">
                <Button variant="link" className="text-green-700">
                  Alle Angebote
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
            
            {isLoadingListings ? (
              <div className="flex justify-center items-center py-10">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-green-500"></div>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-red-500">{error}</p>
              </div>
            ) : marketplaceListings.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Keine Angebote verfügbar.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {marketplaceListings.slice(0, 6).map((listing) => (
                  <div
                    key={listing.id}
                    className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-all"
                  >
                    <div className="relative h-48">
                      {listing.image ? (
                        <Image
                          src={listing.image}
                          alt={listing.title}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">
                          Kein Bild
                        </div>
                      )}
                      {listing.isNew && (
                        <span className="absolute top-2 left-2 bg-green-600 text-white text-xs font-semibold px-2 py-1 rounded">
                          Neu
                        </span>
                      )}
                    </div>
                    
                    <div className="p-5">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{listing.title}</h3>
                      <p className="text-green-700 text-xl font-bold mb-2">{listing.price.toFixed(2)} €/{listing.unit}</p>
                      
                      <div className="flex items-center text-sm text-gray-600 mb-3">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span>{listing.location.city}, {listing.location.postalCode}</span>
                      </div>
                      
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center text-sm">
                          <span className="font-medium mr-2">{listing.seller.name}</span>
                          {listing.seller.isVerified && (
                            <span className="bg-blue-100 text-blue-800 text-xs px-1.5 py-0.5 rounded">
                              Verifiziert
                            </span>
                          )}
                        </div>
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-400 mr-1" fill="currentColor" />
                          <span className="text-sm font-medium">{listing.seller.rating.toFixed(1)}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-xs text-gray-500">
                          <Clock className="h-3 w-3 mr-1" />
                          <span>
                            {new Date(listing.createdAt).toLocaleDateString('de-DE', { 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </span>
                        </div>
                        <Link href={`/marketplace/listings/${listing.id}`}>
                          <Button variant="link" className="text-green-700 p-0">
                            Details
                            <ChevronRight className="ml-1 h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="mt-8 text-center">
              <Link href="/marketplace/listings">
                <Button>
                  Alle Angebote ansehen
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
      
      {/* Information Section */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
              <div className="flex items-start">
                <div className="bg-blue-100 p-3 rounded-full mr-4">
                  <Info className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Verkaufen Sie Ihre Wertstoffe</h3>
                  <p className="text-gray-700 mb-4">
                    Unser Marktplatz bietet Ihnen die Möglichkeit, recycelbare Materialien direkt an Recyclinghöfe oder andere Interessenten zu verkaufen. 
                    Vergleichen Sie die aktuellen Preise und finden Sie den besten Abnehmer für Ihre Wertstoffe.
                  </p>
                  <Link href="/marketplace/sell">
                    <Button>
                      Jetzt Inserat erstellen
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
} 