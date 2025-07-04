# Implementation TODO Tracker

This file tracks outstanding implementation tasks identified from TODO comments or requirements.

**Key:**
*   Priority: High, Medium, Low
*   Status: Open, In Progress, Done, Blocked

---

## Tasks

1.  **Component: `components/admin/BlogActionsDropdown.tsx`**
    *   Task: Add Publish/Unpublish actions.
    *   Details: Requires API endpoint to update post status, frontend logic, and potentially passing `status` prop.
    *   Priority: High
    *   Status: Done

2.  **Component: `components/admin/AdminMarketplaceClientContent.tsx`**
    *   Task: Implement multiple features/fixes.
    *   Details:
        *   Adjust schema logic if needed (e.g., listing type buy/sell). - DONE
        *   Implement delete/approve/reject actions for listings. - DONE (API + Frontend Logic)
        *   Add filters for Type (Buy/Sell) and Status. - DONE
        *   Determine listing type for display (`getTypeBadge`). - DONE
    *   Priority: High
    *   Status: Done

3.  **Component: `components/admin/AdminBlogClientContent.tsx`**
    *   Task: Populate categories dynamically.
    *   Details: Fetch categories from DB/API instead of using hardcoded options.
    *   Priority: Medium
    *   Status: Done

4.  **Component: `components/admin/AdminUsersClientContent.tsx`**
    *   Task: Implement PaginationControls.
    *   Details: Connect existing UI component to backend pagination data/state.
    *   Priority: Medium
    *   Status: Done

5.  **Component: `app/admin/claims/page.tsx`**
    *   Task: Implement client-side filtering/pagination.
    *   Details: Add state management and routing logic for filters/pagination.
    *   Priority: Medium
    *   Status: Done

6.  **Component: `app/api/marketplace/materials/route.ts`**
    *   Task: Add city/postal code filtering.
    *   Details: Enhance API to accept and apply location filters.
    *   Priority: Medium
    *   Status: Done

7.  **Component: `components/recycling-centers/RecyclingCentersList.tsx`**
    *   Task: Use correct RecyclingCenter type.
    *   Details: Apply correct Prisma types once generation issue is resolved.
    *   Priority: Low
    *   Status: Done 