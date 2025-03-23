import { useState } from 'react';
import axios from '@/lib/axios';
import { MaterialOffer } from '@/app/api/recycling-centers/[id]/route';

type MaterialOfferResponse = {
  offer: MaterialOffer;
  success: boolean;
  error?: string;
};

type MaterialOffersResponse = {
  offers: MaterialOffer[];
  success: boolean;
  error?: string;
};

export function useMaterialOffers(centerId: string | number) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fetchOffers = async (): Promise<MaterialOffer[]> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get<MaterialOffersResponse>(`/api/recycling-centers/${centerId}/offers`);
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch material offers');
      }
      
      return response.data.offers;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'An error occurred';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchOffer = async (offerId: string | number): Promise<MaterialOffer> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get<MaterialOfferResponse>(`/api/recycling-centers/${centerId}/offers/${offerId}`);
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch material offer');
      }
      
      return response.data.offer;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'An error occurred';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  const createOffer = async (offerData: Partial<MaterialOffer>): Promise<MaterialOffer> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post<MaterialOfferResponse>(`/api/recycling-centers/${centerId}/offers`, offerData);
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to create material offer');
      }
      
      return response.data.offer;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'An error occurred';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  const updateOffer = async (offerId: string | number, offerData: Partial<MaterialOffer>): Promise<MaterialOffer> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.put<MaterialOfferResponse>(`/api/recycling-centers/${centerId}/offers/${offerId}`, offerData);
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to update material offer');
      }
      
      return response.data.offer;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'An error occurred';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  const deleteOffer = async (offerId: string | number): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.delete(`/api/recycling-centers/${centerId}/offers/${offerId}`);
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to delete material offer');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'An error occurred';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  return {
    loading,
    error,
    fetchOffers,
    fetchOffer,
    createOffer,
    updateOffer,
    deleteOffer
  };
} 