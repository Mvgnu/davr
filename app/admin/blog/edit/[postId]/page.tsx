import React from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/options';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';
import BlogPostForm from '@/components/admin/BlogPostForm'; // Import the form component

// Fetch function (can be moved to lib)
async function getBlogPostData(postId: string) {
     if (!z.string().cuid().safeParse(postId).success) {
        notFound(); // Invalid ID format
    }
    try {
        const post = await prisma.blogPost.findUnique({
            where: { id: postId },
             // Select fields needed by the form - ensure they match form schema
             select: {
                id: true,
                title: true,
                slug: true,
                content: true,
                excerpt: true,
                category: true,
                status: true, 
                featured: true,
                image_url: true,
                // Don't fetch fields the form doesn't handle like created_at, author_name etc.
             }
        });
        if (!post) {
            notFound(); // Post does not exist
        }
        // Cast status to the specific enum type expected by the form schema if necessary
        // This assumes the form schema uses the same enum values as Prisma
        return post as Omit<NonNullable<typeof post>, 'status'> & { status: 'draft' | 'published' | 'archived' }; 
    } catch (error) {
        console.error(`Failed to fetch blog post ${postId} for edit:`, error);
        notFound(); 
    }
}

interface EditBlogPostPageProps {
    params: { postId: string };
}

export default async function EditBlogPostPage({ params }: EditBlogPostPageProps) {
    const session = await getServerSession(authOptions);
    const { postId } = params;

    // Admin check
    if (!session?.user?.isAdmin) {
        redirect(`/login?callbackUrl=/admin/blog/edit/${postId}`); 
    }

    const postData = await getBlogPostData(postId);

    return (
        <div className="container mx-auto px-4 py-12">
            {/* Back Link */}
            <Link 
                href="/admin/blog" 
                className="mb-8 inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 group"
            >
                <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform duration-200"/> Zurück zur Blog-Übersicht
            </Link>

            {/* Render the form component with initial data and postId */}
            <BlogPostForm 
                postId={postId}
                initialData={postData}
            /> 
        </div>
    );
} 