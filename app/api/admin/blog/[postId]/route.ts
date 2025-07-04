import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/options';
import slugify from 'slugify';
import { unlink } from 'fs/promises';
import path from 'path';

// Helper to generate a unique slug (could be moved to lib)
async function generateUniqueSlug(title: string, currentId: string, attempt = 0): Promise<string> {
    const baseSlug = slugify(title, { lower: true, strict: true });
    const slug = attempt === 0 ? baseSlug : `${baseSlug}-${attempt}`;

    const existing = await prisma.blogPost.findUnique({
        where: { 
            slug: slug,
            // Ensure we don't conflict with the post being updated itself
            NOT: { id: currentId } 
        }
    });

    if (!existing) {
        return slug;
    } else {
        return await generateUniqueSlug(title, currentId, attempt + 1);
    }
}

// Helper function to safely delete an image file (similar to marketplace)
async function safeDeleteBlogPostImage(imageUrl: string | null | undefined) {
    if (!imageUrl) return;
    try {
        // Assuming blog images are stored similarly to listing images for now
        // Adjust the path if blog images are stored elsewhere (e.g., /public/uploads/blog)
        const uploadDir = path.join(process.cwd(), 'public/uploads/blog'); 
        const filename = path.basename(imageUrl); 
        const filePath = path.join(uploadDir, filename);

        const resolvedUploadDir = path.resolve(uploadDir);
        const resolvedFilePath = path.resolve(filePath);
        if (!resolvedFilePath.startsWith(resolvedUploadDir + path.sep)) {
             console.warn(`Attempted to delete blog image outside designated directory: ${filePath}`);
             return;
        }
        await unlink(resolvedFilePath);
        console.log(`Successfully deleted blog post image: ${filePath}`);
    } catch (error: any) {
        if (error.code !== 'ENOENT') {
            console.error(`Error deleting blog post image file ${imageUrl}:`, error);
        }
    }
}

// --- PATCH Handler: Update a blog post (Admin Only) ---

const blogPostUpdateSchema = z.object({
    title: z.string().min(3).max(200).optional(),
    content: z.string().min(10).optional(),
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { message: "Slug must be lowercase alphanumeric with hyphens" }).optional(),
    excerpt: z.string().max(500).optional().nullable(),
    category: z.string().max(50).optional().nullable(),
    status: z.enum(['draft', 'published', 'archived']).optional(),
    featured: z.boolean().optional(),
    image_url: z.string().url().optional().nullable(),
    // published_at: Handled based on status change
    // author_name: Potentially updatable if needed?
});

export async function PATCH(
    request: NextRequest,
    { params }: { params: { postId: string } }
) {
    const session = await getServerSession(authOptions);
    const postId = params.postId;

    // 1. Auth & ID Validation
    if (!session?.user?.isAdmin) {
        return NextResponse.json({ error: 'Forbidden: Requires admin privileges' }, { status: 403 });
    }
    if (!postId || !z.string().cuid().safeParse(postId).success) {
        return NextResponse.json({ error: 'Invalid Post ID format' }, { status: 400 });
    }

    try {
        // 2. Fetch Existing Post
        const existingPost = await prisma.blogPost.findUnique({ 
            where: { id: postId },
            select: { status: true, slug: true, image_url: true } // Fetch fields needed for logic
        });
        if (!existingPost) {
            return NextResponse.json({ error: 'Blog post not found' }, { status: 404 });
        }

        // 3. Validate Request Body
        const rawData = await request.json();
        const validationResult = blogPostUpdateSchema.safeParse(rawData);
        if (!validationResult.success) {
            return NextResponse.json({ error: 'Invalid input data', details: validationResult.error.flatten() }, { status: 400 });
        }
        const dataToUpdate = validationResult.data;

        // 4. Handle Slug Update (if title changed or slug explicitly provided)
        let finalSlug = existingPost.slug;
        if (dataToUpdate.slug && dataToUpdate.slug !== existingPost.slug) {
            // If slug provided and different, check uniqueness
            finalSlug = dataToUpdate.slug;
             const existing = await prisma.blogPost.findUnique({ where: { slug: finalSlug, NOT: { id: postId } } });
            if (existing) {
                 return NextResponse.json({ error: 'Provided slug is already in use.' }, { status: 409 });
             }
        } else if (dataToUpdate.title && !dataToUpdate.slug) {
             // If title changed and no slug provided, regenerate slug
            finalSlug = await generateUniqueSlug(dataToUpdate.title, postId);
        }
        // Add slug to data only if it changed
        if (finalSlug !== existingPost.slug) {
            (dataToUpdate as any).slug = finalSlug;
        }

        // 5. Handle published_at based on status change
        let publishedAtUpdate: Date | null | undefined = undefined; // undefined means no change
        if (dataToUpdate.status && dataToUpdate.status !== existingPost.status) {
            if (dataToUpdate.status === 'published') {
                publishedAtUpdate = new Date(); // Set publish date now
            } else if (existingPost.status === 'published') {
                publishedAtUpdate = null; // Unpublish: Clear the date
            }
            (dataToUpdate as any).published_at = publishedAtUpdate;
        }

        // 6. Handle Image Deletion (if URL changed)
        const newImageUrl = dataToUpdate.image_url;
        const oldImageUrl = existingPost.image_url;
        if (oldImageUrl && oldImageUrl !== newImageUrl) {
            await safeDeleteBlogPostImage(oldImageUrl);
        }

        // 7. Update Post
        const updatedPost = await prisma.blogPost.update({
            where: { id: postId },
            data: dataToUpdate,
        });

        return NextResponse.json(updatedPost);

    } catch (error) {
        console.error(`[PATCH Blog Post Error - ${postId}]`, error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid data format.', details: error.errors }, { status: 400 });
        }
         if (error instanceof Error && (error as any).code === 'P2002') { 
             return NextResponse.json({ error: 'A post with the provided/generated slug already exists.' }, { status: 409 });
        }
        return NextResponse.json({ error: 'Failed to update blog post' }, { status: 500 });
    }
}


// --- DELETE Handler: Delete a blog post (Admin Only) ---

export async function DELETE(
    request: NextRequest,
    { params }: { params: { postId: string } }
) {
    const session = await getServerSession(authOptions);
    const postId = params.postId;

    // 1. Auth & ID Validation
    if (!session?.user?.isAdmin) {
        return NextResponse.json({ error: 'Forbidden: Requires admin privileges' }, { status: 403 });
    }
     if (!postId || !z.string().cuid().safeParse(postId).success) {
        return NextResponse.json({ error: 'Invalid Post ID format' }, { status: 400 });
    }

    try {
         // 2. Fetch Existing Post to get image URL
        const existingPost = await prisma.blogPost.findUnique({
            where: { id: postId },
            select: { image_url: true } // Only need image_url
        });

        // If not found, treat as success (idempotent)
        if (!existingPost) {
             return NextResponse.json({ message: 'Blog post already deleted or not found' }, { status: 200 });
        }

        // 3. Delete Associated Image File
        await safeDeleteBlogPostImage(existingPost.image_url);

        // 4. Delete Post from DB
        await prisma.blogPost.delete({
            where: { id: postId },
        });

        console.log(`Blog post ${postId} deleted successfully by admin ${session.user.id}`);
        return NextResponse.json({ message: 'Blog post deleted successfully' }, { status: 200 });

    } catch (error) {
         console.error(`[DELETE Blog Post Error - ${postId}]`, error);
         return NextResponse.json({ error: 'Failed to delete blog post' }, { status: 500 });
    }
} 