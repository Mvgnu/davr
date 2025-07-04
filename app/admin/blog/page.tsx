// No 'use client' - this will be a Server Component to fetch data
import { Metadata } from 'next'; // Metadata can still be exported
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
  PlusCircle,
  Trash2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { prisma } from '@/lib/db/prisma'; // Import Prisma client
import { format } from 'date-fns'; // For date formatting
import { de } from 'date-fns/locale'; // German locale for date formatting
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/options';
import { redirect, useSearchParams } from 'next/navigation';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"; // Import actual dropdown
import BlogActionsDropdown from '@/components/admin/BlogActionsDropdown'; // Import the actual dropdown component
import AdminBlogDeleteButton from '@/components/admin/AdminBlogDeleteButton'; // Import the client-side delete button component
import { ServerPaginationControls } from '@/components/ui/ServerPaginationControls'; // Import the new component

// Type for blog post
interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  author: string;
  category: string;
  publishedAt: string | null;
  updatedAt: string | null;
  status: 'published' | 'draft' | 'archived';
  featured: boolean;
}

// Sample data for blog posts
const blogPosts: BlogPost[] = [
  {
    id: '1',
    title: 'Recycling in Deutschland: Aktuelle Trends und Entwicklungen',
    slug: 'recycling-deutschland-trends-entwicklungen',
    excerpt: 'Ein Überblick über die neuesten Entwicklungen im deutschen Recyclingsektor und was dies für die Zukunft bedeutet.',
    author: 'Dr. Martina Weber',
    category: 'Trends',
    publishedAt: '2024-03-15',
    updatedAt: '2024-04-05',
    status: 'published',
    featured: true,
  },
  {
    id: '2',
    title: 'Die Wirtschaftlichkeit von Aluminium-Recycling',
    slug: 'wirtschaftlichkeit-aluminium-recycling',
    excerpt: 'Warum das Recycling von Aluminium sowohl ökologisch als auch ökonomisch sinnvoll ist.',
    author: 'Prof. Thomas Schmidt',
    category: 'Wirtschaft',
    publishedAt: '2024-02-20',
    updatedAt: null,
    status: 'published',
    featured: false,
  },
  {
    id: '3',
    title: 'Neue EU-Richtlinien für Recyclingquoten: Was ändert sich?',
    slug: 'eu-richtlinien-recyclingquoten-aenderungen',
    excerpt: 'Analyse der neuen EU-Verordnungen und deren Auswirkungen auf die deutsche Recyclingbranche.',
    author: 'Maria Schulz',
    category: 'Politik',
    publishedAt: '2024-04-02',
    updatedAt: null,
    status: 'published',
    featured: false,
  },
  {
    id: '4',
    title: 'Circular Economy: Vom Abfall zum Wertstoff',
    slug: 'circular-economy-abfall-wertstoff',
    excerpt: 'Wie moderne Kreislaufwirtschaft funktioniert und welche Vorteile sie bietet.',
    author: 'Dr. Frank Müller',
    category: 'Nachhaltigkeit',
    publishedAt: '2024-01-30',
    updatedAt: '2024-03-18',
    status: 'published',
    featured: true,
  },
  {
    id: '5',
    title: 'Innovationen im Kunststoffrecycling',
    slug: 'innovationen-kunststoffrecycling',
    excerpt: 'Die neuesten technologischen Durchbrüche im Bereich des Kunststoffrecyclings.',
    author: 'Dr. Martina Weber',
    category: 'Technologie',
    publishedAt: null,
    updatedAt: null,
    status: 'draft',
    featured: false,
  },
  {
    id: '6',
    title: 'Recycling im Alltag: Praktische Tipps für jeden Haushalt',
    slug: 'recycling-alltag-tipps-haushalte',
    excerpt: 'Einfache und effektive Methoden, um den eigenen Abfall zu reduzieren und richtig zu trennen.',
    author: 'Laura Becker',
    category: 'Tipps',
    publishedAt: '2024-03-25',
    updatedAt: null,
    status: 'published',
    featured: false,
  },
  {
    id: '7',
    title: 'Die Zukunft des E-Waste-Recyclings',
    slug: 'zukunft-ewaste-recycling',
    excerpt: 'Herausforderungen und Chancen beim Recycling elektronischer Abfälle in den kommenden Jahren.',
    author: 'Prof. Thomas Schmidt',
    category: 'Technologie',
    publishedAt: null,
    updatedAt: null,
    status: 'draft',
    featured: false,
  },
  {
    id: '8',
    title: 'Städtische Recyclingprogramme im Vergleich',
    slug: 'staedtische-recyclingprogramme-vergleich',
    excerpt: 'Analyse der Recyclingkonzepte verschiedener deutscher Großstädte und deren Erfolge.',
    author: 'Maria Schulz',
    category: 'Städte',
    publishedAt: '2024-02-15',
    updatedAt: '2024-04-10',
    status: 'published',
    featured: false,
  },
  {
    id: '9',
    title: 'Die Rolle der Künstlichen Intelligenz im modernen Recycling',
    slug: 'kuenstliche-intelligenz-modernes-recycling',
    excerpt: 'Wie KI und maschinelles Lernen die Sortierung und Verarbeitung von Recyclingmaterialien revolutionieren.',
    author: 'Dr. Frank Müller',
    category: 'Technologie',
    publishedAt: '2024-04-08',
    updatedAt: null,
    status: 'published',
    featured: false,
  },
  {
    id: '10',
    title: 'Recycling-Mythen entlarvt: Was stimmt wirklich?',
    slug: 'recycling-mythen-entlarvt',
    excerpt: 'Wir räumen mit den gängigsten Missverständnissen und Fehlinformationen über Recycling auf.',
    author: 'Laura Becker',
    category: 'Aufklärung',
    publishedAt: null,
    updatedAt: null,
    status: 'draft',
    featured: false,
  }
];

