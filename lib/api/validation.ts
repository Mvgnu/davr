import { z } from 'zod';
import { ListingType, ListingStatus, VerificationStatus, OfferType } from '@prisma/client';

/**
 * Common validation schemas for API endpoints
 */

// Pagination validation
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(12),
});

// Search validation
export const searchSchema = z.object({
  search: z.string().max(200).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

// Recycling Center query validation
export const recyclingCenterQuerySchema = paginationSchema
  .merge(searchSchema)
  .extend({
    city: z.string().max(100).optional(),
    material: z.string().max(100).optional(),
    materials: z.string().optional(), // Comma-separated IDs
    verified: z
      .enum(['true', 'false'])
      .transform((v) => v === 'true')
      .optional(),
    minRating: z.coerce.number().min(1).max(5).optional(),
    sortBy: z.enum(['name', 'rating', 'distance', 'created_at']).default('name'),
    lat: z.coerce.number().min(-90).max(90).optional(),
    lng: z.coerce.number().min(-180).max(180).optional(),
    maxDistance: z.coerce.number().positive().optional(), // Maximum distance in km
  });

export type RecyclingCenterQuery = z.infer<typeof recyclingCenterQuerySchema>;

// Marketplace listing query validation
export const marketplaceQuerySchema = paginationSchema
  .merge(searchSchema)
  .extend({
    materialId: z.string().cuid().optional(),
    location: z.string().max(100).optional(),
    type: z.nativeEnum(ListingType).optional(),
    status: z.nativeEnum(ListingStatus).optional(),
    sellerId: z.string().cuid().optional(),
    minPrice: z.coerce.number().positive().optional(),
    maxPrice: z.coerce.number().positive().optional(),
  });

export type MarketplaceQuery = z.infer<typeof marketplaceQuerySchema>;

// Marketplace listing creation validation
export const createListingSchema = z.object({
  title: z
    .string()
    .min(3, 'Titel muss mindestens 3 Zeichen lang sein')
    .max(100, 'Titel darf maximal 100 Zeichen lang sein'),
  description: z.string().max(1000, 'Beschreibung darf maximal 1000 Zeichen lang sein').optional(),
  quantity: z.number().positive('Menge muss positiv sein').optional().nullable(),
  unit: z.string().max(20, 'Einheit darf maximal 20 Zeichen lang sein').optional().nullable(),
  location: z.string().max(100, 'Standort darf maximal 100 Zeichen lang sein').optional().nullable(),
  material_id: z.string().cuid('Ungültige Material-ID').optional().nullable(),
  type: z.nativeEnum(ListingType, {
    errorMap: () => ({ message: 'Typ muss BUY oder SELL sein' }),
  }),
  imageUrl: z.string().url('Ungültige Bild-URL').optional().nullable(),
});

export type CreateListingInput = z.infer<typeof createListingSchema>;

// Material query validation
export const materialQuerySchema = z.object({
  search: z.string().max(200).optional(),
  parentId: z.string().cuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export type MaterialQuery = z.infer<typeof materialQuerySchema>;

// Recycling Center Offer validation
export const centerOfferSchema = z.object({
  material_id: z.string().cuid('Ungültige Material-ID'),
  price_per_unit: z.number().positive('Preis muss positiv sein').optional().nullable(),
  unit: z.string().max(20, 'Einheit darf maximal 20 Zeichen lang sein').optional().nullable(),
  notes: z.string().max(500, 'Notizen dürfen maximal 500 Zeichen lang sein').optional().nullable(),
});

export type CenterOfferInput = z.infer<typeof centerOfferSchema>;

// Negotiation creation validation
export const createNegotiationSchema = z.object({
  listingId: z.string().cuid('Ungültige Listing-ID'),
  initialOfferPrice: z
    .number({ invalid_type_error: 'Preis muss eine Zahl sein' })
    .positive('Preis muss positiv sein'),
  initialOfferQuantity: z
    .number({ invalid_type_error: 'Menge muss eine Zahl sein' })
    .positive('Menge muss positiv sein')
    .optional(),
  message: z.string().max(1000).optional(),
  expiresAt: z.coerce.date().optional(),
  currency: z.string().max(3).default('EUR'),
});

export type CreateNegotiationInput = z.infer<typeof createNegotiationSchema>;

export const offerCounterSchema = z
  .object({
    price: z
      .number({ invalid_type_error: 'Preis muss eine Zahl sein' })
      .positive('Preis muss positiv sein')
      .optional(),
    quantity: z
      .number({ invalid_type_error: 'Menge muss eine Zahl sein' })
      .positive('Menge muss positiv sein')
      .optional(),
    message: z.string().max(1000).optional(),
    type: z.nativeEnum(OfferType).optional(),
  })
  .refine(
    (data) => typeof data.price === 'number' || typeof data.quantity === 'number',
    {
      message: 'Mindestens Preis oder Menge erforderlich',
      path: ['price'],
    }
  );

export type OfferCounterInput = z.infer<typeof offerCounterSchema>;

export const acceptNegotiationSchema = z.object({
  agreedPrice: z
    .number({ invalid_type_error: 'Preis muss eine Zahl sein' })
    .positive('Preis muss positiv sein')
    .optional(),
  agreedQuantity: z
    .number({ invalid_type_error: 'Menge muss eine Zahl sein' })
    .positive('Menge muss positiv sein')
    .optional(),
  note: z.string().max(1000).optional(),
});

export type AcceptNegotiationInput = z.infer<typeof acceptNegotiationSchema>;

export const cancelNegotiationSchema = z.object({
  reason: z.string().max(1000).optional(),
});

export type CancelNegotiationInput = z.infer<typeof cancelNegotiationSchema>;

export const escrowMutationSchema = z.object({
  amount: z
    .number({ invalid_type_error: 'Betrag muss eine Zahl sein' })
    .positive('Betrag muss positiv sein'),
  reference: z.string().max(100).optional(),
});

export type EscrowMutationInput = z.infer<typeof escrowMutationSchema>;

// Review creation validation
export const createReviewSchema = z.object({
  rating: z
    .number()
    .int()
    .min(1, 'Bewertung muss mindestens 1 sein')
    .max(5, 'Bewertung darf maximal 5 sein'),
  comment: z.string().max(1000, 'Kommentar darf maximal 1000 Zeichen lang sein').optional(),
  centerId: z.string().cuid('Ungültige Center-ID'),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;

// User registration validation
export const registerUserSchema = z.object({
  name: z.string().min(2, 'Name muss mindestens 2 Zeichen lang sein').max(100),
  email: z.string().email('Ungültige E-Mail-Adresse'),
  password: z
    .string()
    .min(8, 'Passwort muss mindestens 8 Zeichen lang sein')
    .max(100)
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Passwort muss mindestens einen Kleinbuchstaben, einen Großbuchstaben und eine Zahl enthalten'
    ),
});

export type RegisterUserInput = z.infer<typeof registerUserSchema>;

// Center claim validation
export const claimCenterSchema = z.object({
  name: z.string().min(2, 'Name muss mindestens 2 Zeichen lang sein').max(100),
  email: z.string().email('Ungültige E-Mail-Adresse'),
  phone: z.string().max(20).optional(),
  companyName: z.string().max(100).optional(),
  businessRole: z.string().max(100).optional(),
  message: z.string().min(10, 'Nachricht muss mindestens 10 Zeichen lang sein').max(1000),
});

export type ClaimCenterInput = z.infer<typeof claimCenterSchema>;

/**
 * Validation helper function for API routes
 */
export function validateRequest<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  return { success: false, error: result.error };
}

/**
 * Format Zod errors for API responses
 */
export function formatValidationErrors(error: z.ZodError): Record<string, string[]> {
  const formatted: Record<string, string[]> = {};

  error.errors.forEach((err) => {
    const path = err.path.join('.');
    if (!formatted[path]) {
      formatted[path] = [];
    }
    formatted[path].push(err.message);
  });

  return formatted;
}
