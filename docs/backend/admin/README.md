### 1. Get All Users

*   **Endpoint:** `GET /api/admin/users`
*   **Description:** Retrieves a list of all registered users. Intended for administrative use only.
*   **Authentication:** Requires the requesting user to be authenticated and have `isAdmin` set to `true` in their session.
*   **Query Parameters (Optional):**
    *   `search` (string): If provided, filters the results to include only users whose `name` or `email` contains the search string (case-insensitive).
*   **Success Response (200 OK):**
    *   Returns an array of user objects (subset of fields, excluding sensitive information like password hashes).
    *   Example (without search):
        ```json
        [
          {
            "id": "user_cuid_1",
            "name": "Admin User",
            "email": "admin@example.com",
            "emailVerified": "2023-10-26T10:00:00.000Z",
            "image": null,
            "isAdmin": true
          },
          {
            "id": "user_cuid_2",
            "name": "Regular User",
            "email": "user@example.com",
            "emailVerified": null,
            "image": null,
            "isAdmin": false
          }
          // ... more users
        ]
        ```
*   **Error Responses:**
    *   `403 Forbidden`: If the requesting user is not authenticated or not an administrator.
    *   `500 Internal Server Error`: If there was a database error during the fetch.

### 2. Update User Admin Status

*   **Endpoint:** `PATCH /api/admin/users/[userId]`
*   **Description:** Allows an administrator to grant or revoke admin privileges for a specific user.
*   **Authentication:** Requires the requesting user to be authenticated and have `isAdmin` set to `true` in their session.
*   **URL Parameters:**
    *   `userId`: The ID of the user whose admin status is to be updated.
*   **Request Body:**
    *   Content-Type: `application/json`
    *   Schema:
        ```json
        {
          "isAdmin": boolean 
        }
        ```
*   **Success Response (200 OK):**
    *   Returns the updated user object (subset of fields).
    *   Example:
        ```json
        {
          "id": "user_cuid",
          "name": "Updated User",
          "email": "user@example.com",
          "isAdmin": true
        }
        ```
*   **Error Responses:**
    *   `400 Bad Request`: If the request body is invalid (missing `isAdmin` or wrong type) or if an admin attempts to change their own status.
    *   `403 Forbidden`: If the requesting user is not authenticated or not an administrator.
    *   `404 Not Found`: If the user specified by `userId` does not exist.
    *   `500 Internal Server Error`: If there was a database error during the update.

### 3. Get All Marketplace Listings

*   **Endpoint:** `GET /api/admin/listings`
*   **Description:** Retrieves a paginated list of all marketplace listings, intended for administrative viewing.
*   **Authentication:** Requires the requesting user to be authenticated and have `isAdmin` set to `true`.
*   **Query Parameters (Optional):**
    *   `page` (number, default: 1): The page number for pagination.
    *   `limit` (number, default: 10): The number of listings per page.
*   **Success Response (200 OK):**
    *   Returns an object containing the list of listings and pagination metadata.
    *   Example:
        ```json
        {
          "listings": [
            {
              "id": "listing_cuid",
              "title": "Scrap Aluminum Available",
              "description": "Large quantity of clean aluminum scrap.",
              "quantity": 500,
              "unit": "kg",
              "location": "Berlin",
              "is_active": true,
              "created_at": "2023-10-27T10:00:00.000Z",
              "updated_at": "2023-10-27T10:00:00.000Z",
              "image_url": null,
              "seller": {
                "id": "seller_cuid",
                "email": "seller@example.com",
                "name": "Seller Name"
              },
              "material": {
                "id": "material_cuid",
                "name": "Aluminum"
              }
            }
            // ... more listings
          ],
          "pagination": {
            "currentPage": 1,
            "totalPages": 5,
            "pageSize": 10,
            "totalItems": 48
          }
        }
        ```
*   **Error Responses:**
    *   `403 Forbidden`: If the user is not authenticated or not an admin.
    *   `500 Internal Server Error`: If there was a database error.

### 4. Delete Marketplace Listing

*   **Endpoint:** `DELETE /api/admin/listings/[listingId]`
*   **Description:** Allows an administrator to permanently delete a specific marketplace listing.
*   **Authentication:** Requires the requesting user to be authenticated and have `isAdmin` set to `true`.
*   **URL Parameters:**
    *   `listingId`: The ID of the marketplace listing to be deleted.
*   **Success Response (204 No Content):**
    *   Indicates successful deletion. No response body is returned.
