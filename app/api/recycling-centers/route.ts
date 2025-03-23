import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { Material } from '../materials/route';

// Define types for recycling centers
export type RecyclingCenter = {
  id: number;
  name: string;
  slug: string;
  address: string;
  location: {
    city: string;
    zipCode: string;
    state: string;
    latitude?: number;
    longitude?: number;
  };
  contact?: {
    phone?: string;
    email?: string;
    website?: string;
  };
  description?: string;
  rating: {
    average: number;
    count: number;
  };
  offersCount: number;
  isVerified: boolean;
  buysMaterials?: boolean;
  acceptedMaterials: Material[];
  ownerId?: number;
};

// Mock materials for testing
const mockMaterials: Material[] = [
  { id: 1, name: 'Aluminium', category: 'Metalle', recyclable: true },
  { id: 2, name: 'Kupfer', category: 'Metalle', recyclable: true },
  { id: 3, name: 'Stahl', category: 'Metalle', recyclable: true },
  { id: 4, name: 'Zeitungspapier', category: 'Papier & Karton', recyclable: true },
  { id: 5, name: 'Karton', category: 'Papier & Karton', recyclable: true },
  { id: 6, name: 'PET-Flaschen', category: 'Kunststoffe', recyclable: true },
  { id: 7, name: 'HDPE', category: 'Kunststoffe', recyclable: true },
  { id: 8, name: 'Smartphones', category: 'Elektronik', recyclable: true },
  { id: 9, name: 'Batterien', category: 'Elektronik', recyclable: true },
  { id: 10, name: 'Klarglas', category: 'Glas', recyclable: true },
];

