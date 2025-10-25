'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { LoadingState } from '@/components/shared/LoadingState';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface Seller {
  id: string;
  email: string | null;
  name: string | null;
}

interface Material {
  id: string;
  name: string;
}

interface Listing {
  id: string;
  title: string;
  description: string | null;
  quantity: number | null;
  unit: string | null;
  location: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  image_url: string | null;
  seller: Seller;
  material: Material | null;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
}

interface ApiResponse {
  success: boolean;
  data: {
    listings: Listing[];
    pagination: Pagination;
  };
  error?: string;
}

export default function AdminListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchListings(currentPage);
  }, [currentPage]);

  const fetchListings = async (page: number) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/dashboard/admin/listings?page=${page}&limit=10`);
      const result: ApiResponse = await response.json();

      if (result.success) {
        setListings(result.data.listings);
        setPagination(result.data.pagination);
      } else {
        toast.error(result.error || 'Failed to load listings');
      }
    } catch (error) {
      toast.error('Failed to load listings');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= (pagination?.totalPages || 1)) {
      setCurrentPage(newPage);
    }
  };

  if (isLoading) {
    return <LoadingState variant="spinner" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Marketplace Listings Management</h1>
        <p className="text-gray-600 mt-1">
          View and manage all marketplace listings on the platform.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Listings</CardTitle>
          <CardDescription>
            A list of all marketplace listings including their status and creation date.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {listings.length === 0 ? (
            <p className="text-center text-gray-500">No listings found.</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Seller</TableHead>
                      <TableHead>Material</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {listings.map((listing) => (
                      <TableRow key={listing.id}>
                        <TableCell className="font-medium">{listing.title}</TableCell>
                        <TableCell>
                          {listing.seller?.email ?? listing.seller?.name ?? (
                            <span className="text-gray-400 italic">N/A</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {listing.material?.name ?? (
                            <span className="text-gray-400 italic">N/A</span>
                          )}
                        </TableCell>
                        <TableCell>{listing.location ?? <span className="text-gray-400 italic">N/A</span>}</TableCell>
                        <TableCell>
                          {listing.is_active ? (
                            <Badge variant="default">Active</Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell>{listing.created_at ? format(new Date(listing.created_at), 'PP') : 'N/A'}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" className="mr-2">
                            <a href={`/marketplace/${listing.id}`} target="_blank" rel="noopener noreferrer">View</a>
                          </Button>
                          <Button variant="outline" size="sm">
                            <a href={`/dashboard/user/listings/${listing.id}/edit`} target="_blank" rel="noopener noreferrer">Edit</a>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination Controls */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <span className="text-sm text-gray-500">
                    Showing {(pagination.currentPage - 1) * pagination.pageSize + 1} to{' '}
                    {Math.min(pagination.currentPage * pagination.pageSize, pagination.totalItems)}{' '}
                    of {pagination.totalItems} results
                  </span>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="px-3 py-2 text-sm text-gray-500">
                      Page {currentPage} of {pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === pagination.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}