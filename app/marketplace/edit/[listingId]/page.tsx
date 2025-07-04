import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/options';
import { prisma } from '@/lib/db/prisma'; // Direct Prisma access for Server Component
import ListingForm from '@/components/marketplace/ListingForm';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { z } from 'zod';

// Function to fetch listing data (can be colocated or moved to lib)
async function getListingData(listingId: string) {
    if (!z.string().cuid().safeParse(listingId).success) {
        notFound(); // Invalid ID format
    }
    try {
        const listing = await prisma.marketplaceListing.findUnique({
            where: { id: listingId },
             // Select fields needed by the form
             select: {
                id: true,
                title: true,
                description: true,
                quantity: true,
                unit: true,
                location: true,
                material_id: true,
                type: true,
                image_url: true,
                seller_id: true, // Needed for authorization
            }
        });
        if (!listing) {
            notFound(); // Listing does not exist
        }
        return listing;
    } catch (error) {
        console.error("Failed to fetch listing for edit:", error);
        // Consider throwing an error or returning null to show a generic error page
        notFound(); 
    }
}

// Define the expected shape of the listing data for the form
// Should align with ListingForm's initialData expectations (adapt ListingForm if needed)
type ListingEditData = NonNullable<Awaited<ReturnType<typeof getListingData>>>;

interface EditListingPageProps {
  params: { listingId: string };
}

export default async function EditListingPage({ params }: EditListingPageProps) {
    const { listingId } = params;
    const session = await getServerSession(authOptions);
    
    // 1. Authentication Check
    if (!session?.user?.id) {
        redirect(`/login?callbackUrl=/marketplace/edit/${listingId}`);
    }

    // 2. Fetch Listing Data
    const listingData = await getListingData(listingId);

    // 3. Authorization Check (User must be seller or admin)
    const isOwner = listingData.seller_id === session.user.id;
    const isAdmin = session.user.isAdmin; // Ensure isAdmin is in your session type

    if (!isOwner && !isAdmin) {
        // Redirect or show a forbidden page (redirecting to marketplace for now)
        console.warn(`User ${session.user.id} attempted to edit listing ${listingId} without permission.`);
        redirect('/marketplace?error=forbidden');
    }

    // Prepare initialData for the form (map Prisma types if necessary)
    // Ensure ListingForm can accept this structure
    const initialFormData = {
        ...listingData,
        quantity: listingData.quantity ?? undefined,
        material_id: listingData.material_id ?? undefined,
        imageUrl: listingData.image_url ?? undefined, // Pass existing image URL
        // imageFile will be handled separately by the form itself
    };

  return (
    <div className="container mx-auto px-4 py-12">
        {/* Back Link */}
        <Link 
            href={`/marketplace/listings/${listingId}`} 
            className="mb-8 inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 group"
        >
            <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform duration-200"/> Zurück zum Angebot
        </Link>
        {/* Pass listing ID and initial data to the form */}
        <ListingForm 
            listingId={listingId} // Pass listingId for PATCH request URL
            initialData={initialFormData} // Pass fetched data
        />
    </div>
  );
} 