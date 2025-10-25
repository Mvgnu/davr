import React from 'react';
import { notFound } from 'next/navigation';
import MaterialForm from '@/components/admin/MaterialForm';
import { Metadata } from 'next';
import { AlertCircle } from 'lucide-react';

// Type for single material response (adjust if API response differs)
type MaterialResponse = {
  success: boolean;
  data?: {
    id: string;
    name: string;
    description: string | null;
    slug: string;
    parentMaterial: { id: string; name: string } | null;
    recyclability_percentage: number | null;
    recycling_difficulty: 'EASY' | 'MEDIUM' | 'HARD' | null; // EASY|MEDIUM|HARD
    category_icon: string | null;
    environmental_impact: any | null; // Json field
    preparation_tips: any | null; // Json field
    acceptance_rate: number | null;
    average_price_per_unit: number | null;
    price_unit: string | null;
    fun_fact: string | null;
    annual_recycling_volume: number | null;
    image_url: string | null;
    created_at: Date | string;
    updated_at: Date | string;
  };
  error?: string;
};

// Function to fetch a single material
async function getMaterial(id: string): Promise<{ data?: MaterialResponse['data']; error?: string }> {
  const apiUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/admin/materials/${id}`;
  try {
    const response = await fetch(apiUrl, { cache: 'no-store' });

    if (response.status === 404) {
      return { error: 'Material not found.' };
    }
     if (response.status === 403) {
      return { error: 'Forbidden: You do not have permission to view this material.' };
    }
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API Error (${response.status}): ${errorData.error || response.statusText}`);
    }

    const result: MaterialResponse = await response.json();
    if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch material data');
    }
    return { data: result.data };

  } catch (error) {
    console.error(`Error fetching material ${id}:`, error);
    return { error: error instanceof Error ? error.message : 'An unknown error occurred' };
  }
}

// Generate dynamic metadata
export async function generateMetadata({ params }: { params: { materialId: string } }): Promise<Metadata> {
    const result = await getMaterial(params.materialId);
    const materialName = result.data?.name ?? 'Material';
    return {
        title: `Edit ${materialName} | Admin Dashboard | DAVR`,
        description: `Edit details for the material: ${materialName}.`,
    };
}

// Edit Material Page Component
export default async function EditMaterialPage({ params }: { params: { materialId: string } }) {
  const result = await getMaterial(params.materialId);

  // Handle Not Found specifically for page structure
  if (result.error === 'Material not found.') {
    notFound(); // Trigger Next.js 404 page
  }

  // Handle other errors
  if (result.error || !result.data) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Edit Material</h1>
        <div className="flex items-center p-4 bg-red-100 border border-red-300 rounded-md text-red-700">
          <AlertCircle className="w-5 h-5 mr-2" />
          <p>Error loading material data: {result.error || 'Could not load material.'}</p>
        </div>
      </div>
    );
  }

  // Prepare data for the form, carefully mapping fields to match form expectations
  const initialFormData = {
    id: result.data.id,
    name: result.data.name,
    description: result.data.description ?? undefined,
    slug: result.data.slug,
    parent_id: result.data.parentMaterial?.id || null,  // Map parent material id
    recyclability_percentage: result.data.recyclability_percentage,
    // Ensure recycling_difficulty is one of the valid enum values or undefined
    recycling_difficulty: result.data.recycling_difficulty && 
      ['EASY', 'MEDIUM', 'HARD'].includes(result.data.recycling_difficulty) 
        ? result.data.recycling_difficulty as 'EASY' | 'MEDIUM' | 'HARD'
        : undefined,
    category_icon: result.data.category_icon ?? undefined,
    environmental_impact: result.data.environmental_impact ?? undefined,
    preparation_tips: result.data.preparation_tips ?? undefined,
    acceptance_rate: result.data.acceptance_rate,
    average_price_per_unit: result.data.average_price_per_unit,
    price_unit: result.data.price_unit ?? undefined,
    fun_fact: result.data.fun_fact ?? undefined,
    annual_recycling_volume: result.data.annual_recycling_volume,
    image_url: result.data.image_url ?? undefined,
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Edit Material: {result.data.name}</h1>
      <MaterialForm isEditing={true} initialData={initialFormData} />
    </div>
  );
} 