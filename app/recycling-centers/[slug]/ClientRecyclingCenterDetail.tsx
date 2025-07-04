'use client';

import React, { useState } from 'react';
import { MapPin, Phone, Globe, Package, Tag, DollarSign, Info, ArrowLeft, ExternalLink, ArrowRight, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import ReviewsSection from '@/components/recycling-centers/ReviewsSection';
import dynamic from 'next/dynamic';
import { useSession } from 'next-auth/react';
import { ClaimOwnershipForm } from '@/components/recycling-centers/ClaimOwnershipForm';

// Dynamically import the Map component, disable SSR
const RecyclingCenterMap = dynamic(() => import('@/components/map/RecyclingCenterMap'), {
  ssr: false,
  loading: () => <div className="h-80 w-full rounded-md border border-border bg-muted flex items-center justify-center text-muted-foreground">Lade Karte...</div>
});

type MaterialOffer = {
  price_per_unit: number | null;
  unit: string | null;
  notes: string | null;
  material: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
  };
};

type CenterDetail = {
  id: string;
  name: string;
  address_street?: string | null;
  city?: string | null;
  postal_code?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  phone_number?: string | null;
  website?: string | null;
  slug?: string | null;
  offers: MaterialOffer[];
  managedById?: string | null;
};

interface ClientRecyclingCenterDetailProps {
  params: { slug: string };
  centerData: CenterDetail;
  initialSession: any;
}

export default function ClientRecyclingCenterDetail({ params, centerData, initialSession }: ClientRecyclingCenterDetailProps) {
  const { slug } = params;
  const center = centerData;
  const { data: session } = useSession();
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);

  return (
    <div className="container mx-auto px-4 py-12 text-foreground">
      {/* Enhanced Back Link */}
      <Link href="/recycling-centers" className="mb-8 inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 group">
          <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform duration-200"/> Zurück zur Übersicht
      </Link>

      {/* Center Details Card - Enhanced */}
      <div className="bg-card text-card-foreground border border-border/60 rounded-lg shadow-lg overflow-hidden">
         <div className="p-6 md:p-8">
           <h1 
             className="text-3xl md:text-4xl font-bold mb-6 animate-fade-in-up opacity-0 [--animation-delay:100ms]"
             style={{ animationFillMode: 'forwards' }}
           >
             {center.name}
           </h1>
           
           {/* Claim Button Area - Show if logged in and center is not managed */}
           {session?.user && !center.managedById && (
              <div className="mb-6">
                 <Button variant="outline" onClick={() => setIsClaimModalOpen(true)}>
                    <ShieldCheck className="mr-2 h-4 w-4" /> Diesen Eintrag beanspruchen
                 </Button>
              </div>
           )}
           
           {/* Grid for Contact/Location Info */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mb-6 pb-6 border-b border-border/60">
              {/* Address Block */}
              <div className="flex items-start">
                <MapPin className="w-5 h-5 mt-1 mr-3 flex-shrink-0 text-accent" />
                <div>
                  <p className="font-medium text-foreground">
                      {center.address_street ? `${center.address_street},` : 'Adresse nicht angegeben'}
                  </p>
                  <p className="text-muted-foreground">
                    {center.postal_code && `${center.postal_code} `}
                    {center.city}
                  </p>
                </div>
              </div>

              {/* Contact Block */}
              <div className="space-y-2">
                {center.phone_number && (
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 mr-2.5 flex-shrink-0 text-muted-foreground" />
                    <a href={`tel:${center.phone_number}`} className="text-sm text-foreground hover:text-primary transition-colors">{center.phone_number}</a>
                  </div>
                )}
                {center.website && (
                  <div className="flex items-center">
                    <Globe className="w-4 h-4 mr-2.5 flex-shrink-0 text-muted-foreground" />
                    <a href={center.website} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline break-all inline-flex items-center group/link">
                      {center.website}
                      <ExternalLink className="w-3 h-3 ml-1.5 text-muted-foreground group-hover/link:text-primary transition-colors" />
                    </a>
                  </div>
                )}
              </div>
           </div>

           {/* Accepted Materials Section - Enhanced */}
           {center.offers && center.offers.length > 0 && (
              <div 
                className="mb-8 animate-fade-in-up opacity-0 [--animation-delay:200ms]"
                style={{ animationFillMode: 'forwards' }}
                id="materials"
              >
                <h2 className="text-2xl font-semibold mb-5 flex items-center text-foreground">
                   <Package className="w-6 h-6 mr-2.5 text-accent"/> Akzeptierte Materialien & Preise
                </h2>
                <div className="space-y-3">
                  {center.offers.map((offer) => (
                    <div key={offer.material.id} className="p-4 border rounded-md bg-muted/50 border-border/80 transition-colors hover:border-primary/20">
                       {/* Material Name and Link */}
                       <Link href={`/materials/${offer.material.slug}`} className="group inline-block mb-1.5">
                          <h3 className="flex items-center font-semibold text-foreground group-hover:text-primary transition-colors">
                             <Tag className="w-4 h-4 mr-2 text-muted-foreground group-hover:text-primary transition-colors" /> 
                             {offer.material.name}
                             <ArrowRight className="w-4 h-4 ml-1.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200" />
                          </h3>
                       </Link>
                       {/* Material Description */}
                       {offer.material.description && (
                          <p className="text-sm text-muted-foreground pl-6 mb-2">{offer.material.description}</p>
                       )}
                       {/* Offer Details (Price, Notes) */}
                       <div className="pl-6 space-y-1 text-sm">
                         {(offer.price_per_unit !== null && offer.unit) && (
                           <div className="flex items-center text-accent">
                              <DollarSign className="w-4 h-4 mr-1.5 text-accent/80"/> 
                              <span className="font-medium">{offer.price_per_unit}€</span> / {offer.unit}
                           </div>
                         )}
                         {offer.notes && (
                            <div className="flex items-start text-muted-foreground">
                              <Info className="w-4 h-4 mr-1.5 mt-0.5 flex-shrink-0 text-muted-foreground/80"/> 
                              <span className="italic">{offer.notes}</span>
                            </div>
                          )}
                        </div>
                     </div>
                  ))}
                </div>
              </div>
           )}

           {/* Map Section */}
           {center.latitude && center.longitude && (
              <div 
                className="mt-8 animate-fade-in-up opacity-0 [--animation-delay:300ms]"
                style={{ animationFillMode: 'forwards' }}
              >
                  <h2 className="text-2xl font-semibold mb-4 text-foreground">Standort auf Karte</h2>
                  <RecyclingCenterMap 
                     latitude={center.latitude} 
                     longitude={center.longitude} 
                     centerName={center.name}
                     className="h-80 w-full rounded-md border border-border"
                   />
              </div>
           )}
         </div> 
      </div>
      
      {/* Reviews Section */}
      <ReviewsSection centerSlug={slug} centerName={center.name} />

      {/* Render Claim Form Modal (controlled by state) */}
      <ClaimOwnershipForm 
          centerId={center.id} 
          centerName={center.name} 
          isOpen={isClaimModalOpen} 
          onOpenChange={setIsClaimModalOpen} 
      />
    </div>
  );
} 