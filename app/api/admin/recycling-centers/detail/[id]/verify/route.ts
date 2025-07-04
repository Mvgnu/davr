import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/index';
import { pool } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !session.user.isAdmin) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized - Admin access required' 
      }, { status: 403 });
    }
    
    const id = params.id;
    
    if (!id || isNaN(Number(id))) {
      return NextResponse.json({ 
        success: false, 
        error: 'Valid recycling center ID is required' 
      }, { status: 400 });
    }
    
    // Update verification status in PostgreSQL
    const verifyQuery = `
      UPDATE recycling_centers
      SET is_verified = true, verification_status = 'verified'
      WHERE id = $1
      RETURNING id, name, verification_status
    `;
    
    const result = await pool.query(verifyQuery, [id]);
    
    if (result.rowCount === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Recycling center not found' 
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Recycling center verified successfully',
      center: result.rows[0]
    });
  } catch (error) {
    console.error('Error verifying recycling center:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to verify recycling center' 
    }, { status: 500 });
  }
} 