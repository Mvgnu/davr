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
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { NegotiationWorkspace } from '@/components/marketplace/deals/NegotiationWorkspace';
import { 
    ArrowLeft, 
    Edit, 
    Trash2, 
    Package, 
    MapPin, 
    Tag, 
    Calendar, 
    User, 
    Scale, 
    MessageCircle,
    Star,
    Clock,
    CheckCircle,
    Mail,
    Phone
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
// Placeholder for Delete Button with Client Logic
import DeleteListingButton from '@/components/marketplace/DeleteListingButton'; 
import { calculateUserRating } from '@/lib/utils/userRating';

// Function to fetch listing data
async function getListing(listingId: string) {
    if (!z.string().cuid().safeParse(listingId).success) {
        notFound();
    }
    try {
        const listing = await prisma.marketplaceListing.findUnique({
            where: { id: listingId },
            include: {
                material: { select: { name: true, slug: true, recyclability_percentage: true, recycling_difficulty: true } },
                seller: { select: { id: true, name: true, email: true, created_at: true } } // Fetch seller email and join date
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

    const existingNegotiation = session?.user?.id
        ? await prisma.negotiation.findFirst({
              where: {
                  listingId,
                  OR: [
                      { buyerId: session.user.id },
                      { sellerId: session.user.id },
                  ],
              },
              orderBy: { updatedAt: 'desc' },
              select: { id: true },
          })
        : null;

    // Calculate seller metrics
    const userRating = await calculateUserRating(listing.seller.id);
    
    const isOwner = session?.user?.id === listing.seller.id;
    const isAdmin = session?.user?.isAdmin;
    const canModify = isOwner || isAdmin;
    const canContact = session?.user?.id !== listing.seller.id; // Can't contact yourself

    // Format listing date
    const formattedDate = `${new Date(listing.created_at).toLocaleDateString('de-DE', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
    })} (${formatDistanceToNow(new Date(listing.created_at), { addSuffix: true, locale: de })})`;

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
             {/* Back Link */}
            <Link 
                href="/marketplace" 
                className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 group mb-6"
            >
                <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform duration-200"/> Zurück zum Marktplatz
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content - Left Column */}
                <div className="lg:col-span-2 space-y-6">
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
                            <div className="flex flex-wrap justify-between items-start gap-4">
                                <div>
                                    {listing.material && (
                                        <Badge variant="secondary" className="mb-2">
                                            {listing.material.name}
                                        </Badge>
                                    )}
                                     <CardTitle className="text-3xl font-bold">{listing.title}</CardTitle>
                                     <div className="flex items-center mt-2 gap-4">
                                         <div className="flex items-center gap-1">
                                             <User className="h-4 w-4 text-muted-foreground" />
                                             <span className="text-sm text-muted-foreground">von {listing.seller.name || 'Unbekannt'}</span>
                                         </div>
                                         <div className="flex items-center gap-1">
                                             <Calendar className="h-4 w-4 text-muted-foreground" />
                                             <span className="text-sm text-muted-foreground">{formattedDate}</span>
                                         </div>
                                     </div>
                                </div>
                                 {/* Action Buttons (Edit/Delete) - Visible only to owner/admin */}
                                 {canModify && (
                                    <div className="flex gap-2 flex-shrink-0 mt-4 sm:mt-0">
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
                                    <p className="whitespace-pre-wrap">{listing.description}</p>
                                </div>
                            )}

                            {/* Details Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 border-t border-border pt-6">
                                <DetailItem icon={Scale} label="Menge/Einheit" value={listing.quantity && listing.unit ? `${listing.quantity} ${listing.unit}` : 'Nicht angegeben'} />
                                <DetailItem icon={Tag} label="Angebotstyp" value={listing.type === 'BUY' ? 'Kaufgesuch' : 'Verkaufsangebot'} />
                                <DetailItem icon={MapPin} label="Standort" value={listing.location || 'Nicht angegeben'} />
                                <DetailItem icon={Package} label="Material" value={listing.material?.name || 'Nicht angegeben'} />
                                
                                {listing.material?.recyclability_percentage && (
                                    <DetailItem 
                                        icon={CheckCircle} 
                                        label="Recyclierbarkeit" 
                                        value={`${listing.material.recyclability_percentage}%`} 
                                    />
                                )}
                                {listing.material?.recycling_difficulty && (
                                    <DetailItem 
                                        icon={Clock} 
                                        label="Schwierigkeit" 
                                        value={listing.material.recycling_difficulty} 
                                    />
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar - Right Column */}
                <div className="space-y-6">
                    {/* Seller Profile Card */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <User className="h-5 w-5" />
                                Verkäuferprofil
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold">{listing.seller.name || 'Unbekannter Verkäufer'}</h3>
                                    <div className="flex items-center gap-1 mt-1">
                                        <div className="flex">
                                            {[...Array(5)].map((_, i) => (
                                                <Star 
                                                    key={i} 
                                                    className={`h-4 w-4 ${i < Math.floor(userRating.averageRating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
                                                />
                                            ))}
                                        </div>
                                        <span className="text-sm ml-1">
                                            {userRating.averageRating?.toFixed(1) || '0.0'} 
                                            <span className="text-muted-foreground text-xs"> ({userRating.totalReviews || 0} Bewertungen)</span>
                                        </span>
                                    </div>
                                </div>
                                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                    <span className="text-sm font-medium">
                                        {(listing.seller.name || 'U').charAt(0).toUpperCase()}
                                    </span>
                                </div>
                            </div>
                            
                            <div className="text-sm text-muted-foreground">
                                Mitglied seit {listing.seller.created_at ? new Date(listing.seller.created_at).getFullYear() : 'N/A'}
                            </div>
                            
                            {canContact && (
                                <div className="pt-4">
                                    <Link href={`/messages?recipientUserId=${listing.seller.id}`}>
                                        <Button className="w-full">
                                            <MessageCircle className="mr-2 h-4 w-4" />
                                            Nachricht senden
                                        </Button>
                                    </Link>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Contact Card */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <MessageCircle className="h-5 w-5" />
                                Kontakt
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center gap-2 text-sm">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">E-Mail:</span>
                                <span className="break-all">{listing.seller.email || 'Nicht angegeben'}</span>
                            </div>
                            
                            <div className="pt-2">
                                <Link href={`/messages?recipientUserId=${listing.seller.id}`}>
                                    <Button variant="outline" className="w-full">
                                        <MessageCircle className="mr-2 h-4 w-4" />
                                        Direkt kontaktieren
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Additional Info Card */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg">Weitere Informationen</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Erstellt am:</span>
                                    <span>{formattedDate}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Status:</span>
                                    <Badge variant={listing.status === 'ACTIVE' ? 'default' : 'secondary'}>
                                        {listing.status}
                                    </Badge>
                                </div>
                                {listing.quantity && listing.unit && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Verfügbar:</span>
                                        <span>{listing.quantity} {listing.unit}</span>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <NegotiationWorkspace
                        listingId={listing.id}
                        listingTitle={listing.title}
                        sellerId={listing.seller.id}
                        initialNegotiationId={existingNegotiation?.id ?? null}
                        currency="EUR"
                    />
                </div>
            </div>
        </div>
    );
}

// Helper component for detail items
interface DetailItemProps {
    icon: React.ElementType;
    label: string;
    value: React.ReactNode;
}

function DetailItem({ icon: Icon, label, value }: DetailItemProps) {
    return (
        <div className="flex items-start space-x-3">
            <Icon className="h-5 w-5 mt-0.5 text-muted-foreground flex-shrink-0" />
            <div>
                <p className="text-sm font-medium text-foreground">{label}</p>
                <p className="text-sm text-muted-foreground break-words">{value}</p>
            </div>
        </div>
    );
} 