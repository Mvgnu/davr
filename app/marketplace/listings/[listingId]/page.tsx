import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/options';
import { z } from 'zod';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Edit, Trash2, Package, MapPin, Tag, Calendar, User, Scale } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
// Placeholder for Delete Button with Client Logic
import DeleteListingButton from '@/components/marketplace/DeleteListingButton'; 

// Function to fetch listing data
async function getListing(listingId: string) {
    if (!z.string().cuid().safeParse(listingId).success) {
        notFound();
    }
    try {
        const listing = await prisma.marketplaceListing.findUnique({
            where: { id: listingId },
            include: {
                material: { select: { name: true, slug: true } },
                seller: { select: { id: true, name: true, email: true } } // Fetch seller email
            }
        });
        if (!listing) {
            notFound();
        }
        // Can add status check here if needed (e.g., only show ACTIVE unless owner/admin)
        return listing;
    } catch (error) {
        console.error("Failed to fetch listing details:", error);
        notFound();
    }
}

interface ListingDetailPageProps {
    params: { listingId: string };
}

export default async function ListingDetailPage({ params }: ListingDetailPageProps) {
    const { listingId } = params;
    const listing = await getListing(listingId);
    const session = await getServerSession(authOptions);

    const isOwner = session?.user?.id === listing.seller.id;
    const isAdmin = session?.user?.isAdmin;
    const canModify = isOwner || isAdmin;

    return (
        <div className="container mx-auto px-4 py-12">
             {/* Back Link */}
            <Link 
                href="/marketplace" 
                className="mb-8 inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 group"
            >
                <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform duration-200"/> Zurück zum Marktplatz
            </Link>

            <Card className="overflow-hidden">
                 {/* Image Header */}
                 <div className="relative w-full h-64 md:h-96 bg-muted">
                    {listing.image_url ? (
                        <Image 
                            src={listing.image_url}
                            alt={listing.title}
                            fill
                            style={{ objectFit: 'cover' }}
                            priority // Prioritize loading the main image
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-secondary/50">
                            <Package className="w-24 h-24 text-muted-foreground/50" />
                        </div>
                    )}
                </div>

                <CardHeader className="pb-4">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                        <div>
                            {listing.material && (
                                <Badge variant="secondary" className="mb-2">
                                    {listing.material.name}
                                </Badge>
                            )}
                             <CardTitle className="text-3xl font-bold">{listing.title}</CardTitle>
                             <p className="text-sm text-muted-foreground mt-1">
                                Angeboten von <span className="font-medium text-foreground">{listing.seller.name || 'Unbekannt'}</span>
                                {` am ${new Date(listing.created_at).toLocaleDateString('de-DE')} 
                                (${formatDistanceToNow(new Date(listing.created_at), { addSuffix: true, locale: de })})`}
                             </p>
                        </div>
                         {/* Action Buttons (Edit/Delete) - Visible only to owner/admin */}
                         {canModify && (
                            <div className="flex gap-2 flex-shrink-0 mt-4 md:mt-0">
                                <Link href={`/marketplace/edit/${listing.id}`}>
                                    <Button variant="outline" size="sm">
                                        <Edit className="mr-1.5 h-4 w-4"/> Bearbeiten
                                    </Button>
                                </Link>
                                <DeleteListingButton listingId={listing.id} />
                            </div>
                        )}
                    </div>
                </CardHeader>

                <CardContent className="pt-2">
                    {listing.description && (
                        <div className="prose prose-sm max-w-none dark:prose-invert mt-4 mb-6">
                            <p>{listing.description}</p>
                        </div>
                    )}

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 border-t border-border pt-6">
                        <DetailItem icon={Scale} label="Menge/Einheit" value={listing.quantity && listing.unit ? `${listing.quantity} ${listing.unit}` : 'N/A'} />
                        <DetailItem icon={Tag} label="Typ" value={listing.type === 'BUY' ? 'Kaufgesuch' : 'Verkaufsangebot'} />
                        <DetailItem icon={MapPin} label="Standort" value={listing.location || 'N/A'} />
                        <DetailItem icon={Package} label="Material" value={listing.material?.name || 'N/A'} />
                        <DetailItem icon={User} label="Verkäufer" value={listing.seller.name || 'Unbekannt'} />
                         <DetailItem icon={Calendar} label="Erstellt" value={new Date(listing.created_at).toLocaleString('de-DE')} />
                        {/* Add more details if needed, e.g., Seller contact info if allowed */} 
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// Helper component for detail items
interface DetailItemProps {
    icon: React.ElementType;
    label: string;
    value: React.ReactNode;
}

function DetailItem({ icon, label, value }: DetailItemProps) {
    return (
        <div className="flex items-start space-x-3">
            <icon className="h-5 w-5 mt-0.5 text-muted-foreground flex-shrink-0" />
            <div>
                <p className="text-sm font-medium text-foreground">{label}</p>
                <p className="text-sm text-muted-foreground break-words">{value}</p>
            </div>
        </div>
    );
} 