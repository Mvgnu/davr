import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { pool } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if user is authenticated and is an admin
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is an admin
    const userResult = await pool.query(
      'SELECT role FROM users WHERE id = $1',
      [session.user.id]
    );

    if (userResult.rows.length === 0 || userResult.rows[0].role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const claimId = parseInt(params.id);
    if (isNaN(claimId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid claim ID' },
        { status: 400 }
      );
    }

    // Get the claim details
    const claimResult = await pool.query(
      'SELECT * FROM recycling_center_claims WHERE id = $1',
      [claimId]
    );

    if (claimResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Claim request not found' },
        { status: 404 }
      );
    }

    const claim = claimResult.rows[0];

    // Check if claim is already processed
    if (claim.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: 'Claim request has already been processed' },
        { status: 400 }
      );
    }

    // Get the recycling center details
    const recyclingCenterResult = await pool.query(
      'SELECT * FROM recycling_centers WHERE id = $1',
      [claim.recycling_center_id]
    );

    if (recyclingCenterResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Recycling center not found' },
        { status: 404 }
      );
    }

    // Check if recycling center is already claimed
    if (recyclingCenterResult.rows[0].owner_id) {
      return NextResponse.json(
        { success: false, error: 'Recycling center is already claimed by another user' },
        { status: 409 }
      );
    }

    // Run approval process in a transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Update the claim status to approved
      await client.query(
        'UPDATE recycling_center_claims SET status = $1, updated_at = NOW() WHERE id = $2',
        ['approved', claimId]
      );

      // Update the recycling center to be claimed by the user
      await client.query(
        `UPDATE recycling_centers 
         SET owner_id = $1, 
             verification_status = $2, 
             updated_at = NOW() 
         WHERE id = $3`,
        [claim.user_id, 'verified', claim.recycling_center_id]
      );

      // Reject all other pending claims for this recycling center
      await client.query(
        `UPDATE recycling_center_claims 
         SET status = $1, updated_at = NOW() 
         WHERE recycling_center_id = $2 AND id != $3 AND status = 'pending'`,
        ['rejected', claim.recycling_center_id, claimId]
      );
      
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    return NextResponse.json({
      success: true,
      message: 'Claim request approved successfully'
    });
  } catch (error) {
    console.error('Error approving claim request:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 