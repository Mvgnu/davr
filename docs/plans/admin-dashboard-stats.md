# Plan: Admin Dashboard Enhancements / Stats

**Goal:** Enhance the main Admin Dashboard (`/admin`) by displaying key statistics about the platform using visually distinct cards.

**Schema:** No changes needed.

**API Changes:**

*   **`GET /api/admin/stats`:**
    *   Create a new API route: `app/api/admin/stats/route.ts`.
    *   Implement a `GET` handler.
    *   **Auth:** Requires admin privileges.
    *   **Logic:**
        *   Use `prisma.$transaction` to efficiently query multiple counts.
        *   Fetch total users: `prisma.user.count()`.
        *   Fetch total active marketplace listings: `prisma.marketplaceListing.count({ where: { is_active: true } })`.
        *   Fetch total marketplace listings: `prisma.marketplaceListing.count()`.
        *   Fetch total recycling centers: `prisma.recyclingCenter.count()`.
        *   Fetch total materials: `prisma.material.count()`.
    *   **Output:** Return a JSON object with the counts. Example:
        ```json
        {
          "totalUsers": 125,
          "activeListings": 55,
          "totalListings": 68,
          "totalRecyclingCenters": 15,
          "totalMaterials": 30
        }
        ```

**Frontend Changes:**

*   **Page:** Modify the existing Admin Dashboard page `app/admin/page.tsx`.
*   **Refactor `app/admin/page.tsx`:**
    *   Make the default export function `async`.
    *   Fetch data directly within the component from the new `/api/admin/stats` endpoint using a server-side `fetch`.
    *   Handle potential errors during the fetch gracefully (e.g., display an error message within the dashboard).
*   **UI Components:**
    *   Utilize Shadcn `Card`, `CardHeader`, `CardTitle`, `CardContent` components to create individual stat cards.
    *   Display each statistic (Total Users, Active Listings, Total Listings, Recycling Centers, Materials) in its own card.
    *   Include relevant `lucide-react` icons (e.g., `Users`, `ShoppingBag`, `CheckCircle`, `Building2`, `Package`) in each card header.
*   **Layout:** Arrange the stat cards in a responsive grid (e.g., using Tailwind CSS `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`).

**Documentation:**

*   Create `docs/plans/admin-dashboard-stats.md`.
*   Update `docs/backend/admin/README.md`: Document the new `GET /api/admin/stats` endpoint.
*   Update `docs/frontend/admin/README.md`: Update the description of the `/admin` dashboard page.
*   Update `docs/progress_tracker.md` upon completion. 