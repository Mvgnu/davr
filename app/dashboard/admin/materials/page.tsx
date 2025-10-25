'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { LoadingState } from '@/components/shared/LoadingState';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

interface ParentMaterial {
  id: string;
  name: string;
}

interface Material {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  parent_id: string | null;
  created_at: Date;
  updated_at: Date;
  image_url: string | null;
  recyclability_percentage: number | null;
  parent: ParentMaterial | null;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface ApiResponse {
  success: boolean;
  materials: Material[];
  pagination: Pagination;
  error?: string;
}

export default function AdminMaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchMaterials(currentPage);
  }, [currentPage]);

  const fetchMaterials = async (page: number) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/dashboard/admin/materials?page=${page}&limit=10`);
      const result: ApiResponse = await response.json();

      if (result.success) {
        setMaterials(result.data?.materials || []);
        setPagination(result.data?.pagination || null);
      } else {
        toast.error(result.error || 'Failed to load materials');
      }
    } catch (error) {
      toast.error('Failed to load materials');
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
    return <LoadingState />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Materials Management</h1>
        <p className="text-gray-600 mt-1">
          View and manage all materials on the platform.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Materials</CardTitle>
          <CardDescription>
            A list of all materials including their categories and listing counts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {materials.length === 0 ? (
            <p className="text-center text-gray-500">No materials found.</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead>Parent</TableHead>
                      <TableHead>Recyclability</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {materials.map((material) => (
                      <TableRow key={material.id}>
                        <TableCell className="font-medium">{material.name}</TableCell>
                        <TableCell>{material.slug}</TableCell>
                        <TableCell>
                          {material.parent?.name ?? (
                            <span className="text-gray-400 italic">N/A</span>
                          )}
                        </TableCell>
                        <TableCell>{material.recyclability_percentage ? `${material.recyclability_percentage}%` : 'N/A'}</TableCell>
                        <TableCell>{material.created_at ? format(new Date(material.created_at), 'PP') : 'N/A'}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" className="mr-2">
                            View
                          </Button>
                          <Button variant="outline" size="sm">
                            Edit
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