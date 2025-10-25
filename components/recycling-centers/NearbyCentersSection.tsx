import Link from 'next/link';
import { MapPin, Building2, Package, Navigation } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface NearbyCenter {
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
}

interface NearbyCentersSectionProps {
  centers: NearbyCenter[];
  currentCenterName: string;
}

export function NearbyCentersSection({ centers, currentCenterName }: NearbyCentersSectionProps) {
  if (!centers || centers.length === 0) {
    return null;
  }

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-semibold mb-5 flex items-center text-foreground">
        <Navigation className="w-6 h-6 mr-2.5 text-accent" />
        Recyclingzentren in der Nahe
      </h2>
      <p className="text-sm text-muted-foreground mb-6">
        Weitere Zentren im Umkreis von 30km fur Preisvergleiche
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {centers.map((center) => (
          <Card key={center.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex gap-3">
                {center.image_url ? (
                  <div className="w-20 h-20 rounded-md overflow-hidden flex-shrink-0 bg-muted">
                    <img
                      src={center.image_url}
                      alt={center.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-md flex-shrink-0 bg-muted flex items-center justify-center">
                    <Building2 className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <Link
                    href={`/recycling-centers/${center.slug}`}
                    className="font-semibold text-foreground hover:text-primary transition-colors line-clamp-1 block mb-1"
                  >
                    {center.name}
                  </Link>

                  <div className="flex items-center text-sm text-muted-foreground mb-2">
                    <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">{center.city}</span>
                    <span className="mx-2">•</span>
                    <span className="font-medium text-green-600">
                      {center.distance} km
                    </span>
                  </div>

                  <div className="flex items-center text-sm text-muted-foreground">
                    <Package className="w-3 h-3 mr-1" />
                    <span>
                      {center._count.offers} Material{center._count.offers !== 1 ? 'ien' : ''}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t">
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href={`/recycling-centers/${center.slug}`}>
                    Details ansehen
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
