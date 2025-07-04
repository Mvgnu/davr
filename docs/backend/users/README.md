# User Specific Backend Documentation

This document outlines API endpoints related to specific user data.

## Endpoints

### `GET /api/users/me/listings`

*   **Description:** Fetches all marketplace listings created by the currently authenticated user.
*   **Authentication:** Required (User must be logged in via NextAuth).
*   **Response Body (Success):** Array of listing objects, structured to be compatible with the `ListingCard` component (includes `id`, `title`, `description`, `quantity`, `unit`, `location`, `created_at`, nested `material` {name}, nested `seller` {id, name}).
*   **Success Status:** 200 OK.
*   **Error Statuses:**
    *   401 Unauthorized (User not authenticated).
    *   500 Internal Server Error. 