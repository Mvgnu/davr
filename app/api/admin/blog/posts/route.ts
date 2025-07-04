import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/options';
import { prisma } from '@/lib/db/prisma';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic'; // Mark route as dynamic

// GET endpoint for fetching blog posts (admin view) - using Prisma
export async function GET(request: NextRequest) {
  try {
    // 1. Check Authentication & Authorization
    const session = await getServerSession(authOptions);
    const userIsAdmin = session?.user?.isAdmin === true;

    if (!session?.user?.id || !userIsAdmin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    // 2. Parse query parameters for filtering, sorting, and pagination
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const status = searchParams.get('status'); // e.g., 'published', 'draft'
    const category = searchParams.get('category');
    const featured = searchParams.get('featured'); // e.g., 'true', 'false'
    const searchTerm = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';
    const skip = (page - 1) * limit;

    // 3. Build Prisma WHERE clause
    let where: Prisma.BlogPostWhereInput = {};

    if (status && status !== 'all') {
      where.status = status;
    }
    if (category && category !== 'all') {
      where.category = category;
    }
    if (featured === 'true') {
      where.featured = true;
    } else if (featured === 'false') {
      where.featured = false;
    }

    if (searchTerm) {
      where.OR = [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { excerpt: { contains: searchTerm, mode: 'insensitive' } },
        { content: { contains: searchTerm, mode: 'insensitive' } },
        { author_name: { contains: searchTerm, mode: 'insensitive' } },
        { category: { contains: searchTerm, mode: 'insensitive' } }
      ];
    }

    // 4. Build Prisma ORDER BY clause
    let orderBy: Prisma.BlogPostOrderByWithRelationInput = {};
    if (sortBy === 'createdAt') orderBy.created_at = sortOrder;
    if (sortBy === 'updatedAt') orderBy.updated_at = sortOrder;
    if (sortBy === 'publishedAt') orderBy.published_at = sortOrder;
    if (sortBy === 'title') orderBy.title = sortOrder;
    if (sortBy === 'author') orderBy.author_name = sortOrder;
    if (sortBy === 'category') orderBy.category = sortOrder;
    if (sortBy === 'status') orderBy.status = sortOrder;
    // Add other sort options as needed

    // 5. Execute Prisma queries (fetch posts and total count)
    const [posts, totalPosts] = await prisma.$transaction([
      prisma.blogPost.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        // Select fields needed for the admin list view
        select: {
            id: true,
            title: true,
            slug: true,
            author_name: true,
            category: true,
            published_at: true,
            created_at: true, // Include created_at for default sort
            updated_at: true,
            status: true,
            featured: true
        }
      }),
      prisma.blogPost.count({ where }),
    ]);

    // 6. Calculate pagination metadata
    const totalPages = Math.ceil(totalPosts / limit);

    return NextResponse.json({
      success: true,
      data: posts,
      pagination: {
        page,
        limit,
        totalCount: totalPosts,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching blog posts [Prisma]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error fetching blog posts' },
      { status: 500 }
    );
  }
} 