export const metadata: Metadata = {
  title: 'Admin - Blog verwalten',
  description: 'Blog-Artikel erstellen, bearbeiten und veröffentlichen',
};

// Define the type for the selected post fields
type PostForTable = {
  id: string;
  title: string;
  slug: string;
  author_name: string | null;
  category: string | null;
  published_at: Date | null;
  updated_at: Date | null;
  status: string; // Matches the expected prop type for BlogActionsDropdown
};

// Fetch paginated posts
async function getPaginatedBlogPosts(page: number, pageSize: number) {
  const skip = (page - 1) * pageSize;
  const take = pageSize;

  try {
    const posts = await prisma.blogPost.findMany({
      skip: skip,
      take: take,
      orderBy: { created_at: 'desc' }, // Order by creation date
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        published_at: true,
        created_at: true, // Keep created_at if needed elsewhere, or remove if only for sorting
        updated_at: true,
        author_name: true,
      }
    });

    const totalCount = await prisma.blogPost.count(); // Get total count for pagination

    return { posts, totalCount };
  } catch (error) {
    console.error("Failed to fetch paginated blog posts for admin:", error);
    return { posts: [], totalCount: 0 };
  }
}

export default async function AdminBlogPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) { // Accept searchParams
  const session = await getServerSession(authOptions);

  // Admin check
  if (!session?.user?.isAdmin) {
    redirect('/login?callbackUrl=/admin/blog');
  }

  const currentPage = parseInt(searchParams?.page as string || '1', 10);
  const pageSize = 10; // Or make this configurable

  const { posts, totalCount } = await getPaginatedBlogPosts(currentPage, pageSize);
  const totalPages = Math.ceil(totalCount / pageSize);

  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "outline" | "destructive" => {
    switch (status) {
      case 'published': return 'default';
      case 'draft': return 'secondary';
      case 'archived': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Blog Post Management</h1>
        <Link href="/admin/blog/new">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Create New Post
          </Button>
        </Link>
      </div>

      <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Published</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {posts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No blog posts found for this page.
                </TableCell>
              </TableRow>
            ) : (
              posts.map((post) => (
                <TableRow key={post.id}>
                  <TableCell className="font-medium">
                    <Link href={`/blog/${post.slug}`} target="_blank" className="hover:underline" title="View Published Post (if applicable)">
                      {post.title}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(post.status)}>
                      {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>{post.author_name || 'N/A'}</TableCell>
                  <TableCell>
                    {post.published_at ? format(post.published_at, 'Pp', { locale: de }) : '-'}
                  </TableCell>
                  <TableCell>
                    {/* Use created_at as fallback if updated_at is null/same */}
                    {format(post.updated_at || post.created_at, 'Pp', { locale: de })} 
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/admin/blog/edit/${post.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                      </Link>
                      <AdminBlogDeleteButton postId={post.id} postTitle={post.title} />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls - Server Component Implementation */}
      {totalPages > 1 && (
        <ServerPaginationControls 
          currentPage={currentPage} 
          totalPages={totalPages} 
          baseUrl="/admin/blog" 
        />
      )}
    </div>
  );
} 