import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/index';
import { pool } from '@/lib/db';
import { prisma } from '@/lib/db/prisma';

const DEFAULT_PAGE_SIZE = 10;

// Get all recycling centers (admin only, with comprehensive details)
export async function GET(request: NextRequest) {
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
    
    // Parse query parameters for pagination and filtering
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || `${DEFAULT_PAGE_SIZE}`);
    const skip = (page - 1) * limit;
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const city = searchParams.get('city') || '';
    
    // Build WHERE clause and params array for the query
    let whereClause = '';
    let params = [];
    let paramIndex = 1;
    
    if (search) {
      whereClause += `(rc.name ILIKE $${paramIndex} OR rc.city ILIKE $${paramIndex} OR rc.description ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    
    if (status) {
      if (whereClause) whereClause += ' AND ';
      
      if (status === 'verified') {
        whereClause += `rc.verification_status = $${paramIndex}`;
        params.push('verified');
      } else if (status === 'pending') {
        whereClause += `rc.verification_status = $${paramIndex}`;
        params.push('pending');
      } else if (status === 'claimed') {
        whereClause += `rc.owner_id IS NOT NULL`;
      } else if (status === 'unclaimed') {
        whereClause += `rc.owner_id IS NULL`;
      }
      
      if (status !== 'claimed' && status !== 'unclaimed') {
        paramIndex++;
      }
    }
    
    if (city) {
      if (whereClause) whereClause += ' AND ';
      whereClause += `rc.city ILIKE $${paramIndex}`;
      params.push(`%${city}%`);
      paramIndex++;
    }
    
    // Prepare the query with join to users table for owner email
    let countQuery = 'SELECT COUNT(*) FROM recycling_centers rc';
    let dataQuery = `
      SELECT 
        rc.*,
        u.email as owner_email,
        (
          SELECT json_agg(json_build_object(
            'id', m.id,
            'name', m.name,
            'category', m.category
          ))
          FROM materials m
          JOIN recycling_center_offers rco ON m.id = rco.material_id
          WHERE rco.recycling_center_id = rc.id
        ) as materials
      FROM recycling_centers rc
      LEFT JOIN users u ON rc.owner_id = u.id
    `;
    
    if (whereClause) {
      countQuery += ' WHERE ' + whereClause;
      dataQuery += ' WHERE ' + whereClause;
    }
    
    dataQuery += ` ORDER BY rc.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, skip);
    
    // Execute queries
    const countResult = await pool.query(countQuery, params.slice(0, paramIndex - 1));
    const dataResult = await pool.query(dataQuery, params);
    
    const totalCount = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalCount / limit);
    
    // Map claimed_by to owner_id for frontend compatibility
    const recyclingCenters = dataResult.rows.map(center => ({
      ...center,
      claimed_by: center.owner_id,
      claimed_by_email: center.owner_email
    }));
    
    return NextResponse.json({
      success: true,
      data: recyclingCenters,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching recycling centers:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch recycling centers' },
      { status: 500 }
    );
  }
}

// Create a new recycling center (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is an admin
    const userResult = await pool.query(
      'SELECT role FROM users WHERE id = $1',
      [session.user.id]
    );

    if (userResult.rows.length === 0 || userResult.rows[0].role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Forbidden - Admin access required' }, { status: 403 });
    }
    
    const data = await request.json();
    
    // Validate required fields
    if (!data.name || !data.address || !data.city) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }
    
    // Use transaction for consistency
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Create the recycling center
      const centerResult = await client.query(
        `
          INSERT INTO recycling_centers (
            name, 
            address, 
            city, 
            postal_code, 
            state,
            slug, 
            verification_status, 
            created_at, 
            updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
          RETURNING id, name, address, city, slug, verification_status
        `,
        [
          data.name,
          data.address,
          data.city,
          data.postal_code || '',
          data.state || '',
          data.slug || generateSlug(data.name),
          data.verification_status || 'pending'
        ]
      );
      
      await client.query('COMMIT');
      
      return NextResponse.json({
        success: true,
        data: centerResult.rows[0]
      }, { status: 201 });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error creating recycling center:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to create recycling center' 
    }, { status: 500 });
  }
}

// Helper function to generate a slug from a name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-');
} 