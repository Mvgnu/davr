// Server component for recycling center detail page
import { Suspense } from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import RecyclingCenterDetailContent, { RecyclingCenterDetailType } from '@/components/recycling-centers/RecyclingCenterDetailContent';
import { getRecyclingCenterBySlug } from '@/lib/data/recycling-centers';
import { getMaterialOffersByRecyclingCenterId } from '@/lib/data/recycling-centers';
import DetailSkeleton from '@/components/recycling-centers/DetailSkeleton';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/index';
import { notFound } from 'next/navigation';

// Define type for opening hours
interface OpeningHour {
  day: string;
  open: string;
  close: string;
}

// Generate metadata for the recycling center page based on slug
export async function generateMetadata({ 
  params 
}: { 
  params: { city: string; slug: string } 
}): Promise<Metadata> {
  try {
    // Format city name from slug
    const cityName = params.city
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    // Fetch the recycling center data
    const recyclingCenter = await getRecyclingCenterBySlug(params.slug);
    
    if (!recyclingCenter) {
      return {
        title: `Recyclingcenter nicht gefunden | ${cityName}`,
        description: `Leider konnte das gesuchte Recyclingcenter in ${cityName} nicht gefunden werden.`,
        robots: 'noindex, nofollow',
      };
    }
    
    // Rich structured data for SEO
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      'name': recyclingCenter.name,
      'description': recyclingCenter.description || `Recyclingcenter in ${cityName}`,
      'address': {
        '@type': 'PostalAddress',
        'addressLocality': recyclingCenter.city || cityName,
        'postalCode': recyclingCenter.postalCode,
        'streetAddress': recyclingCenter.address
      },
      'telephone': recyclingCenter.phone,
      'email': recyclingCenter.email,
      'url': recyclingCenter.website,
      'openingHours': recyclingCenter.openingHours || undefined
    };
    
    return {
      title: `${recyclingCenter.name} | Recyclingcenter in ${cityName}`,
      description: `${recyclingCenter.name} in ${cityName}. ${recyclingCenter.description || 'Informationen über akzeptierte Materialien, Öffnungszeiten und Standortdetails.'}`,
      keywords: `${recyclingCenter.name}, Recyclingcenter ${cityName}, Recyclinganlage, Abfallwirtschaft, Materialrecycling`,
      openGraph: {
        title: `${recyclingCenter.name} - Recyclingcenter in ${cityName}`,
        description: recyclingCenter.description || `Details über ${recyclingCenter.name} Recyclingcenter in ${cityName}`,
        type: 'website',
        url: `https://yourwebsite.com/recycling-centers/${params.city}/${params.slug}`,
        images: ['/images/recycling-center.jpg'],
        siteName: 'Deutsches Recycling Portal',
        locale: 'de_DE',
      },
      twitter: {
        card: 'summary_large_image',
        title: `${recyclingCenter.name} - Recyclingcenter in ${cityName}`,
        description: recyclingCenter.description || `Details über ${recyclingCenter.name}`,
        images: ['/images/recycling-center.jpg'],
      },
      alternates: {
        canonical: `https://yourwebsite.com/recycling-centers/${params.city}/${params.slug}`,
        languages: {
          'de-DE': `https://yourwebsite.com/recycling-centers/${params.city}/${params.slug}`,
        },
      },
      other: {
        'format-detection': 'telephone=no',
        structuredData: JSON.stringify(structuredData),
      }
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Recyclingcenter Details',
      description: 'Details zu einem Recyclingcenter in Deutschland.',
      robots: 'noindex, nofollow',
    };
  }
}

// Main server component
export default async function RecyclingCenterDetailPage({
  params
}: {
  params: { city: string; slug: string }
}) {
  // Get authentication session
  const session = await getServerSession(authOptions);
  
  // Format city name from slug for display
  const cityName = params.city
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  // Pre-fetch the recycling center data on the server
  let error = null;
  
  try {
    // Fetch the recycling center from the database
    const centerData = await getRecyclingCenterBySlug(params.slug);
    
    // If center doesn't exist, return 404
    if (!centerData) {
      return notFound();
    }
    
    // Get material offers if available
    const materialOffers = await getMaterialOffersByRecyclingCenterId(centerData.id);
    
    // Create a properly formatted RecyclingCenterDetailType object
    const recyclingCenter: RecyclingCenterDetailType = {
      id: centerData.id,
      name: centerData.name,
      slug: centerData.slug,
      address: centerData.address,
      location: {
        city: centerData.city,
        zipCode: centerData.postalCode,
        state: centerData.state || '',
        latitude: centerData.latitude ?? undefined,
        longitude: centerData.longitude ?? undefined
      },
      description: centerData.description || '',
      phone: centerData.phone || '',
      email: centerData.email || '',
      website: centerData.website || '',
      openingHours: centerData.openingHours 
        ? typeof centerData.openingHours === 'string' && centerData.openingHours.startsWith('{')
          ? JSON.parse(centerData.openingHours)
          : { default: centerData.openingHours }
        : {},
      materialOffers: materialOffers.map(offer => ({
        id: offer.id,
        materialId: offer.materialId,
        materialName: offer.materialName || 'Unbekanntes Material',
        category: offer.category || 'Sonstige',
        price: offer.price,
        minQuantity: offer.minQuantity,
        notes: offer.notes || undefined,
        active: offer.active
      })),
      isVerified: false,
      rating: {
        average: 0,
        count: 0
      },
      isOwner: session ? 
        (centerData.userId === session.user?.id || session.user?.role === 'ADMIN') : 
        false,
      isAdmin: session?.user?.role === 'ADMIN' || false,
      isAuthenticated: !!session
    };
    
    // Render the detail page with the data
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link 
            href={`/recycling-centers/${params.city}`}
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
            <Link href={`/recycling-centers/${params.city}`} className="hover:text-green-600">{cityName}</Link>
            <span className="mx-2">›</span>
            <span className="text-gray-700">{recyclingCenter.name}</span>
          </div>
        </div>
        
        {/* Center Detail - Use Suspense for async components */}
        <Suspense fallback={<DetailSkeleton />}>
          <RecyclingCenterDetailContent 
            recyclingCenter={recyclingCenter}
            cityName={cityName} 
            city={params.city}
            slug={params.slug}
          />
        </Suspense>
      </div>
    );
  } catch (err) {
    console.error('Error fetching recycling center:', err);
    error = 'Fehler beim Laden der Recyclingcenter-Daten. Bitte versuchen Sie es später erneut.';
    
    // Handle error state
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <div className="text-red-500 mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
              <path d="M12 9v4"></path>
              <path d="M12 17h.01"></path>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-red-600">Fehler</h1>
          <p className="mt-2 text-gray-600">{error}</p>
          <Link 
            href={`/recycling-centers/${params.city}`} 
            className="mt-6 inline-flex items-center text-green-600 hover:text-green-800 font-medium"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Zurück zu Recyclingcentern in {cityName}
          </Link>
        </div>
      </div>
    );
  }
} 