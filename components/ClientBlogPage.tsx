'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { CalendarIcon, UserCircleIcon, ArrowRightIcon, TagIcon } from '@heroicons/react/24/outline';
import BlogFilters from '@/components/BlogFilters';
import { BLOG_CATEGORIES } from '@/components/BlogFilters';

// Define the type for a blog post from the API
interface BlogPost {
  _id: string;
  title: string;
  excerpt: string;
  content: string;
  image: string;
  author: string;
  authorTitle: string;
  category: string;
  tags: string[];
  isPremium: boolean;
  date: string;
  createdAt: string;
  updatedAt: string;
  slug?: string;
}

// Define pagination data type
interface PaginationData {
  total: number;
  totalPages: number;
  currentPage: number;
  limit: number;
}

// Generate the schema.org JSON-LD markup for the blog page
function generateBlogPageSchema(posts: BlogPost[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'Recycling-Wissenszentrum',
    description: 'Informationen über die neuesten Nachrichten, Trends und Innovationen rund um nachhaltiges Recycling und Abfallwirtschaft in Deutschland.',
    url: 'https://www.aluminium-recycling-deutschland.de/blog',
    publisher: {
      '@type': 'Organization',
      name: 'Aluminium Recycling Deutschland',
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.aluminium-recycling-deutschland.de/logo.png'
      }
    },
    blogPost: posts.map(post => ({
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.excerpt,
      datePublished: post.date,
      dateModified: post.updatedAt,
      author: {
        '@type': 'Person',
        name: post.author
      },
      image: post.image,
      url: `https://www.aluminium-recycling-deutschland.de/blog/${post.slug || post._id}`
    }))
  };
}

