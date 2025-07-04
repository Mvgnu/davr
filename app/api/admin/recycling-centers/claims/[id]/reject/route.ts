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

    // Parse request body for optional rejection reason
    const body = await request.json().catch(() => ({}));
    const rejectionReason = body.reason || 'The claim request was rejected by an administrator.';

    // Use a transaction for consistent updates
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Update the claim status to rejected with the reason
      await client.query(
        `UPDATE recycling_center_claims 
         SET status = $1, rejection_reason = $2, updated_at = NOW() 
         WHERE id = $3`,
        ['rejected', rejectionReason, claimId]
      );

      // Check if this was the last pending claim for this recycling center
      const pendingClaimsResult = await client.query(
        'SELECT COUNT(*) FROM recycling_center_claims WHERE recycling_center_id = $1 AND status = $2',
        [claim.recycling_center_id, 'pending']
      );

      const pendingClaimsCount = parseInt(pendingClaimsResult.rows[0].count);

      // If no pending claims remain and recycling center is in verification pending status, revert it to unverified
      if (pendingClaimsCount === 0) {
        await client.query(
          `UPDATE recycling_centers 
           SET verification_status = CASE 
                 WHEN verification_status = 'verification_pending' THEN 'unverified'
                 ELSE verification_status
               END,
               updated_at = NOW()
           WHERE id = $1 AND owner_id IS NULL`,
          [claim.recycling_center_id]
        );
      }
      
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    return NextResponse.json({
      success: true,
      message: 'Claim request rejected successfully'
    });
  } catch (error) {
    console.error('Error rejecting claim request:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 