/**
 * GET handler to fetch recycling centers with filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const city = searchParams.get('city') || '';
    const material = searchParams.get('material') || '';
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortOrder = searchParams.get('sortOrder') || 'asc';
    
    // Calculate pagination
    const offset = (page - 1) * limit;
    
    // Build query conditions
    const conditions = [];
    const params: any[] = [];
    let paramIndex = 1;
    
    if (city) {
      conditions.push(`LOWER(rc.city) LIKE $${paramIndex}`);
      params.push(`%${city.toLowerCase()}%`);
      paramIndex++;
    }
    
    if (material) {
      conditions.push(`
        rc.id IN (
          SELECT recycling_center_id 
          FROM recycling_center_offers rco
          JOIN materials m ON rco.material_id = m.id
          WHERE LOWER(m.name) LIKE $${paramIndex} OR LOWER(m.category) LIKE $${paramIndex}
        )
      `);
      params.push(`%${material.toLowerCase()}%`);
      paramIndex++;
    }
    
    if (search) {
      conditions.push(`(
        LOWER(rc.name) LIKE $${paramIndex} OR
        LOWER(rc.description) LIKE $${paramIndex} OR
        LOWER(rc.city) LIKE $${paramIndex} OR
        rc.postal_code LIKE $${paramIndex}
      )`);
      params.push(`%${search.toLowerCase()}%`);
      paramIndex++;
    }
    
    // Construct the WHERE clause
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    // Validate and sanitize sort parameters
    const validSortColumns = ['name', 'city', 'rating', 'created_at'];
    const validSortOrders = ['asc', 'desc'];
    
    const sanitizedSortBy = validSortColumns.includes(sortBy) ? sortBy : 'name';
    const sanitizedSortOrder = validSortOrders.includes(sortOrder.toLowerCase()) ? sortOrder.toLowerCase() : 'asc';
    
    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM recycling_centers rc
      ${whereClause}
    `;
    
    const countResult = await query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);
    
    // Query for recycling centers
    const centersQuery = `
      SELECT 
        rc.id, rc.name, rc.slug, rc.address, rc.city, rc.postal_code, rc.state, 
        rc.latitude, rc.longitude, rc.phone, rc.email, rc.website, 
        rc.description, rc.is_verified, rc.rating, rc.rating_count,
        COUNT(DISTINCT rco.id) as offers_count
      FROM recycling_centers rc
      LEFT JOIN recycling_center_offers rco ON rc.id = rco.recycling_center_id
      ${whereClause}
      GROUP BY rc.id
      ORDER BY ${sanitizedSortBy === 'rating' ? 'rc.rating' : 'rc.' + sanitizedSortBy} ${sanitizedSortOrder}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    params.push(limit, offset);
    const centersResult = await query(centersQuery, params);
    
    // For each recycling center, get its accepted materials
    const centers = await Promise.all(centersResult.rows.map(async (center) => {
      // Get materials for this center
      const materialsQuery = `
        SELECT m.id, m.name, m.category, m.recyclable, rco.price
        FROM materials m
        JOIN recycling_center_offers rco ON m.id = rco.material_id
        WHERE rco.recycling_center_id = $1 AND rco.is_active = true
      `;
      
      const materialsResult = await query(materialsQuery, [center.id]);
      const acceptedMaterials = materialsResult.rows;
      
      // Format the center according to the RecyclingCenter type
      return {
        id: center.id,
        name: center.name,
        slug: center.slug,
        address: center.address,
        location: {
          city: center.city,
          zipCode: center.postal_code,
          state: center.state,
          latitude: parseFloat(center.latitude),
          longitude: parseFloat(center.longitude)
        },
        contact: {
          phone: center.phone,
          email: center.email,
          website: center.website
        },
        description: center.description,
        rating: {
          average: parseFloat(center.rating),
          count: center.rating_count
        },
        offersCount: parseInt(center.offers_count),
        isVerified: center.is_verified,
        buysMaterials: acceptedMaterials.some(m => parseFloat(m.price) > 0),
        acceptedMaterials: acceptedMaterials.map(m => ({
          id: m.id,
          name: m.name,
          category: m.category,
          recyclable: m.recyclable,
          price: parseFloat(m.price)
        })),
        ownerId: center.owner_id
      };
    }));
    
    // Format the response with pagination metadata
    return NextResponse.json({
      data: centers,
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching recycling centers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recycling centers' },
      { status: 500 }
    );
  }
}

// Helper function to get random materials for mock data
function getRandomMaterials(count: number): Material[] {
  // Shuffle array and get first n elements
  return [...mockMaterials]
    .sort(() => 0.5 - Math.random())
    .slice(0, Math.min(count, mockMaterials.length));
}

/**
 * POST handler to create a new recycling center
 */
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // TODO: Validate the input data
    
    // Insert the new recycling center
    const result = await query(
      `INSERT INTO recycling_centers (
        name, slug, address, city, postal_code, state, country,
        phone, email, website, description, latitude, longitude,
        is_verified, verification_status, rating, rating_count
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING id`,
      [
        data.name,
        data.slug || data.name.toLowerCase().replace(/[^\w]+/g, '-'),
        data.address,
        data.location.city,
        data.location.zipCode,
        data.location.state,
        'Germany',
        data.contact?.phone,
        data.contact?.email,
        data.contact?.website,
        data.description,
        data.location.latitude,
        data.location.longitude,
        data.isVerified || false,
        'pending',
        0,
        0
      ]
    );
    
    const centerId = result.rows[0].id;
    
    // Add materials if provided
    if (data.acceptedMaterials && data.acceptedMaterials.length > 0) {
      for (const material of data.acceptedMaterials) {
        await query(
          `INSERT INTO recycling_center_offers (
            recycling_center_id, material_id, price, is_active
          ) VALUES ($1, $2, $3, $4)`,
          [centerId, material.id, material.price || 0, true]
        );
      }
    }
    
    return NextResponse.json({
      message: 'Recycling center created successfully',
      id: centerId
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating recycling center:', error);
    return NextResponse.json(
      { error: 'Failed to create recycling center' },
      { status: 500 }
    );
  }
} 