*   **Error Responses:**
    *   `400 Bad Request`: If `listingId` is missing.
    *   `403 Forbidden`: If the user is not authenticated or not an admin.
    *   `404 Not Found`: If the listing specified by `listingId` does not exist.
    *   `500 Internal Server Error`: If there was a database error during deletion.

### 4a. Get Single Marketplace Listing (Admin)

*   **Endpoint:** `GET /api/admin/listings/[listingId]`
*   **Description:** Retrieves details for a specific marketplace listing (Admin view).
*   **Authentication:** Requires admin privileges.
*   **URL Parameters:**
    *   `listingId`: The ID of the listing.
*   **Success Response (200 OK):**
    *   Returns the listing object, including seller and material info.
    *   Example:
        ```json
        {
          "success": true,
          "data": {
            "id": "listing_cuid",
            "title": "Scrap Aluminum Available",
            "description": "Large quantity of clean aluminum scrap.",
            "materialId": "mat_cuid_aluminum",
            "quantity": 500,
            "unit": "kg",
            "location": "Berlin",
            "is_active": true,
            "image_url": null,
            "seller": {
              "id": "seller_cuid",
              "name": "Seller Name",
              "email": "seller@example.com"
            },
            "material": {
              "id": "mat_cuid_aluminum",
              "name": "Aluminum"
            },
            "created_at": "2023-10-27T10:00:00.000Z",
            "updated_at": "2023-10-27T10:00:00.000Z"
          }
        }
        ```
*   **Error Responses:**
    *   `400 Bad Request`: Missing `listingId`.
    *   `403 Forbidden`: Not an admin.
    *   `404 Not Found`: Listing not found.
    *   `500 Internal Server Error`: Database error.

### 4b. Update Marketplace Listing (Admin)

*   **Endpoint:** `PATCH /api/admin/listings/[listingId]`
*   **Description:** Updates details for a specific marketplace listing.
*   **Authentication:** Requires admin privileges.
*   **URL Parameters:**
    *   `listingId`: The ID of the listing to update.
*   **Request Body:**
    *   Content-Type: `application/json`
    *   Schema (fields are optional):
        ```json
        {
          "title": "Updated Title",
          "description": "Updated description.",
          "materialId": "new_mat_cuid",
          "quantity": 600,
          "unit": "kg",
          "location": "Hamburg",
          "is_active": false
          // seller_id and image_url are typically not updated here
        }
        ```
*   **Success Response (200 OK):**
    *   Returns the updated listing object.
*   **Error Responses:**
    *   `400 Bad Request`: Invalid input data (validation failure, invalid materialId).
    *   `403 Forbidden`: Not an admin.
    *   `404 Not Found`: Listing not found or referenced Material not found.
    *   `500 Internal Server Error`: Database error.

### 5. Get Platform Statistics

*   **Endpoint:** `GET /api/admin/stats`
*   **Description:** Retrieves key statistics about the platform (user count, listing counts, etc.).
*   **Authentication:** Requires the requesting user to be authenticated and have `isAdmin` set to `true`.
*   **Success Response (200 OK):**
    *   Returns a JSON object containing various platform counts.
    *   Example:
        ```json
        {
          "totalUsers": 125,
          "activeListings": 55,
          "totalListings": 68,
          "totalRecyclingCenters": 15,
          "totalMaterials": 30
        }
        ```
*   **Error Responses:**
    *   `403 Forbidden`: If the user is not authenticated or not an admin.
    *   `500 Internal Server Error`: If there was a database error while fetching counts.

### 6. Get All Recycling Centers

*   **Endpoint:** `GET /api/admin/recycling-centers`
*   **Description:** Retrieves a paginated list of all recycling centers, intended for administrative viewing.
*   **Authentication:** Requires the requesting user to be authenticated and have `isAdmin` set to `true`.
*   **Query Parameters (Optional):**
    *   `page` (number, default: 1): The page number for pagination.
    *   `limit` (number, default: 10): The number of centers per page.
*   **Success Response (200 OK):**
    *   Returns an object containing the list of centers and pagination metadata.
    *   Example:
        ```json
        {
          "centers": [
            {
              "id": "center_cuid",
              "name": "BSR Recyclinghof Mustermannstraße",
              "address_street": "Mustermannstraße 1",
              "city": "Berlin",
              "postal_code": "12345",
              "created_at": "2023-10-26T12:00:00.000Z",
              "owner": {
                "id": "owner_cuid",
                "email": "owner@example.com",
                "name": "Max Mustermann"
              }
            }
            // ... more centers
          ],
          "pagination": {
            "currentPage": 1,
            "totalPages": 3,
            "pageSize": 10,
            "totalItems": 25
          }
        }
        ```
