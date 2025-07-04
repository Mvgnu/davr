import React from 'react';
import { Metadata } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/options';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import PaginationControls from '@/components/ui/PaginationControls'; // Reusable pagination
import AdminListingActionsCell from '@/components/admin/AdminListingActionsCell'; // Action cell component

export const metadata: Metadata = {
  title: 'Anzeigenverwaltung | Admin Dashboard | DAVR',
  description: 'Verwalten Sie Marktplatzanzeigen auf der DAVR-Plattform.',
};

// Type for Listing data including relations
type AdminListing = {
  id: string;
  title: string;
  description: string | null;
  quantity: number | null;
  unit: string | null;
  location: string | null;
  is_active: boolean;
  created_at: Date | string;
  updated_at: Date | string;
  image_url: string | null;
  seller: {
    id: string;
    email: string | null;
    name: string | null;
  };
  material: {
    id: string;
    name: string;
  } | null;
};

type PaginatedResponse = {
  listings: AdminListing[];
  pagination: {
    currentPage: number;
    totalPages: number;
    pageSize: number;
    totalItems: number;
  };
};

// Fetch function to get listings from the admin API
async function getListings(page: number = 1, limit: number = 10): Promise<{ data?: PaginatedResponse; error?: string }> {
  const apiUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/admin/listings?page=${page}&limit=${limit}`;
  try {
    // Server-side fetch automatically includes necessary cookies for auth
    const response = await fetch(apiUrl, { cache: 'no-store' });

    if (response.status === 403) {
        return { error: 'Forbidden: You do not have permission to view these listings.' };
    }
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API Error (${response.status}): ${errorData.error || response.statusText}`);
    }
    const data: PaginatedResponse = await response.json();
    return { data };

  } catch (error) {
    console.error("Error fetching admin listings:", error);
    return { error: error instanceof Error ? error.message : 'An unknown error occurred' };
  }
}

// Page Props including searchParams for pagination
interface AdminListingsPageProps {
  searchParams?: { [key: string]: string | string[] | undefined };
}

// Admin Listings Management Page Component
export default async function AdminListingsPage({ searchParams }: AdminListingsPageProps) {
  const page = parseInt(searchParams?.page as string || '1', 10);
  const limit = parseInt(searchParams?.limit as string || '10', 10);

  const result = await getListings(page, limit);

  // Handle Error State
  if (result.error) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-4">Marketplace Listings Management</h1>
        <div className="flex items-center p-4 bg-red-100 border border-red-300 rounded-md text-red-700">
          <AlertCircle className="w-5 h-5 mr-2" />
          <p>Error loading listings: {result.error}</p>
        </div>
      </div>
    );
  }

  const listings = result.data?.listings ?? [];
  const pagination = result.data?.pagination;

  // Handle No Listings State
  if (listings.length === 0) {
    return (
        <div>
            <h1 className="text-2xl font-bold mb-4">Marketplace Listings Management</h1>
            <p className="text-gray-500">No marketplace listings found.</p>
            {/* Optionally add a link back to admin dashboard or another relevant page */} 
        </div>
    );
  }

  // Render Listings Table
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Marketplace Listings Management</h1>
      <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Seller</TableHead>
                <TableHead>Material</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {listings.map((listing) => (
                <TableRow key={listing.id}>
                  <TableCell className="font-medium">{listing.title}</TableCell>
                  <TableCell>{listing.seller?.email ?? listing.seller?.name ?? <span className="text-gray-400 italic">N/A</span>}</TableCell>
                  <TableCell>{listing.material?.name ?? <span className="text-gray-400 italic">N/A</span>}</TableCell>
                  <TableCell>{listing.location ?? <span className="text-gray-400 italic">N/A</span>}</TableCell>
                  <TableCell>
                    {listing.is_active ? (
                      <Badge variant="default">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell>{format(new Date(listing.created_at), 'PP')}</TableCell>
                  <TableCell>
                    <AdminListingActionsCell listingId={listing.id} listingTitle={listing.title} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
      </div>

      {/* Pagination Controls */}
      {pagination && pagination.totalPages > 1 && (
        <PaginationControls
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          baseUrl="/admin/listings"
          // Pass existing search params if needed in the future
        />
      )}
    </div>
  );
} 