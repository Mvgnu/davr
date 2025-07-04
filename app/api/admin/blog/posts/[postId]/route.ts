import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/options';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic'; // Ensure dynamic execution for auth check

const paramSchema = z.object({
  postId: z.string().cuid('Invalid post ID'),
});

// DELETE Handler
export async function DELETE(
  request: Request, // Changed from NextRequest
  { params }: { params: { postId: string } }
) {
  const session = await getServerSession(authOptions);
  // 1. Check Authentication & Authorization
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  // 2. Validate Route Parameter
  const validation = paramSchema.safeParse(params);
  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid input', details: validation.error.flatten().fieldErrors }, { status: 400 });
  }
  const { postId } = validation.data;

  try {
    // 3. Delete the blog post
    await prisma.blogPost.delete({
      where: { id: postId },
    });

    console.log(`Admin ${session.user.email} deleted blog post ${postId}`);
    return NextResponse.json({ success: true, message: 'Blog post deleted successfully.' });

  } catch (error: any) {
    console.error(`Error deleting blog post ${postId}:`, error);

    // Check if the error is because the record was not found
    if (error.code === 'P2025') { // Prisma error code for RecordNotFound
      return NextResponse.json({ error: 'Blog post not found.' }, { status: 404 });
    }
    
    // Generic server error
    return NextResponse.json({ error: 'Failed to delete blog post' }, { status: 500 });
  }
} 