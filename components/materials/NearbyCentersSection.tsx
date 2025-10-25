'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { MapPin, Building2, Phone, Globe, Mail, Navigation, Euro, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MaterialOffer {
  price_per_unit: number | null;
  unit: string | null;
  notes: string | null;
}

interface NearbyCenter {
  id: string;
  name: string;
  slug: string;
  address_street: string | null;
  city: string | null;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
  distance: number | null;
  phone_number: string | null;
  website: string | null;
  email: string | null;
  image_url: string | null;
  verification_status: string;
  review_count: number;
  material_offer: MaterialOffer | null;
}

interface NearbyCentersSectionProps {
  materialSlug: string;
  materialName: string;
}

export default function NearbyCentersSection({
  materialSlug,
  materialName,
}: NearbyCentersSectionProps) {
  const [centers, setCenters] = useState<NearbyCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    // Try to get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.log('Geolocation not available:', error);
          // Continue without location
        }
      );
    }
  }, []);

  useEffect(() => {
    async function fetchCenters() {
      try {
        let url = `/api/materials/${materialSlug}/nearby-centers?limit=5`;
        if (userLocation) {
          url += `&lat=${userLocation.lat}&lng=${userLocation.lng}`;
        }

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Failed to fetch centers');
        }

        const data = await response.json();
        setCenters(data.centers || []);
      } catch (err) {
        setError('Fehler beim Laden der Recyclinghöfe');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchCenters();
  }, [materialSlug, userLocation]);

  const formatDistance = (distance: number | null) => {
    if (!distance) return null;
    return distance < 1 ? `${Math.round(distance * 1000)} m` : `${distance.toFixed(1)} km`;
  };

  const formatPrice = (offer: MaterialOffer | null) => {
    if (!offer || offer.price_per_unit === null) return null;
    return `${offer.price_per_unit.toFixed(2)} €/${offer.unit || 'kg'}`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 md:p-8 border border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Recyclinghöfe in Ihrer Nähe
            </h2>
            <p className="text-sm text-muted-foreground">
              Diese Höfe akzeptieren {materialName}
            </p>
          </div>
        </div>
        <Link href={`/recycling-centers?material=${encodeURIComponent(materialName)}`}>
          <Button variant="outline" size="sm" className="hidden md:flex items-center gap-1">
            Alle anzeigen
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 animate-pulse">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-3" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-2" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-8 text-muted-foreground">
          {error}
        </div>
      ) : centers.length === 0 ? (
        <div className="text-center py-8">
          <Building2 className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-muted-foreground mb-4">
            Keine Recyclinghöfe gefunden, die {materialName} akzeptieren.
          </p>
          <Link href="/recycling-centers">
            <Button variant="outline" size="sm">
              Alle Recyclinghöfe durchsuchen
            </Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {centers.map((center) => (
              <Link
                key={center.id}
                href={`/recycling-centers/${center.slug}`}
                className="block border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-primary/50 hover:shadow-md transition-all duration-200 group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 mb-2 group-hover:text-primary transition-colors">
                      {center.name}
                    </h3>

                    {/* Address */}
                    {(center.address_street || center.city) && (
                      <div className="flex items-start gap-2 text-sm text-muted-foreground mb-2">
                        <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>
                          {center.address_street && <>{center.address_street}, </>}
                          {center.postal_code} {center.city}
                        </span>
                      </div>
                    )}

                    {/* Price */}
                    {center.material_offer && formatPrice(center.material_offer) && (
                      <div className="flex items-center gap-2 text-sm mb-2">
                        <Euro className="w-4 h-4 text-green-600 dark:text-green-400" />
                        <span className="font-semibold text-green-700 dark:text-green-400">
                          {formatPrice(center.material_offer)}
                        </span>
                      </div>
                    )}

                    {/* Contact Info */}
                    <div className="flex flex-wrap gap-3 mt-2">
                      {center.phone_number && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Phone className="w-3.5 h-3.5" />
                          <span>{center.phone_number}</span>
                        </div>
                      )}
                      {center.website && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Globe className="w-3.5 h-3.5" />
                          <span>Website</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Distance Badge */}
                  {center.distance !== null && (
                    <div className="flex-shrink-0">
                      <div className="px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-semibold flex items-center gap-1.5">
                        <Navigation className="w-3.5 h-3.5" />
                        {formatDistance(center.distance)}
                      </div>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>

          {/* View All Link (Mobile) */}
          <div className="mt-6 md:hidden">
            <Link href={`/recycling-centers?material=${encodeURIComponent(materialName)}`}>
              <Button variant="outline" className="w-full">
                Alle Recyclinghöfe anzeigen
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
