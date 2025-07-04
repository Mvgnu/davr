# Backend API: Recycling Centers

Handles fetching data related to recycling centers.

## Endpoints

### `GET /api/recycling-centers`

*   **Purpose:** Fetches a list of recycling centers, with optional filtering.
*   **Authentication:** None required (public endpoint).
*   **Implementation:** `app/api/recycling-centers/route.ts`
*   **Method:** `GET`
*   **Query Parameters (Optional):**
    *   `city` (string): Filter centers by city name (case-insensitive contains).
    *   `material` (string): Filter centers that accept a material with this name (case-insensitive contains).
    *   `search` (string): Free-text search across name, city, postal code (case-insensitive contains).
*   **Success Response (200 OK):**
    *   **Content-Type:** `application/json`
    *   **Body:** An array of recycling center objects.
    ```json
    [
      {
        "id": "string",
        "name": "string",
        "address_street": "string | null",
        "city": "string | null",
        "postal_code": "string | null",
        "slug": "string | null",
        "website": "string | null"
      },
      // ... more centers
    ]
    ```
*   **Error Response (500 Internal Server Error):**
    *   **Content-Type:** `application/json`
    *   **Body:** `{ "error": "Failed to fetch recycling centers" }`

### `GET /api/recycling-centers/[slug]`

*   **Purpose:** Fetches details for a single recycling center by its unique slug.
*   **Authentication:** None required (public endpoint).
*   **Implementation:** `app/api/recycling-centers/[slug]/route.ts`
*   **Method:** `GET`
*   **Path Parameters:**
    *   `slug` (string): The unique slug of the recycling center.
*   **Success Response (200 OK):**
    *   **Content-Type:** `application/json`
    *   **Body:** A single recycling center object with detailed fields.
    ```json
    {
      "id": "string",
      "name": "string",
      "address_street": "string | null",
      "city": "string | null",
      "postal_code": "string | null",
      "latitude": "number | null",
      "longitude": "number | null",
      "phone_number": "string | null",
      "website": "string | null",
      "slug": "string | null"
      // ... potentially more fields later
    }
    ```
*   **Error Response (404 Not Found):**
    *   **Content-Type:** `application/json`
    *   **Body:** `{ "error": "Recycling center not found" }`
*   **Error Response (500 Internal Server Error):**
    *   **Content-Type:** `application/json`
    *   **Body:** `{ "error": "Failed to fetch recycling center" }` 