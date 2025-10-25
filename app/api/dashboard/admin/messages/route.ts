import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/permissions';
import { prisma } from '@/lib/db/prisma';

const DEFAULT_PAGE_SIZE = 10;

// GET handler to fetch all messages (Admin Only)
export async function GET(request: Request) {
  try {
    await requireRole('ADMIN');

    // Handle Pagination
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || `${DEFAULT_PAGE_SIZE}`, 10);
    const skip = (page - 1) * limit;

    // Fetch messages from the database with relations and pagination
    const [messages, totalMessages] = await prisma.$transaction([
      prisma.message.findMany({
        skip: skip,
        take: limit,
        orderBy: {
          created_at: 'desc',
        },
        // No relations to include for now to avoid TypeScript errors
      }),
      prisma.message.count(), // Get the total count for pagination
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalMessages / limit);

    // Return the paginated list
    return NextResponse.json({
      success: true,
      data: {
        messages,
        pagination: {
          currentPage: page,
          totalPages,
          pageSize: limit,
          totalItems: totalMessages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
    });

  } catch (error) {
    console.error('[GET Dashboard Admin Messages Error]', error);

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
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

// POST handler to create a new message (Admin Only)
export async function POST(request: Request) {
  try {
    await requireRole('ADMIN');

    const body = await request.json();
    
    const newMessage = await prisma.message.create({
      data: {
        subject: body.subject,
        content: body.content,
        senderUserId: body.senderUserId,
        recipientUserId: body.recipientUserId,
        status: body.status || 'new',
      },
    });

    return NextResponse.json({ 
      success: true, 
      data: newMessage 
    });
  } catch (error) {
    console.error('[POST Dashboard Admin Messages Error]', error);

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
      { error: 'Failed to create message' },
      { status: 500 }
    );
  }
}