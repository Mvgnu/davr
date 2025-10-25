import React from 'react';
import { prisma } from '@/lib/db/prisma';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  author_name: string | null;
  category: string | null;
  published_at: Date | null;
  created_at: Date;
  status: string;
  image_url: string | null;
}

async function getBlogPosts(page: number = 1, limit: number = 10) {
  try {
    const skip = (page - 1) * limit;

    const [posts, totalPosts] = await prisma.$transaction([
      prisma.blogPost.findMany({
        where: { 
          status: 'published'
        },
        skip: skip,
        take: limit,
        orderBy: {
          published_at: 'desc',
          created_at: 'desc',
        },
      }),
      prisma.blogPost.count({
        where: { 
          status: 'published'
        },
      }),
    ]);

    const totalPages = Math.ceil(totalPosts / limit);

    return {
      posts: posts.map(post => ({
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        author_name: post.author_name,
        category: post.category,
        published_at: post.published_at,
        created_at: post.created_at,
        status: post.status,
        image_url: post.image_url,
      })),
      pagination: {
        currentPage: page,
        totalPages,
        pageSize: limit,
        totalItems: totalPosts,
      }
    };
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return {
      posts: [],
      pagination: {
        currentPage: 1,
        totalPages: 1,
        pageSize: 10,
        totalItems: 0,
      }
    };
  }
}

export default async function BlogPage({ searchParams }: { searchParams?: { page?: string } }) {
  const page = parseInt(searchParams?.page || '1', 10);
  const { posts, pagination } = await getBlogPosts(page, 10);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-4">Unser Blog</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Erfahren Sie mehr über Aluminium-Recycling, Nachhaltigkeit und aktuelle Neuigkeiten aus der Branche.
        </p>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Keine Blog-Beiträge gefunden.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post) => (
            <Card key={post.id} className="flex flex-col overflow-hidden hover:shadow-lg transition-shadow">
              {post.image_url && (
                <div className="aspect-video overflow-hidden">
                  <img 
                    src={post.image_url} 
                    alt={post.title} 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              <CardHeader className="flex-grow">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {post.category && (
                    <Badge variant="secondary">{post.category}</Badge>
                  )}
                  <time 
                    dateTime={post.published_at?.toISOString() || post.created_at.toISOString()}
                    className="text-xs text-muted-foreground"
                  >
                    {format(post.published_at || post.created_at, 'PPP', { locale: de })}
                  </time>
                </div>
                
                <CardTitle className="text-xl mb-2 line-clamp-2">
                  {post.title}
                </CardTitle>
                
                {post.excerpt && (
                  <CardDescription className="line-clamp-3">
                    {post.excerpt}
                  </CardDescription>
                )}
              </CardHeader>
              
              <CardContent>
                <Button asChild variant="outline" className="w-full">
                  <Link href={`/blog/${post.slug}`}>
                    Weiterlesen
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-12">
          <Button
            variant="outline"
            disabled={page === 1}
            asChild
          >
            <Link href={`/blog?page=${page - 1}`}>
              Vorherige
            </Link>
          </Button>
          
          <div className="text-sm text-muted-foreground">
            Seite {page} von {pagination.totalPages}
          </div>
          
          <Button
            variant="outline"
            disabled={page === pagination.totalPages}
            asChild
          >
            <Link href={`/blog?page=${page + 1}`}>
              Nächste
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}