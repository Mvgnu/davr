import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/options';
import slugify from 'slugify'; // Using slugify library

// Schema for pagination query parameters
const paginationSchema = z.object({
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(50).optional().default(10),
});

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    
    // Validate pagination parameters
    const parseResult = paginationSchema.safeParse({
        page: searchParams.get('page'),
        limit: searchParams.get('limit'),
    });

    if (!parseResult.success) {
        return NextResponse.json({ error: 'Invalid pagination parameters', details: parseResult.error.flatten() }, { status: 400 });
    }

    const { page, limit } = parseResult.data;
    const skip = (page - 1) * limit;

    try {
        const now = new Date();
        const whereClause = {
            status: 'published',
            published_at: { 
                lte: now // Less than or equal to now
            },
        };

        // Fetch total count of published posts
        const totalPosts = await prisma.blogPost.count({
            where: whereClause,
        });

        // Fetch paginated published posts
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
            orderBy: {
                published_at: 'desc' // Show newest first
            },
            skip: skip,
            take: limit,
        });

        const totalPages = Math.ceil(totalPosts / limit);

        return NextResponse.json({
            posts,
            pagination: {
                currentPage: page,
                totalPages,
                totalPosts,
                limit,
            }
        });

    } catch (error) {
        console.error('[GET Blog Posts Error]', error);
        return NextResponse.json({ error: 'Failed to fetch blog posts' }, { status: 500 });
    }
}

// POST handler will be added later for admin actions 

// --- POST Handler: Create a new blog post (Admin Only) ---

const blogPostCreateSchema = z.object({
    title: z.string().min(3, 'Title must be at least 3 characters').max(200),
    content: z.string().min(10, 'Content is too short'),
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { message: "Slug must be lowercase alphanumeric with hyphens" }).optional(), // Optional, generated if missing
    excerpt: z.string().max(500).optional().nullable(),
    category: z.string().max(50).optional().nullable(),
    status: z.enum(['draft', 'published', 'archived']).optional().default('draft'),
    featured: z.boolean().optional().default(false),
    image_url: z.string().url().optional().nullable(),
    // published_at: Managed based on status
    // author_name: Set from session or default
});

// Helper to generate a unique slug
async function generateUniqueSlug(title: string, attempt = 0): Promise<string> {
    const baseSlug = slugify(title, { lower: true, strict: true });
    const slug = attempt === 0 ? baseSlug : `${baseSlug}-${attempt}`;

    const existing = await prisma.blogPost.findUnique({ where: { slug } });

    if (!existing) {
        return slug;
    } else {
        return await generateUniqueSlug(title, attempt + 1);
    }
}

export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions);

    // 1. Authentication & Authorization
    if (!session?.user?.isAdmin) {
        return NextResponse.json({ error: 'Forbidden: Requires admin privileges' }, { status: 403 });
    }

    try {
        const rawData = await request.json();

        // 2. Validation
        const validationResult = blogPostCreateSchema.safeParse(rawData);
        if (!validationResult.success) {
            return NextResponse.json({ error: 'Invalid input data', details: validationResult.error.flatten() }, { status: 400 });
        }
        const data = validationResult.data;

        // 3. Slug Generation & Uniqueness Check
        let finalSlug = data.slug;
        if (!finalSlug) {
            finalSlug = await generateUniqueSlug(data.title);
        } else {
            // Verify provided slug is unique
            const existing = await prisma.blogPost.findUnique({ where: { slug: finalSlug } });
            if (existing) {
                return NextResponse.json({ error: 'Provided slug is already in use.', details: { fieldErrors: { slug: ['Slug already exists'] } } }, { status: 409 }); // Conflict
            }
        }

        // 4. Determine published_at based on status
        let publishedAt: Date | null = null;
        if (data.status === 'published') {
            publishedAt = new Date(); // Set publish date if status is published
        }

        // 5. Create Post
        const newPost = await prisma.blogPost.create({
            data: {
                title: data.title,
                slug: finalSlug,
                content: data.content,
                excerpt: data.excerpt,
                category: data.category,
                status: data.status,
                featured: data.featured,
                image_url: data.image_url,
                author_name: session.user.name || 'Admin', // Use user name from session or default
                published_at: publishedAt,
            }
        });

        return NextResponse.json(newPost, { status: 201 });

    } catch (error) {
        console.error('[POST Blog Post Error]', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid data format.', details: error.errors }, { status: 400 });
        }
         // Handle potential Prisma errors (like unique constraint if slug check failed somehow)
        if (error instanceof Error && (error as any).code === 'P2002') { // Prisma unique constraint violation
             return NextResponse.json({ error: 'A post with this slug already exists.' }, { status: 409 });
        }
        return NextResponse.json({ error: 'Failed to create blog post' }, { status: 500 });
    }
} 