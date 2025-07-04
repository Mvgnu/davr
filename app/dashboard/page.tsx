import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth/options" // Assuming @ alias
import { redirect } from 'next/navigation';
import Link from "next/link";
import { Button } from "@/components/ui/button";
import ListingCard from "@/components/marketplace/ListingCard"; // Import the card
import { PlusCircle, LayoutDashboard, AlertTriangle, ListX } from "lucide-react"; // Added Icons

// Type matching the API response from /api/users/me/listings and ListingCard props
type UserListing = {
  id: string;
  title: string;
  description?: string | null;
  quantity?: number | null;
  unit?: string | null;
  location?: string | null;
  image_url?: string | null;
  status?: string;
  category?: string;
  created_at: string; 
  material?: { name: string } | null;
  seller: { id: string; name: string | null };
};

async function getUserListings(): Promise<UserListing[]> {
    const session = await getServerSession(authOptions); 
    if (!session?.user?.id) {
        // This should ideally not be reached if page checks session, but good practice
        throw new Error("Unauthorized");
    }

    try {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const apiUrl = `${baseUrl}/api/users/me/listings`;
        
        // Fetch using the authenticated session cookies (Next.js handles this automatically server-side)
        const res = await fetch(apiUrl, { 
             cache: 'no-store',
             // Automatically includes cookies for server-side fetches within the same app
        }); 

        if (!res.ok) {
             if (res.status === 401) throw new Error("Unauthorized to fetch listings");
            const errorBody = await res.text();
            console.error(`API Error (${apiUrl}): ${res.status} ${res.statusText}`, errorBody);
            throw new Error(`Failed to fetch listings. Status: ${res.status}`);
        }
        return await res.json();
    } catch (error) {
        console.error('[getUserListings Fetch Error]', error);
        // Re-throw the error to be caught by the page component
        throw error instanceof Error ? error : new Error('Failed to fetch data');
    }
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  // If no session exists, redirect to login
  if (!session) {
    redirect('/login?callbackUrl=/dashboard') // Redirect back here after login
  }

  let userListings: UserListing[] = [];
  let fetchError: string | null = null;

  try {
    userListings = await getUserListings();
  } catch (error) {
     fetchError = error instanceof Error ? error.message : 'An unknown error occurred while fetching your listings.';
  }

  return (
    // Enhanced Container & Header
    <div className="container mx-auto px-4 py-12 text-foreground">
      <h1 
        className="text-3xl md:text-4xl font-bold mb-8 pb-4 border-b border-border/60 animate-fade-in-up opacity-0 [--animation-delay:100ms] flex items-center"
        style={{ animationFillMode: 'forwards' }}
      >
        <LayoutDashboard className="mr-3 h-8 w-8 text-primary"/>
        Dashboard
      </h1>

      {/* Enhanced Welcome Block */}
      <div 
        className="mb-10 p-5 bg-card border border-border/60 rounded-lg shadow-sm animate-fade-in-up opacity-0 [--animation-delay:200ms]"
        style={{ animationFillMode: 'forwards' }}
      >
        <h2 className="text-xl font-semibold mb-1 text-foreground">Willkommen, {session.user?.name || 'Nutzer'}!</h2>
        <p className="text-muted-foreground text-sm">Verwalten Sie hier Ihre Marktplatz-Angebote.</p>
      </div>

      {/* Enhanced Listings Section Header */}
      <div 
        className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 animate-fade-in-up opacity-0 [--animation-delay:300ms]"
        style={{ animationFillMode: 'forwards' }}
      >
         <h2 className="text-2xl font-semibold mb-3 md:mb-0">Ihre Marktplatz-Angebote</h2>
         <Link href="/marketplace/new">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Neues Angebot erstellen
            </Button>
         </Link>
      </div>

      {/* Enhanced Error State */}
      {fetchError && (
          <div 
            className="text-center py-16 text-destructive animate-fade-in-up opacity-0 [--animation-delay:400ms]"
            style={{ animationFillMode: 'forwards' }}
          >
            <AlertTriangle className="w-16 h-16 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Fehler beim Laden Ihrer Angebote</h3>
            <p className="text-muted-foreground">{fetchError}</p>
          </div>
      )}

      {/* Enhanced Empty State */}
      {!fetchError && userListings.length === 0 && (
          <div 
            className="text-center py-20 text-muted-foreground animate-fade-in-up opacity-0 [--animation-delay:400ms]"
             style={{ animationFillMode: 'forwards' }}
          >
            <ListX className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold text-foreground mb-2">Noch keine Angebote erstellt</h3>
            <p className="mb-4">Erstellen Sie Ihr erstes Angebot auf dem Marktplatz.</p>
            <Button asChild>
              <Link href="/marketplace/new">Angebot erstellen</Link>
            </Button>
          </div>
      )}

      {/* Enhanced Listing Grid with Staggered Animation */}
      {!fetchError && userListings.length > 0 && (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userListings.map((listing, index) => (
               <div 
                key={listing.id} 
                className="animate-fade-in-up opacity-0"
                style={{ animationDelay: `${400 + index * 75}ms`, animationFillMode: 'forwards' }}
              >
                <ListingCard listing={listing} />
              </div>
            ))}
         </div>
      )}
      
    </div>
  )
} 