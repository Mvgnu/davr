import React from 'react';
import { MapPin, ShieldCheck, Star, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CenterHeroProps {
  name: string;
  city?: string | null;
  verified?: boolean;
  ratingAvg?: number | null;
  ratingCount?: number;
  onContact?: () => void;
  phone?: string | null;
  imageUrl?: string | null;
  description?: string | null;
}

export default function CenterHero({
  name,
  city,
  verified,
  ratingAvg,
  ratingCount,
  onContact,
  phone,
  imageUrl,
  description
}: CenterHeroProps) {
  return (
    <div className="mb-8">
      {imageUrl && (
        <div className="relative w-full h-64 md:h-80 rounded-lg overflow-hidden mb-6 bg-muted">
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <h1 className="text-3xl md:text-4xl font-bold mb-2 drop-shadow-lg">{name}</h1>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              {city && (
                <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-sm px-2 py-1 rounded">
                  <MapPin className="w-4 h-4" /> {city}
                </span>
              )}
              {verified && (
                <span className="inline-flex items-center gap-1 bg-emerald-500/90 backdrop-blur-sm px-2 py-1 rounded">
                  <ShieldCheck className="w-4 h-4" /> Verifiziert
                </span>
              )}
              {typeof ratingAvg === 'number' && (
                <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-sm px-2 py-1 rounded">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" /> {ratingAvg.toFixed(1)} ({ratingCount || 0})
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {!imageUrl && (
        <>
          <div className="relative w-full h-48 md:h-64 rounded-lg overflow-hidden mb-6 bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
            <Building2 className="w-24 h-24 text-green-600/30" />
          </div>
          <div className="mb-6">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">{name}</h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              {city && (
                <span className="inline-flex items-center gap-1"><MapPin className="w-4 h-4" /> {city}</span>
              )}
              {verified && (
                <span className="inline-flex items-center gap-1 text-emerald-600"><ShieldCheck className="w-4 h-4" /> Verifiziert</span>
              )}
              {typeof ratingAvg === 'number' && (
                <span className="inline-flex items-center gap-1"><Star className="w-4 h-4 text-yellow-500 fill-current" /> {ratingAvg.toFixed(1)} ({ratingCount || 0})</span>
              )}
            </div>
          </div>
        </>
      )}

      {description && (
        <p className="text-muted-foreground mb-4 leading-relaxed">{description}</p>
      )}

      <div className="flex flex-wrap gap-3">
        {onContact && <Button onClick={onContact}>Nachricht senden</Button>}
        {phone && (
          <Button variant="outline" asChild>
            <a href={`tel:${phone}`}>Anrufen</a>
          </Button>
        )}
      </div>
    </div>
  );
}


