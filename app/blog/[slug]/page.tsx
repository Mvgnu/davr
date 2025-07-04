import React from 'react';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Calendar, User, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Fetch function (can be moved to lib)
async function getPublishedPostBySlug(slug: string) {
    if (!slug) {
        notFound();
    }
    try {
        const now = new Date();
        const post = await prisma.blogPost.findUnique({
            where: { 
                slug: slug, 
                status: 'published',
                published_at: { lte: now }
            },
            // Select all fields by default
        });

        if (!post) {
            notFound(); // Post not found or not published
        }
        return post;
    } catch (error) {
        console.error(`Error fetching blog post by slug ${slug}:`, error);
        notFound();
    }
}

interface BlogPostPageProps {
    params: { slug: string };
}

// Optional: Generate Metadata for SEO
// export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
//     const post = await getPublishedPostBySlug(params.slug);
//     return {
//         title: post.title,
//         description: post.excerpt,
//         // Add other metadata like open graph tags
//     };
// }

export default async function BlogPostPage({ params }: BlogPostPageProps) {
    const post = await getPublishedPostBySlug(params.slug);

    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl">
            {/* Back Link */}
             <Link 
                href="/blog" 
                className="mb-8 inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 group"
            >
                <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform duration-200"/> Zurück zum Blog
            </Link>

            <article>
                {/* Header Section */}
                <header className="mb-8">
                    {post.category && (
                        <Badge variant="secondary" className="mb-2">{post.category}</Badge>
                    )}
                    <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-3">{post.title}</h1>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                         <div className="flex items-center gap-1.5">
                             <User className="h-4 w-4" />
                             <span>{post.author_name || 'Unbekannt'}</span>
                         </div>
                         {post.published_at && (
                            <div className="flex items-center gap-1.5">
                                <Calendar className="h-4 w-4" />
                                <time dateTime={post.published_at.toISOString()}>
                                    {format(post.published_at, 'PPP', { locale: de })}
                                </time>
                            </div>
                         )}
                    </div>
                </header>

                {/* Featured Image */}
                {post.image_url && (
                    <div className="relative w-full h-64 md:h-96 mb-8 rounded-lg overflow-hidden shadow-lg">
                        <Image
                            src={post.image_url}
                            alt={post.title}
                            fill
                            style={{ objectFit: 'cover' }}
                            priority
                        />
                    </div>
                )}

                {/* Post Content - Rendered using ReactMarkdown */}
                <div className="prose prose-lg dark:prose-invert max-w-none">
                   <ReactMarkdown remarkPlugins={[remarkGfm]}>
                       {post.content} 
                   </ReactMarkdown>
                </div>
            </article>
        </div>
    );
} 