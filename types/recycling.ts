export interface RecyclingCenter {
  _id: string;
  name: string;
  city: string;
  postalCode: string;
  state?: string;
  phone?: string;
  email?: string;
  website?: string;
  isVerified?: boolean;
  rating?: {
    average: number;
    count: number;
  };
  acceptedMaterials: string[];
  buyMaterials: string[];
}

export interface RecyclingCentersResponse {
  data: RecyclingCenter[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
} 