import React from 'react';
import MaterialForm from '@/components/admin/MaterialForm';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create New Material | Admin Dashboard | DAVR',
  description: 'Add a new material to the DAVR platform.',
};

export default function CreateMaterialPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Create New Material</h1>
      <MaterialForm isEditing={false} />
    </div>
  );
} 