'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import RecyclingCenterForm from '@/components/recycling-centers/RecyclingCenterForm';
import { RecyclingCenterDetail } from '@/lib/api/recyclingCenters';

interface RecyclingCenterEditFormProps {
  recyclingCenter: RecyclingCenterDetail;
  city: string;
  slug: string;
}

const RecyclingCenterEditForm: React.FC<RecyclingCenterEditFormProps> = ({
  recyclingCenter,
  city,
  slug
}) => {
  const router = useRouter();
  
  const handleSuccess = () => {
    toast.success('Recyclingcenter erfolgreich aktualisiert');
    router.push(`/recycling-centers/${city}/${slug}`);
    router.refresh();
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Recyclingcenter bearbeiten</h1>
        <p className="text-gray-600 mb-6">
          Aktualisieren Sie die Informationen für {recyclingCenter.name}.
        </p>
        
        <RecyclingCenterForm 
          recyclingCenter={recyclingCenter} 
          onSuccess={handleSuccess} 
        />
      </div>
    </div>
  );
};

export default RecyclingCenterEditForm; 