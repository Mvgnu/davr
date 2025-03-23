import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMaterialOffers } from '@/lib/hooks/useMaterialOffers';
import { MaterialOffer, MaterialOfferFormData } from '@/lib/api/recyclingCenters';
import axios from '@/lib/axios';
import { Material } from '@/app/api/materials/route';

interface MaterialOfferFormProps {
  centerId: string | number;
  materialOfferId?: string | number;
  onSuccess?: () => void;
}

const MaterialOfferForm: React.FC<MaterialOfferFormProps> = ({
  centerId,
  materialOfferId,
  onSuccess
}) => {
  const router = useRouter();
  const isEditMode = !!materialOfferId;
  
  const [formData, setFormData] = useState<MaterialOfferFormData>({
    centerId,
    materialId: '',
    price: 0,
    minQuantity: 0,
    notes: '',
    active: true
  });
  
  const [materialOptions, setMaterialOptions] = useState<Array<{id: string | number; name: string}>>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { fetchOffer, addOffer, editOffer } = useMaterialOffers(centerId);

  // Fetch material options from the real API
  useEffect(() => {
    const loadMaterialOptions = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/materials');
        
        if (response.data?.success && Array.isArray(response.data.data)) {
          const materials = response.data.data.map((material: Material) => ({
            id: material.id,
            name: material.name
          }));
          setMaterialOptions(materials);
        } else {
          throw new Error('Invalid response format from materials API');
        }
      } catch (err) {
        console.error('Failed to load materials:', err);
        setError('Failed to load material options');
      } finally {
        setLoading(false);
      }
    };
    
    loadMaterialOptions();
  }, []);
  
  // If editing, fetch the existing offer
  useEffect(() => {
    const loadExistingOffer = async () => {
      if (!materialOfferId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const offer = await fetchOffer(materialOfferId);
        if (offer) {
          setFormData({
            centerId,
            materialId: offer.materialId,
            price: offer.price,
            minQuantity: offer.minQuantity || 0,
            notes: offer.notes || '',
            active: true
          });
        }
      } catch (err) {
        setError('Failed to load material offer details');
      } finally {
        setLoading(false);
      }
    };
    
    if (isEditMode) {
      loadExistingOffer();
    }
  }, [materialOfferId, centerId, fetchOffer, isEditMode]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.materialId) {
      setError('Please select a material');
      return;
    }
    
    if (formData.price <= 0) {
      setError('Price must be greater than 0');
      return;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      if (isEditMode && materialOfferId) {
        await editOffer(materialOfferId, formData);
      } else {
        await addOffer(formData);
      }
      
      if (onSuccess) {
        onSuccess();
      } else {
        // Navigate back to the recycling center details
        router.push(`/recycling-centers/${centerId}`);
      }
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Failed to save material offer');
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading && !isEditMode) {
    return <div className="py-4 text-center">Loading materials...</div>;
  }
  
  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">
        {isEditMode ? 'Edit Material Offer' : 'Add New Material Offer'}
      </h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="materialId" className="block text-sm font-medium text-gray-700 mb-1">
            Material *
          </label>
          <select
            id="materialId"
            name="materialId"
            value={formData.materialId.toString()}
            onChange={handleChange}
            required
            disabled={isEditMode}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
          >
            <option value="">Select a material</option>
            {materialOptions.map(material => (
              <option key={material.id} value={material.id.toString()}>
                {material.name}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
            Price per kg (€) *
          </label>
          <input
            type="number"
            id="price"
            name="price"
            value={formData.price}
            onChange={handleChange}
            min="0.01"
            step="0.01"
            required
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
          />
          <p className="mt-1 text-sm text-gray-500">
            Enter the price you'll pay per kilogram
          </p>
        </div>
        
        <div>
          <label htmlFor="minQuantity" className="block text-sm font-medium text-gray-700 mb-1">
            Minimum Quantity (kg)
          </label>
          <input
            type="number"
            id="minQuantity"
            name="minQuantity"
            value={formData.minQuantity || ''}
            onChange={handleChange}
            min="0"
            step="0.1"
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
          />
          <p className="mt-1 text-sm text-gray-500">
            Minimum quantity you'll accept (leave empty if no minimum)
          </p>
        </div>
        
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            value={formData.notes || ''}
            onChange={handleChange}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
            placeholder="Add any special requirements or conditions"
          />
        </div>
        
        <div className="flex items-center">
          <input
            type="checkbox"
            id="active"
            name="active"
            checked={formData.active}
            onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
          />
          <label htmlFor="active" className="ml-2 block text-sm text-gray-700">
            Active (visible to users)
          </label>
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Saving...' : isEditMode ? 'Update Offer' : 'Create Offer'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MaterialOfferForm; 