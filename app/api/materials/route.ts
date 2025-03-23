import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// Define the Material type
export interface Material {
  id: number;
  name: string;
  description: string;
  category: string;
  subtype: string | null;
  recyclable: boolean;
  market_value_level: string | null;
  approximate_min_price: number | null;
  approximate_max_price: number | null;
  image_url: string | null;
  parent_id: number | null;
  children?: Material[];
}

/**
 * GET handler for fetching materials with optional category filter
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    
    let queryStr = `
      SELECT 
        id, 
        name, 
        description, 
        category,
        subtype,
        recyclable,
        market_value_level,
        approximate_min_price,
        approximate_max_price,
        image_url,
        parent_id
      FROM 
        materials
    `;
    
    const queryParams: any[] = [];
    const conditions: string[] = [];
    
    // Add filters if provided
    if (category) {
      conditions.push(`category = $${queryParams.length + 1}`);
      queryParams.push(category);
    }
    
    if (search) {
      conditions.push(`name ILIKE $${queryParams.length + 1}`);
      queryParams.push(`%${search}%`);
    }
    
    if (conditions.length > 0) {
      queryStr += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    queryStr += ` ORDER BY name ASC`;
    
    const result = await query(queryStr, queryParams);
    
    // Fetch all materials to build parent-child relationships
    const allMaterials: Material[] = result.rows;
    
    // Build a hierarchical structure for materials with parent-child relationships
    const materialsWithChildren = allMaterials.map(material => {
      const children = allMaterials.filter(m => m.parent_id === material.id);
      return {
        ...material,
        children: children.length > 0 ? children : undefined
      };
    });
    
    // Filter out children that are already included in their parents (only return top-level materials)
    const topLevelMaterials = materialsWithChildren.filter(m => !m.parent_id);
    
    // Get unique categories as array for metadata
    const categories = Array.from(new Set(allMaterials.map(m => m.category)));
    
    return NextResponse.json({ 
      success: true, 
      data: topLevelMaterials,
      meta: {
        total: topLevelMaterials.length,
        categories
      }
    });
  } catch (error) {
    console.error('Error fetching materials:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch materials' },
      { status: 500 }
    );
  }
}

// POST handler to create a new material (admin only)
export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.name || !data.category) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: name and category are required' },
        { status: 400 }
      );
    }
    
    // Insert material into database
    const insertSql = `
      INSERT INTO materials (name, category, recyclable, description)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, category, recyclable, description
    `;
    
    const params = [
      data.name,
      data.category,
      data.recyclable !== undefined ? data.recyclable : true,
      data.description || null
    ];
    
    const result = await query(insertSql, params);
    const newMaterial = result.rows[0];
    
    return NextResponse.json({
      success: true,
      material: newMaterial
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating material:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create material' },
      { status: 500 }
    );
  }
}

/**
 * GET handler to fetch materials
 */
