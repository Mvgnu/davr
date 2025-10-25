'use client';

import React, { useState } from 'react';
import { MapPin, Phone, Globe, Package, ArrowLeft, ExternalLink, ShieldCheck, Mail } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import CenterHero from '@/components/recycling-centers/CenterHero';
import ReviewsSection from '@/components/recycling-centers/ReviewsSection';
import { OpeningHours } from '@/components/recycling-centers/OpeningHours';
import { MaterialsList } from '@/components/recycling-centers/MaterialsList';
import { NearbyCentersSection } from '@/components/recycling-centers/NearbyCentersSection';
import dynamic from 'next/dynamic';
import { useSession } from 'next-auth/react';
import { ClaimOwnershipForm } from '@/components/recycling-centers/ClaimOwnershipForm';
import ContactCenterModal from '@/components/recycling-centers/ContactCenterModal';

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
    image_url: string | null;
  };
};

type WorkingHour = {
  day_of_week: string;
  open_time: string;
  close_time: string;
  is_closed: boolean;
};

type NearbyCenter = {
  id: string;
  name: string;
  slug: string | null;
  city: string | null;
  latitude: number;
  longitude: number;
  image_url: string | null;
  distance: number;
  _count: {
    offers: number;
  };
};

type CenterDetail = {
  id: string;
  name: string;
  description?: string | null;
  address_street?: string | null;
  city?: string | null;
  postal_code?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  phone_number?: string | null;
  website?: string | null;
  email?: string | null;
  slug?: string | null;
  image_url?: string | null;
  offers: MaterialOffer[];
  working_hours?: WorkingHour[];
  nearbyCenters?: NearbyCenter[];
  managedById?: string | null;
  verification_status?: 'PENDING' | 'VERIFIED' | 'REJECTED' | null;
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
  const [isContactOpen, setIsContactOpen] = useState(false);

  return (
    <div className="container mx-auto px-4 py-12 text-foreground">
      <Link href="/recycling-centers" className="mb-8 inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 group">
          <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform duration-200"/> Zurück zur Übersicht
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <div className="bg-card text-card-foreground border border-border/60 rounded-lg shadow-lg overflow-hidden">
            <div className="p-6 md:p-8">
              <CenterHero
                name={center.name}
                city={center.city}
                verified={center.verification_status === 'VERIFIED'}
                ratingAvg={null}
                ratingCount={undefined}
                onContact={() => setIsContactOpen(true)}
                phone={center.phone_number}
                imageUrl={center.image_url}
                description={center.description}
              />

              <div className="flex items-start mb-8">
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

              {center.offers && center.offers.length > 0 && (
                <div className="mb-8" id="materials">
                  <h2 className="text-2xl font-semibold mb-5 flex items-center text-foreground">
                    <Package className="w-6 h-6 mr-2.5 text-accent"/> Akzeptierte Materialien & Preise
                  </h2>
                  <MaterialsList
                    offers={center.offers}
                    centerSlug={center.slug || slug}
                    centerLatitude={center.latitude}
                    centerLongitude={center.longitude}
                  />
                </div>
              )}

              {center.latitude && center.longitude && (
                <div className="mt-8" id="map">
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

          {center.nearbyCenters && center.nearbyCenters.length > 0 && (
            <div className="mt-8">
              <NearbyCentersSection
                centers={center.nearbyCenters}
                currentCenterName={center.name}
              />
            </div>
          )}

          <ReviewsSection centerSlug={slug} centerName={center.name} />
        </div>

        <div className="space-y-4 md:sticky md:top-20 h-fit">
          {center.working_hours && center.working_hours.length > 0 && (
            <OpeningHours hours={center.working_hours} />
          )}

          <Card>
            <CardHeader>
              <div className="text-sm font-semibold">Kontakt</div>
            </CardHeader>
            <CardContent className="p-4 space-y-2">
              {center.phone_number ? (
                <div className="flex items-center text-sm">
                  <Phone className="w-4 h-4 mr-2 text-muted-foreground" />
                  <a href={`tel:${center.phone_number}`} className="hover:underline">{center.phone_number}</a>
                </div>
              ) : (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Phone className="w-4 h-4 mr-2" /> Keine Telefonnummer
                </div>
              )}
              {center.email ? (
                <div className="flex items-center text-sm">
                  <Mail className="w-4 h-4 mr-2 text-muted-foreground" />
                  <a href={`mailto:${center.email}`} className="hover:underline break-all">{center.email}</a>
                </div>
              ) : (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Mail className="w-4 h-4 mr-2" /> Keine E-Mail
                </div>
              )}
              {center.website ? (
                <div className="flex items-center text-sm">
                  <Globe className="w-4 h-4 mr-2 text-muted-foreground" />
                  <a href={center.website} target="_blank" rel="noopener noreferrer" className="hover:underline break-all inline-flex items-center">
                    {center.website}
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </div>
              ) : (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Globe className="w-4 h-4 mr-2" /> Keine Website
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="text-sm font-semibold">Adresse</div>
            </CardHeader>
            <CardContent className="p-4 space-y-1 text-sm">
              <div className="flex">
                <MapPin className="w-4 h-4 mr-2 mt-0.5 text-muted-foreground" />
                <div>
                  <div>{center.address_street || 'Adresse nicht angegeben'}</div>
                  <div className="text-muted-foreground">{center.postal_code} {center.city}</div>
                </div>
              </div>
              {center.latitude && center.longitude && (
                <div className="pt-2">
                  <a href="#map" className="text-primary hover:underline text-sm">Zur Karte springen</a>
                </div>
              )}
            </CardContent>
          </Card>

          {session?.user && !center.managedById && (
            <Card>
              <CardHeader>
                <div className="text-sm font-semibold">Verifizierung</div>
              </CardHeader>
              <CardContent className="p-4">
                <Button variant="outline" size="sm" className="w-full" onClick={() => setIsClaimModalOpen(true)}>
                  <ShieldCheck className="mr-2 h-4 w-4" /> Diesen Eintrag beanspruchen
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <ClaimOwnershipForm
        centerId={center.id}
        centerName={center.name}
        isOpen={isClaimModalOpen}
        onOpenChange={setIsClaimModalOpen}
      />
      <ContactCenterModal
        isOpen={isContactOpen}
        onOpenChange={setIsContactOpen}
        centerId={center.id}
        recipientUserId={center.managedById || undefined}
        centerName={center.name}
      />
    </div>
  );
} 