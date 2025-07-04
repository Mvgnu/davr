import { AxiosError } from 'axios';
import axios from '@/lib/axios';
import { getAllCities } from '@/lib/data/recycling';

export type RecyclingCenter = {
  id: number | string;
  name: string;
  slug: string;
  location: {
    city: string;
    zipCode: string;
    state: string;
    latitude?: number;
    longitude?: number;
  };
  rating: {
    average: number;
    count: number;
  };
  offersCount: number;
  isVerified: boolean;
};

export type Review = {
  id: number;
  author: string;
  rating: number;
  comment: string;
  date: string;
  ownerReply?: string;
};

export type RecyclingCenterDetail = RecyclingCenter & {
  description: string;
  address: string;
  contact: {
    phone?: string;
    email?: string;
    website?: string;
  };
  openingHours?: any;
  materialsByCategory: Record<string, MaterialOffer[]>;
  reviews?: Review[] | undefined;
  isOwner: boolean;
}

export type MaterialOffer = {
  id: number | string;
  materialId: number | string;
  name: string;
  price: number;
  minQuantity?: number;
  notes?: string;
  imageUrl?: string;
  recyclable: boolean;
};

export type Pagination = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

export type RecyclingCentersResponse = {
  data: RecyclingCenter[];
  pagination: Pagination;
};

export type RecyclingCenterFormData = {
  name: string;
  address: string;
  city: string;
  postalCode: string;
  phone?: string;
  email?: string;
  website?: string;
  description?: string;
  openingHours?: any;
  latitude?: number;
  longitude?: number;
};

export type MaterialOfferFormData = {
  centerId: number | string;
  materialId: number | string;
  price: number;
  minQuantity?: number;
  notes?: string;
  active?: boolean;
};

// Error handling helper
const handleApiError = (error: any) => {
  if (error instanceof AxiosError) {
    const errorMsg = error.response?.data?.error || 'An unknown error occurred';
    throw new Error(errorMsg);
  }
  throw error;
};

// Get all recycling centers with filtering and pagination
export const getRecyclingCenters = async (params?: {
  page?: number;
  limit?: number;
  city?: string;
  material?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}): Promise<RecyclingCentersResponse> => {
  try {
    const response = await axios.get('/api/recycling-centers', { params });
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

// Get a single recycling center by ID or slug
export const getRecyclingCenter = async (idOrSlug: string | number): Promise<RecyclingCenterDetail> => {
  try {
    const response = await axios.get(`/api/recycling-centers/${idOrSlug}`);
    return response.data.center;
  } catch (error) {
    return handleApiError(error);
  }
};

// Create a new recycling center
export const createRecyclingCenter = async (data: RecyclingCenterFormData): Promise<RecyclingCenterDetail> => {
  try {
    const response = await axios.post('/api/recycling-centers', data);
    return response.data.center;
  } catch (error) {
    return handleApiError(error);
  }
};

// Update an existing recycling center
export const updateRecyclingCenter = async (id: string | number, data: Partial<RecyclingCenterFormData>): Promise<RecyclingCenterDetail> => {
  try {
    const response = await axios.patch(`/api/recycling-centers/${id}`, data);
    return response.data.center;
  } catch (error) {
    return handleApiError(error);
  }
};

// Delete a recycling center
export const deleteRecyclingCenter = async (id: string | number): Promise<boolean> => {
  try {
    const response = await axios.delete(`/api/recycling-centers/${id}`);
    return response.data.success || false;
  } catch (error) {
    return handleApiError(error);
  }
};

// Get all material offers for a recycling center
export const getMaterialOffers = async (params?: {
  centerId?: string | number;
  materialId?: string | number;
  limit?: number;
}): Promise<{ data: MaterialOffer[]; pagination: Pagination }> => {
  try {
    const response = await axios.get('/api/recycling-centers/offers', { params });
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

// Get a single material offer
export const getMaterialOffer = async (id: string | number): Promise<MaterialOffer> => {
  try {
    const response = await axios.get(`/api/recycling-centers/offers/${id}`);
    return response.data.offer;
  } catch (error) {
    return handleApiError(error);
  }
};

// Create a new material offer
export const createMaterialOffer = async (data: MaterialOfferFormData): Promise<MaterialOffer> => {
  try {
    const response = await axios.post('/api/recycling-centers/offers', data);
    return response.data.offer;
  } catch (error) {
    return handleApiError(error);
  }
};

// Update an existing material offer
export const updateMaterialOffer = async (id: string | number, data: Partial<MaterialOfferFormData>): Promise<MaterialOffer> => {
  try {
    const response = await axios.patch(`/api/recycling-centers/offers/${id}`, data);
    return response.data.offer;
  } catch (error) {
    return handleApiError(error);
  }
};

// Delete a material offer
export const deleteMaterialOffer = async (id: string | number): Promise<boolean> => {
  try {
    const response = await axios.delete(`/api/recycling-centers/offers/${id}`);
    return response.data.success || false;
  } catch (error) {
    return handleApiError(error);
  }
};

export async function fetchCities(): Promise<string[]> {
  // This is a wrapper for the getAllCities function to be used by client components
  return await getAllCities();
}

export async function searchCenters(filters: any) {
  try {
    const response = await axios.get('/api/recycling-centers', { params: filters });
    if (response.data.success) {
      return response.data;
    }
    throw new Error('Failed to fetch recycling centers');
  } catch (error) {
    console.error('Error fetching recycling centers:', error);
    return {
      success: false,
      error: 'Failed to fetch recycling centers',
      centers: [],
      pagination: {
        currentPage: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false
      }
    };
  }
} 