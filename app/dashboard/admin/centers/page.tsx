'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { LoadingState } from '@/components/shared/LoadingState';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Eye, Edit, Trash2, UserPlus, UserMinus, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import AssignOwnerDialog from '@/components/dashboard/admin/AssignOwnerDialog';
import RemoveOwnerDialog from '@/components/dashboard/admin/RemoveOwnerDialog';
import VerifyCenterDialog from '@/components/dashboard/admin/VerifyCenterDialog';
import CenterEditorDialog from '@/components/dashboard/admin/CenterEditorDialog';
import DeleteCenterDialog from '@/components/dashboard/admin/DeleteCenterDialog';

interface RecyclingCenter {
  id: string;
  name: string;
  description: string | null;
  address_street: string | null;
  city: string | null;
  postal_code: string | null;
  country: string | null;
  email: string | null;
  phone_number: string | null;
  latitude: number | null;
  longitude: number | null;
  verification_status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  created_at: Date;
  updated_at: Date;
  slug: string | null;
  image_url: string | null;
  managedById: string | null;
  managedBy: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
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
  centers: RecyclingCenter[];
  pagination: Pagination;
  error?: string;
}

export default function AdminRecyclingCentersPage() {
  const [centers, setCenters] = useState<RecyclingCenter[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // Dialog states
  const [editingCenter, setEditingCenter] = useState<RecyclingCenter | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [centerToDelete, setCenterToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [centerToAssignOwner, setCenterToAssignOwner] = useState<{ id: string; name: string } | null>(null);
  const [isAssignOwnerDialogOpen, setIsAssignOwnerDialogOpen] = useState(false);
  const [centerToRemoveOwner, setCenterToRemoveOwner] = useState<{ id: string; name: string; ownerName: string } | null>(null);
  const [isRemoveOwnerDialogOpen, setIsRemoveOwnerDialogOpen] = useState(false);
  const [centerToVerify, setCenterToVerify] = useState<{ id: string; name: string } | null>(null);
  const [verifyAction, setVerifyAction] = useState<'VERIFIED' | 'REJECTED'>('VERIFIED');
  const [isVerifyDialogOpen, setIsVerifyDialogOpen] = useState(false);

  useEffect(() => {
    fetchCenters(currentPage);
  }, [currentPage]);

  const fetchCenters = async (page: number) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/dashboard/admin/recycling-centers?page=${page}&limit=10`);
      const result: ApiResponse = await response.json();

      if (result.success) {
        setCenters(result.data?.centers || []);
        setPagination(result.data?.pagination || null);
      } else {
        toast.error(result.error || 'Failed to load recycling centers');
      }
    } catch (error) {
      toast.error('Failed to load recycling centers');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= (pagination?.totalPages || 1)) {
      setCurrentPage(newPage);
    }
  };

  const handleEditClick = (center: RecyclingCenter) => {
    setEditingCenter(center);
    setIsEditorOpen(true);
  };

  const handleDeleteClick = (center: RecyclingCenter) => {
    setCenterToDelete({ id: center.id, name: center.name });
    setIsDeleteDialogOpen(true);
  };

  const handleAssignOwnerClick = (center: RecyclingCenter) => {
    setCenterToAssignOwner({ id: center.id, name: center.name });
    setIsAssignOwnerDialogOpen(true);
  };

  const handleRemoveOwnerClick = (center: RecyclingCenter) => {
    if (center.managedBy) {
      setCenterToRemoveOwner({ 
        id: center.id, 
        name: center.name, 
        ownerName: center.managedBy.name || center.managedBy.email || 'Unknown User' 
      });
      setIsRemoveOwnerDialogOpen(true);
    }
  };

  const handleVerifyClick = (center: RecyclingCenter, action: 'VERIFIED' | 'REJECTED') => {
    setCenterToVerify({ id: center.id, name: center.name });
    setVerifyAction(action);
    setIsVerifyDialogOpen(true);
  };

  const handleCenterSaved = (updatedCenter: RecyclingCenter) => {
    // Update the centers list with the saved center
    setCenters(prevCenters => 
      prevCenters.map(c => c.id === updatedCenter.id ? updatedCenter : c)
    );
    fetchCenters(currentPage);
  };

  const handleCenterDeleted = (deletedCenterId: string) => {
    // Remove the deleted center from the list
    setCenters(prevCenters => prevCenters.filter(c => c.id !== deletedCenterId));
    fetchCenters(currentPage);
  };

  const handleOwnerAssigned = () => {
    fetchCenters(currentPage);
  };

  const handleOwnerRemoved = () => {
    fetchCenters(currentPage);
  };

  const handleVerificationComplete = () => {
    fetchCenters(currentPage);
  };

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Recycling Centers Management</h1>
          <p className="text-gray-600 mt-1">
            View and manage all recycling centers on the platform.
          </p>
        </div>
        <Button onClick={() => { setEditingCenter(null); setIsEditorOpen(true); }}>
          <UserPlus className="h-4 w-4 mr-2" />
          Add Center
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Recycling Centers</CardTitle>
          <CardDescription>
            A list of all recycling centers including their verification status and activity.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {centers.length === 0 ? (
            <p className="text-center text-gray-500">No recycling centers found.</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead>Postal Code</TableHead>
                      <TableHead>Verification</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {centers.map((center) => (
                      <TableRow key={center.id}>
                        <TableCell className="font-medium max-w-xs truncate">
                          {center.name}
                          {center.managedById && (
                            <Badge variant="secondary" className="ml-2 text-xs">
                              Has Owner
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>{center.city}</TableCell>
                        <TableCell>{center.postal_code}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              center.verification_status === 'VERIFIED' ? 'default' : 
                              center.verification_status === 'PENDING' ? 'secondary' : 
                              'destructive'
                            }
                          >
                            {center.verification_status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {center.managedBy ? (
                            <div>
                              <div className="font-medium text-sm">
                                {center.managedBy.name || center.managedBy.email}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {center.managedBy.email}
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground italic">No Owner</span>
                          )}
                        </TableCell>
                        <TableCell>{center.email}</TableCell>
                        <TableCell>{center.phone_number}</TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mr-2"
                            asChild
                          >
                            <Link href={`/recycling-centers/${center.slug}`} target="_blank">
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mr-2"
                            onClick={() => handleEditClick(center)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          
                          {center.verification_status !== 'VERIFIED' && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="mr-2"
                              onClick={() => handleVerifyClick(center, 'VERIFIED')}
                            >
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            </Button>
                          )}
                          
                          {center.verification_status !== 'REJECTED' && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="mr-2"
                              onClick={() => handleVerifyClick(center, 'REJECTED')}
                            >
                              <XCircle className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                          
                          {!center.managedById ? (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="mr-2"
                              onClick={() => handleAssignOwnerClick(center)}
                            >
                              <UserPlus className="h-4 w-4 text-blue-600" />
                            </Button>
                          ) : (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="mr-2"
                              onClick={() => handleRemoveOwnerClick(center)}
                            >
                              <UserMinus className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                          
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleDeleteClick(center)}
                          >
                            <Trash2 className="h-4 w-4" />
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

      {/* Dialogs */}
      <CenterEditorDialog
        center={editingCenter}
        isOpen={isEditorOpen}
        onOpenChange={setIsEditorOpen}
        onSave={handleCenterSaved}
      />

      <DeleteCenterDialog
        centerId={centerToDelete?.id || ''}
        centerName={centerToDelete?.name || ''}
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onDelete={handleCenterDeleted}
      />

      <AssignOwnerDialog
        centerId={centerToAssignOwner?.id || ''}
        isOpen={isAssignOwnerDialogOpen}
        onOpenChange={setIsAssignOwnerDialogOpen}
        onOwnerAssigned={handleOwnerAssigned}
      />

      <RemoveOwnerDialog
        centerId={centerToRemoveOwner?.id || ''}
        centerName={centerToRemoveOwner?.name || ''}
        currentOwnerName={centerToRemoveOwner?.ownerName || ''}
        isOpen={isRemoveOwnerDialogOpen}
        onOpenChange={setIsRemoveOwnerDialogOpen}
        onOwnerRemoved={handleOwnerRemoved}
      />

      <VerifyCenterDialog
        centerId={centerToVerify?.id || ''}
        centerName={centerToVerify?.name || ''}
        isOpen={isVerifyDialogOpen}
        onOpenChange={setIsVerifyDialogOpen}
        action={verifyAction}
        onVerificationComplete={handleVerificationComplete}
      />
    </div>
  );
}