import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { prisma } from '@/lib/db/prisma'; // Use direct Prisma access
import PaginationControls from '@/components/ui/PaginationControls'; // Assuming this path
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, User, Tag as TagIcon } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

const POSTS_PER_PAGE = 9;

// Define the structure of a blog post summary
// Based on the select clause in the API route
type BlogPostSummary = {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    image_url: string | null;
    published_at: Date | null;
    author_name: string | null;
    category: string | null;
    featured: boolean;
};

// Helper function to fetch blog posts (can be moved to lib)
async function getPublishedBlogPosts(page: number, limit: number): Promise<{ posts: BlogPostSummary[], totalPages: number, currentPage: number }> {
    const skip = (page - 1) * limit;
    const now = new Date();
    const whereClause = {
        status: 'published',
        published_at: { lte: now },
    };

    try {
        const totalPosts = await prisma.blogPost.count({ where: whereClause });
        const posts = await prisma.blogPost.findMany({
            where: whereClause,
            select: {
                id: true,
                title: true,
                slug: true,
                excerpt: true,
                image_url: true,
                published_at: true,
                author_name: true,
                category: true,
                featured: true,
            },
            orderBy: { published_at: 'desc' },
            skip: skip,
            take: limit,
        });

        const totalPages = Math.ceil(totalPosts / limit);
        // Ensure published_at is serialized correctly if needed, but Prisma handles Date objects
        // const serializedPosts = posts.map(post => ({ ...post, published_at: post.published_at?.toISOString() }));
        
        return { posts, totalPages, currentPage: page };
    } catch (error) {
        console.error("Error fetching blog posts:", error);
        return { posts: [], totalPages: 0, currentPage: page }; // Return empty on error
    }
}

// --- Blog Card Component (Colocated for simplicity) ---
interface BlogCardProps {
    post: BlogPostSummary;
}

function BlogCard({ post }: BlogCardProps) {
    return (
        <Link href={`/blog/${post.slug}`} className="group block h-full">
            <Card className="flex flex-col h-full overflow-hidden border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300 ease-in-out">
                <div className="relative w-full h-48 bg-muted overflow-hidden">
                    {post.image_url ? (
                        <Image 
                            src={post.image_url}
                            alt={post.title}
                            fill
                            style={{ objectFit: 'cover' }}
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className="transition-transform duration-300 ease-in-out group-hover:scale-105"
                        />
                    ) : (
                         <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-secondary/50">
                            {/* Placeholder icon or gradient */}
                        </div>
                    )}
                </div>
                <CardHeader>
                    {post.category && (
                        <Badge variant="outline" className="mb-2 self-start">{post.category}</Badge>
                    )}
                    <CardTitle className="text-xl font-semibold group-hover:text-primary transition-colors duration-200 line-clamp-2">{post.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow">
                    {post.excerpt && (
                        <p className="text-muted-foreground text-sm line-clamp-3">{post.excerpt}</p>
                    )}
                </CardContent>
                <CardFooter className="text-xs text-muted-foreground border-t border-border/60 pt-3 flex flex-col items-start gap-1.5">
                     <div className="flex items-center gap-1.5">
                         <User className="h-3.5 w-3.5" />
                         <span>{post.author_name || 'Unbekannt'}</span>
                     </div>
                     {post.published_at && (
                        <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" />
                            <time dateTime={post.published_at.toISOString()}>
                                {format(post.published_at, 'PPP', { locale: de })}
                            </time>
                        </div>
                     )}
                </CardFooter>
            </Card>
        </Link>
    );
}

// --- Main Blog Page Component ---
interface BlogPageProps {
    searchParams?: { [key: string]: string | string[] | undefined };
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
    const page = parseInt(searchParams?.page as string || '1', 10);
    const validatedPage = Math.max(1, isNaN(page) ? 1 : page);

    const { posts, totalPages, currentPage } = await getPublishedBlogPosts(validatedPage, POSTS_PER_PAGE);

    return (
        <div className="container mx-auto px-4 py-12">
            <h1 className="text-3xl md:text-4xl font-bold mb-8">Blog</h1>
            
            {posts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                    {posts.map((post) => (
                        <BlogCard key={post.id} post={post} />
                    ))}
                </div>
            ) : (
                <p className="text-center text-muted-foreground py-10">Keine Blogbeiträge gefunden.</p>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center">
                     <PaginationControls 
                        currentPage={currentPage}
                        totalPages={totalPages}
                        baseUrl="/blog" 
                    />
                </div>
            )}
        </div>
    );
} 