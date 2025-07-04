'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import AdminUserRow from '@/components/admin/AdminUserRow';
import { Pagination } from "@/components/ui/pagination";
// Use the client-specific type from the page
import type { ClientAdminUser } from '@/app/admin/users/page'; 

// Define Pagination type based on page component
interface PaginationData {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

interface AdminUsersClientContentProps {
    initialUsers: ClientAdminUser[]; // Updated type
    initialPagination: PaginationData; // Added pagination prop
    initialSearch: string;
    currentAdminId: string;
}

export default function AdminUsersClientContent({ 
    initialUsers, 
    initialPagination, // Destructure pagination
    initialSearch,
    currentAdminId
}: AdminUsersClientContentProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [searchTerm, setSearchTerm] = useState(initialSearch);
    // State to potentially hold pagination if needed for controls later
    const [pagination, setPagination] = useState(initialPagination); 

    // Debounced function to update URL search params
    const handleSearch = useDebouncedCallback((term: string) => {
        const params = new URLSearchParams(searchParams);
        if (term) {
            params.set('search', term);
        } else {
            params.delete('search');
        }
        params.set('page', '1'); // Reset to page 1 on new search
        router.replace(`/admin/users?${params.toString()}`);
    }, 300); 

    // Update internal state when input changes
    const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        handleSearch(e.target.value);
    };

    // Handle pagination change (example, needs PaginationControls component)
    const handlePageChange = (newPage: number) => {
      const params = new URLSearchParams(searchParams);
      params.set('page', newPage.toString());
      router.push(`/admin/users?${params.toString()}`);
    };

    // Handle No Users State
    const noUsersFound = initialUsers.length === 0;
    const isSearching = initialSearch !== '';

    return (
        <div>
            {/* Search Input */}
            <div className="mb-4 max-w-sm">
                <Input
                    type="search"
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={onInputChange}
                    className="bg-white"
                />
            </div>

            {/* User Table or No Results Message */}
            {noUsersFound ? (
                <div className="bg-white rounded-lg shadow p-6 text-center">
                    <p className="text-gray-500">
                        {isSearching 
                            ? `No users found matching "${initialSearch}".` 
                            : "No users found."}
                    </p>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {/* Update Table Headers to match ClientAdminUser type */}
                                <TableHead>ID</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Role</TableHead> 
                                <TableHead>Verified</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Registered</TableHead>
                                <TableHead>Last Login</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {initialUsers.map((user) => (
                                // AdminUserRow will need updates to match ClientAdminUser props
                                <AdminUserRow
                                    key={user.id}
                                    user={user}
                                    currentAdminId={currentAdminId}
                                />
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
            
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