export default function ClientBlogPage() {
  const searchParams = useSearchParams();
  const isMounted = useRef(false);
  const isInitialLoadRef = useRef(true);
  const fetchControllerRef = useRef<AbortController | null>(null);
  
  // State
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationData>({
    total: 0,
    totalPages: 1,
    currentPage: 1,
    limit: 10
  });
  
  // Filter state (extracted from URL params)
  const [filters, setFilters] = useState({
    search: searchParams?.get('search') || '',
    category: searchParams?.get('category') || 'all',
    sort: searchParams?.get('sort') || 'newest'
  });
  
  // Method to fetch blog posts with current filters
  const fetchBlogPosts = useCallback(async (initialLoad = false) => {
    // Cancel any in-flight requests
    if (fetchControllerRef.current) {
      fetchControllerRef.current.abort();
    }
    
    // Create a new abort controller for this request
    fetchControllerRef.current = new AbortController();
    const signal = fetchControllerRef.current.signal;
    
    try {
      if (!initialLoad) {
        setLoading(true);
      }
      setError(null);
      
      // Build query parameters
      const params = new URLSearchParams();
      if (filters.search) params.set('search', filters.search);
      if (filters.category !== 'all') params.set('category', filters.category);
      if (filters.sort !== 'newest') params.set('sort', filters.sort);
      
      // Current page from URL or default to 1
      const page = searchParams?.get('page') || '1';
      params.set('page', page);
      params.set('limit', '10'); // 10 posts per page
      
      // Debug logging
      console.log('Fetching blog posts with params:', params.toString());
      
      // Fetch data from API with cache busting
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/blog?${params.toString()}&_t=${timestamp}`, { 
        signal,
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      if (signal.aborted) {
        console.log('Request was aborted');
        return;
      }
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (signal.aborted) {
        console.log('Request was aborted during JSON parsing');
        return;
      }
      
      if (data.success) {
        console.log('Successfully fetched posts:', data.data.posts.length);
        setBlogPosts(data.data.posts || []);
        setPagination(data.data.pagination || {
          total: data.data.posts?.length || 0,
          totalPages: 1,
          currentPage: 1,
          limit: 10
        });
      } else {
        console.error('API returned error:', data.message);
        setError(data.message || 'Fehler beim Laden der Artikel');
        setBlogPosts([]);
      }
    } catch (err) {
      // Ignore errors from aborted requests
      if (signal.aborted) {
        console.log('Error due to aborted request, ignoring');
        return;
      }
      
      console.error('Error fetching blog posts:', err);
      setError('Es gab ein Problem beim Laden der Artikel. Bitte versuchen Sie es später erneut.');
      setBlogPosts([]);
    } finally {
      // Only update loading state if request wasn't aborted
      if (!signal.aborted) {
        setLoading(false);
      }
    }
  }, [filters, searchParams]);
  
  // Initial load of blog posts
  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      console.log('Initial load of blog posts');
      fetchBlogPosts(true);
    }
  }, []);
  
  // Update filters when URL changes
  useEffect(() => {
    if (!searchParams || !isMounted.current) return;
    
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || 'all';
    const sort = searchParams.get('sort') || 'newest';
    
    // Check if filters have changed
    const filtersChanged = 
      search !== filters.search || 
      category !== filters.category || 
      sort !== filters.sort;
    
    if (filtersChanged) {
      console.log('Filters changed from URL:', { search, category, sort });
      setFilters({
        search,
        category,
        sort
      });
      
      // Skip auto-fetching on initial render
      if (!isInitialLoadRef.current) {
        fetchBlogPosts();
      }
      isInitialLoadRef.current = false;
    }
  }, [searchParams, fetchBlogPosts, filters]);
  
  // Handle search and filter changes
  const handleSearchChange = useCallback((newFilters: { search: string; category: string; sort: string }) => {
    console.log('Filters changed from UI:', newFilters);
    
    // Update filters
    setFilters(newFilters);
    
    // Reset to page 1 when filters change
    const params = new URLSearchParams(window.location.search);
    params.set('page', '1');
    window.history.pushState({}, '', `${window.location.pathname}?${params.toString()}`);
    
    // Fetch new data
    fetchBlogPosts();
  }, [fetchBlogPosts]);
  
  // Handle pagination
  const handlePageChange = useCallback((newPage: number) => {
    // Update URL with new page
    const params = new URLSearchParams(window.location.search);
    params.set('page', newPage.toString());
    window.history.pushState({}, '', `${window.location.pathname}?${params.toString()}`);
    
    // Fetch posts for the new page
    fetchBlogPosts();
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [fetchBlogPosts]);
  
  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({
      search: '',
      category: 'all',
      sort: 'newest'
    });
    
    // Update URL to remove all parameters
    window.history.pushState({}, '', '/blog');
    
    // Refetch posts
    fetchBlogPosts();
  }, [fetchBlogPosts]);
  
  // Format date to German locale
  const formatDate = useCallback((dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('de-DE', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch (e) {
      console.error('Error formatting date:', e);
      return dateString;
    }
  }, []);
  
  // Render pagination controls
  const renderPagination = useCallback(() => {
    const { currentPage, totalPages } = pagination;
    
    if (totalPages <= 1) return null;
    
    // Calculate page numbers to show
    const pages = [];
    const maxPagesToShow = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = startPage + maxPagesToShow - 1;
    
    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return (
      <div className="flex justify-center mt-12">
        <nav className="inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
          {/* Previous page button */}
          <button
            onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
            disabled={currentPage === 1 || loading}
            className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
              currentPage === 1 || loading ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
            }`}
            aria-label="Vorherige Seite"
          >
            <span className="sr-only">Vorherige</span>
            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </button>
          
          {/* Page numbers */}
          {pages.map(page => (
            <button
              key={page}
              onClick={() => page !== currentPage && handlePageChange(page)}
              disabled={loading}
              className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                page === currentPage
                  ? 'z-10 bg-green-50 border-green-500 text-green-600'
                  : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
              }`}
              aria-current={page === currentPage ? 'page' : undefined}
              aria-label={`Seite ${page}`}
            >
              {page}
            </button>
          ))}
          
          {/* Next page button */}
          <button
            onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || loading}
            className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
              currentPage === totalPages || loading ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
            }`}
            aria-label="Nächste Seite"
          >
            <span className="sr-only">Nächste</span>
            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        </nav>
      </div>
    );
  }, [pagination, loading, handlePageChange]);
  
  // Show skeleton loading state for initial load
  if (loading && blogPosts.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="mb-16 text-center">
          <h1 className="text-4xl font-bold mb-4 text-gray-900">Recycling-Wissenszentrum</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Bleiben Sie informiert über die neuesten Nachrichten, Trends und Innovationen rund um nachhaltiges Recycling und Abfallwirtschaft.
          </p>
        </div>
        
        <BlogFilters onSearch={handleSearchChange} initialFilters={filters} />
        
        <div className="animate-pulse">
          {/* Featured post skeleton */}
          <div className="mb-20">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-8 bg-white rounded-xl shadow-lg overflow-hidden h-80">
              <div className="md:col-span-3 bg-gray-200"></div>
              <div className="md:col-span-2 p-8">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded mb-6 w-2/3"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
              </div>
            </div>
          </div>
          
          {/* Posts grid skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="h-56 bg-gray-200"></div>
                <div className="p-6">
                  <div className="h-4 bg-gray-200 rounded mb-4 w-1/4"></div>
                  <div className="h-6 bg-gray-200 rounded mb-3 w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded mb-4 w-2/3"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  // Show error state
  if (error && blogPosts.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold mb-4 text-gray-900">Recycling-Wissenszentrum</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Derzeit sind keine Artikel verfügbar. Bitte schauen Sie später wieder vorbei.
          </p>
        </div>
        
        <BlogFilters onSearch={handleSearchChange} initialFilters={filters} />
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={() => fetchBlogPosts()}
            className="px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
          >
            Erneut versuchen
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <>
      {/* JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateBlogPageSchema(blogPosts))
        }}
      />
    
      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Header section */}
        <div className="mb-16 text-center">
          <h1 className="text-4xl font-bold mb-4 text-gray-900">Recycling-Wissenszentrum</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Bleiben Sie informiert über die neuesten Nachrichten, Trends und Innovationen rund um nachhaltiges Recycling und Abfallwirtschaft.
          </p>
        </div>
        
        {/* Search and Filter component */}
        <BlogFilters onSearch={handleSearchChange} initialFilters={filters} />
        
        {/* Results summary if searching or filtering */}
        {(filters.search || filters.category !== 'all') && (
          <div className="mb-8 bg-gray-50 rounded-lg p-4">
            <p className="text-gray-700">
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Suche Artikel...
                </span>
              ) : pagination.total === 0 ? (
                'Keine Artikel gefunden für Ihre Suche.'
              ) : (
                `${pagination.total} Artikel gefunden ${
                  filters.search ? `für "${filters.search}"` : ''
                } ${
                  filters.category !== 'all'
                    ? `in der Kategorie "${BLOG_CATEGORIES.find(c => c.value === filters.category)?.name}"`
                    : ''
                }`
              )}
            </p>
          </div>
        )}
        
        {/* Featured Post */}
        {blogPosts.length > 0 && !filters.search && filters.category === 'all' && !loading && (
          <div className="mb-20">
            <Link href={`/blog/${blogPosts[0].slug || blogPosts[0]._id}`} className="block group">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-8 bg-white rounded-xl shadow-lg overflow-hidden">
                <div 
                  className="md:col-span-3 h-80 bg-gray-200 relative"
                  style={{ 
                    backgroundImage: `url(${blogPosts[0].image || '/images/blog-placeholder.jpg'})`, 
                    backgroundSize: 'cover', 
                    backgroundPosition: 'center' 
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent group-hover:opacity-75 transition-opacity"></div>
                  <div className="absolute bottom-0 left-0 p-8 text-white">
                    <span className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium inline-block mb-3">
                      Hervorgehobener Artikel
                    </span>
                    <h2 className="text-3xl font-bold mb-2">{blogPosts[0].title}</h2>
                    <div className="flex items-center text-sm text-white/90">
                      <CalendarIcon className="h-4 w-4 mr-1" />
                      <span>{formatDate(blogPosts[0].date)}</span>
                    </div>
                  </div>
                </div>
                <div className="md:col-span-2 p-8 flex flex-col justify-center">
                  <div className="mb-4">
                    <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium mb-2">
                      {blogPosts[0].category}
                    </span>
                    <div className="flex items-center text-sm text-gray-500 mb-4">
                      <UserCircleIcon className="h-4 w-4 mr-1" />
                      <span>{blogPosts[0].author}</span>
                    </div>
                  </div>
                  <p className="text-gray-600 mb-6">
                    {blogPosts[0].excerpt}
                  </p>
                  <div className="flex items-center text-green-600 font-medium group">
                    Weiterlesen 
                    <ArrowRightIcon className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </Link>
          </div>
        )}
        
        {/* Recent Posts Grid */}
        {blogPosts.length > 0 && !loading && (
          <div className="mb-20">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900">
                {filters.search || filters.category !== 'all'
                  ? 'Suchergebnisse'
                  : 'Aktuelle Artikel'}
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Skip the first post if showing the featured post */}
              {(filters.search || filters.category !== 'all' ? blogPosts : blogPosts.slice(1)).map((post: BlogPost) => (
                <div key={post._id} className="bg-white rounded-xl shadow-md overflow-hidden transition-transform hover:-translate-y-1 hover:shadow-lg">
                  <Link href={`/blog/${post.slug || post._id}`} className="block group">
                    <div className="h-56 relative">
                      <Image
                        src={post.image || '/images/blog-placeholder.jpg'}
                        alt={post.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                      <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors"></div>
                    </div>
                    <div className="p-6">
                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          {post.category}
                        </span>
                        {post.tags && post.tags.length > 0 && post.tags[0] && (
                          <span className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                            <TagIcon className="h-3 w-3 mr-1" />
                            {post.tags[0]}
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl font-bold mb-2 text-gray-900 group-hover:text-green-600 transition-colors">
                        {post.title}
                      </h3>
                      <p className="text-gray-600 mb-4 line-clamp-3">
                        {post.excerpt}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-sm text-gray-500">
                          <CalendarIcon className="h-4 w-4 mr-1" />
                          <span>{formatDate(post.date)}</span>
                        </div>
                        <span className="text-green-600 text-sm font-medium">Weiterlesen</span>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Loading overlay */}
        {loading && blogPosts.length > 0 && (
          <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl">
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Artikel werden geladen...</span>
              </div>
            </div>
          </div>
        )}
        
        {/* Pagination */}
        {!loading && renderPagination()}
        
        {/* No results message */}
        {blogPosts.length === 0 && !loading && !error && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">Keine Artikel gefunden</h3>
            <p className="mt-1 text-gray-500">
              Versuchen Sie es mit anderen Suchbegriffen oder Filtern.
            </p>
            <div className="mt-6">
              <button
                onClick={clearFilters}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
              >
                Filter zurücksetzen
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
} 