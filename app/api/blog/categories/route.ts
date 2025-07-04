import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

/**
 * GET handler to retrieve all distinct blog post categories
 */
export async function GET(request: Request) {
    try {
        const distinctCategories = await prisma.blogPost.findMany({
            where: {
                category: { not: null }, // Ensure category is not null
                status: 'published' // Optionally fetch only from published posts?
            },
            distinct: ['category'], // Get distinct categories
            select: {
                category: true,
            },
            orderBy: {
                category: 'asc',
            },
        });

        // Extract the category names from the result
        const categories = distinctCategories.map(item => item.category).filter(Boolean) as string[]; // Filter out null/undefined just in case

        return NextResponse.json(categories);

    } catch (error: any) {
        console.error('[GET Blog Categories Error]', error);
        return NextResponse.json(
            { error: 'Failed to fetch blog categories', details: error.message },
            { status: 500 }
        );
    }
} 