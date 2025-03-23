'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Head from 'next/head';
import Image from 'next/image';
import RecyclingCenterDetail from '@/components/recycling-centers/RecyclingCenterDetail';
import { useRecyclingCenters } from '@/lib/hooks/useRecyclingCenters';
import Link from 'next/link';
import { ChevronLeft, Info, MapPin, Star, Clock, Phone, Mail, Globe, AlertTriangle } from 'lucide-react';

export default function RecyclingCenterDetailPageWithSlug() {
  const params = useParams();
  const city = params?.city as string;
  const slug = params?.slug as string;
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cityName, setCityName] = useState<string>('');
  const [recyclingCenter, setRecyclingCenter] = useState<any>(null);
  const { fetchCenter } = useRecyclingCenters();
  
  useEffect(() => {
    // Convert city-slug to properly capitalized city name
    if (city) {
      const formattedCity = city
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      setCityName(formattedCity);
    }
    
    // Fetch the recycling center data for metadata
    const loadCenterData = async () => {
      try {
        if (slug) {
          const centerData = await fetchCenter(slug);
          setRecyclingCenter(centerData);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error loading recycling center metadata:', err);
        setError('Fehler beim Laden der Recyclingcenter-Daten. Bitte versuchen Sie es später erneut.');
        setIsLoading(false);
      }
    };
    
    loadCenterData();
  }, [city, slug, fetchCenter]);
  
  if (!city || !slug) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-red-600">Fehler</h1>
          <p className="mt-2 text-gray-600">Fehlende Parameter für die Suche nach Recyclingcentern.</p>
          <Link 
            href="/recycling-centers" 
            className="mt-6 inline-flex items-center text-green-600 hover:text-green-800 font-medium"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Zurück zur Hauptseite
          </Link>
        </div>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="animate-pulse flex flex-col items-center">
            <div className="rounded-full bg-gray-200 h-12 w-12 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-3"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3 mb-6"></div>
            <div className="h-48 bg-gray-200 rounded w-full mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6 mb-3"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
          <p className="mt-6 text-gray-500">Recyclingcenter-Informationen werden geladen...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-red-600">Fehler</h1>
          <p className="mt-2 text-gray-600">{error}</p>
          <Link 
            href={`/recycling-centers/${city}`} 
            className="mt-6 inline-flex items-center text-green-600 hover:text-green-800 font-medium"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Zurück zu Recyclingcentern in {cityName}
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <>
      <Head>
        {recyclingCenter && (
          <>
            <title>{recyclingCenter.name} | Recyclingcenter in {cityName}</title>
            <meta 
              name="description" 
              content={`${recyclingCenter.name} in ${cityName}. ${recyclingCenter.description || 'Informationen über akzeptierte Materialien, Öffnungszeiten und Standortdetails.'}`} 
            />
            <meta 
              name="keywords" 
              content={`${recyclingCenter.name}, Recyclingcenter ${cityName}, Recyclinganlage, Abfallwirtschaft, Materialrecycling`} 
            />
            
            {/* Open Graph / Social Media */}
            <meta property="og:title" content={`${recyclingCenter.name} - Recyclingcenter in ${cityName}`} />
            <meta property="og:description" content={recyclingCenter.description || `Details über ${recyclingCenter.name} Recyclingcenter in ${cityName}`} />
            <meta property="og:type" content="business.business" />
            <meta property="og:url" content={`https://yourwebsite.com/recycling-centers/${city}/${slug}`} />
            <meta property="og:image" content="/images/recycling-center.jpg" />
            
            {/* Structured Data */}
            <script 
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                  "@context": "https://schema.org",
                  "@type": "LocalBusiness",
                  "name": recyclingCenter.name,
                  "description": recyclingCenter.description || `Recyclingcenter in ${cityName}`,
                  "image": "/images/recycling-center.jpg",
                  "address": {
                    "@type": "PostalAddress",
                    "streetAddress": recyclingCenter.address || "",
                    "addressLocality": recyclingCenter.location?.city || cityName,
                    "postalCode": recyclingCenter.location?.zipCode || "",
                    "addressCountry": "DE"
                  },
                  "geo": {
                    "@type": "GeoCoordinates",
                    "latitude": recyclingCenter.location?.latitude,
                    "longitude": recyclingCenter.location?.longitude
                  },
                  "telephone": recyclingCenter.contact?.phone || "",
                  "email": recyclingCenter.contact?.email || "",
                  "url": recyclingCenter.contact?.website || "",
                  "openingHoursSpecification": [
                    {
                      "@type": "OpeningHoursSpecification",
                      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                      "opens": "08:00",
                      "closes": "18:00"
                    },
                    {
                      "@type": "OpeningHoursSpecification",
                      "dayOfWeek": "Saturday",
                      "opens": "09:00",
                      "closes": "14:00"
                    }
                  ],
                  "aggregateRating": recyclingCenter.rating ? {
                    "@type": "AggregateRating",
                    "ratingValue": recyclingCenter.rating.average || 0,
                    "reviewCount": recyclingCenter.rating.count || 0
                  } : undefined
                })
              }}
            />
          </>
        )}
      </Head>
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link 
            href={`/recycling-centers/${city}`}
            className="inline-flex items-center text-green-600 hover:text-green-800 font-medium"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Zurück zu allen Recyclingcentern in {cityName}
          </Link>
        </div>
        
        {/* Breadcrumb Navigation */}
        <div className="text-sm text-gray-500 mb-6">
          <div className="flex items-center flex-wrap">
            <Link href="/" className="hover:text-green-600">Startseite</Link>
            <span className="mx-2">›</span>
            <Link href="/recycling-centers" className="hover:text-green-600">Recyclingcenter</Link>
            <span className="mx-2">›</span>
            <Link href={`/recycling-centers/${city}`} className="hover:text-green-600">{cityName}</Link>
            <span className="mx-2">›</span>
            <span className="text-gray-700">{recyclingCenter?.name || 'Details'}</span>
          </div>
        </div>
        
        {/* Page Content */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <RecyclingCenterDetail idOrSlug={slug} />
        </div>
        
        {/* Additional Section */}
        <div className="mt-12 bg-white rounded-lg p-8 shadow-lg border border-gray-100">
          <div className="flex items-center mb-6">
            <div className="bg-green-100 p-2 rounded-full mr-3">
              <Info className="w-5 h-5 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold">Besuch dieses Recyclingcenters</h2>
          </div>
          
          <div className="prose prose-green max-w-none">
            <p>
              Bei der Planung Ihres Besuchs in diesem Recyclingcenter in {cityName} beachten Sie bitte Folgendes:
            </p>
            
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
              <li className="flex items-start">
                <Clock className="w-5 h-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
                <span>Überprüfen Sie die Öffnungszeiten vor Ihrem Besuch</span>
              </li>
              <li className="flex items-start">
                <MapPin className="w-5 h-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
                <span>Planen Sie Ihre Route im Voraus für eine reibungslose Anreise</span>
              </li>
              <li className="flex items-start">
                <Info className="w-5 h-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
                <span>Sortieren Sie Ihre Recyclingmaterialien nach Materialtyp</span>
              </li>
              <li className="flex items-start">
                <Star className="w-5 h-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
                <span>Reinigen Sie Behälter, um die Akzeptanz zu gewährleisten</span>
              </li>
            </ul>
            
            <div className="bg-gray-50 p-6 rounded-lg my-6 border border-gray-200">
              <h3 className="font-semibold mb-2">Dokumentation und Identifikation</h3>
              <p>
                Einige Recyclingcenter benötigen einen Identitätsnachweis oder einen Nachweis Ihres Wohnorts. 
                Bringen Sie für {cityName} am besten Folgendes mit:
              </p>
              <ul className="mt-2">
                <li>Personalausweis oder Reisepass</li>
                <li>Aktueller Wohnsitznachweis (z.B. Stromrechnung)</li>
                <li>Fahrzeugpapiere, wenn Sie mit einem Fahrzeug ankommen</li>
              </ul>
            </div>
            
            <p>
              Dieses Recyclingcenter in {cityName} ist Teil eines Netzwerks von Einrichtungen, die sich der 
              ökologischen Nachhaltigkeit durch ordnungsgemäße Abfallwirtschaft und Recyclingpraktiken verschrieben haben.
            </p>
            
            <blockquote className="border-l-4 border-green-500 pl-4 italic">
              "Recycling ist nicht nur gut für die Umwelt - es ist eine Verantwortung, die wir alle teilen, 
              um eine nachhaltigere Zukunft zu gewährleisten."
            </blockquote>
          </div>
        </div>
      </div>
    </>
  );
} 