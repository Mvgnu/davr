import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/options';
import { z } from "zod";

// Types
interface Listing {
  id: number;
  title: string;
  description: string;
  price: number;
  unit: string;
  material_type: string;
  category: string;
  city: string;
  postal_code: string;
  image: string | null;
  seller_id: number;
  seller_name: string;
  seller_rating: number;
  seller_verified: boolean;
  is_new: boolean;
  created_at: Date;
  updated_at: Date;
  status: string;
}

// GET endpoint for listings with filtering
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const material = searchParams.get('material');
    const city = searchParams.get('city');
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');
    const sort = searchParams.get('sort') || 'date';
    const order = searchParams.get('order') || 'desc';
    
    // Build the WHERE clause
    let whereClause = '';
    const params: any[] = [];
    let paramCount = 1;
    
    if (material) {
      whereClause += ` material_type = $${paramCount}`;
      params.push(material);
      paramCount++;
    }
    
    if (city) {
      if (whereClause) whereClause += ' AND';
      whereClause += ` city ILIKE $${paramCount}`;
      params.push(`%${city}%`);
      paramCount++;
    }
    
    if (whereClause) {
      whereClause = 'WHERE' + whereClause;
    }
    
    // Determine sort options
    let sortClause = '';
    if (sort === 'date') {
      sortClause = `ORDER BY created_at ${order === 'desc' ? 'DESC' : 'ASC'}`;
    } else if (sort === 'price') {
      sortClause = `ORDER BY price ${order === 'desc' ? 'DESC' : 'ASC'}`;
    }
    
    // Count total records for pagination
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM marketplace_listings 
      ${whereClause}
    `;
    const countResult = await query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);
    
    // Get listings with pagination
    const listingsQuery = `
      SELECT 
        l.id, l.title, l.description, l.price, l.unit, l.material_type, 
        l.category, l.city, l.postal_code, l.image, l.seller_id, 
        l.is_new, l.created_at, l.updated_at, l.status,
        u.name as seller_name, u.rating as seller_rating, u.is_verified as seller_verified
      FROM marketplace_listings l
      JOIN users u ON l.seller_id = u.id
      ${whereClause}
      ${sortClause}
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;
    
    const listingsParams = [...params, limit, (page - 1) * limit];
    const listingsResult = await query(listingsQuery, listingsParams);
    
    // Format the results
    const listings = listingsResult.rows.map((listing: any) => ({
      id: listing.id,
      title: listing.title,
      description: listing.description,
      price: listing.price,
      unit: listing.unit,
      materialType: listing.material_type,
      category: listing.category,
      location: {
        city: listing.city,
        postalCode: listing.postal_code,
      },
      image: listing.image,
      sellerId: listing.seller_id,
      seller: {
        name: listing.seller_name,
        rating: listing.seller_rating,
        isVerified: listing.seller_verified
      },
      isNew: listing.is_new,
      createdAt: listing.created_at,
      updatedAt: listing.updated_at,
      status: listing.status
    }));
    
    return NextResponse.json({
      success: true,
      data: listings,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching marketplace listings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch marketplace listings' },
      { status: 500 }
    );
  }
}

// POST endpoint to create a new listing
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const data = await request.json();
    
    // Validate required fields
    if (!data.title || !data.price || !data.description || !data.materialType) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Get user info for seller details
    const userResult = await query(
      'SELECT id, name, rating, is_verified FROM users WHERE email = $1',
      [session.user.email]
    );
    
    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    const user = userResult.rows[0];
    
    // Count user's total listings
    const totalListingsResult = await query(
      'SELECT COUNT(*) as total FROM marketplace_listings WHERE seller_id = $1',
      [user.id]
    );
    
    // Insert the new listing
    const insertQuery = `
      INSERT INTO marketplace_listings (
        title, description, price, unit, material_type, category,
        city, postal_code, image, seller_id, is_new, status
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
      ) RETURNING id, created_at, updated_at
    `;
    
    const insertParams = [
      data.title,
      data.description,
      parseFloat(data.price),
      data.unit || 'kg',
      data.materialType,
      data.category || 'Andere',
      data.city,
      data.postalCode,
      data.image || null,
      user.id,
      true,
      'active'
    ];
    
    const result = await query(insertQuery, insertParams);
    const newListing = result.rows[0];
    
    return NextResponse.json({
      success: true,
      data: {
        id: newListing.id,
        title: data.title,
        description: data.description,
        price: parseFloat(data.price),
        unit: data.unit || 'kg',
        materialType: data.materialType,
        category: data.category || 'Andere',
        location: {
          city: data.city,
          postalCode: data.postalCode,
        },
        image: data.image || null,
        sellerId: user.id,
        seller: {
          name: user.name,
          rating: user.rating || 0,
          isVerified: user.is_verified || false,
          totalListings: parseInt(totalListingsResult.rows[0].total) + 1
        },
        isNew: true,
        createdAt: newListing.created_at,
        updatedAt: newListing.updated_at,
        status: 'active'
      }
    });
  } catch (error) {
    console.error('Error creating marketplace listing:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create marketplace listing' },
      { status: 500 }
    );
  }
} 