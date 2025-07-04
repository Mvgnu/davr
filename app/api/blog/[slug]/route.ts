import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(
    request: NextRequest, 
    { params }: { params: { slug: string } }
) {
    const slug = params.slug;

    if (!slug) {
        return NextResponse.json({ error: 'Slug parameter is required' }, { status: 400 });
    }

    try {
        const now = new Date();
        const post = await prisma.blogPost.findUnique({
            where: { 
                slug: slug, 
                // Ensure the post is published and the publish date is not in the future
                status: 'published',
                published_at: {
                    lte: now
                }
            },
            // Select all fields needed for the detail page
            // select: { ... } // Omit select to get all fields by default
        });

        if (!post) {
            return NextResponse.json({ error: 'Blog post not found or not published yet' }, { status: 404 });
        }

        return NextResponse.json(post);

    } catch (error) {
        console.error(`[GET Blog Post by Slug Error - ${slug}]`, error);
        return NextResponse.json({ error: 'Failed to fetch blog post' }, { status: 500 });
    }
} 