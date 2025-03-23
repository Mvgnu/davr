export interface Material {
  id: string;
  name: string;
  description: string;
  category: string;
  subtype?: string;
  recyclable: boolean;
  marketValueLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  approximateMinPrice: number;
  approximateMaxPrice: number;
  imageUrl?: string;
}

export interface Center {
  id: string;
  name: string;
  address: string;
  city: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  distance?: number;
}

export interface SearchResponse {
  success: boolean;
  data: {
    materials: Material[];
    centers: Center[];
  };
} 