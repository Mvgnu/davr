// types/recycling-center.ts

// Define the shape of the data for a Recycling Center
// Used for form validation and potentially API responses
export interface RecyclingCenterFormData {
  id?: string; // Optional for creation, required for update
  name: string;
  address_street?: string | null;
  city?: string | null;
  postal_code?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  phone_number?: string | null;
  website?: string | null;
  // Add other relevant fields from your Prisma schema if needed
  // e.g., owner_id, slug, offers etc. depending on form needs
}

// You might also want a type for the full DB model including relations
// import { User, RecyclingCenterOffer } from '@prisma/client'; // Adjust import if needed

// export interface RecyclingCenter extends RecyclingCenterFormData {
//   id: string;
//   created_at: Date;
//   updated_at: Date;
//   owner?: User | null;
//   offers?: RecyclingCenterOffer[];
// } 