'use client'; // Convert to client component for state and interaction

import React, { useState, useEffect } from 'react'; // Import useState, useEffect
import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth'; // Keep for server-side fetch if needed
import { authOptions } from '@/lib/auth/options';
import { prisma } from '@/lib/db/prisma'; // Keep for server-side fetch
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import { useSession } from 'next-auth/react'; // Use client session hook

// Define types for data passed to client component
type Material = {
    id: string;
    name: string;
    slug: string;
}
type OfferWithMaterial = {
    id: string;
    price_per_unit: number | null;
    unit: string | null;
    notes: string | null;
    material: Material;
}
type CenterManagementData = {
    id: string;
    name: string;
    slug: string;
    offers: OfferWithMaterial[];
}

interface ManageCenterClientProps {
    initialCenterData: CenterManagementData | null; // Pass fetched data
    slug: string; // Pass slug for potential refetching or linking
}

// Async function remains for server-side data fetching
async function fetchCenterForManagement(slug: string, userId: string): Promise<CenterManagementData | null> {
    const center = await prisma.recyclingCenter.findUnique({
        where: { slug: slug, managedById: userId },
        select: {
            id: true,
            name: true,
            slug: true,
            managedById: true, // Keep for verification
            offers: {
                select: { // Select specific fields for OfferWithMaterial
                    id: true,
                    price_per_unit: true,
                    unit: true,
                    notes: true,
                    material: {
                        select: { id: true, name: true, slug: true }
                    }
                },
                orderBy: {
                    material: { name: 'asc' }
                }
            }
        }
    });
    // Remove managedById before returning to client if not needed there
    if (center) {
        const { managedById, ...rest } = center;
        return rest as CenterManagementData;
    }
    return null;
}

// Server component (default export)
export default async function ManageCenterPage({ params }: { params: { slug: string } }) {
    const { slug } = params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
        return redirect(`/login?callbackUrl=/manage/center/${slug}`);
    }
    const userId = session.user.id;

    const centerData = await fetchCenterForManagement(slug, userId);

    // Pass fetched data (or null if unauthorized/not found) to the client component
    return <ManageCenterClient initialCenterData={centerData} slug={slug} />;
}

// Client component for handling UI and state
function ManageCenterClient({ initialCenterData, slug }: ManageCenterClientProps) {
    const { data: session, status } = useSession(); // Still useful for loading states
    const [center, setCenter] = useState<CenterManagementData | null>(initialCenterData);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Handle case where initial fetch failed (user not authorized or center not found)
    if (!center) {
         return (
            <div className="container mx-auto px-4 py-12">
                <div className="max-w-md mx-auto text-center p-8 border rounded-lg shadow-md bg-card">
                    <AlertTriangle className="w-12 h-12 mx-auto text-destructive mb-4" />
                    <h1 className="text-2xl font-bold mb-2 text-destructive">Zugriff verweigert</h1>
                    <p className="text-muted-foreground mb-6">
                        Entweder existiert der Recyclinghof unter dem Slug "{slug}" nicht, oder Sie sind nicht berechtigt, ihn zu verwalten.
                    </p>
                    <Button asChild>
                        <Link href="/">Zur Startseite</Link>
                    </Button>
                </div>
            </div>
        );
    }

    // TODO: Add functions to handle Add/Edit/Delete API calls and update state
    const handleAddOffer = async (/* offer data */) => { /* ... */ };
    const handleUpdateOffer = async (/* offerId, offer data */) => { /* ... */ };
    const handleDeleteOffer = async (/* offerId */) => { /* ... */ };

    return (
        <div className="container mx-auto px-4 py-12">
            <Link href={`/recycling-centers/${center.slug}`} className="mb-6 inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 group">
                <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform duration-200"/> Zurück zu "{center.name}"
            </Link>
            <h1 className="text-3xl font-bold mb-8">Verwaltung: {center.name}</h1>

            {/* Offer Management UI Container */}
            <div className="p-6 border rounded-lg bg-card shadow space-y-6">
                <h2 className="text-xl font-semibold">Angebote verwalten</h2>
                
                {/* TODO: Add Offer Form Component */}
                <div>
                     <h3 className="font-medium mb-2">Neues Angebot hinzufügen</h3>
                     {/* Placeholder for AddOfferForm */}
                     <div className="p-4 border rounded bg-muted/50 text-sm text-muted-foreground">Add Offer Form Placeholder</div>
                </div>

                {/* TODO: Add Offer List Component */}
                <div>
                     <h3 className="font-medium mb-2">Aktuelle Angebote ({center.offers.length})</h3>
                     {/* Placeholder for OfferList */}
                      {center.offers.length === 0 ? (
                         <p className="text-sm text-muted-foreground italic">Noch keine Angebote hinzugefügt.</p>
                      ) : (
                         <div className="space-y-2">
                           {center.offers.map(offer => (
                              <div key={offer.id} className="p-3 border rounded bg-muted/50 flex justify-between items-center">
                                 <span>{offer.material.name} - {offer.price_per_unit ? `${offer.price_per_unit}€/${offer.unit}` : 'Kein Preis'}</span>
                                 {/* Placeholder buttons */}
                                 <div className="space-x-2">
                                    <Button variant="ghost" size="sm">Bearbeiten</Button>
                                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">Löschen</Button>
                                 </div>
                              </div>
                           ))}
                        </div>
                     )}
                </div>
            </div>
        </div>
    );
} 