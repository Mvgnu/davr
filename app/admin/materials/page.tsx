import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle, PlusCircle } from 'lucide-react';
import PaginationControls from '@/components/ui/PaginationControls';
import { Button } from '@/components/ui/button';
import AdminMaterialActionsCell from '@/components/admin/AdminMaterialActionsCell'; // Placeholder for future actions

export const metadata: Metadata = {
  title: 'Materials Management | Admin Dashboard | DAVR',
  description: 'Manage materials on the DAVR platform.',
};

// Type matching the GET /api/admin/materials response data structure
type AdminMaterial = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  parentMaterial: { id: string; name: string } | null;
  _count: {
    marketplaceListings: number;
    recyclingCenterOffers: number;
    subMaterials: number;
  };
  created_at: Date | string;
  updated_at: Date | string;
};

type PaginatedMaterialsResponse = {
  success: boolean;
  data: AdminMaterial[];
  pagination: {
    currentPage: number;
    totalPages: number;
    pageSize: number;
    totalItems: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  error?: string;
  details?: any;
};

// Fetch function to get materials from the admin API
async function getMaterials(page: number = 1, limit: number = 10): Promise<{ data?: PaginatedMaterialsResponse; error?: string }> {
  const apiUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/admin/materials?page=${page}&limit=${limit}`;
  try {
    const response = await fetch(apiUrl, { cache: 'no-store' }); // No caching for admin data

    if (response.status === 403) {
      return { error: 'Forbidden: You do not have permission to view materials.' };
    }
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API Error (${response.status}): ${errorData.error || response.statusText}`);
    }
    const data: PaginatedMaterialsResponse = await response.json();
    if (!data.success) {
        throw new Error(data.error || 'Failed to fetch materials');
    }
    return { data };

  } catch (error) {
    console.error("Error fetching admin materials:", error);
    return { error: error instanceof Error ? error.message : 'An unknown error occurred' };
  }
}

// Page Props including searchParams for pagination
interface AdminMaterialsPageProps {
  searchParams?: { [key: string]: string | string[] | undefined };
}

// Admin Materials Management Page Component
export default async function AdminMaterialsPage({ searchParams }: AdminMaterialsPageProps) {
  const page = parseInt(searchParams?.page as string || '1', 10);
  const limit = parseInt(searchParams?.limit as string || '10', 10);

  const result = await getMaterials(page, limit);

  // Handle Error State
  if (result.error) {
    return (
      <div>
        <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">Materials Management</h1>
        </div>
        <div className="flex items-center p-4 bg-red-100 border border-red-300 rounded-md text-red-700">
          <AlertCircle className="w-5 h-5 mr-2" />
          <p>Error loading materials: {result.error}</p>
        </div>
      </div>
    );
  }

  const materials = result.data?.data ?? [];
  const pagination = result.data?.pagination;

  return (
    <div>
        {/* Header and Create Button */}
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Materials Management</h1>
            <Button asChild>
                <Link href="/admin/materials/new">
                    <PlusCircle className="w-4 h-4 mr-2" /> Create Material
                </Link>
            </Button>
        </div>

      {/* Handle No Materials State */}
      {materials.length === 0 ? (
        <p className="text-gray-500">No materials found.</p>
      ) : (
        <>
          {/* Materials Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Parent</TableHead>
                  <TableHead>Listings</TableHead>
                  <TableHead>Offers</TableHead>
                  <TableHead>Sub-Mats</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {materials.map((material) => (
                  <TableRow key={material.id}>
                    <TableCell className="font-medium">{material.name}</TableCell>
                    <TableCell>{material.category}</TableCell>
                    <TableCell>{material.parentMaterial?.name ?? <span className="text-gray-400 italic">N/A</span>}</TableCell>
                    <TableCell>{material._count.marketplaceListings}</TableCell>
                    <TableCell>{material._count.recyclingCenterOffers}</TableCell>
                    <TableCell>{material._count.subMaterials}</TableCell>
                    <TableCell>
                        {/* Actions Cell Component will go here */}
                        <AdminMaterialActionsCell materialId={material.id} materialName={material.name} />
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
              baseUrl="/admin/materials"
            />
          )}
        </>
      )}
    </div>
  );
} 