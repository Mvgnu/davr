# Plan: Marketplace Listing Feature (MVP)

**Status:** Planning

**Goal:** Create the basic structure for a marketplace where users can list recyclable materials for sale/collection.

**Tech Stack:**
*   **Frontend:** Next.js, React, Tailwind CSS, NextAuth.js
*   **Backend:** Next.js API Routes, Prisma
*   **Database:** **PostgreSQL**
*   **ORM:** Prisma

## Feature Overview (MVP - Minimum Viable Product)

*   Define a `MarketplaceListing` model in the database schema.
*   Allow authenticated users to create a new marketplace listing via a form.
*   Create an API endpoint to handle listing creation.
*   Create an API endpoint to fetch all current listings.
*   Create a public page (`/marketplace`) to display all listings.
*   Listings should include basic details like title, description, material type (linked to `Material` model), quantity/unit, location (e.g., user's city/postal code), and seller information (linked to `User` model).

## Database Schema (**PostgreSQL** via Prisma)

1.  **Add `MarketplaceListing` model to `prisma/schema.prisma`:**
    ```prisma
    model MarketplaceListing {
      id          String    @id @default(cuid())
      title       String
      description String?
      quantity    Float?
      unit        String?   // e.g., "kg", "items", "bags"
      location    String?   // e.g., City or Postal Code
      is_active   Boolean   @default(true)
      created_at  DateTime  @default(now())
      updated_at  DateTime  @updatedAt

      // Relations
      material_id String?   // Link to the specific material being listed
      material    Material? @relation(fields: [material_id], references: [id])

      seller_id   String    // Link to the user creating the listing
      seller      User      @relation(fields: [seller_id], references: [id])
      
      // Optional: Add fields for price, contact info specific to listing later
      
      @@index([material_id])
      @@index([seller_id])
    }
    ```
2.  **Add relation back from `User` and `Material` models:**
    *   In `User` model: `listings MarketplaceListing[]`
    *   In `Material` model: `listings MarketplaceListing[]`
3.  **Generate Migration:** `npx prisma migrate dev --name add_marketplace_listing_model`.

## Backend Implementation (Next.js API Routes)

1.  **Create API Route (`/api/marketplace/listings/route.ts`):**
    *   **`GET` Handler:**
        *   Fetch all active listings (`where: { is_active: true }`).
        *   Include related `material` (name) and `seller` (name, email) data using Prisma `include`.
        *   Return the list as JSON.
    *   **`POST` Handler:**
        *   Requires authentication (check session using `getServerSession`).
        *   Receive listing data (title, description, materialId, quantity, unit, location) from request body.
        *   Validate input.
        *   Create new `MarketplaceListing` record in the database, associating it with the authenticated user (`seller_id`).
        *   Return success (201 Created) or error response.

## Frontend Implementation (React Components / Pages)

1.  **Create Page (`/app/marketplace/page.tsx`):**
    *   Server component to fetch listings from `GET /api/marketplace/listings`.
    *   Display listings (e.g., using a card component).
    *   Include a link/button (visible to authenticated users) to create a new listing (e.g., `/marketplace/new`).
2.  **Create Page (`/app/marketplace/new/page.tsx`):**
    *   Protected page (redirect if not authenticated).
    *   Contains a form (`CreateListingForm`) to submit new listing details.
3.  **Create Component (`components/marketplace/CreateListingForm.tsx`):**
    *   Client component with form state (React Hook Form + Zod).
    *   Includes fields for title, description, material (potentially dropdown fetched from `Material` model), quantity, unit, location.
    *   Submits data to `POST /api/marketplace/listings`.
    *   Handles success (e.g., redirect to marketplace page) and error states.
4.  **Create Component (`components/marketplace/ListingCard.tsx`):**
    *   Displays information for a single marketplace listing.

## Documentation Needs

*   `docs/backend/marketplace/README.md`: Document the new marketplace API endpoints (`GET` and `POST /api/marketplace/listings`).
*   `docs/frontend/marketplace/README.md`: Document the new frontend pages and components.
*   Update main backend/frontend READMEs with links.

## Testing Plan

*   **Backend:** Test API endpoints for fetching and creating listings (authenticated).
*   **Frontend:** Verify display of listings, test creation form submission (authenticated), verify page protection.

## Open Questions / Future Enhancements

*   Image uploads for listings.
*   Editing/Deleting own listings.
*   Contact mechanism between users.
*   Search/filtering for listings. 