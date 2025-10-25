'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Package, Tag, DollarSign, Info, ArrowRight, Search, ChevronDown, ChevronUp, TrendingUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface MaterialOffer {
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
}

interface MaterialsListProps {
  offers: MaterialOffer[];
  centerSlug: string;
  centerLatitude?: number | null;
  centerLongitude?: number | null;
}

export function MaterialsList({ offers, centerSlug, centerLatitude, centerLongitude }: MaterialsListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  if (!offers || offers.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>Keine Materialinformationen verfügbar</p>
      </div>
    );
  }

  const filteredOffers = offers.filter((offer) =>
    offer.material.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const displayedOffers = isExpanded ? filteredOffers : filteredOffers.slice(0, 3);
  const hasMore = filteredOffers.length > 3;

  const buildComparePricesUrl = (materialSlug: string) => {
    if (!centerLatitude || !centerLongitude) {
      return `/recycling-centers?material=${materialSlug}`;
    }
    return `/recycling-centers?material=${materialSlug}&lat=${centerLatitude}&lng=${centerLongitude}&radius=30`;
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Materialien durchsuchen..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {filteredOffers.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>Keine Materialien gefunden für "{searchQuery}"</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {displayedOffers.map((offer) => (
              <div
                key={offer.material.id}
                className="p-4 border rounded-lg bg-card hover:shadow-md transition-all duration-200 group"
              >
                <div className="flex items-start gap-3">
                  {offer.material.image_url && (
                    <div className="w-16 h-16 rounded-md overflow-hidden flex-shrink-0 bg-muted">
                      <img
                        src={offer.material.image_url}
                        alt={offer.material.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <Link
                        href={`/materials/${offer.material.slug}`}
                        className="group-hover:text-primary transition-colors"
                      >
                        <h3 className="flex items-center font-semibold text-foreground">
                          <Tag className="w-4 h-4 mr-2 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                          <span className="truncate">{offer.material.name}</span>
                          <ArrowRight className="w-4 h-4 ml-1.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200 flex-shrink-0" />
                        </h3>
                      </Link>

                      {offer.price_per_unit !== null && offer.unit && (
                        <div className="flex items-center text-green-600 font-semibold text-sm flex-shrink-0">
                          <DollarSign className="w-4 h-4 mr-0.5" />
                          <span>{offer.price_per_unit}€/{offer.unit}</span>
                        </div>
                      )}
                    </div>

                    {offer.material.description && (
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {offer.material.description}
                      </p>
                    )}

                    {offer.notes && (
                      <div className="flex items-start text-sm text-muted-foreground mb-2">
                        <Info className="w-4 h-4 mr-1.5 mt-0.5 flex-shrink-0" />
                        <span className="italic">{offer.notes}</span>
                      </div>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs mt-2"
                      asChild
                    >
                      <Link href={buildComparePricesUrl(offer.material.slug)}>
                        <TrendingUp className="w-3 h-3 mr-1.5" />
                        Preise vergleichen
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {hasMore && !searchQuery && (
            <div className="text-center pt-2">
              <Button
                variant="outline"
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full sm:w-auto"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="w-4 h-4 mr-2" />
                    Weniger anzeigen
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 mr-2" />
                    Alle {filteredOffers.length} Materialien anzeigen
                  </>
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
} 