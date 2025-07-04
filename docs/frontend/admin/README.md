# Admin Panel Frontend (`/app/admin`)

This section details the frontend components and pages specific to the administrator panel.

## Layout (`/admin/layout.tsx`)

*   **Component:** `app/admin/layout.tsx` (Client Component)
*   **Functionality:**
    *   Wraps all pages under the `/admin` route.
    *   Uses `useSession` to check if the user is authenticated and has the `isAdmin` flag.
    *   Redirects non-admins or unauthenticated users to the homepage (`/`).
    *   Provides a fixed sidebar navigation for admin-specific sections (Dashboard, Users, Listings).

## Dashboard (`/admin`)

*   **Component:** `app/admin/page.tsx` (Async Server Component)
*   **Fetches Data From:** `GET /api/admin/stats`
*   **Displays:**
    *   A welcome message to the administrator.
    *   A grid of statistics cards (`Card` components) showing key platform metrics:
        *   Total Users
        *   Active Marketplace Listings
        *   Total Marketplace Listings
        *   Total Recycling Centers
        *   Total Materials
    *   Includes icons (`lucide-react`) in card headers for visual distinction.
    *   Handles and displays errors if statistics fetching fails.
*   **Functionality:** Provides a quick overview of the platform's status.

### User Management (`/admin/users`)

*   **Component Structure:**
    *   `app/admin/users/page.tsx` (Server Component): Fetches the current admin ID and initial user list based on the `search` URL parameter. Passes data to the client component.
    *   `components/admin/AdminUsersClientContent.tsx` (Client Component): Handles the search input UI and logic (state, debouncing, URL updates) and renders the user table.
    *   `components/admin/AdminUserRow.tsx` (Client Component): Represents a single row in the table, handling the Admin Role Management logic (switch, confirmation). 
*   **Fetches Data From:** `GET /api/admin/users` (potentially with `?search=...` parameter).
*   **Displays:** A search input and a table listing filtered users.
*   **Key Information Displayed:** User ID, Name, Email, Admin Status, Email Verification Date.
*   **Functionality:**
    *   **Search Users:** An input field allows searching users by name or email. Typing in the input updates the URL `search` parameter (debounced), causing the server component to re-fetch and display filtered results.
    *   **View Users:** Lists users fetched from the API.
    *   **Admin Role Management:** (Handled within `AdminUserRow`)
        *   Provides an interactive `Switch` to toggle the `isAdmin` status.
        *   Disabled for the currently logged-in admin.
        *   Triggers confirmation `AlertDialog`.
        *   Sends `PATCH` request to `/api/admin/users/[userId]`.
        *   Provides feedback via `react-hot-toast` and refreshes data.

### Marketplace Listings Management (`/admin/listings`)

*   **Component:** `app/admin/listings/page.tsx` (Server Component)
*   **Fetches Data From:** `GET /api/admin/listings` (with pagination parameters `?page=X&limit=Y`)
*   **Displays:** A paginated table listing all marketplace listings.
*   **Key Information Displayed:** Title, Seller Email/Name, Material Name, Location, Active Status, Created Date.
*   **Functionality:**
    *   **View Listings:** Lists all listings fetched from the API, ordered by creation date (newest first).
    *   **Pagination:** Uses the `PaginationControls` component to navigate between pages of listings.
    *   **Delete Listing:**
        *   Uses the client component `components/admin/AdminListingActionsCell.tsx` in the "Actions" column for each row.
        *   Provides a "Delete" button.
        *   Clicking the button triggers a confirmation `AlertDialog`.
        *   Upon confirmation, a `DELETE` request is sent to `/api/admin/listings/[listingId]`.
        *   User feedback is provided using `react-hot-toast`.
        *   The page data is refreshed upon successful deletion using `router.refresh()`.
    *   **Edit Listing:**
        *   The `AdminListingActionsCell.tsx` component also includes an "Edit" button (pencil icon) linking to `/admin/listings/[listingId]/edit`.

#### Edit Listing Page (`/admin/listings/[listingId]/edit`)

*   **Component:** `app/admin/listings/[listingId]/edit/page.tsx` (Server Component)
*   **Fetches Data From:** 
    *   `GET /api/admin/listings/[listingId]` (for the specific listing details).
    *   `GET /api/materials` (for the materials dropdown). 
*   **Functionality:** Fetches data for the specified listing and all materials. Renders the reusable `AdminListingForm` client component (`components/admin/AdminListingForm.tsx`) populated with the fetched `initialData` and `materials`. Handles 404 if the listing is not found.
*   **Form:** Allows admins to edit Title, Description, Material (dropdown), Quantity, Unit, Location, and Active Status (`Checkbox`). Uses `react-hook-form` and `zod` for validation. Submits a `PATCH` request to `/api/admin/listings/[listingId]`. Redirects to the listing list on success. Handles errors with toast notifications.

