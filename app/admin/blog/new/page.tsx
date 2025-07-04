import React from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/options';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import BlogPostForm from '@/components/admin/BlogPostForm'; // Import the form component

export default async function NewBlogPostPage() {
    const session = await getServerSession(authOptions);

    // Admin check
    if (!session?.user?.isAdmin) {
        redirect('/login?callbackUrl=/admin/blog/new'); 
    }

    return (
        <div className="container mx-auto px-4 py-12">
            {/* Back Link */}
            <Link 
                href="/admin/blog" 
                className="mb-8 inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 group"
            >
                <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform duration-200"/> Zurück zur Blog-Übersicht
            </Link>

            {/* Render the form component */}
            <BlogPostForm /> 
            {/* Pass initialData={null} or similar if form handles edit mode */}
        </div>
    );
} 