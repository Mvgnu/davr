import { NextResponse } from 'next/server';

// Define a type for material subtypes
type MaterialSubtype = {
  id: number;
  materialId: number;
  name: string;
  description?: string;
  imageUrl?: string;
  purityLevel?: string;
  specificWeight?: number;
  marketValueModifier?: number;
  properties?: Record<string, string>;
};

// Mock data for material subtypes
const mockSubtypes: MaterialSubtype[] = [
  {
    id: 1,
    materialId: 1, // Aluminum Cans
    name: 'Clean Aluminum Cans',
    description: 'Clean and empty aluminum beverage cans',
    purityLevel: 'High',
    specificWeight: 0.5,
    marketValueModifier: 1.2,
    properties: {
      'aluminumContent': '95%',
      'contaminationLevel': 'Low'
    }
  },
  {
    id: 2,
    materialId: 1, // Aluminum Cans
    name: 'Mixed Aluminum Cans',
    description: 'Mixed aluminum cans with some contamination',
    purityLevel: 'Medium',
    specificWeight: 0.45,
    marketValueModifier: 1.0,
    properties: {
      'aluminumContent': '90%',
      'contaminationLevel': 'Medium'
    }
  },
  {
    id: 3,
    materialId: 2, // Aluminum Foil
    name: 'Clean Aluminum Foil',
    description: 'Clean aluminum foil without food residue',
    purityLevel: 'High',
    specificWeight: 0.3,
    marketValueModifier: 1.1,
    properties: {
      'aluminumContent': '98%',
      'contaminationLevel': 'Very Low'
    }
  },
  {
    id: 4,
    materialId: 3, // Copper Wire
    name: 'Clean Copper Wire',
    description: 'Bare copper wire with no insulation',
    purityLevel: 'Very High',
    specificWeight: 0.9,
    marketValueModifier: 1.5,
    properties: {
      'copperContent': '99%',
      'contaminationLevel': 'None'
    }
  },
  {
    id: 5,
    materialId: 3, // Copper Wire
    name: 'Insulated Copper Wire',
    description: 'Copper wire with insulation',
    purityLevel: 'Medium',
    specificWeight: 0.7,
    marketValueModifier: 0.8,
    properties: {
      'copperContent': '80%',
      'contaminationLevel': 'Medium'
    }
  }
];

// GET endpoint for material subtypes with filtering
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const materialId = searchParams.get('materialId');
    const searchQuery = searchParams.get('q');
    
    if (!materialId) {
      return NextResponse.json(
        { success: false, error: 'Material ID is required' },
        { status: 400 }
      );
    }
    
    // Filter subtypes by material ID
    let filteredSubtypes = mockSubtypes.filter(
      subtype => subtype.materialId === parseInt(materialId)
    );
    
    // Further filter by search query if provided
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredSubtypes = filteredSubtypes.filter(
        subtype => 
          subtype.name.toLowerCase().includes(query) || 
          (subtype.description && subtype.description.toLowerCase().includes(query))
      );
    }
    
    return NextResponse.json({
      success: true,
      data: filteredSubtypes
    });
  } catch (error) {
    console.error('Error fetching material subtypes:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch material subtypes' },
      { status: 500 }
    );
  }
}

// POST endpoint to create a new material subtype
export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.materialId || !data.name) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: materialId and name are required' },
        { status: 400 }
      );
    }
    
    // Check if a subtype with this name already exists for this material
    const subtypeExists = mockSubtypes.some(
      subtype => 
        subtype.materialId === parseInt(data.materialId) && 
        subtype.name.toLowerCase() === data.name.toLowerCase()
    );
    
    if (subtypeExists) {
      return NextResponse.json(
        { success: false, error: 'A subtype with this name already exists for this material' },
        { status: 409 }
      );
    }
    
    // Create a new subtype
    const newSubtype: MaterialSubtype = {
      id: mockSubtypes.length + 1,
      materialId: parseInt(data.materialId),
      name: data.name,
      description: data.description || '',
      imageUrl: data.imageUrl || undefined,
      purityLevel: data.purityLevel || undefined,
      specificWeight: data.specificWeight || 0,
      marketValueModifier: data.marketValueModifier || 1.0,
      properties: data.properties || {}
    };
    
    // Add to mock data
    mockSubtypes.push(newSubtype);
    
    return NextResponse.json({
      success: true,
      data: newSubtype
    });
  } catch (error) {
    console.error('Error creating material subtype:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create material subtype' },
      { status: 500 }
    );
  }
} 