*   **Error Responses:**
    *   `403 Forbidden`: If the user is not authenticated or not an admin.
    *   `500 Internal Server Error`: If there was a database error.

### 7. Delete Recycling Center

*   **Endpoint:** `DELETE /api/admin/recycling-centers/[centerId]`
*   **Description:** Allows an administrator to permanently delete a specific recycling center and its associated offers (due to cascade delete).
*   **Authentication:** Requires the requesting user to be authenticated and have `isAdmin` set to `true`.
*   **URL Parameters:**
    *   `centerId`: The ID of the recycling center to be deleted.
*   **Success Response (204 No Content):**
    *   Indicates successful deletion. No response body is returned.
*   **Error Responses:**
    *   `400 Bad Request`: If `centerId` is missing.
    *   `403 Forbidden`: If the user is not authenticated or not an admin.
    *   `404 Not Found`: If the center specified by `centerId` does not exist.
    *   `500 Internal Server Error`: If there was a database error during deletion.

### 7a. Get Single Recycling Center (Admin)

*   **Endpoint:** `GET /api/admin/recycling-centers/[centerId]`
*   **Description:** Retrieves details for a specific recycling center (Admin view).
*   **Authentication:** Requires admin privileges.
*   **URL Parameters:**
    *   `centerId`: The ID of the recycling center.
*   **Success Response (200 OK):**
    *   Returns the recycling center object, potentially including owner info.
    *   Example:
        ```json
        {
          "success": true,
          "data": {
            "id": "center_cuid",
            "name": "BSR Recyclinghof Mustermannstraße",
            "address": "Mustermannstraße 1",
            "city": "Berlin",
            "state": "Berlin",
            "postal_code": "12345",
            "phone_number": "030123456",
            "website": "https://www.bsr.de/",
            "opening_hours": "Mon-Fri: 8am-6pm",
            "description": "Accepts various materials.",
            "verification_status": "verified",
            "owner": {
              "id": "owner_cuid",
              "name": "Max Mustermann",
              "email": "owner@example.com"
            },
            "created_at": "2023-10-26T12:00:00.000Z",
            "updated_at": "2023-10-26T14:00:00.000Z"
            // ... other fields like coordinates
          }
        }
        ```
*   **Error Responses:**
    *   `400 Bad Request`: Missing `centerId`.
    *   `403 Forbidden`: Not an admin.
    *   `404 Not Found`: Center not found.
    *   `500 Internal Server Error`: Database error.

### 7b. Update Recycling Center (Admin)

*   **Endpoint:** `PATCH /api/admin/recycling-centers/[centerId]`
*   **Description:** Updates details for a specific recycling center, including verification status.
*   **Authentication:** Requires admin privileges.
*   **URL Parameters:**
    *   `centerId`: The ID of the center to update.
*   **Request Body:**
    *   Content-Type: `application/json`
    *   Schema (fields are optional):
        ```json
        {
          "name": "Updated Center Name",
          "address": "Updated Address",
          "city": "Updated City",
          "state": "Updated State",
          "postal_code": "Updated Postal Code",
          "phone_number": "Updated Phone",
          "website": "https://updated.example.com" or null,
          "opening_hours": "Updated Hours",
          "description": "Updated Description",
          "verification_status": "pending" | "verified" | "rejected"
          // Coordinates might be included if editable
        }
        ```
*   **Success Response (200 OK):**
    *   Returns the updated recycling center object.
*   **Error Responses:**
    *   `400 Bad Request`: Invalid input data (validation failure, or empty required fields like name/address/city).
    *   `403 Forbidden`: Not an admin.
    *   `404 Not Found`: Center not found.
    *   `500 Internal Server Error`: Database error.

## Materials Management

### 8. Get All Materials

*   **Endpoint:** `GET /api/admin/materials`
*   **Description:** Retrieves a paginated list of all materials.
*   **Authentication:** Requires admin privileges.
*   **Query Parameters (Optional):**
    *   `page` (number, default: 1): Page number.
    *   `limit` (number, default: 10): Items per page.
