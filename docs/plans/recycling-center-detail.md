# Plan: Recycling Center Detail Page

**Status:** Planning

**Goal:** Create a page to display detailed information about a single recycling center, accessed via a dynamic route (e.g., using its slug).

**Tech Stack:**
*   **Frontend:** Next.js, React, Tailwind CSS
*   **Backend:** Next.js API Routes, Prisma
*   **Database:** **PostgreSQL**
*   **ORM:** Prisma

## Feature Overview

*   A dynamic route, like `/recycling-centers/[slug]`, will display details for a specific center identified by its unique `slug`.
*   The page should display more comprehensive information than the list card, such as: full address, contact info (phone, website), map location (future enhancement), potentially accepted materials (requires schema update/join), operating hours (requires schema update).
*   Data for the specific center will be fetched from the database via a backend API endpoint.
*   Handle cases where a center with the given slug is not found (404).

## Database Schema (**PostgreSQL** via Prisma)

*   No immediate schema changes required *for basic details*. We will use existing fields on the `RecyclingCenter` model (name, address, city, postal code, phone, website, latitude, longitude).
*   **Future:** Displaying accepted materials or operating hours would require adding relations (e.g., `RecyclingCenterOffer`) or new fields to the `RecyclingCenter` model and potentially new migrations.

## Backend Implementation (Next.js API Route)

1.  **Create Dynamic API Route (`/app/api/recycling-centers/[slug]/route.ts`):**
    *   Implement a `GET` handler that receives the `slug` parameter from the URL.
    *   Use Prisma Client (`@/lib/db/prisma`) to fetch a single recycling center by its unique `slug`.
        *   Query: `prisma.recyclingCenter.findUnique({ where: { slug: slug } })`.
        *   Select all necessary fields for the detail page.
    *   If no center is found for the slug, return a 404 Not Found response.
    *   Handle potential errors during database fetch (500).
    *   Return the single center object as JSON.

## Frontend Implementation (React Components / Page)

1.  **Create Dynamic Page (`/app/recycling-centers/[slug]/page.tsx`):**
    *   This will be a server component that receives the `slug` from the route parameters.
    *   Fetch data for the specific center from the new API endpoint (`/api/recycling-centers/${slug}`) within the component.
    *   If the fetch returns a 404 or an error, use Next.js `notFound()` function to render the 404 page.
    *   Display the fetched center details (name, address, contact info, etc.) using appropriate HTML structure and Tailwind CSS.
    *   Optionally, create a dedicated `RecyclingCenterDetail` component to encapsulate the display logic.

## Documentation Needs

*   **Update `docs/backend/recycling-centers/README.md`:** Add documentation for the new dynamic API endpoint (`GET /api/recycling-centers/[slug]`), including path parameters, success response (single object), and 404/500 error responses.
*   **Update `docs/frontend/recycling-centers/README.md`:** Add documentation for the new dynamic page (`/app/recycling-centers/[slug]/page.tsx`). Describe its purpose, data fetching mechanism, and how it displays details.

## Testing Plan

*   **Backend:** Test the dynamic API endpoint (`/api/recycling-centers/[some-slug]`) directly:
    *   With a valid slug from seeded data (expect 200 OK and center data).
    *   With an invalid/non-existent slug (expect 404 Not Found).
*   **Frontend:**
    *   Navigate to a valid detail page URL (e.g., `/recycling-centers/gruener-punkt-mitte`) and verify details are displayed correctly.
    *   Navigate to an invalid URL (e.g., `/recycling-centers/invalid-slug`) and verify the Next.js 404 page is rendered.

## Open Questions / Future Enhancements

*   Add accepted materials display (requires schema changes, API update, frontend update).
*   Add operating hours display (requires schema changes, API update, frontend update).
*   Integrate an interactive map (e.g., Leaflet) showing the center's location.
*   Add user reviews/ratings section. 