import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/options';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const paramSchema = z.object({
  postId: z.string().cuid('Invalid post ID'),
});

const bodySchema = z.object({
  status: z.enum(['published', 'draft'], { errorMap: () => ({ message: "Status must be 'published' or 'draft'." })}),
});

// PATCH Handler to update status
export async function PATCH(
  request: Request,
  { params }: { params: { postId: string } }
) {
  const session = await getServerSession(authOptions);
  // 1. Check Auth
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  // 2. Validate Param
  const paramValidation = paramSchema.safeParse(params);
  if (!paramValidation.success) {
    return NextResponse.json({ error: 'Invalid input', details: paramValidation.error.flatten().fieldErrors }, { status: 400 });
  }
  const { postId } = paramValidation.data;

  // 3. Validate Body
  let body: { status: 'published' | 'draft' };
  try {
    const rawBody = await request.json();
    const bodyValidation = bodySchema.safeParse(rawBody);
    if (!bodyValidation.success) {
      return NextResponse.json({ error: 'Invalid input', details: bodyValidation.error.flatten().fieldErrors }, { status: 400 });
    }
    body = bodyValidation.data;
  } catch (e) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  try {
    // 4. Update the blog post status
    const updateData: { status: string, published_at?: Date | null } = {
      status: body.status,
    };

    if (body.status === 'published') {
      // Set published_at only if it's not already set (first time publishing)
      // Or update it if needed, depends on desired logic. Here, we just set it.
      updateData.published_at = new Date(); 
    } else {
      // Optional: Set published_at to null when unpublishing
      // updateData.published_at = null; // Decide if this is desired
    }

    const updatedPost = await prisma.blogPost.update({
      where: { id: postId },
      data: updateData,
    });

    console.log(`Admin ${session.user.email} updated status of blog post ${postId} to ${body.status}`);
    return NextResponse.json({ success: true, message: `Blog post ${body.status}.`, post: updatedPost });

  } catch (error: any) {
    console.error(`Error updating status for blog post ${postId}:`, error);

    if (error.code === 'P2025') { // RecordNotFound
      return NextResponse.json({ error: 'Blog post not found.' }, { status: 404 });
    }
    
    return NextResponse.json({ error: 'Failed to update blog post status' }, { status: 500 });
  }
}
