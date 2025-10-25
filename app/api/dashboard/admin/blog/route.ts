import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/permissions';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';
import path from 'path';

// GET handler to fetch all blog posts (Admin Only)
export async function GET(request: Request) {
  try {
    await requireRole('ADMIN');

    // Handle Pagination
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const skip = (page - 1) * limit;

    // Fetch blog posts from the database with relations and pagination
    const [posts, totalPosts] = await prisma.$transaction([
      prisma.blogPost.findMany({
        skip: skip,
        take: limit,
        orderBy: {
          created_at: 'desc',
        },
        // No relations to include since BlogPost doesn't have author relation
      }),
      prisma.blogPost.count(), // Get the total count for pagination
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalPosts / limit);

    // Return the paginated list
    return NextResponse.json({
      success: true,
      data: {
        posts,
        pagination: {
          currentPage: page,
          totalPages,
          pageSize: limit,
          totalItems: totalPosts,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
    });

  } catch (error) {
    console.error('[GET Dashboard Admin Blog Posts Error]', error);

    if (error instanceof Error) {
      if (error.message === 'UNAUTHORIZED') {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      if (error.message === 'FORBIDDEN') {
        return NextResponse.json(
          { error: 'Admin access required' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to fetch blog posts' },
      { status: 500 }
    );
  }
}

// POST handler to create a new blog post (Admin Only)
export async function POST(request: Request) {
  try {
    await requireRole('ADMIN');

    const body = await request.json();
    
    // Validate the input
    const blogPostSchema = z.object({
      title: z.string().min(1, "Title is required"),
      content: z.string().min(1, "Content is required"),
      excerpt: z.string().optional(),
      slug: z.string().min(1, "Slug is required"),
      author_name: z.string().min(1, "Author name is required"),
      published: z.boolean().optional().default(false),
      featured_image_url: z.string().optional(),
      tags: z.array(z.string()).optional(),
      category: z.string().optional(),
    });
    
    const validationResult = blogPostSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.errors },
        { status: 400 }
      );
    }
    
    const { title, content, excerpt, slug, author_name, published, featured_image_url, tags, category } = validationResult.data;
    
    // Check if slug already exists
    const existing = await prisma.blogPost.findUnique({
      where: { slug },
    });
    
    if (existing) {
      return NextResponse.json(
        { error: 'A blog post with this slug already exists' },
        { status: 400 }
      );
    }
    
    const newPost = await prisma.blogPost.create({
      data: {
        title,
        content,
        excerpt: excerpt || null,
        slug,
        author_name,
        status: published ? 'published' : 'draft',
        image_url: featured_image_url || null,
        category: category || null,
      },
    });

    return NextResponse.json({ 
      success: true, 
      data: newPost 
    });
  } catch (error) {
    console.error('[POST Dashboard Admin Blog Posts Error]', error);

    if (error instanceof Error) {
      if (error.message === 'UNAUTHORIZED') {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      if (error.message === 'FORBIDDEN') {
        return NextResponse.json(
          { error: 'Admin access required' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to create blog post' },
      { status: 500 }
    );
  }
}

// PUT handler to update a blog post (Admin Only)
export async function PUT(request: Request) {
  try {
    await requireRole('ADMIN');

    const body = await request.json();
    
    // Validate the input
    const blogPostSchema = z.object({
      id: z.string().cuid(),
      title: z.string().min(1, "Title is required").optional(),
      content: z.string().min(1, "Content is required").optional(),
      excerpt: z.string().optional(),
      slug: z.string().min(1, "Slug is required").optional(),
      author_name: z.string().min(1, "Author name is required").optional(),
      published: z.boolean().optional(),
      featured_image_url: z.string().optional(),
      tags: z.array(z.string()).optional(),
      category: z.string().optional(),
    });
    
    const validationResult = blogPostSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.errors },
        { status: 400 }
      );
    }
    
    const { id, title, content, excerpt, slug, author_name, published, featured_image_url, tags, category } = validationResult.data;
    
    // Check if slug already exists for a different post
    if (slug) {
      const existing = await prisma.blogPost.findUnique({
        where: { slug },
      });
      
      if (existing && existing.id !== id) {
        return NextResponse.json(
          { error: 'A blog post with this slug already exists' },
          { status: 400 }
        );
      }
    }
    
    // Update the blog post
    const updatedPost = await prisma.blogPost.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(excerpt !== undefined && { excerpt: excerpt || null }),
        ...(slug !== undefined && { slug }),
        ...(author_name !== undefined && { author_name }),
        ...(published !== undefined && { status: published ? 'published' : 'draft' }),
        ...(featured_image_url !== undefined && { image_url: featured_image_url || null }),
        ...(category !== undefined && { category: category || null }),
        updated_at: new Date(),
      },
    });

    return NextResponse.json({ 
      success: true, 
      data: updatedPost 
    });
  } catch (error) {
    console.error('[PUT Dashboard Admin Blog Posts Error]', error);

    if (error instanceof Error) {
      if (error.message === 'UNAUTHORIZED') {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      if (error.message === 'FORBIDDEN') {
        return NextResponse.json(
          { error: 'Admin access required' },
          { status: 403 }
        );
      }
      
      if (error.message.includes('Record to update not found')) {
        return NextResponse.json(
          { error: 'Blog post not found' },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to update blog post' },
      { status: 500 }
    );
  }
}

// DELETE handler to delete a blog post (Admin Only)
export async function DELETE(request: Request) {
  try {
    await requireRole('ADMIN');

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Blog post ID is required' },
        { status: 400 }
      );
    }

    // Check if blog post exists
    const existingPost = await prisma.blogPost.findUnique({
      where: { id },
    });

    if (!existingPost) {
      return NextResponse.json(
        { error: 'Blog post not found' },
        { status: 404 }
      );
    }

    // Delete the blog post
    await prisma.blogPost.delete({
      where: { id },
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Blog post deleted successfully' 
    });
  } catch (error) {
    console.error('[DELETE Dashboard Admin Blog Posts Error]', error);

    if (error instanceof Error) {
      if (error.message === 'UNAUTHORIZED') {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      if (error.message === 'FORBIDDEN') {
        return NextResponse.json(
          { error: 'Admin access required' },
          { status: 403 }
        );
      }
      
      if (error.message.includes('Record to delete does not exist')) {
        return NextResponse.json(
          { error: 'Blog post not found' },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to delete blog post' },
      { status: 500 }
    );
  }
}