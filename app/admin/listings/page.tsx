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
  status: string; // Using string for status since it's an enum from Prisma
  created_at: Date | string;
  updated_at: Date | string;
  image_url: string | null;
  type: string; // BUY or SELL
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
async function getListings(
  page: number = 1, 
  limit: number = 10,
  status?: string,
  search?: string
): Promise<{ data?: PaginatedResponse; error?: string }> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(status && { status }),
    ...(search && { search }),
  });
  
  const apiUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/admin/marketplace/listings?${params.toString()}`;
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
    const data: any = await response.json(); // Using any for now since the response format might be different
    
    // Transform the response to match our expected format
    return { 
      data: {
        listings: data.listings,
        pagination: data.pagination
      } 
    };

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
  const statusFilter = searchParams?.status as string || '';
  const searchFilter = searchParams?.search as string || '';

  // Build query string with filters
  const queryString = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(statusFilter && { status: statusFilter }),
    ...(searchFilter && { search: searchFilter }),
  }).toString();

  const result = await getListings(page, limit, statusFilter, searchFilter);

  // Handle Error State
  if (result.error) {
    return (
      <div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h1 className="text-2xl font-bold">Marketplace Listings Management</h1>
        </div>
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h1 className="text-2xl font-bold">Marketplace Listings Management</h1>
        </div>
        <p className="text-gray-500">No marketplace listings found.</p>
        {/* Optionally add a link back to admin dashboard or another relevant page */} 
      </div>
    );
  }

  // Render Listings Table
  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold">Marketplace Listings Management</h1>
        
        {/* Status Filter */}
        <div className="flex flex-wrap gap-2">
          <a 
            href="/admin/listings" 
            className={`px-3 py-1 text-sm rounded-full ${!statusFilter ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}
          >
            All ({result.data?.pagination?.totalItems || 0})
          </a>
          <a 
            href={`?${new URLSearchParams({status: 'PENDING', ...searchParams}).toString()}`} 
            className={`px-3 py-1 text-sm rounded-full ${statusFilter === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}
          >
            Pending
          </a>
          <a 
            href={`?${new URLSearchParams({status: 'ACTIVE', ...searchParams}).toString()}`} 
            className={`px-3 py-1 text-sm rounded-full ${statusFilter === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
          >
            Active
          </a>
          <a 
            href={`?${new URLSearchParams({status: 'REJECTED', ...searchParams}).toString()}`} 
            className={`px-3 py-1 text-sm rounded-full ${statusFilter === 'REJECTED' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}
          >
            Rejected
          </a>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
        {/* Search and Filter Controls */}
        <div className="p-4 border-b">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <form action="/admin/listings" method="GET">
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="search"
                    placeholder="Search by title..."
                    defaultValue={searchFilter}
                    className="flex-1 px-3 py-2 border rounded-md"
                  />
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md">
                    Search
                  </button>
                  {searchFilter && (
                    <a 
                      href="/admin/listings" 
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md"
                    >
                      Clear
                    </a>
                  )}
                </div>
                {/* Hidden fields to preserve other filters */}
                {statusFilter && (
                  <input type="hidden" name="status" value={statusFilter} />
                )}
                {searchParams?.page && searchParams.page !== '1' && (
                  <input type="hidden" name="page" value={searchParams.page} />
                )}
                {searchParams?.limit && searchParams.limit !== '10' && (
                  <input type="hidden" name="limit" value={searchParams.limit} />
                )}
              </form>
            </div>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Seller</TableHead>
              <TableHead>Material</TableHead>
              <TableHead>Type</TableHead>
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
                <TableCell>
                  {listing.type ? (
                    <Badge 
                      variant={
                        listing.type === 'SELL' ? 'default' : 
                        'secondary'
                      }
                    >
                      {listing.type}
                    </Badge>
                  ) : (
                    <Badge variant="outline">Unknown</Badge>
                  )}
                </TableCell>
                <TableCell>{listing.location ?? <span className="text-gray-400 italic">N/A</span>}</TableCell>
                <TableCell>
                  {listing.status ? (
                    <Badge 
                      variant={
                        listing.status === 'ACTIVE' ? 'default' : 
                        listing.status === 'PENDING' ? 'secondary' : 
                        listing.status === 'REJECTED' ? 'destructive' : 
                        'outline'
                      }
                    >
                      {listing.status}
                    </Badge>
                  ) : (
                    <Badge variant="outline">Unknown</Badge>
                  )}
                </TableCell>
                <TableCell>{format(new Date(listing.created_at), 'PP')}</TableCell>
                <TableCell>
                  <AdminListingActionsCell 
                    listingId={listing.id} 
                    listingTitle={listing.title} 
                    status={listing.status} 
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-sm text-gray-600">
            Showing {((pagination.currentPage - 1) * pagination.pageSize) + 1} to {Math.min(pagination.currentPage * pagination.pageSize, pagination.totalItems)} of {pagination.totalItems} listings
          </div>
          <PaginationControls
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            baseUrl="/admin/listings"
            // Pass existing search params if needed in the future
            extraParams={{ 
              ...(statusFilter && { status: statusFilter }),
              ...(searchFilter && { search: searchFilter })
            }}
          />
        </div>
      )}
    </div>
  );
} 