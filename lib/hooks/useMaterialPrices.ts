import { useState, useEffect } from 'react';
import axios from 'axios';

export type MaterialPriceStats = {
  materialId: string;
  materialName: string;
  category: string;
  offerCount: number;
  minPrice: number | null;
  maxPrice: number | null;
  avgPrice: number | null;
  priceTrend: number | null;
};

export type MaterialPricesResponse = {
  success: boolean;
  data: MaterialPriceStats[];
  error?: string;
};

export function useMaterialPrices(materialId?: string, category?: string) {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [priceStats, setPriceStats] = useState<MaterialPriceStats[]>([]);

  useEffect(() => {
    const fetchPriceStats = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Build query parameters
        const params = new URLSearchParams();
        if (materialId) params.append('materialId', materialId);
        if (category) params.append('category', category);
        
        // Make API request
        const response = await axios.get<MaterialPricesResponse>(`/api/materials/prices?${params.toString()}`);
        
        if (response.data.success) {
          setPriceStats(response.data.data);
        } else {
          setError(response.data.error || 'Failed to fetch price statistics');
        }
      } catch (err) {
        console.error('Error fetching material price statistics:', err);
        setError('An error occurred while fetching price statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchPriceStats();
  }, [materialId, category]);

  /**
   * Get price stats for a specific material
   */
  const getMaterialPrice = (id: string): MaterialPriceStats | undefined => {
    return priceStats.find(stats => stats.materialId === id);
  };

  return {
    loading,
    error,
    priceStats,
    getMaterialPrice,
  };
} 