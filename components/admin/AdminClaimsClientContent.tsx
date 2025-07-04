'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import ClaimActions from '@/components/admin/ClaimActions';
import { Pagination } from "@/components/ui/pagination"; // Use standard pagination

// Type mirroring the FormattedClaim from the page, might need adjustment
interface ClientClaim {
  id: string;
  recyclingCenterId: string;
  userId: string;
  name: string;
  email: string;
  phone: string | null;
  companyName: string | null;
  businessRole: string | null;
  message: string;
  status: string;
  createdAt: Date; // Expect Date object from page component
  updatedAt: Date;
  recyclingCenterName: string | null | undefined;
  recyclingCenterSlug: string | null | undefined;
  recyclingCenterCity: string | null | undefined;
  userEmail: string | null | undefined;
}

interface PaginationData {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

interface AdminClaimsClientContentProps {
    initialClaims: ClientClaim[];
    initialPagination: PaginationData;
    initialStatus: string;
}

function getStatusBadge(status: string) {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-500 text-white">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
}

export default function AdminClaimsClientContent({ 
    initialClaims,
    initialPagination,
    initialStatus
}: AdminClaimsClientContentProps) {
    const router = useRouter();
    const searchParams = useSearchParams(); // Get current search params

    // We use the initial props to display data, routing handles changes
    const claims = initialClaims;
    const pagination = initialPagination;
    const currentStatus = initialStatus;

    const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newStatus = e.target.value;
        const params = new URLSearchParams(searchParams.toString()); // Use toString() to get a mutable copy
        params.set('status', newStatus);
        params.set('page', '1'); // Reset to page 1 when status changes
        router.push(`/admin/claims?${params.toString()}`);
    };

    const handlePageChange = (newPage: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('page', newPage.toString());
        router.push(`/admin/claims?${params.toString()}`);
    };

    return (
        <div>
            {/* Status Filter Dropdown */}
            <div className="mb-4 max-w-xs">
                <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">Filter by Status:</label>
                <select 
                    id="status-filter"
                    value={currentStatus} 
                    onChange={handleStatusChange}
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm h-10 bg-white"
                >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                </select>
            </div>

            {/* Claims Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Claim ID</TableHead>
                        <TableHead>Center Name</TableHead>
                        <TableHead>User Email</TableHead>
                        <TableHead>Claimer Name</TableHead>
                        <TableHead>Date Submitted</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {claims.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={7} className="text-center text-gray-500 py-6">
                            No claims found for the selected status.
                            </TableCell>
                        </TableRow>
                        ) : (
                        claims.map((claim) => (
                            <TableRow key={claim.id}>
                            <TableCell className="font-medium">{claim.id.substring(0, 8)}...</TableCell>
                            <TableCell>
                                <Link href={`/recycling-centers/${claim.recyclingCenterSlug ?? '#'}`} target="_blank" className="text-blue-600 hover:underline">
                                {claim.recyclingCenterName || 'N/A'}
                                </Link>
                                <span className="text-xs text-gray-500 block">{claim.recyclingCenterCity || ''}</span>
                            </TableCell>
                            <TableCell>{claim.userEmail || 'N/A'}</TableCell>
                            <TableCell>{claim.name}</TableCell>
                            <TableCell>{format(new Date(claim.createdAt), 'dd MMM yyyy')}</TableCell>
                            <TableCell>{getStatusBadge(claim.status)}</TableCell>
                            <TableCell>
                                <ClaimActions claimId={claim.id} status={claim.status} />
                            </TableCell>
                            </TableRow>
                        ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
                <div className="mt-6 flex justify-center">
                    <Pagination 
                        currentPage={pagination.page} 
                        totalPages={pagination.totalPages} 
                        onPageChange={handlePageChange} 
                    />
                </div>
            )}
        </div>
    );
} 