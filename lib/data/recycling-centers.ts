import { query } from '@/lib/db';
import { cache } from 'react';

export interface RecyclingCenter {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  address: string;
  city: string;
  postalCode: string;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  openingHours: string | null;
  userId: string | null;
  claimedByUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MaterialOffer {
  id: number;
  recyclingCenterId: number;
  materialId: number;
  materialName?: string;
  category?: string;
  price: number;
  minQuantity: number;
  maxQuantity?: number | null;
  notes?: string | null;
  active: boolean;
}

export interface AcceptedMaterial {
  id: number;
  recyclingCenterId: number;
  materialId: number;
  materialName?: string;
  category?: string;
}

export const getRecyclingCenterBySlug = cache(async (
  slug: string
): Promise<RecyclingCenter | null> => {
  try {
    const result = await query(
      `
      SELECT * FROM recycling_centers
      WHERE slug = $1
      LIMIT 1
      `,
      [slug]
    );

    if (!result.rows.length) {
      return null;
    }

    const center = result.rows[0];
    
    return {
      id: center.id,
      name: center.name,
      slug: center.slug,
      description: center.description,
      address: center.address,
      city: center.city,
      postalCode: center.postal_code,
      state: center.state,
      latitude: center.latitude,
      longitude: center.longitude,
      phone: center.phone,
      email: center.email,
      website: center.website,
      openingHours: center.opening_hours,
      userId: center.user_id,
      claimedByUserId: center.claimed_by_user_id,
      createdAt: new Date(center.created_at),
      updatedAt: new Date(center.updated_at),
    };
  } catch (error) {
    console.error('Error fetching recycling center by slug:', error);
    return null;
  }
});

export const getRecyclingCenterById = cache(async (
  id: number
): Promise<RecyclingCenter | null> => {
  try {
    const result = await query(
      `
      SELECT * FROM recycling_centers
      WHERE id = $1
      LIMIT 1
      `,
      [id]
    );

    if (!result.rows.length) {
      return null;
    }

    const center = result.rows[0];
    
    return {
      id: center.id,
      name: center.name,
      slug: center.slug,
      description: center.description,
      address: center.address,
      city: center.city,
      postalCode: center.postal_code,
      state: center.state,
      latitude: center.latitude,
      longitude: center.longitude,
      phone: center.phone,
      email: center.email,
      website: center.website,
      openingHours: center.opening_hours,
      userId: center.user_id,
      claimedByUserId: center.claimed_by_user_id,
      createdAt: new Date(center.created_at),
      updatedAt: new Date(center.updated_at)
    };
  } catch (error) {
    console.error('Error fetching recycling center by ID:', error);
    return null;
  }
});

export const getMaterialOffersByRecyclingCenterId = cache(async (
  recyclingCenterId: number
): Promise<MaterialOffer[]> => {
  try {
    const result = await query(
      `
      SELECT mo.*, m.name as material_name, m.category
      FROM material_offers mo
      JOIN materials m ON mo.material_id = m.id
      WHERE mo.recycling_center_id = $1
      `,
      [recyclingCenterId]
    );

    return result.rows.map((row: any) => ({
      id: row.id,
      recyclingCenterId: row.recycling_center_id,
      materialId: row.material_id,
      materialName: row.material_name,
      category: row.category,
      price: parseFloat(row.price),
      minQuantity: row.min_quantity ? parseFloat(row.min_quantity) : 0,
      maxQuantity: row.max_quantity ? parseFloat(row.max_quantity) : null,
      notes: row.notes,
      active: row.active
    }));
  } catch (error) {
    console.error('Error fetching material offers:', error);
    return [];
  }
});

export const getAcceptedMaterialsByRecyclingCenterId = cache(async (
  recyclingCenterId: number
): Promise<AcceptedMaterial[]> => {
  try {
    const result = await query(
      `
      SELECT am.*, m.name as material_name, m.category
      FROM accepted_materials am
      JOIN materials m ON am.material_id = m.id
      WHERE am.recycling_center_id = $1
      `,
      [recyclingCenterId]
    );

    return result.rows.map((row: any) => ({
      id: row.id,
      recyclingCenterId: row.recycling_center_id,
      materialId: row.material_id,
      materialName: row.material_name,
      category: row.category
    }));
  } catch (error) {
    console.error('Error fetching accepted materials:', error);
    return [];
  }
}); 