# Materials Backend Documentation

This document outlines the API endpoints related to recyclable materials.

## Endpoints

### `GET /api/materials`

*   **Description:** Fetches a list of all available materials.
*   **Authentication:** None (publicly accessible).
*   **Response Body:** Array of material objects, each including `id`, `name`, `slug`.
*   **Success Status:** 200 OK.
*   **Error Status:** 500 Internal Server Error.

### `GET /api/materials/[slug]`

*   **Description:** Fetches details for a single material by its unique slug.
*   **Authentication:** None (publicly accessible).
*   **URL Parameter:** `slug` (string - unique slug of the material).
*   **Response Body (Success):** The material object including `id`, `name`, `description`, `slug`, `parent_id`, nested `parent` (name, slug), and nested `children` (array of name, slug).
*   **Success Status:** 200 OK.
*   **Error Statuses:**
    *   400 Bad Request (Slug parameter missing).
    *   404 Not Found (Material with the specified slug does not exist).
    *   500 Internal Server Error. 