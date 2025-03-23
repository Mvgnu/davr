import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { query } from '@/lib/db';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'You must be logged in to claim a recycling center' },
        { status: 401 }
      );
    }
    
    const centerId = parseInt(params.id);
    if (isNaN(centerId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid recycling center ID' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    const { reason } = body;
    
    if (!reason || reason.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'You must provide a reason for claiming this recycling center' },
        { status: 400 }
      );
    }
    
    // Check if the recycling center exists
    const centerQuery = `
      SELECT id, name, owner_id FROM recycling_centers WHERE id = $1
    `;
    
    const centerResult = await query(centerQuery, [centerId]);
    
    if (centerResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Recycling center not found' },
        { status: 404 }
      );
    }
    
    const center = centerResult.rows[0];
    
    // Check if the recycling center is already claimed
    if (center.owner_id) {
      return NextResponse.json(
        { success: false, error: 'This recycling center is already claimed' },
        { status: 400 }
      );
    }
    
    // Get the user ID
    const userEmail = session.user.email;
    
    if (!userEmail) {
      return NextResponse.json(
        { success: false, error: 'User email not found in session' },
        { status: 400 }
      );
    }
    
    const userQuery = `SELECT id FROM users WHERE email = $1`;
    const userResult = await query(userQuery, [userEmail]);
    
    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    const userId = userResult.rows[0].id;
    
    // Update the recycling center with the new owner
    const updateQuery = `
      UPDATE recycling_centers
      SET owner_id = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING id, name
    `;
    
    await query(updateQuery, [userId, centerId]);
    
    // Create a claim record
    const claimQuery = `
      INSERT INTO center_claims (
        user_id,
        recycling_center_id,
        claim_reason,
        status
      ) VALUES ($1, $2, $3, 'approved')
      RETURNING id
    `;
    
    const claimResult = await query(claimQuery, [userId, centerId, reason]);
    const claimId = claimResult.rows[0].id;
    
    return NextResponse.json({
      success: true,
      message: 'Recycling center claimed successfully',
      claimId: claimId
    });
    
  } catch (error) {
    console.error('Error claiming recycling center:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to claim recycling center' },
      { status: 500 }
    );
  }
} 