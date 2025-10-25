import React from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/options';
import { TreeView } from '@/components/admin/MaterialTreeView';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Type definition for material hierarchy
type MaterialNode = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  recyclability_percentage: number | null;
  children: MaterialNode[];
};

// Function to fetch the material hierarchy
async function getMaterialHierarchy(): Promise<MaterialNode[]> {
  const apiUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/admin/materials/hierarchy`;
  
  try {
    const response = await fetch(apiUrl, { cache: 'no-store' });
    
    if (response.status === 403) {
      throw new Error('Forbidden: You do not have permission to view material hierarchy.');
    }
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API Error (${response.status}): ${errorData.error || response.statusText}`);
    }
    
    const data = await response.json();
    return data.hierarchy || [];
  } catch (error) {
    console.error("Error fetching material hierarchy:", error);
    throw error;
  }
}

export default async function MaterialHierarchyPage() {
  const session = await getServerSession(authOptions);
  const userName = session?.user?.name ?? session?.user?.email ?? 'Admin';

  let hierarchy: MaterialNode[] = [];
  let error: string | null = null;

  try {
    hierarchy = await getMaterialHierarchy();
  } catch (err) {
    error = err instanceof Error ? err.message : 'An unknown error occurred';
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Material Hierarchy</h1>
      <p className="mb-6 text-lg">Welcome, {userName}! Visualize the material hierarchy structure.</p>

      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-300 rounded-md text-red-700">
          <p>Error loading hierarchy: {error}</p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Material Hierarchy Visualization</CardTitle>
        </CardHeader>
        <CardContent>
          {hierarchy.length > 0 ? (
            <TreeView nodes={hierarchy} />
          ) : (
            <p className="text-gray-500">No materials found or hierarchy is empty.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}