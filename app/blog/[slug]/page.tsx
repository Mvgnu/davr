import React from 'react';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import DOMPurify from 'isomorphic-dompurify';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  author_name: string | null;
  category: string | null;
  published_at: Date | null;
  created_at: Date;
  updated_at: Date;
  status: string;
  featured: boolean;
  image_url: string | null;
}

async function getBlogPost(slug: string): Promise<BlogPost | null> {
  try {
    const post = await prisma.blogPost.findUnique({
      where: { 
        slug,
        status: 'published'
      },
    });

    if (!post) {
      return null;
    }

    return {
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      author_name: post.author_name,
      category: post.category,
      published_at: post.published_at,
      created_at: post.created_at,
      updated_at: post.updated_at,
      status: post.status,
      featured: post.featured,
      image_url: post.image_url,
    };
  } catch (error) {
    console.error('Error fetching blog post:', error);
    return null;
  }
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await getBlogPost(params.slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Button variant="outline" asChild>
          <Link href="/blog">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück zum Blog
          </Link>
        </Button>
      </div>

      <article className="space-y-8">
        <header className="space-y-4">
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {post.category && (
              <span className="px-2 py-1 bg-primary/10 text-primary rounded-full">
                {post.category}
              </span>
            )}
            <time dateTime={post.published_at?.toISOString() || post.created_at.toISOString()}>
              {format(post.published_at || post.created_at, 'PPP', { locale: de })}
            </time>
            {post.author_name && (
              <span>Von {post.author_name}</span>
            )}
          </div>

          <h1 className="text-4xl font-bold tracking-tight">{post.title}</h1>

          {post.excerpt && (
            <p className="text-xl text-muted-foreground">
              {post.excerpt}
            </p>
          )}
        </header>

        {post.image_url && (
          <div className="rounded-lg overflow-hidden">
            <img 
              src={post.image_url} 
              alt={post.title} 
              className="w-full h-96 object-cover"
            />
          </div>
        )}

        <div 
          className="prose prose-lg max-w-none dark:prose-invert"
          dangerouslySetInnerHTML={{ 
            __html: DOMPurify.sanitize(post.content) 
          }}
        />
      </article>

      <footer className="mt-12 pt-8 border-t border-border">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            Zuletzt aktualisiert:{' '}
            <time dateTime={post.updated_at.toISOString()}>
              {format(post.updated_at, 'PPP', { locale: de })}
            </time>
          </div>
          <Button variant="outline" asChild>
            <Link href="/blog">
              Mehr Blog-Beiträge
            </Link>
          </Button>
        </div>
      </footer>
    </div>
  );
}