'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { MapPin, Filter } from 'lucide-react';

interface MaterialsSidebarFiltersProps {
  initialQuery?: string;
  initialLocation?: string;
  initialType?: string;
}

const DEBOUNCE_MS = 300;

export default function MaterialsSidebarFilters({ initialQuery = '', initialLocation = '', initialType = 'all' }: MaterialsSidebarFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(initialQuery);
  const [location, setLocation] = useState(initialLocation);
  const [type, setType] = useState(initialType);

  // Keep local state in sync if user navigates via back/forward
  useEffect(() => {
    setQuery(searchParams.get('q') ?? '');
    setLocation(searchParams.get('location') ?? '');
    setType(searchParams.get('type') ?? 'all');
  }, [searchParams]);

  const buildUrl = useCallback((next: { q?: string; location?: string; type?: string; page?: string }) => {
    const params = new URLSearchParams();
    // Preserve existing params first
    searchParams.forEach((v, k) => {
      params.set(k, v);
    });
    // Apply incoming changes
    if (typeof next.q !== 'undefined') {
      if (next.q) params.set('q', next.q); else params.delete('q');
    }
    if (typeof next.location !== 'undefined') {
      if (next.location) params.set('location', next.location); else params.delete('location');
    }
    if (typeof next.type !== 'undefined') {
      if (next.type && next.type !== 'all') params.set('type', next.type); else params.delete('type');
    }
    // Reset page when filters change
    if (params.has('page')) params.delete('page');
    return `${pathname}?${params.toString()}`;
  }, [pathname, searchParams]);

  // Debounced push for text inputs
  useEffect(() => {
    const handle = setTimeout(() => {
      router.push(buildUrl({ q: query }));
    }, DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [query, buildUrl, router]);

  useEffect(() => {
    const handle = setTimeout(() => {
      router.push(buildUrl({ location }));
    }, DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [location, buildUrl, router]);

  // Immediate apply for type select
  useEffect(() => {
    router.push(buildUrl({ type }));
  }, [type, buildUrl, router]);

  return (
    <>
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="text-sm font-semibold">Suche & Standort</div>
          <div className="space-y-2">
            <Label htmlFor="materials-q">Suche</Label>
            <Input id="materials-q" placeholder="Material suchen..." value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="materials-location" className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" /> Standort</Label>
            <Input id="materials-location" placeholder="PLZ oder Stadt" value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="text-sm font-semibold flex items-center gap-2"><Filter className="h-4 w-4" /> Filter</div>
          <div className="space-y-2">
            <Label>Materialtyp</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue placeholder="Materialtyp" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle</SelectItem>
                <SelectItem value="metal">Metalle</SelectItem>
                <SelectItem value="plastic">Kunststoffe</SelectItem>
                <SelectItem value="paper">Papier</SelectItem>
                <SelectItem value="glass">Glas</SelectItem>
                <SelectItem value="electronics">Elektronik</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </>
  );
}