export async function GET_mock() {
  try {
    // In a real app, you would query the database to get materials
    
    // Mock data for now
    const materials: Material[] = [
      { id: 1, name: 'Aluminium', category: 'Metalle', recyclable: true, description: 'Aluminiumdosen, -folien und -verpackungen', acceptedBy: 95, purchasedBy: 45, avgPrice: 0.75, unit: 'kg' },
      { id: 2, name: 'Kupfer', category: 'Metalle', recyclable: true, description: 'Kupferkabel und -rohre', acceptedBy: 85, purchasedBy: 80, avgPrice: 5.25, unit: 'kg' },
      { id: 3, name: 'Stahl', category: 'Metalle', recyclable: true, description: 'Stahlteile und -behälter', acceptedBy: 90, purchasedBy: 70, avgPrice: 0.25, unit: 'kg' },
      { id: 4, name: 'Messing', category: 'Metalle', recyclable: true, description: 'Messingteile und -armaturen', acceptedBy: 75, purchasedBy: 65, avgPrice: 3.50, unit: 'kg' },
      { id: 5, name: 'Blei', category: 'Metalle', recyclable: true, description: 'Blei aus Altbatterien oder Baumaterial', acceptedBy: 65, purchasedBy: 55, avgPrice: 0.85, unit: 'kg' },
      
      { id: 6, name: 'Zeitungspapier', category: 'Papier & Karton', recyclable: true, description: 'Zeitungen, Zeitschriften, Prospekte', acceptedBy: 98, purchasedBy: 15, avgPrice: 0.08, unit: 'kg' },
      { id: 7, name: 'Karton', category: 'Papier & Karton', recyclable: true, description: 'Verpackungskartons, Wellpappe', acceptedBy: 96, purchasedBy: 10, avgPrice: 0.05, unit: 'kg' },
      { id: 8, name: 'Büropapier', category: 'Papier & Karton', recyclable: true, description: 'Bedrucktes oder unbedrucktes Büropapier', acceptedBy: 94, purchasedBy: 5, avgPrice: 0.10, unit: 'kg' },
      
      { id: 9, name: 'PET-Flaschen', category: 'Kunststoffe', recyclable: true, description: 'Transparente Getränkeflaschen aus PET', acceptedBy: 88, purchasedBy: 25, avgPrice: 0.20, unit: 'kg' },
      { id: 10, name: 'HDPE', category: 'Kunststoffe', recyclable: true, description: 'Milchflaschen, Reinigungsmittelflaschen', acceptedBy: 75, purchasedBy: 15, avgPrice: 0.15, unit: 'kg' },
      { id: 11, name: 'Plastikfolien', category: 'Kunststoffe', recyclable: true, description: 'Verpackungsfolien, Plastiktüten', acceptedBy: 65, purchasedBy: 5, avgPrice: 0.05, unit: 'kg' },
      
      { id: 12, name: 'Smartphones', category: 'Elektronik', recyclable: true, description: 'Alte oder defekte Smartphones', acceptedBy: 85, purchasedBy: 75, avgPrice: 15.00, unit: 'Stück' },
      { id: 13, name: 'Computer', category: 'Elektronik', recyclable: true, description: 'Desktop-PCs, Laptops', acceptedBy: 82, purchasedBy: 70, avgPrice: 25.00, unit: 'Stück' },
      { id: 14, name: 'Küchengeräte', category: 'Elektronik', recyclable: true, description: 'Mixer, Toaster, Kaffeemaschinen', acceptedBy: 80, purchasedBy: 20, avgPrice: 5.00, unit: 'Stück' },
      { id: 15, name: 'Batterien', category: 'Elektronik', recyclable: true, description: 'Haushalts- und Gerätebatterien', acceptedBy: 95, purchasedBy: 5, avgPrice: 0.50, unit: 'kg' },
      
      { id: 16, name: 'Klarglas', category: 'Glas', recyclable: true, description: 'Farblose Glasflaschen und -behälter', acceptedBy: 90, purchasedBy: 5, avgPrice: 0.05, unit: 'kg' },
      { id: 17, name: 'Buntglas', category: 'Glas', recyclable: true, description: 'Farbige Glasflaschen und -behälter', acceptedBy: 85, purchasedBy: 5, avgPrice: 0.05, unit: 'kg' },
      
      { id: 18, name: 'Altreifen', category: 'Gummi', recyclable: true, description: 'Auto- und Fahrradreifen', acceptedBy: 70, purchasedBy: 10, avgPrice: 0.10, unit: 'kg' },
      
      { id: 19, name: 'Altkleider', category: 'Textilien', recyclable: true, description: 'Gebrauchte Kleidung in gutem Zustand', acceptedBy: 75, purchasedBy: 25, avgPrice: 0.50, unit: 'kg' },
      { id: 20, name: 'Altholz', category: 'Holz', recyclable: true, description: 'Unbehandeltes Holz, Paletten', acceptedBy: 65, purchasedBy: 15, avgPrice: 0.05, unit: 'kg' },
    ];
    
    return NextResponse.json({
      data: materials,
      success: true
    });
  } catch (error) {
    console.error('Error fetching materials:', error);
    return NextResponse.json(
      { error: 'Failed to fetch materials', success: false }, 
      { status: 500 }
    );
  }
} 