*   **Success Response (200 OK):**
    *   Returns an object containing the list of materials and pagination metadata.
    *   Includes `_count` for related listings, offers, and sub-materials, and `parentMaterial` name/id.
    *   Example:
        ```json
        {
          "success": true,
          "data": [
            {
              "id": "mat_cuid",
              "name": "Aluminum",
              "description": "Various forms of aluminum scrap.",
              "category": "Metal",
              "parentMaterial": null,
              "_count": {
                "marketplaceListings": 5,
                "recyclingCenterOffers": 12,
                "subMaterials": 3
              },
              "created_at": "2023-10-28T10:00:00.000Z",
              "updated_at": "2023-10-28T10:00:00.000Z"
            }
            // ... more materials
          ],
          "pagination": {
            "currentPage": 1,
            "totalPages": 2,
            "pageSize": 10,
            "totalItems": 15,
            "hasNextPage": true,
            "hasPrevPage": false
          }
        }
        ```
*   **Error Responses:**
    *   `403 Forbidden`: Not an admin.
    *   `500 Internal Server Error`: Database error.

### 9. Create Material

*   **Endpoint:** `POST /api/admin/materials`
*   **Description:** Creates a new material.
*   **Authentication:** Requires admin privileges.
*   **Request Body:**
    *   Content-Type: `application/json`
    *   Schema:
        ```json
        {
          "name": "New Material Name",
          "description": "Optional description",
          "category": "Material Category"
          // "parentMaterialId": "optional_cuid" 
        }
        ```
*   **Success Response (201 Created):**
    *   Returns the newly created material object.
    *   Example:
        ```json
        {
          "success": true,
          "data": {
            "id": "new_mat_cuid",
            "name": "New Material Name",
            "description": "Optional description",
            "category": "Material Category",
            "parentMaterialId": null,
            "created_at": "2023-10-28T11:00:00.000Z",
            "updated_at": "2023-10-28T11:00:00.000Z"
          }
        }
        ```
*   **Error Responses:**
    *   `400 Bad Request`: Invalid input data (validation failure).
    *   `403 Forbidden`: Not an admin.
    *   `409 Conflict`: Material with the same name already exists.
    *   `500 Internal Server Error`: Database error.

### 10. Get Single Material

*   **Endpoint:** `GET /api/admin/materials/[materialId]`
*   **Description:** Retrieves details for a specific material.
*   **Authentication:** Requires admin privileges.
*   **URL Parameters:**
    *   `materialId`: The ID of the material.
*   **Success Response (200 OK):**
    *   Returns the material object.
    *   Example:
        ```json
        {
          "success": true,
          "data": {
            "id": "mat_cuid",
            "name": "Aluminum",
            "description": "Various forms of aluminum scrap.",
            "category": "Metal",
            "parentMaterialId": null, 
            "created_at": "2023-10-28T10:00:00.000Z",
            "updated_at": "2023-10-28T10:00:00.000Z"
          }
        }
        ```
*   **Error Responses:**
    *   `400 Bad Request`: Missing `materialId`.
    *   `403 Forbidden`: Not an admin.
    *   `404 Not Found`: Material not found.
    *   `500 Internal Server Error`: Database error.

### 11. Update Material

*   **Endpoint:** `PATCH /api/admin/materials/[materialId]`
*   **Description:** Updates details for a specific material.
*   **Authentication:** Requires admin privileges.
*   **URL Parameters:**
    *   `materialId`: The ID of the material to update.
*   **Request Body:**
    *   Content-Type: `application/json`
    *   Schema (fields are optional):
        ```json
        {
          "name": "Updated Name",
          "description": "Updated description",
          "category": "Updated Category"
          // "parentMaterialId": "updated_cuid_or_null"
        }
        ```
*   **Success Response (200 OK):**
    *   Returns the updated material object.
*   **Error Responses:**
    *   `400 Bad Request`: Invalid input data.
    *   `403 Forbidden`: Not an admin.
    *   `404 Not Found`: Material not found.
    *   `409 Conflict`: Updated name conflicts with another existing material.
    *   `500 Internal Server Error`: Database error.

### 12. Delete Material

*   **Endpoint:** `DELETE /api/admin/materials/[materialId]`
*   **Description:** Deletes a specific material.
*   **Authentication:** Requires admin privileges.
*   **URL Parameters:**
    *   `materialId`: The ID of the material to delete.
*   **Important:** Deletion will fail if the material is referenced by marketplace listings, recycling center offers, or has sub-materials.
*   **Success Response (204 No Content):**
    *   Indicates successful deletion. No response body.
*   **Error Responses:**
    *   `400 Bad Request`: Missing `materialId`.
    *   `403 Forbidden`: Not an admin.
    *   `404 Not Found`: Material not found.
    *   `409 Conflict`: Material is currently in use and cannot be deleted.
    *   `500 Internal Server Error`: Database error. 