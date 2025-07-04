'use client';

import React, { useState, useEffect, useCallback, useTransition } from 'react';
import Link from 'next/link';
import { 
  Eye, 
  Flag, 
  Trash, 
  MoreHorizontal, 
  Search, 
  Check, 
  X, 
  Plus, 
  ExternalLink,
  MessageSquare,
  Tag,
  Loader2,
  Archive
} from 'lucide-react';
import { ListingType, ListingStatus } from '@prisma/client';
import { format } from 'date-fns';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/ui/pagination';
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from "@/components/ui/table";
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuLabel, 
    DropdownMenuSeparator, 
    DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useDebouncedCallback } from 'use-debounce';
import toast from 'react-hot-toast';

// Define listing type based on Prisma schema (adjust if necessary)
// Assuming Prisma returns related objects directly
interface Listing {
  id: string;
  title: string;
  description: string | null;
  quantity: number | null;
  unit: string | null;
  location: string | null;
  created_at: Date;
  updated_at: Date;
  image_url: string | null;
  type: ListingType;
  status: ListingStatus;
  seller: { id: string; name: string | null };
  material: { name: string } | null;
}

interface PaginationState {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

// Helper functions (moved from page or defined here)
const formatPrice = (price: number | null): string => {
  if (price === null || price === undefined) return 'N/A';
  return `${price.toFixed(2)} €`; // Basic formatting
};

const getTypeBadge = (type: ListingType) => {
  switch (type) {
    case ListingType.BUY:
      return <Badge variant="secondary">Kaufgesuch</Badge>;
    case ListingType.SELL:
      return <Badge variant="default">Verkauf</Badge>;
    default:
      return <Badge variant="outline">Unbekannt</Badge>;
  }
};

const getStatusBadge = (status: ListingStatus) => {
  switch (status) {
    case ListingStatus.ACTIVE:
      return <Badge variant="default" className="bg-green-500 text-white">Aktiv</Badge>;
    case ListingStatus.PENDING:
      return <Badge variant="secondary">Ausstehend</Badge>;
    case ListingStatus.INACTIVE:
      return <Badge variant="outline">Inaktiv</Badge>;
    case ListingStatus.REJECTED:
      return <Badge variant="destructive" className="bg-red-100 text-red-700"><X className="h-3 w-3 mr-1 inline" /> Abgelehnt</Badge>;
    case ListingStatus.FLAGGED:
      return <Badge variant="destructive"><Flag className="h-3 w-3 mr-1 inline" /> Gemeldet</Badge>;
    default:
      return <Badge variant="outline">Unbekannt</Badge>;
  }
};

export default function AdminMarketplaceClientContent() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [pagination, setPagination] = useState<PaginationState>({ page: 1, limit: 10, totalCount: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [isPending, startTransition] = useTransition();

  const fetchData = useCallback(async (page = 1, search = '', status = 'all', type = 'all') => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        search: search,
        status: status,
        type: type,
      });
      const response = await fetch(`/api/admin/marketplace/listings?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.statusText}`);
      }
      const result = await response.json();
      if (result.success) {
        const fetchedListings = (result.data || []).map((l: any) => ({ 
          ...l, 
          created_at: new Date(l.created_at),
          updated_at: new Date(l.updated_at)
        }));
        setListings(fetchedListings);
        setPagination(result.pagination || { page: 1, limit: 10, totalCount: 0, totalPages: 1 });
      } else {
        throw new Error(result.error || 'Failed to fetch listings');
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      toast.error('Could not load marketplace listings.');
    } finally {
      setIsLoading(false);
    }
  }, [pagination.limit]);

  useEffect(() => {
    fetchData(1, searchTerm, statusFilter, typeFilter);
  }, [searchTerm, statusFilter, typeFilter, fetchData]);

  const debouncedSearch = useDebouncedCallback((value: string) => {
    setSearchTerm(value);
  }, 500); 

  const handlePageChange = (newPage: number) => {
    fetchData(newPage, searchTerm, statusFilter, typeFilter);
  };
  
  const handleUpdateStatus = (listingId: string, newStatus: ListingStatus, actionVerb: string) => {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/marketplace/listings/${listingId}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        });
        const result = await response.json();
        if (response.ok && result.success) {
          toast.success(`Angebot erfolgreich ${actionVerb}.`);
          fetchData(pagination.page, searchTerm, statusFilter, typeFilter);
        } else {
          toast.error(result.error || `Fehler beim ${actionVerb.toLowerCase()} des Angebots.`);
        }
      } catch (error) {
        console.error(`Fehler beim ${actionVerb.toLowerCase()} des Angebots:`, error);
        toast.error('Ein unerwarteter Fehler ist aufgetreten.');
      }
    });
  };

  const handleDeleteListing = (listingId: string, listingTitle: string) => {
    if (confirm(`Sind Sie sicher, dass Sie das Angebot "${listingTitle}" löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.`)) {
      startTransition(async () => {
        try {
          const response = await fetch(`/api/admin/marketplace/listings/${listingId}`, {
            method: 'DELETE',
          });
          const result = await response.json();
          if (response.ok && result.success) {
            toast.success('Angebot erfolgreich gelöscht.');
            fetchData(pagination.page, searchTerm, statusFilter, typeFilter);
          } else {
            toast.error(result.error || 'Fehler beim Löschen des Angebots.');
          }
        } catch (error) {
          console.error('Fehler beim Löschen des Angebots:', error);
          toast.error('Ein unerwarteter Fehler ist aufgetreten.');
        }
      });
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Marktplatz-Angebote</CardTitle>
          <CardDescription>Durchsuchen, verwalten und moderieren Sie Angebote.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
            <div className="relative flex-1 w-full md:w-auto">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Suche nach Titel, Verkäufer, Material..."
                className="pl-8 w-full"
                onChange={(e) => debouncedSearch(e.target.value)}
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="border border-gray-300 rounded-md p-2 text-sm h-10"
            >
              <option value="all">Alle Typen</option>
              <option value={ListingType.SELL}>Verkauf</option>
              <option value={ListingType.BUY}>Kaufgesuch</option>
            </select>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-md p-2 text-sm h-10"
            >
              <option value="all">Alle Status</option>
              <option value={ListingStatus.ACTIVE}>Aktiv</option>
              <option value={ListingStatus.PENDING}>Ausstehend</option>
              <option value={ListingStatus.INACTIVE}>Inaktiv</option>
              <option value={ListingStatus.REJECTED}>Abgelehnt</option>
              <option value={ListingStatus.FLAGGED}>Gemeldet</option>
            </select>
            <Button asChild>
              <Link href="/admin/marketplace/new"><Plus className="mr-2 h-4 w-4" /> Angebot hinzufügen</Link>
            </Button>
          </div>

          {isLoading && (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            </div>
          )}
          {error && (
            <div className="text-red-600 bg-red-50 p-4 rounded-md">
              Fehler beim Laden der Angebote: {error}
            </div>
          )}
          {!isLoading && !error && listings.length === 0 && (
            <div className="text-center text-gray-500 py-10">
              Keine Angebote gefunden, die den Kriterien entsprechen.
            </div>
          )}
          
          {!isLoading && !error && listings.length > 0 && (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Titel</TableHead>
                    <TableHead>Anbieter</TableHead>
                    <TableHead>Material</TableHead>
                    <TableHead className="hidden md:table-cell">Typ</TableHead>
                    <TableHead className="hidden md:table-cell">Menge</TableHead>
                    <TableHead className="hidden sm:table-cell">Status</TableHead>
                    <TableHead className="hidden md:table-cell">Erstellt</TableHead>
                    <TableHead><span className="sr-only">Aktionen</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {listings.map((listing) => (
                    <TableRow key={listing.id}>
                      <TableCell className="font-medium">
                        <Link href={`/marketplace/listings/${listing.id}`} target="_blank" className="hover:underline">
                           {listing.title}
                        </Link>
                      </TableCell>
                      <TableCell>{listing.seller?.name ?? 'N/A'}</TableCell>
                      <TableCell>
                         {listing.material?.name ? (
                             <Badge variant="outline"><Tag className="h-3 w-3 mr-1"/>{listing.material.name}</Badge>
                         ) : (
                             <span className="text-gray-400">N/A</span>
                         )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{getTypeBadge(listing.type)}</TableCell>
                      <TableCell className="hidden md:table-cell">{listing.quantity} {listing.unit}</TableCell>
                      <TableCell className="hidden sm:table-cell">{getStatusBadge(listing.status)}</TableCell>
                      <TableCell className="hidden md:table-cell">{format(new Date(listing.created_at), 'dd.MM.yyyy')}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost" disabled={isPending}>
                              {isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <MoreHorizontal className="h-4 w-4" />
                              )}
                              <span className="sr-only">Menü anzeigen</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Aktionen</DropdownMenuLabel>
                            <DropdownMenuItem asChild>
                              <Link href={`/marketplace/listings/${listing.id}`} target="_blank"><Eye className="mr-2 h-4 w-4"/>Ansehen</Link>
                            </DropdownMenuItem>
                            {/* Add Approve/Reject if status is pending */} 
                            {/* {listing.status === 'pending' && ( ... )} */} 
                            {/* Add Flag related actions */} 
                            {/* {listing.reportCount > 0 && (...)} */}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-red-600 focus:text-red-700 focus:bg-red-50"
                              onClick={() => handleDeleteListing(listing.id, listing.title)}
                              disabled={isPending} 
                            >
                              {isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash className="mr-2 h-4 w-4" />
                              )}
                              Löschen
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {pagination.totalPages > 1 && (
                  <div className="mt-6 flex justify-center">
                      <Pagination 
                          currentPage={pagination.page}
                          totalPages={pagination.totalPages}
                          onPageChange={handlePageChange}
                      />
                  </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 