import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connection';
import RecyclingCenter from '@/lib/models/RecyclingCenter';
import { getMaterialByValue } from '@/lib/constants/materials';

/**
 * Handler for GET request to search recycling centers by material they buy
 * Query parameters:
 * - material: Required. Material ID to search for
 * - lat: Optional. Latitude for location-based search
 * - lng: Optional. Longitude for location-based search
 * - distance: Optional. Distance in km for location-based search (default: 50)
 * - page: Optional. Page number for pagination (default: 1)
 * - limit: Optional. Items per page (default: 10)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const materialId = searchParams.get('material');
    const lat = searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : null;
    const lng = searchParams.get('lng') ? parseFloat(searchParams.get('lng')!) : null;
    const distance = searchParams.get('distance') ? parseInt(searchParams.get('distance')!) : 50;
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10;
    const skip = (page - 1) * limit;

    // Material ID is required
    if (!materialId) {
      return NextResponse.json({ error: 'Material ID is required' }, { status: 400 });
    }

    // Validate material
    const material = getMaterialByValue(materialId);
    if (!material) {
      return NextResponse.json({ error: 'Invalid material ID' }, { status: 400 });
    }

    await dbConnect();

    // Build the query
    let query: any = {
      'buyMaterials.materialId': materialId,
      'buyMaterials.active': true
    };

    // Add geospatial query if coordinates are provided
    if (lat !== null && lng !== null) {
      query.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat]
          },
          $maxDistance: distance * 1000 // Convert km to meters
        }
      };
    }

    // Execute query with pagination
    const centers = await RecyclingCenter.find(query)
      .select('name city slug address postalCode location buyMaterials images description')
      .skip(skip)
      .limit(limit);
    
    // Count total results for pagination
    const total = await RecyclingCenter.countDocuments(query);
    
    // Transform data to include only relevant buying price for requested material
    const transformedCenters = centers.map(center => {
      const centerObj = center.toObject();
      
      // Filter buyMaterials to only include the requested material
      const buyMaterial = centerObj.buyMaterials?.find(
        (m: any) => m.materialId === materialId && m.active
      );
      
      return {
        ...centerObj,
        buyMaterials: buyMaterial ? [buyMaterial] : []
      };
    });

    return NextResponse.json({
      centers: transformedCenters,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      },
      material
    });
  } catch (error) {
    console.error('Error searching recycling centers by material:', error);
    return NextResponse.json({ error: 'Failed to search recycling centers' }, { status: 500 });
  }
} 