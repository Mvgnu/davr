import React from 'react';
import ListingForm from '@/components/marketplace/ListingForm';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/options'; // Adjust if your authOptions path is different
import { redirect } from 'next/navigation';

export default async function NewListingPage() {
  // Add server-side authentication check
  const session = await getServerSession(authOptions);
  // Redirect to login if not authenticated, preserving the intended destination
  if (!session?.user?.id) { 
    redirect('/login?callbackUrl=/marketplace/new'); 
  }

  return (
    <div className="container mx-auto px-4 py-12">
       {/* Back Link */}
        <Link href="/marketplace" className="mb-8 inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 group">
            <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform duration-200"/> Zurück zum Marktplatz
        </Link>
      <ListingForm />
    </div>
  );
} 