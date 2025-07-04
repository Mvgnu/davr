# Plan: Filtering & Searching Recycling Centers

**Status:** Planning

**Goal:** Allow users to filter and search the list of recycling centers on the `/recycling-centers` page.

**Tech Stack:**
*   **Frontend:** Next.js, React, Tailwind CSS
*   **Backend:** Next.js API Routes, Prisma
*   **Database:** **PostgreSQL**
*   **ORM:** Prisma

## Feature Overview

*   Modify the `/recycling-centers` page to include filter/search controls.
*   Allow filtering by `city` (potentially a dropdown or autocomplete based on available cities).
*   Allow filtering by `material` (requires understanding how materials are linked - assume `Material` model and potentially `RecyclingCenterOffer` for now).
*   Allow free-text search across relevant fields (e.g., `name`, `city`, `postal_code`).
*   Update the backend API (`GET /api/recycling-centers`) to accept and process these filter/search parameters.
*   Update the frontend to pass filter/search values to the API and display the filtered results.

## Database Schema (**PostgreSQL** via Prisma)

*   Requires understanding the relationship between `RecyclingCenter` and `Material` for filtering by material. Assuming a many-to-many relation exists or will be added via `RecyclingCenterOffer` model (linking centers to materials they accept).
    *   **Action:** If `RecyclingCenterOffer` model isn't present or doesn't link correctly, it needs to be added/updated in `prisma/schema.prisma`, followed by a migration (`prisma migrate dev`). For now, planning assumes this link exists or will be handled.
*   Indexes on relevant filter fields (`city` on `RecyclingCenter`, potentially `name` on `Material`) are beneficial for performance.

## Backend Implementation (Next.js API Route)

1.  **Modify API Route (`GET /api/recycling-centers/route.ts`):**
    *   Read query parameters from the request URL (`searchParams`): `city`, `material`, `search`.
    *   Construct a Prisma `where` clause dynamically based on the provided parameters.
        *   `city`: `city: { contains: city, mode: 'insensitive' }` (or `equals` if using dropdown)
        *   `search`: Use `OR` condition across `name`, `city`, `postal_code` with `{ contains: search, mode: 'insensitive' }`.
        *   `material`: Requires a relational filter. If using `RecyclingCenterOffer`, it might look like: `offers: { some: { material: { name: { contains: material, mode: 'insensitive' } } } }`.
    *   Pass the constructed `where` clause to `prisma.recyclingCenter.findMany()`. Handle cases where no filters are provided.
    *   Return the filtered list.
    *   **Consider:** Adding pagination parameters (`page`, `limit`) simultaneously would be efficient.

## Frontend Implementation (React Components / Page)

1.  **Modify Page (`/app/recycling-centers/page.tsx`):**
    *   Make the page component accept search parameters (`searchParams` prop).
    *   Pass these `searchParams` to the `fetchRecyclingCenters` function.
    *   Modify `fetchRecyclingCenters` to append the received `searchParams` to the API request URL (`/api/recycling-centers?city=...&material=...`).
    *   Add state management (e.g., `useState` or preferably URL state via `useRouter` and `useSearchParams`) to hold the current filter/search values selected by the user.
2.  **Create Filter/Search Component (`components/recycling/CenterFilters.tsx` - Recommended):**
    *   Component containing input fields (text search), dropdowns (city, material - requires fetching distinct values or using predefined lists).
    *   Handles changes to filter inputs.
    *   Triggers a page reload or data refetch when filters change (e.g., by updating URL search parameters using `router.push`).
3.  **Integrate Filters:** Add the `CenterFilters` component to the `/app/recycling-centers/page.tsx`.

## Documentation Needs

*   **Update `docs/backend/recycling-centers/README.md`:** Modify the documentation for `GET /api/recycling-centers` to include the new optional query parameters (`city`, `material`, `search`, potentially `page`, `limit`), explaining how they filter results.
*   **Update `docs/frontend/recycling-centers/README.md`:**
    *   Update the page documentation (`/app/recycling-centers/page.tsx`) to explain how filters are handled (passed via URL, fetched).
    *   Add documentation for the new `CenterFilters` component, detailing its props, state management, and how it interacts with the page/URL.

## Testing Plan

*   **Backend:** Test the API endpoint (`GET /api/recycling-centers`) with various combinations of query parameters:
    *   `?city=Berlin`
    *   `?material=Plastic` (Requires relevant data/schema)
    *   `?search=Grün`
    *   `?city=Hamburg&search=Nord`
    *   Verify the returned list is correctly filtered.
*   **Frontend:**
    *   Interact with the filter/search UI elements on the `/recycling-centers` page.
    *   Verify that the displayed list updates correctly based on applied filters.
    *   Verify URL parameters update correctly when filters change.
    *   Test empty/no results scenarios for filters.

## Open Questions / Future Enhancements

*   Implement pagination alongside filtering.
*   Use debouncing for the free-text search input to avoid excessive API calls.
*   Decide on UI for city/material filters (dropdown vs. autocomplete).
*   Fetch distinct city/material values for dropdowns dynamically.
*   Need to confirm/implement the `RecyclingCenterOffer` model and relation for material filtering. 