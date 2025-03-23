import { useState, useEffect } from 'react';
import axios from '@/lib/axios';
import { RecyclingCenter } from '@/app/api/recycling-centers/route';
import { RecyclingCenterDetail } from '@/app/api/recycling-centers/[id]/route';

type ApiResponse<T> = {
  data: T;
  meta?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
};

export type RecyclingCenterFilters = {
  city?: string;
  material?: string;
  materials?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  minRating?: number;
  verified?: boolean;
};

interface PaginationData {
  page: number;
  totalPages: number;
  totalItems: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export function useRecyclingCenters(initialFilters?: RecyclingCenterFilters) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [centers, setCenters] = useState<RecyclingCenter[]>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  
  const fetchCenters = async (page = 1): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      
      // Ensure page is a valid number and defaults to 1
      const validPage = Number.isNaN(Number(page)) ? 1 : Number(page);
      
      const filters = { 
        ...initialFilters,
        page: validPage
      };
      
      if (filters) {
        if (filters.city) params.append('city', filters.city);
        if (filters.material) params.append('material', filters.material);
        if (filters.materials) params.append('materials', filters.materials);
        if (filters.search) params.append('search', filters.search);
        
        // Ensure numeric values are valid before adding to params
        if (filters.page && !isNaN(filters.page)) {
          params.append('page', filters.page.toString());
        }
        
        if (filters.limit && !isNaN(filters.limit)) {
          params.append('limit', filters.limit.toString());
        }
        
        if (filters.sortBy) params.append('sortBy', filters.sortBy);
        if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
        
        if (filters.minRating && !isNaN(filters.minRating)) {
          params.append('minRating', filters.minRating.toString());
        }
        
        if (filters.verified !== undefined) {
          params.append('verified', filters.verified.toString());
        }
      }
      
      const queryString = params.toString();
      const url = `/api/recycling-centers${queryString ? `?${queryString}` : ''}`;
      
      const response = await axios.get<ApiResponse<RecyclingCenter[]>>(url);
      
      setCenters(response.data.data || []);
      
      if (response.data.meta) {
        const apiMeta = response.data.meta;
        setPagination({
          page: apiMeta.page,
          totalPages: apiMeta.pages,
          totalItems: apiMeta.total,
          hasNext: apiMeta.page < apiMeta.pages,
          hasPrev: apiMeta.page > 1
        });
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'An error occurred';
      setError(errorMessage);
      console.error('Error fetching recycling centers:', err);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    // Ensure initial page is valid
    const initialPage = initialFilters?.page && !isNaN(initialFilters.page) 
      ? initialFilters.page 
      : 1;
      
    fetchCenters(initialPage);
  }, []);
  
  const fetchCenter = async (id: string | number): Promise<RecyclingCenterDetail> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get<ApiResponse<RecyclingCenterDetail>>(`/api/recycling-centers/${id}`);
      return response.data.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'An error occurred';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  const createCenter = async (centerData: Partial<RecyclingCenter>): Promise<RecyclingCenter> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post<ApiResponse<RecyclingCenter>>(
        '/api/recycling-centers',
        centerData
      );
      
      return response.data.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'An error occurred';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  const updateCenter = async (id: string | number, centerData: Partial<RecyclingCenter>): Promise<RecyclingCenter> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.put<ApiResponse<RecyclingCenter>>(
        `/api/recycling-centers/${id}`,
        centerData
      );
      
      return response.data.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'An error occurred';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  const deleteCenter = async (id: string | number): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      await axios.delete(`/api/recycling-centers/${id}`);
      return true;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'An error occurred';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  return {
    centers,
    pagination,
    loading,
    error,
    fetchCenters,
    fetchCenter,
    createCenter,
    updateCenter,
    deleteCenter
  };
} 