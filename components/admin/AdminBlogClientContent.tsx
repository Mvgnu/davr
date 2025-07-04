'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  Edit, 
  Trash, 
  MoreHorizontal, 
  Search, 
  Calendar, 
  Plus, 
  Eye,
  FileText,
  Loader2
} from 'lucide-react';

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
import { format, parseISO } from 'date-fns';
import BlogActionsDropdown from './BlogActionsDropdown';

// Type matching the select clause in the API route
interface BlogPostSummary {
  id: string;
  title: string;
  slug: string;
  author_name: string | null;
  category: string | null;
  published_at: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
  status: string;
  featured: boolean;
}

interface PaginationState {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

const formatDate = (dateString: Date | string | null) => {
    if (!dateString) return 'N/A';
    try {
        const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
        return format(date, 'dd.MM.yyyy');
    } catch (e) {
        console.error("Date formatting error:", e);
        return 'Invalid Date';
    }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'published':
      return <Badge variant="default" className="bg-green-500 text-white">Veröffentlicht</Badge>;
    case 'draft':
      return <Badge variant="secondary">Entwurf</Badge>;
    case 'archived':
      return <Badge variant="outline">Archiviert</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export default function AdminBlogClientContent() {
  const [posts, setPosts] = useState<BlogPostSummary[]>([]);
  const [pagination, setPagination] = useState<PaginationState>({ page: 1, limit: 10, totalCount: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [featuredFilter, setFeaturedFilter] = useState('all');
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  // Add sortBy, sortOrder state if needed

  // Fetch categories effect
  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoadingCategories(true);
      try {
        const response = await fetch('/api/blog/categories');
        if (!response.ok) {
          throw new Error('Failed to fetch categories');
        }
        const data: string[] = await response.json();
        setCategories(data);
      } catch (error) {
        console.error("Failed to load categories:", error);
        toast.error('Could not load blog categories.');
      } finally {
        setIsLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  const fetchData = useCallback(async (page = 1, search = '', status = 'all', category = 'all', featured = 'all') => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        search: search,
        status: status,
        category: category,
        featured: featured,
        // Add other params: sortBy, sortOrder
      });
      const response = await fetch(`/api/admin/blog/posts?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.statusText}`);
      }
      const result = await response.json();
      if (result.success) {
        setPosts(result.data || []);
        setPagination(result.pagination || { page: 1, limit: 10, totalCount: 0, totalPages: 1 });
      } else {
        throw new Error(result.error || 'Failed to fetch blog posts');
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      toast.error('Could not load blog posts.');
    } finally {
      setIsLoading(false);
    }
  }, [pagination.limit]); // Dependency on limit

  // Initial fetch and fetch on filter changes
  useEffect(() => {
    fetchData(1, searchTerm, statusFilter, categoryFilter, featuredFilter);
  }, [searchTerm, statusFilter, categoryFilter, featuredFilter, fetchData]);

  // Debounced search handler
  const debouncedSearch = useDebouncedCallback((value: string) => {
    setSearchTerm(value);
  }, 500); 

  // Pagination handler
  const handlePageChange = (newPage: number) => {
    fetchData(newPage, searchTerm, statusFilter, categoryFilter, featuredFilter);
  };
  
  // Removed placeholder delete handler as logic is in BlogActionsDropdown
  // const handleDeletePost = (id: string, title: string) => { ... }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Blog verwalten</h1>
          <p className="text-gray-600 mt-1">Blog-Artikel erstellen, bearbeiten und veröffentlichen</p>
        </div>
        <Link href="/admin/blog/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Neuen Artikel erstellen
          </Button>
        </Link>
      </div>

      {/* --- Filters and Search START --- */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Suche nach Titel, Autor oder Kategorie..."
                className="pl-8 w-full"
                onChange={(e) => debouncedSearch(e.target.value)}
              />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Category Filter (Dynamic) */}
              <select 
                value={categoryFilter} 
                onChange={(e) => setCategoryFilter(e.target.value)} 
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background w-full sm:w-[180px]"
                disabled={isLoadingCategories} // Disable while loading
              >
                <option value="all">Alle Kategorien</option>
                {isLoadingCategories ? (
                  <option value="loading" disabled>Lade...</option>
                ) : (
                  categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))
                )}
              </select>
              
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)} 
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background w-full sm:w-[180px]"
              >
                <option value="all">Alle Status</option>
                <option value="published">Veröffentlicht</option>
                <option value="draft">Entwurf</option>
                <option value="archived">Archiviert</option>
              </select>
              
              <select 
                value={featuredFilter} 
                onChange={(e) => setFeaturedFilter(e.target.value)} 
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background w-full sm:w-[180px]"
              >
                <option value="all">Alle</option>
                <option value="true">Hervorgehoben</option>
                <option value="false">Nicht hervorgehoben</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* --- Filters and Search END --- */}

      {/* Blog Posts Table Display Area */}
      <Card>
        <CardHeader>
          <CardTitle>Blog-Artikel</CardTitle>
          <CardDescription>
             Insgesamt {pagination.totalCount} Artikel gefunden.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Loading State */}
          {isLoading && (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            </div>
          )}
          {/* Error State */}
          {error && (
            <div className="text-red-600 bg-red-50 p-4 rounded-md">
              Fehler beim Laden der Artikel: {error}
            </div>
          )}
          {/* No Data State */}
          {!isLoading && !error && posts.length === 0 && (
            <div className="text-center text-gray-500 py-10">
              Keine Artikel gefunden, die den Kriterien entsprechen.
            </div>
          )}

          {/* --- Actual Table START --- */}
          {!isLoading && !error && posts.length > 0 && (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Titel</TableHead>
                    <TableHead>Autor</TableHead>
                    <TableHead>Kategorie</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Veröffentlicht am</TableHead>
                    <TableHead>Hervorgehoben</TableHead>
                    <TableHead><span className="sr-only">Aktionen</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {posts.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell className="font-medium">
                        <Link href={`/admin/blog/edit/${post.id}`} className="hover:underline">
                          {post.title}
                        </Link>
                      </TableCell>
                      <TableCell>{post.author_name ?? 'N/A'}</TableCell>
                      <TableCell>{post.category ?? 'N/A'}</TableCell>
                      <TableCell>{getStatusBadge(post.status)}</TableCell>
                      <TableCell>{formatDate(post.published_at)}</TableCell>
                      <TableCell>{post.featured ? 'Ja' : 'Nein'}</TableCell>
                      <TableCell>
                        <BlogActionsDropdown 
                          postId={post.id}
                          postTitle={post.title}
                          postSlug={post.slug}
                          status={post.status}
                        />
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
          {/* --- Actual Table END --- */}

        </CardContent>
      </Card>
    </div>
  );
} 