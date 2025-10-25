import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/options';
import { prisma } from '@/lib/db/prisma';

const DEFAULT_PAGE_SIZE = 10;

// GET handler to fetch user's messages (sent and received)
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || `${DEFAULT_PAGE_SIZE}`, 10);
    const type = searchParams.get('type'); // 'sent', 'received', or both
    const status = searchParams.get('status'); // Filter by status
    
    const skip = (page - 1) * limit;

    // Build where clause based on type
    const whereClause: any = {};
    
    // Messages where the user is either the sender or recipient
    if (type === 'sent') {
      whereClause.senderUserId = session.user.id;
    } else if (type === 'received') {
      whereClause.recipientUserId = session.user.id;
    } else {
      // Default: messages where user is either sender or recipient
      whereClause.OR = [
        { senderUserId: session.user.id },
        { recipientUserId: session.user.id }
      ];
    }
    
    if (status) {
      whereClause.status = status;
    }

    const [messages, totalCount] = await prisma.$transaction([
      prisma.message.findMany({
        where: whereClause,
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      prisma.message.count({ where: whereClause })
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      data: messages,
      pagination: {
        currentPage: page,
        totalPages,
        pageSize: limit,
        totalItems: totalCount,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('[GET User Messages Error]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}