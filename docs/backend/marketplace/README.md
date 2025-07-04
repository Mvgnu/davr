# Marketplace Backend Documentation

This document outlines the API endpoints related to the marketplace feature.

## Endpoints

### `GET /api/marketplace/listings`

*   **Description:** Fetches a list of active marketplace listings, with optional filtering and pagination.
*   **Authentication:** None (publicly accessible).
*   **Query Parameters:**
    *   `page` (number, optional): Page number for pagination (default: 1).
    *   `limit` (number, optional): Number of listings per page (default: 12, max: 50).
    *   `material` (string, optional): Filter by material name (case-insensitive contains).
    *   `search` (string, optional): General search term (searches title, description, location, material name; case-insensitive contains).
*   **Response Body:** Object containing `listings` (array of listing objects) and `pagination` (object with `currentPage`, `totalPages`, `totalListings`, `limit`). Listings include `id`, `title`, `description` (optional), `quantity` (optional), `unit` (optional), `location` (optional), `created_at`, `material` (optional object with `name`), `seller` (object with `id`, `name`).
*   **Success Status:** 200 OK.
*   **Error Status:** 500 Internal Server Error.

### `POST /api/marketplace/listings`

*   **Description:** Creates a new marketplace listing.
*   **Authentication:** Required (User must be logged in via NextAuth).
*   **Request Body:** JSON object matching the `createListingSchema` (title required; description, material_id, quantity, unit, location optional).
*   **Response Body (Success):** The newly created listing object, including related `material` (name) and `seller` (id, name).
*   **Success Status:** 201 Created.
*   **Error Statuses:** 
    *   400 Bad Request (Invalid input data - Zod validation failed or invalid `material_id` foreign key).
    *   401 Unauthorized (User not authenticated).
    *   500 Internal Server Error.

### `GET /api/marketplace/listings/[id]`

*   **Description:** Fetches details for a single marketplace listing by its ID.
*   **Authentication:** None (publicly accessible).
*   **URL Parameter:** `id` (string - CUID of the listing).
*   **Response Body (Success):** The listing object including `id`, `title`, `description`, `quantity`, `unit`, `location`, `created_at`, `updated_at`, `is_active`, `material` (optional object with `name`, `slug`), `seller` (object with `id`, `name`, `email`).
*   **Success Status:** 200 OK.
*   **Error Statuses:**
    *   400 Bad Request (Listing ID parameter missing).
    *   404 Not Found (Listing with the specified ID does not exist).
    *   500 Internal Server Error.

### `DELETE /api/marketplace/listings/[id]`

*   **Description:** Deletes a specific marketplace listing.
*   **Authentication:** Required. User must own the listing.
*   **URL Parameter:** `id` (string - CUID of the listing).
*   **Response Body (Success):** None.
*   **Success Status:** 204 No Content.
*   **Error Statuses:**
    *   400 Bad Request (Listing ID parameter missing).
    *   401 Unauthorized (User not authenticated).
    *   403 Forbidden (User does not own the listing).
    *   404 Not Found (Listing not found).
    *   500 Internal Server Error.

### `PATCH /api/marketplace/listings/[id]`

*   **Description:** Updates a specific marketplace listing. Allows partial updates.
*   **Authentication:** Required. User must own the listing.
*   **URL Parameter:** `id` (string - CUID of the listing).
*   **Request Body:** JSON object containing fields to update (matching `updateListingSchema`). At least one field must be provided.
*   **Response Body (Success):** The updated listing object, including relations.
*   **Success Status:** 200 OK.
*   **Error Statuses:**
    *   400 Bad Request (Invalid input data or invalid `material_id`).
    *   401 Unauthorized.
    *   403 Forbidden.
    *   404 Not Found.
    *   500 Internal Server Error.

### `GET /api/materials`

*   **Description:** Fetches a list of all available materials.
*   **Authentication:** None (publicly accessible).
*   **Response Body:** Array of material objects, each including `id`, `name`, `slug`.
*   **Success Status:** 200 OK.
*   **Error Status:** 500 Internal Server Error. 