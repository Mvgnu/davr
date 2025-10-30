import { z } from 'zod';
import {
  ListingType,
  ListingStatus,
  NegotiationActivityAudience,
  NotificationDeliveryStatus,
  VerificationStatus,
  OfferType,
  DealDisputeSeverity,
  DealDisputeCategory,
  DealDisputeEvidenceType,
  ContractRevisionStatus,
  ContractRevisionCommentStatus,
  FulfilmentOrderStatus,
  FulfilmentMilestoneType,
  FulfilmentReminderType,
} from '@prisma/client';

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

export const notificationsQuerySchema = z.object({
  negotiationId: z.string().cuid().optional(),
  audience: z.nativeEnum(NegotiationActivityAudience).optional(),
  userId: z.string().cuid().optional(),
  since: z
    .string()
    .datetime({ offset: true })
    .transform((value) => new Date(value))
    .optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  deliveryStatus: z.nativeEnum(NotificationDeliveryStatus).optional(),
});

export type NotificationsQuery = z.infer<typeof notificationsQuerySchema>;

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

const disputeEvidenceSchema = z.object({
  type: z.nativeEnum(DealDisputeEvidenceType).default(DealDisputeEvidenceType.LINK).optional(),
  url: z.string().url('Ungültige Nachweis-URL'),
  label: z.string().max(120).optional(),
});

export const createDealDisputeSchema = z.object({
  summary: z
    .string()
    .min(10, 'Bitte beschreiben Sie den Vorfall mit mindestens 10 Zeichen')
    .max(240, 'Zusammenfassung darf maximal 240 Zeichen lang sein'),
  description: z.string().max(2000).optional(),
  requestedOutcome: z.string().max(500).optional(),
  severity: z.nativeEnum(DealDisputeSeverity).default(DealDisputeSeverity.MEDIUM).optional(),
  category: z.nativeEnum(DealDisputeCategory).default(DealDisputeCategory.ESCROW).optional(),
  attachments: z
    .array(disputeEvidenceSchema)
    .max(5, 'Maximal 5 Nachweise erlaubt')
    .optional(),
});

export type CreateDealDisputeInput = z.infer<typeof createDealDisputeSchema>;

const fulfilmentWindowFields = {
  pickupWindowStart: z.coerce.date().optional().nullable(),
  pickupWindowEnd: z.coerce.date().optional().nullable(),
} as const;

function isValidFulfilmentWindow(data: { pickupWindowStart?: Date | null; pickupWindowEnd?: Date | null }) {
  return (
    !(data.pickupWindowStart && data.pickupWindowEnd) ||
    data.pickupWindowEnd.getTime() >= data.pickupWindowStart.getTime()
  );
}

const fulfilmentWindowSchema = z
  .object(fulfilmentWindowFields)
  .refine(isValidFulfilmentWindow, {
    message: 'Abholzeitraum-Ende muss nach dem Start liegen',
    path: ['pickupWindowEnd'],
  });

const fulfilmentOrderShape = {
  ...fulfilmentWindowFields,
  reference: z.string().max(60).optional().nullable(),
  pickupLocation: z.string().max(200).optional().nullable(),
  deliveryLocation: z.string().max(200).optional().nullable(),
  carrierCode: z
    .string()
    .trim()
    .max(40)
    .transform((value) => value.toUpperCase())
    .optional()
    .nullable(),
  carrierName: z.string().max(120).optional().nullable(),
  carrierContact: z.string().max(120).optional().nullable(),
  carrierServiceLevel: z.string().max(120).optional().nullable(),
  trackingNumber: z.string().max(120).optional().nullable(),
  externalId: z.string().max(120).optional().nullable(),
  specialInstructions: z.string().max(1000).optional().nullable(),
} as const;

export const createFulfilmentOrderSchema = z
  .object({
    ...fulfilmentOrderShape,
    status: z.nativeEnum(FulfilmentOrderStatus)
      .default(FulfilmentOrderStatus.SCHEDULING)
      .optional(),
  })
  .refine(isValidFulfilmentWindow, {
    message: 'Abholzeitraum-Ende muss nach dem Start liegen',
    path: ['pickupWindowEnd'],
  });

export type CreateFulfilmentOrderInput = z.infer<typeof createFulfilmentOrderSchema>;

export const updateFulfilmentOrderSchema = z
  .object(fulfilmentOrderShape)
  .partial()
  .extend({ status: z.nativeEnum(FulfilmentOrderStatus).optional() })
  .refine(isValidFulfilmentWindow, {
    message: 'Abholzeitraum-Ende muss nach dem Start liegen',
    path: ['pickupWindowEnd'],
  });

export type UpdateFulfilmentOrderInput = z.infer<typeof updateFulfilmentOrderSchema>;

export const recordFulfilmentMilestoneSchema = z.object({
  type: z.nativeEnum(FulfilmentMilestoneType),
  occurredAt: z.coerce.date().optional(),
  notes: z.string().max(500).optional().nullable(),
  payload: z.record(z.string(), z.unknown()).optional(),
});

export type RecordFulfilmentMilestoneInput = z.infer<typeof recordFulfilmentMilestoneSchema>;

export const scheduleFulfilmentReminderSchema = z.object({
  type: z.nativeEnum(FulfilmentReminderType),
  scheduledFor: z.coerce.date(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type ScheduleFulfilmentReminderInput = z.infer<typeof scheduleFulfilmentReminderSchema>;

const contractRevisionAttachmentSchema = z.object({
  id: z.string().cuid().optional(),
  name: z.string().min(1).max(120),
  url: z.string().url('Ungültige Anhang-URL'),
  mimeType: z.string().max(120).optional(),
});

export const createContractRevisionSchema = z.object({
  body: z
    .string()
    .min(20, 'Revision muss mindestens 20 Zeichen enthalten')
    .max(20000, 'Revision darf maximal 20000 Zeichen enthalten'),
  summary: z.string().max(400).optional(),
  attachments: z.array(contractRevisionAttachmentSchema).max(10).optional(),
  submit: z.boolean().default(true).optional(),
});

export type CreateContractRevisionInput = z.infer<typeof createContractRevisionSchema>;

export const updateContractRevisionStatusSchema = z.object({
  status: z.nativeEnum(ContractRevisionStatus),
});

export type UpdateContractRevisionStatusInput = z.infer<typeof updateContractRevisionStatusSchema>;

export const addRevisionCommentSchema = z.object({
  body: z
    .string()
    .min(1, 'Kommentar darf nicht leer sein')
    .max(2000, 'Kommentar darf maximal 2000 Zeichen enthalten'),
  anchor: z.record(z.string(), z.unknown()).optional(),
});

export type AddRevisionCommentInput = z.infer<typeof addRevisionCommentSchema>;

export const resolveRevisionCommentSchema = z.object({
  resolved: z.boolean().default(true),
});

export type ResolveRevisionCommentInput = z.infer<typeof resolveRevisionCommentSchema>;

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
