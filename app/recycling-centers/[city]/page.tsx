'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Head from 'next/head';
import { useRecyclingCenters } from '@/lib/hooks/useRecyclingCenters';
import RecyclingCentersList from '@/components/recycling-centers/RecyclingCentersList';
import { ChevronLeft, MapPin, Recycle, Star, Shield, Clock } from 'lucide-react';

export default function CityRecyclingCentersPage() {
  const params = useParams();
  const citySlug = params?.city as string;
  const [cityName, setCityName] = useState<string>('');
  
  useEffect(() => {
    // Convert city-slug to properly capitalized city name
    if (citySlug) {
      const formattedCity = citySlug
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      setCityName(formattedCity);
    }
  }, [citySlug]);
  
  if (!citySlug) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-red-600">Fehler</h1>
          <p className="mt-2 text-gray-600">Der Stadt-Parameter fehlt oder ist ungültig.</p>
        </div>
      </div>
    );
  }
  
  return (
    <>
      <Head>
        <title>Recyclingcenter in {cityName} | Finden Sie lokale Recyclingstellen</title>
        <meta name="description" content={`Finden Sie die besten Recyclingcenter in ${cityName}. Umfassende Liste von Recyclinganlagen mit Materialarten, Öffnungszeiten und Wegbeschreibungen.`} />
        <meta name="keywords" content={`Recyclingcenter ${cityName}, Recyclinganlagen ${cityName}, Abfallwirtschaft ${cityName}, Recycling-Abgabestellen ${cityName}`} />
        
        {/* Open Graph / Social Media */}
        <meta property="og:title" content={`Recyclingcenter in ${cityName}`} />
        <meta property="og:description" content={`Entdecken Sie die besten Recyclinganlagen in ${cityName}. Finden Sie Standorte, akzeptierte Materialien und Öffnungszeiten.`} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`https://yourwebsite.com/recycling-centers/${citySlug}`} />
        <meta property="og:image" content="/images/recycling-city.jpg" />
        
        {/* Structured Data */}
        <script 
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "CollectionPage",
              "name": `Recyclingcenter in ${cityName}`,
              "description": `Umfassendes Verzeichnis von Recyclinganlagen in ${cityName}.`,
              "url": `https://yourwebsite.com/recycling-centers/${citySlug}`,
              "isPartOf": {
                "@type": "WebSite",
                "name": "Aluminium Recycling Deutschland",
                "url": "https://yourwebsite.com"
              },
              "about": {
                "@type": "Thing",
                "name": `Recycling in ${cityName}`,
                "description": `Informationen über Recyclingmöglichkeiten und -zentren in ${cityName}, Deutschland.`
              },
              "specialty": "Recycling und Abfallwirtschaft"
            })
          }}
        />
      </Head>
    
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link 
            href="/recycling-centers"
            className="inline-flex items-center text-green-600 hover:text-green-800 font-medium"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Zurück zu allen Recyclingcentern
          </Link>
        </div>
      
        {/* City Hero Section */}
        <div className="bg-gradient-to-r from-green-500 to-green-700 rounded-lg shadow-xl p-8 mb-10 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 opacity-10">
            <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
              <path fill="#FFFFFF" d="M47.7,-58.2C59.7,-47.4,66.3,-30.9,68.5,-14.2C70.8,2.6,68.7,19.6,60.1,32.1C51.5,44.6,36.4,52.7,20.2,58.9C4,65,-13.3,69.3,-30.1,65.2C-46.9,61.2,-63.2,48.8,-71.2,32.1C-79.2,15.4,-78.8,-5.6,-70.7,-22.4C-62.6,-39.2,-46.7,-51.8,-30.9,-61.3C-15.1,-70.9,0.6,-77.3,15.9,-74.5C31.2,-71.8,46.2,-60,47.7,-58.2Z" transform="translate(100 100)" />
            </svg>
          </div>
          <div className="relative z-10">
            <div className="flex items-center mb-4">
              <MapPin className="w-6 h-6 mr-2" />
              <h1 className="text-3xl font-bold">
                Recyclingcenter in {cityName}
              </h1>
            </div>
            <p className="text-lg mb-6 max-w-3xl">
              Finden Sie die besten Recyclinganlagen in {cityName} für all Ihre recycelbaren Materialien.
              Unsere umfassende Datenbank enthält Standortdetails, akzeptierte Materialien und Nutzerbewertungen.
            </p>
            
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center text-sm bg-white bg-opacity-20 px-3 py-2 rounded-full">
                <Recycle className="w-4 h-4 mr-2" />
                <span>Nachhaltige Abfallwirtschaft in {cityName}</span>
              </div>
              <div className="flex items-center text-sm bg-white bg-opacity-20 px-3 py-2 rounded-full">
                <Star className="w-4 h-4 mr-2" />
                <span>Bewertete Recyclingcenter</span>
              </div>
              <div className="flex items-center text-sm bg-white bg-opacity-20 px-3 py-2 rounded-full">
                <Clock className="w-4 h-4 mr-2" />
                <span>Aktuelle Öffnungszeiten</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Centers List */}
        <div className="bg-white p-8 rounded-lg shadow-lg border border-gray-100 mb-10">
          <RecyclingCentersList initialCity={cityName} showSearch={true} />
        </div>
        
        {/* SEO Content */}
        <div className="prose prose-green max-w-none bg-white p-8 rounded-lg shadow-md border border-gray-100">
          <h2>Recycling in {cityName}: Ihr vollständiger Leitfaden</h2>
          <p>
            {cityName} hat sich als Vorreiter bei Abfallwirtschaft und Recyclinginitiativen etabliert. 
            Die Stadt bietet zahlreiche Einrichtungen zur Verwertung verschiedener Arten von Recyclingmaterialien, 
            von gewöhnlichen Haushaltsgegenständen bis hin zu Spezialmaterialien.
          </p>
          
          <h3>Vorteile des Recyclings in {cityName}</h3>
          <ul>
            <li><strong>Lokale Umweltauswirkungen:</strong> Reduziert die Deponieauslastung und verringert die Umweltverschmutzung in der Region {cityName}.</li>
            <li><strong>Gemeinschaftsbeteiligung:</strong> Viele Zentren in {cityName} bieten gemeinschaftliche Bildungsprogramme an.</li>
            <li><strong>Wirtschaftliche Vorteile:</strong> Recycling schafft Arbeitsplätze und belebt die lokale Wirtschaft in {cityName}.</li>
            <li><strong>Bequemlichkeit:</strong> Mit mehreren Zentren in ganz {cityName} ist es einfach, einen passenden Standort zu finden.</li>
          </ul>
          
          <h3>Recycling-Richtlinien in {cityName}</h3>
          <p>
            Beachten Sie beim Besuch von Recyclingcentern in {cityName} folgende Punkte:
          </p>
          <ul>
            <li>Sortieren Sie Ihre Recyclingmaterialien nach Materialart, bevor Sie ankommen</li>
            <li>Überprüfen Sie die Öffnungszeiten der Zentren, da diese in {cityName} unterschiedlich sein können</li>
            <li>Bringen Sie einen Nachweis über Ihren Wohnsitz in {cityName} mit, falls erforderlich (einige Zentren bieten Einwohnern Vorrang oder Rabatte)</li>
            <li>Reinigen Sie Behälter vor dem Recycling, um Kontaminationen zu vermeiden</li>
          </ul>
          
          <div className="bg-green-50 p-6 rounded-lg my-8 border border-green-200">
            <h3 className="flex items-center text-green-800">
              <Shield className="w-5 h-5 mr-2" /> Wussten Sie schon?
            </h3>
            <p>
              {cityName} hat eine Recyclingquote von über 65%, was deutlich über dem nationalen Durchschnitt liegt. 
              Die Stadt investiert kontinuierlich in moderne Recyclingtechnologien und Bildungsprogramme, 
              um diese Quote weiter zu verbessern und eine nachhaltigere Zukunft zu fördern.
            </p>
          </div>
          
          <p>
            Durchsuchen Sie unsere umfassende Liste der Recyclingcenter in {cityName} oben, 
            um die perfekte Einrichtung für Ihre spezifischen Recyclingbedürfnisse zu finden.
          </p>
        </div>
      </div>
    </>
  );
} 