### Recycling Centers Management (`/admin/recycling-centers`)

*   **Component:** `app/admin/recycling-centers/page.tsx` (Server Component)
*   **Fetches Data From:** `GET /api/admin/recycling-centers` (with pagination parameters `?page=X&limit=Y`)
*   **Displays:** A paginated table listing all recycling centers.
*   **Key Information Displayed:** Name, City, Owner Email/Name, Created Date.
*   **Functionality:**
    *   **View Centers:** Lists all centers fetched from the API, ordered by name.
    *   **Pagination:** Uses the `PaginationControls` component to navigate between pages.
    *   **Delete Center:**
        *   Uses the client component `components/admin/AdminRecyclingCenterActionsCell.tsx` in the "Actions" column.
        *   Provides a "Delete" button triggering a confirmation `AlertDialog`.
        *   Upon confirmation, sends a `DELETE` request to `/api/admin/recycling-centers/[centerId]`.
        *   Provides feedback and refreshes the page data on success.
    *   **Edit Center:** 
        *   The `AdminRecyclingCenterActionsCell.tsx` component also includes an "Edit" button linking to `/admin/recycling-centers/[centerId]/edit`.

#### Edit Recycling Center Page (`/admin/recycling-centers/[centerId]/edit`)

*   **Component:** `app/admin/recycling-centers/[centerId]/edit/page.tsx` (Server Component)
*   **Fetches Data From:** `GET /api/admin/recycling-centers/[centerId]`.
*   **Functionality:** Fetches data for the specified center. Renders the reusable `RecyclingCenterForm` client component (`components/admin/RecyclingCenterForm.tsx`) populated with the fetched `initialData`. Handles 404 if center not found.
*   **Form:** Allows admins to edit Name, Address details, Contact info, Opening Hours, Description, and Verification Status (`pending`, `verified`, `rejected`). Uses `react-hook-form` and `zod` for validation. Submits a `PATCH` request to `/api/admin/recycling-centers/[centerId]`. Redirects to the center list on success. Handles errors with toast notifications.

### Materials Management (`/admin/materials`)

*   **Component:** `app/admin/materials/page.tsx` (Server Component)
*   **Fetches Data From:** `GET /api/admin/materials` (paginated)
*   **Displays:** A paginated table listing all materials.
*   **Key Information Displayed:** Name, Category, Parent Material, Counts (Listings, Offers, Sub-Materials).
*   **Functionality:**
    *   **View Materials:** Lists all materials fetched from the API, ordered by name.
    *   **Create Material:** Includes a button linking to `/admin/materials/new`.
    *   **Pagination:** Uses the `PaginationControls` component.
    *   **Edit/Delete Material:**
        *   Uses the client component `components/admin/AdminMaterialActionsCell.tsx` for each row.
        *   Provides an "Edit" button linking to `/admin/materials/[materialId]/edit`.
        *   Provides a "Delete" button triggering a confirmation `AlertDialog`.
        *   Upon confirmation, sends a `DELETE` request to `/api/admin/materials/[materialId]`.
        *   Handles potential 409 Conflict errors if the material is in use.
        *   Provides feedback via `react-hot-toast` and refreshes the page data.

#### New Material Page (`/admin/materials/new`)

*   **Component:** `app/admin/materials/new/page.tsx` (Server Component)
*   **Functionality:** Renders the reusable `MaterialForm` client component (`components/admin/MaterialForm.tsx`) with `isEditing={false}`.
*   **Form:** Allows admins to input Name, Category, and Description. Uses `react-hook-form` and `zod` for validation. Submits a `POST` request to `/api/admin/materials`. Redirects to the materials list on success. Handles errors with toast notifications.

#### Edit Material Page (`/admin/materials/[materialId]/edit`)

*   **Component:** `app/admin/materials/[materialId]/edit/page.tsx` (Server Component)
*   **Fetches Data From:** `GET /api/admin/materials/[materialId]`.
*   **Functionality:** Fetches data for the specified material. Renders the `MaterialForm` component with `isEditing={true}` and populates it with the fetched `initialData`. Handles 404 if material not found.
*   **Form:** Allows admins to edit Name, Category, and Description. Uses `react-hook-form` and `zod` for validation. Submits a `PATCH` request to `/api/admin/materials/[materialId]`. Redirects to the materials list on success. Handles errors with toast notifications. 