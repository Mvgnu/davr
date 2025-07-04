import React from 'react';
import { Metadata } from 'next';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import PaginationControls from '@/components/ui/PaginationControls';
import AdminRecyclingCenterActionsCell from '@/components/admin/AdminRecyclingCenterActionsCell';

export const metadata: Metadata = {
  title: 'Wertstoffhöfe Verwaltung | Admin Dashboard | DAVR',
  description: 'Verwalten Sie Wertstoffhöfe auf der DAVR-Plattform.',
};

// Type for Center data including relations
type AdminRecyclingCenter = {
  id: string;
  name: string;
  address_street: string | null;
  city: string | null;
  postal_code: string | null;
  created_at: Date | string;
  owner: {
    id: string;
    email: string | null;
    name: string | null;
  } | null; // Owner can be null
};

type PaginatedResponse = {
  centers: AdminRecyclingCenter[];
  pagination: {
    currentPage: number;
    totalPages: number;
    pageSize: number;
    totalItems: number;
  };
};

// Fetch function to get centers from the admin API
async function getCenters(page: number = 1, limit: number = 10): Promise<{ data?: PaginatedResponse; error?: string }> {
  const apiUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/admin/recycling-centers?page=${page}&limit=${limit}`;
  try {
    // Server-side fetch automatically includes necessary cookies for auth
    const response = await fetch(apiUrl, { cache: 'no-store' });

    if (response.status === 403) {
        return { error: 'Forbidden: You do not have permission to view these centers.' };
    }
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API Error (${response.status}): ${errorData.error || response.statusText}`);
    }
    const data: PaginatedResponse = await response.json();
    return { data };

  } catch (error) {
    console.error("Error fetching admin recycling centers:", error);
    return { error: error instanceof Error ? error.message : 'An unknown error occurred' };
  }
}

// Page Props including searchParams for pagination
interface AdminRecyclingCentersPageProps {
  searchParams?: { [key: string]: string | string[] | undefined };
}

// Admin Recycling Centers Management Page Component
export default async function AdminRecyclingCentersPage({ searchParams }: AdminRecyclingCentersPageProps) {
  const page = parseInt(searchParams?.page as string || '1', 10);
  const limit = parseInt(searchParams?.limit as string || '10', 10);

  const result = await getCenters(page, limit);

  // Handle Error State
  if (result.error) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-4">Recycling Center Management</h1>
        <div className="flex items-center p-4 bg-red-100 border border-red-300 rounded-md text-red-700">
          <AlertCircle className="w-5 h-5 mr-2" />
          <p>Error loading centers: {result.error}</p>
        </div>
      </div>
    );
  }

  const centers = result.data?.centers ?? [];
  const pagination = result.data?.pagination;

  // Handle No Centers State
  if (centers.length === 0) {
    return (
        <div>
            <h1 className="text-2xl font-bold mb-4">Recycling Center Management</h1>
            <p className="text-gray-500">No recycling centers found.</p>
        </div>
    );
  }

  // Render Centers Table
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Recycling Center Management</h1>
      <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {centers.map((center) => (
                <TableRow key={center.id}>
                  <TableCell className="font-medium">{center.name}</TableCell>
                  <TableCell>{center.city ?? <span className="text-gray-400 italic">N/A</span>}</TableCell>
                  <TableCell>{center.owner?.email ?? center.owner?.name ?? <span className="text-gray-400 italic">N/A</span>}</TableCell>
                  <TableCell>{format(new Date(center.created_at), 'PP')}</TableCell>
                  <TableCell>
                    <AdminRecyclingCenterActionsCell centerId={center.id} centerName={center.name} />
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
          baseUrl="/admin/recycling-centers"
        />
      )}
    </div>
  );
} 