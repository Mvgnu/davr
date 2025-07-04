'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, ExternalLink, ShieldCheck, ShieldAlert, ShieldQuestion, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from "@/components/ui/badge";

// Type definition adjusted based on search results
type DisplayRecyclingCenter = {
    id: string;
    name: string;
    slug?: string | null;
    address_street?: string | null;
    city?: string | null;
    postal_code?: string | null;
    website?: string | null;
    verification_status?: 'pending' | 'verified' | 'rejected' | null;
    image_url?: string | null;
    rating?: number | null;
    distance?: number | null;
};

type RecyclingCenterCardProps = {
  center: DisplayRecyclingCenter;
};

// Helper function to get badge variant and icon based on status
const getStatusProps = (status: 'pending' | 'verified' | 'rejected' | null | undefined) => {
    switch (status) {
        case 'verified':
            return { variant: 'secondary' as const, Icon: ShieldCheck, text: 'Verified' }; 
        case 'pending':
            return { variant: 'secondary' as const, Icon: ShieldAlert, text: 'Pending' }; 
        case 'rejected':
             return { variant: 'destructive' as const, Icon: ShieldAlert, text: 'Rejected' };
        default:
            return { variant: 'secondary' as const, Icon: ShieldQuestion, text: 'Unverified' };
    }
};

export default function RecyclingCenterCard({ center }: RecyclingCenterCardProps) {
  const { variant: statusVariant, Icon: StatusIcon, text: statusText } = getStatusProps(center.verification_status);
  const placeholderImage = '/images/placeholder/recycling-center.jpg';

  return (
    <Link 
        href={center.slug ? `/recycling-centers/${center.slug}` : '#'} 
        className={`group block h-full ${!center.slug ? 'cursor-default' : ''}`}
    >
        <Card 
            className="h-full transition-all duration-300 group hover:shadow-md hover:translate-y-[-1px] overflow-hidden flex flex-col"
            material="paper" // Example material texture
        >
            <div className="relative w-full aspect-[16/10] overflow-hidden">
                <Image
                    src={center.image_url || placeholderImage}
                    alt={center.name || 'Recycling Center'}
                    fill
                    className="object-cover transition-transform duration-500 ease-in-out group-hover:scale-105"
                    sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 30vw"
                />
                <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5 z-10">
                    <Badge variant={statusVariant} className="text-xs backdrop-blur-sm bg-card/80">
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusText}
                    </Badge>
                    {center.distance !== null && center.distance !== undefined && (
                        <Badge variant="outline" className="text-xs backdrop-blur-sm bg-card/80">
                            {center.distance.toFixed(1)} km
                        </Badge>
                    )}
                </div>
            </div>

            <CardContent className="p-5 flex flex-col flex-grow">
                <h3 className="mb-2 text-lg font-semibold text-foreground group-hover:text-primary transition-colors duration-200 line-clamp-2">
                    {center.name}
                </h3>
                
                <div className="flex items-start mb-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-accent/80" />
                    <span className="line-clamp-2">
                        {center.address_street && `${center.address_street}, `}
                        {center.postal_code && `${center.postal_code} `}
                        {center.city || 'Standort nicht angegeben'}
                    </span>
                </div>

                {/* Rating could be added here if data is available */}
                {/* <div className="flex items-center mt-2"> ... rating logic ... </div> */}
                
                <div className="mt-auto pt-4 flex justify-between items-center">
                     {center.website && (
                      <a 
                        href={center.website} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center text-xs text-muted-foreground hover:text-primary transition-colors duration-200 group/link"
                      >
                        <ExternalLink className="w-3 h-3 mr-1 group-hover/link:text-primary transition-colors" />
                        Webseite
                      </a>
                    )}
                    <span className="flex items-center text-sm text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-in-out">
                        Details <ArrowRight className="w-4 h-4 ml-1 transform transition-transform duration-300 group-hover:translate-x-1" />
                    </span>
                </div>
            </CardContent>
        </Card>
    </Link>
  );
} 