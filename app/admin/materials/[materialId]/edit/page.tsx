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
    category: string;
    // Add other fields if they exist and are needed for the form
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

  // Prepare data for the form, converting null description to undefined
  const initialFormData = {
      ...result.data,
      description: result.data.description ?? undefined, 
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Edit Material: {result.data.name}</h1>
      <MaterialForm isEditing={true} initialData={initialFormData} />
    </div>
  );
} 