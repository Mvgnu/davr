# Plan: Display Recycling Centers List

**Status:** Planning

**Goal:** Create a public page displaying a list of recycling centers from the database.

**Tech Stack:**
*   **Frontend:** Next.js, React, Tailwind CSS
*   **Backend:** Next.js API Routes, Prisma
*   **Database:** **PostgreSQL**
*   **ORM:** Prisma

## Feature Overview

*   A publicly accessible page (e.g., `/recycling-centers`) will display a list/cards of recycling centers.
*   Each item in the list should show basic information like name, address (city), and perhaps accepted material categories (if easily accessible).
*   The data will be fetched from the **PostgreSQL** database via a backend API endpoint.
*   Basic loading and error states should be handled on the frontend.

## Database Schema (**PostgreSQL** via Prisma)

**Challenge:** The necessary tables (`recycling_centers`, potentially `materials`, `recycling_center_offers`) exist in the database but are **not** currently defined in `prisma/schema.prisma` due to the earlier reset focusing only on Auth models. 

**Resolution Strategy (Autonomous Action):**
1.  **Introspect Database:** Use `npx prisma db pull` to update `prisma/schema.prisma` to reflect the *actual* current state of the **PostgreSQL** database (`recycling_db`), including the existing recycling-related tables.
2.  **Review & Refine:** Briefly review the introspected schema for the `RecyclingCenter` model (and related models if needed for display) to confirm necessary fields (e.g., `id`, `name`, `address`, `city`, `postal_code`, potentially relations). No *new* migrations should be needed initially as we are reading existing structure.

**Required Fields (Expected in `RecyclingCenter` model after introspection):**
*   `id`
*   `name`
*   `address_street`
*   `city`
*   `postal_code`
*   (Potentially relations to materials/offers depending on introspected schema)

## Backend Implementation (Next.js API Route)

1.  **Create API Route (`/app/api/recycling-centers/route.ts`):**
    *   Implement a `GET` handler.
    *   Use Prisma Client (`@/lib/db/prisma`) to fetch a list of recycling centers.
        *   Query: `prisma.recyclingCenter.findMany({...})`.
        *   Select necessary fields (id, name, address, city, etc.).
        *   Consider adding basic pagination later (fetch first ~20 initially).
        *   Include related data if necessary and feasible (e.g., count of accepted materials).
    *   Handle potential errors during database fetch.
    *   Return the list of centers as JSON response.

## Frontend Implementation (React Components / Page)

1.  **Create Page (`/app/recycling-centers/page.tsx`):**
    *   Fetch data from the `/api/recycling-centers` endpoint. This can be done server-side within the page component for initial load.
    *   Handle loading state while data is fetched.
    *   Handle error state if the API call fails.
    *   Map over the fetched data and render a list or grid of recycling centers.
2.  **Create Component (`components/recycling/RecyclingCenterCard.tsx` - Optional but recommended):**
    *   A component to display information for a single recycling center (name, address).
    *   Accepts recycling center data as props.
    *   Styled using Tailwind CSS.

## Documentation Needs

*   **`docs/backend/recycling-centers/README.md`:** Create documentation for the new API endpoint (`/api/recycling-centers`). Detail the `GET` request, expected response format, and example data.
*   **`docs/frontend/recycling-centers/README.md`:** Create documentation for the frontend page (`/app/recycling-centers/page.tsx`) and the `RecyclingCenterCard` component (if created). Describe their purpose, how data is fetched/displayed, and any props.
*   **Update `docs/backend/README.md`:** Link to the new recycling centers API documentation.
*   **Update `docs/frontend/README.md`:** Link to the new recycling centers frontend documentation.

## Testing Plan

*   **Backend:** Test the API endpoint (`/api/recycling-centers`) directly (e.g., using `curl` or browser) to verify it returns expected data structure and handles errors.
*   **Database:** Manually verify that the `recycling_centers` table in **PostgreSQL** contains sample data (or add some if empty) for testing.
*   **Frontend:** Load the `/recycling-centers` page and verify:
    *   Loading state appears briefly.
    *   Recycling center data is displayed correctly.
    *   Error state is handled gracefully if the API fails.

## Open Questions / Future Enhancements

*   Implement pagination for the API endpoint and frontend list.
*   Add filtering/search functionality.
*   Display more details (accepted materials, opening hours) - requires schema confirmation/joins.
*   Show locations on a map. 