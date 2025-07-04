import React from 'react'
import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/index'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { User, Mail, MapPin, Phone, Building, ArrowLeft, Save, AlertCircle, Settings, Package, Star, ShoppingBag, Heart, LogOut, Edit, Camera } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import ProfileContent from '@/components/profile/ProfileContent'
import { getUserProfile } from '@/lib/data/user'
import { formatDate } from '@/lib/utils/dateUtils'

// Assume UserListing type exists or import it if available elsewhere
type UserListing = {
  id: string;
  title: string;
  description?: string | null;
  quantity?: number | null;
  unit?: string | null;
  location?: string | null;
  created_at: string; 
  image_url?: string | null; // Add image_url if ListingCard needs it
  status?: string; // Add status if ListingCard needs it
  material?: { name: string } | null;
  seller: { id: string; name: string | null }; // Keep seller if needed by card, though redundant here
};

export const metadata: Metadata = {
  title: 'Mein Profil | DAVR',
  description: 'Verwalten Sie Ihr DAVR-Konto, Ihre Angebote und Einstellungen.',
}

export default async function ProfilePage() {
  console.log("Rendering ProfilePage");
  
  // Server-side authentication check
  const session = await getServerSession(authOptions);
  console.log("Session:", session ? "Found" : "Not found");
  
  if (!session?.user) {
    console.log("No session, redirecting to login");
    return redirect('/auth/login?callbackUrl=/profile');
  }
  
  let userData: any = null; // Use a more specific type if available
  let userListings: UserListing[] = [];
  let profileError: string | null = null;
  let listingsError: string | null = null;

  try {
    // Fetch profile data
    console.log("Fetching user profile for ID:", session.user.id);
    userData = await getUserProfile(session.user.id);
    
    if (!userData) {
      console.log("User data not found, redirecting to login");
      return redirect('/auth/login?error=UserNotFound');
    }
    
    console.log("User data found");

    // Fetch listings using the API route (similar to dashboard)
    try {
        console.log("Fetching user listings for ID:", session.user.id);
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const apiUrl = `${baseUrl}/api/users/me/listings`;
        const res = await fetch(apiUrl, { cache: 'no-store' }); // Use fetch directly

        if (!res.ok) {
            const errorBody = await res.text();
            console.error(`API Error (${apiUrl}): ${res.status} ${res.statusText}`, errorBody);
            throw new Error(`Failed to fetch listings. Status: ${res.status}`);
        }
        userListings = await res.json();
        console.log(`Found ${userListings.length} listings`);

    } catch (error) {
        console.error('[ProfilePage Listings Fetch Error]', error);
        listingsError = error instanceof Error ? error.message : 'Failed to fetch listings';
        // Don't throw here, allow page to render with profile data even if listings fail
    }
    
    console.log("Rendering profile page");
    
    // Format the date on the server side
    const formattedCreatedAt = formatDate(new Date(userData.createdAt));
    
    // Prepare user data with preformatted dates
    const preparedUserData = {
      ...userData,
      formattedCreatedAt
    };
    
    return (
      <div className="bg-white">
        <div className="bg-gradient-to-b from-green-50 to-white py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              {/* Pass user data and listings (even if empty/error) */}
              <ProfileContent userData={preparedUserData} listings={userListings} listingsError={listingsError} />
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    // This catch block now primarily handles errors from getUserProfile
    console.error("Error fetching profile data:", error);
    profileError = error instanceof Error ? error.message : 'An unknown error occurred fetching profile data.';
    // Render error state for profile fetch failure
    return (
      <div className="bg-white p-8">
        <div className="max-w-xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Fehler beim Laden des Profils</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{profileError}</p>
            </CardContent>
            <CardFooter>
              <Link href="/">
                <Button>Zurück zur Startseite</Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }
} 