# Plan: Admin Marketplace Listing Management

**Goal:** Allow administrators to view and delete any marketplace listing from the admin panel.

**Schema:** No changes needed.

**API Changes:**

*   **`GET /api/admin/listings`:**
    *   Create a new API route: `app/api/admin/listings/route.ts`.
    *   Implement a `GET` handler.
    *   **Auth:** Requires admin privileges.
    *   **Logic:** Fetch all marketplace listings using Prisma. Include related `seller` and `material` data. Implement pagination similar to the public listing API (accept `page`, `limit` query parameters). Order by `created_at` descending.
    *   **Output:** Return paginated list of listings with seller/material info and total count.
*   **`DELETE /api/admin/listings/[listingId]`:**
    *   Create a new dynamic API route: `app/api/admin/listings/[listingId]/route.ts`.
    *   Implement a `DELETE` handler.
    *   **Auth:** Requires admin privileges.
    *   **URL Parameters:** `listingId`.
    *   **Logic:** Find the listing by `listingId`. If found, delete it using `prisma.marketplaceListing.delete`. Handle not found (404).
    *   **Output:** Return success message (200 OK or 204 No Content). Handle errors (403, 404, 500).

**Frontend Changes:**

*   **New Page:** Create `app/admin/listings/page.tsx`.
*   **Navigation:** Add a link to `/admin/listings` in the admin sidebar (`app/admin/layout.tsx`). Add a relevant icon (e.g., `ShoppingBag` from lucide-react).
*   **Component:** The new page (`app/admin/listings/page.tsx`) will be a server component.
*   **Data Fetching:** Fetch listings from `GET /api/admin/listings` using search parameters for pagination.
*   **Display:** Render listings in a table (similar to the user list) showing key details (Title, Seller Email, Material, Location, Created Date, Status). Include pagination controls (`components/ui/PaginationControls.tsx`).
*   **Actions:**
    *   Need a client component for the delete action within each row (e.g., `AdminListingActionsCell.tsx`).
    *   This component will include a "Delete" button.
    *   Clicking Delete opens a confirmation `AlertDialog`.
    *   On confirmation, it sends a `DELETE` request to `/api/admin/listings/[listingId]`.
    *   Handles loading state, displays feedback (`react-hot-toast`), and refreshes data (`router.refresh()`).

**Documentation:**

*   Create `docs/plans/admin-marketplace-management.md`.
*   Update `docs/backend/admin/README.md`: Document the new `GET /api/admin/listings` and `DELETE /api/admin/listings/[listingId]` endpoints.
*   Update `docs/frontend/admin/README.md`: Add a section describing the `/admin/listings` page and its functionality.
*   Update `docs/progress_tracker.md` upon completion. 