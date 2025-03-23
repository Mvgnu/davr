# API Documentation

## Overview

This document provides comprehensive information about the API endpoints in the DAVR recycling application. The API is structured around core resources including recycling centers, materials, marketplace listings, and user data.

## Database Architecture

The application is transitioning from MongoDB to PostgreSQL for all data storage. The PostgreSQL schema includes proper relations between entities:

- **Materials** - Base materials that can be recycled
- **Material Subtypes** - Specific variations of materials with different properties and values
- **Recycling Centers** - Physical locations that accept and buy recyclable materials
- **Recycling Center Offers** - Specific offers from recycling centers to buy materials/subtypes
- **Marketplace Listings** - User-created listings for selling materials

## Authentication

Most write operations require authentication using NextAuth. The system supports:
- Regular user accounts
- Recycling center owner accounts
- Admin accounts with extended privileges

## Endpoints

### Recycling Centers

#### GET /api/recycling-centers

Fetches a list of recycling centers with filtering options.

**Query Parameters:**
- `page` (default: 1) - Page number for pagination
- `limit` (default: 10) - Number of results per page
- `city` - Filter by city name
- `material` - Filter by materials accepted
- `search` - Search query across name, description, city, postal code
- `sortBy` (default: 'name') - Field to sort by
- `sortOrder` (default: 'asc') - Sort direction ('asc' or 'desc')

**Response Example:**
```json
{
  "centers": [
    {
      "id": "123",
      "name": "City Recycling Center",
      "slug": "city-recycling-center",
      "location": {
        "city": "Berlin",
        "zipCode": "10115",
        "state": "Berlin"
      },
      "rating": {
        "average": 4.5,
        "count": 28
      },
      "acceptedMaterialsCount": 15,
      "buyMaterialsCount": 8,
      "isVerified": true
    }
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 10,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

#### POST /api/recycling-centers

Creates a new recycling center. This endpoint is being migrated to use PostgreSQL.

**Authorization Required:** Yes (Admin or verified recycling center owner)

**Request Body:**
```json
{
  "name": "City Recycling Center",
  "address": "123 Main St",
  "city": "Berlin",
  "postalCode": "10115",
  "phone": "+49123456789",
  "email": "contact@recycling.example",
  "website": "https://recycling.example",
  "description": "Full-service recycling center",
  "openingHours": {
    "monday": "9:00-18:00",
    "tuesday": "9:00-18:00",
    "wednesday": "9:00-18:00",
    "thursday": "9:00-18:00",
    "friday": "9:00-18:00",
    "saturday": "10:00-16:00",
    "sunday": "closed"
  }
}
```

**Response Example:**
```json
{
  "success": true,
  "center": {
    "id": "123",
    "name": "City Recycling Center",
    "slug": "city-recycling-center",
    "address": "123 Main St",
    "city": "Berlin",
    "postalCode": "10115"
  }
}
```

#### GET /api/recycling-centers/[id]

Fetches details for a specific recycling center.

**Response Example:**
```json
{
  "center": {
    "id": "123",
    "name": "City Recycling Center",
    "address": "123 Main St",
    "city": "Berlin",
    "postalCode": "10115",
    "phone": "+49123456789",
    "email": "contact@recycling.example",
    "website": "https://recycling.example",
    "description": "Full-service recycling center",
    "openingHours": {
      "monday": "9:00-18:00",
      "tuesday": "9:00-18:00",
      "wednesday": "9:00-18:00",
      "thursday": "9:00-18:00",
      "friday": "9:00-18:00",
      "saturday": "10:00-16:00",
      "sunday": "closed"
    },
    "isVerified": true,
    "rating": 4.5,
    "ratingCount": 28,
    "location": {
      "latitude": 52.52,
      "longitude": 13.405
    }
  }
}
```

#### PUT /api/recycling-centers/[id]

Updates an existing recycling center.

**Authorization Required:** Yes (Admin or center owner)

**Request Body:** Same as POST but with fields to update

**Response Example:**
```json
{
  "success": true,
  "center": {
    "id": "123",
    "name": "City Recycling Center Updated",
    "address": "123 Main St",
    "city": "Berlin",
    "postalCode": "10115",
    "...": "..."
  }
}
```

#### DELETE /api/recycling-centers/[id]

Deletes a recycling center.

**Authorization Required:** Yes (Admin only)

**Response Example:**
```json
{
  "success": true,
  "message": "Recycling center deleted successfully"
}
```

### Recycling Center Offers (PostgreSQL)

> **Note:** This is the newer, PostgreSQL-based API for recycling center material offers. It replaces the older MongoDB-based `/api/recycling-centers/[id]/buy-materials` endpoint.

#### GET /api/recycling-centers/offers

Fetches offers from recycling centers to buy specific materials.

**Query Parameters:**
- `centerId` - Filter by recycling center ID
- `materialId` - Filter by material ID
- `subtypeId` - Filter by material subtype ID
- `city` - Filter by city location
- `minPrice` - Minimum price per kg
- `maxPrice` - Maximum price per kg
- `limit` (default: 50) - Results per page
- `page` (default: 1) - Page number
- `sort` (default: 'price') - Field to sort by ('price' or 'date')
- `order` (default: 'desc') - Sort direction ('asc' or 'desc')

**Response Example:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "recyclingCenter": {
        "id": 123,
        "name": "City Recycling Center",
        "city": "Berlin",
        "postalCode": "10115"
      },
      "material": {
        "id": 456,
        "name": "Copper",
        "subtype": {
          "id": 789,
          "name": "Pure Copper Wire"
        }
      },
      "price": 5.75,
      "conditions": {
        "minQuantity": 1,
        "maxQuantity": 100,
        "specialConditions": "Must be clean and stripped"
      },
      "createdAt": "2023-04-01T12:00:00Z",
      "updatedAt": "2023-04-01T12:00:00Z"
    }
  ],
  "pagination": {
    "total": 120,
    "page": 1,
    "limit": 50,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```

#### POST /api/recycling-centers/offers

Creates or updates an offer from a recycling center for a specific material.

**Authorization Required:** Yes (Admin or center owner)

**Request Body:**
```json
{
  "recyclingCenterId": 123,
  "materialId": 456,
  "subtypeId": 789,
  "pricePerKg": 5.75,
  "minQuantity": 1,
  "maxQuantity": 100,
  "specialConditions": "Must be clean and stripped"
}
```

**Response Example:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "recyclingCenter": {
      "id": 123,
      "name": "City Recycling Center",
      "city": "Berlin",
      "postalCode": "10115"
    },
    "material": {
      "id": 456,
      "name": "Copper",
      "subtype": {
        "id": 789,
        "name": "Pure Copper Wire"
      }
    },
    "price": 5.75,
    "conditions": {
      "minQuantity": 1,
      "maxQuantity": 100,
      "specialConditions": "Must be clean and stripped"
    },
    "createdAt": "2023-04-01T12:00:00Z",
    "updatedAt": "2023-04-01T12:00:00Z"
  }
}
```

### Legacy Buy Materials API (MongoDB - Deprecated)

> **Note:** These endpoints are being phased out in favor of the newer PostgreSQL-based `/api/recycling-centers/offers` endpoints.

#### GET /api/recycling-centers/[id]/buy-materials

Fetches materials that a specific recycling center buys.

**Response Example:**
```json
{
  "buyMaterials": [
    {
      "materialId": "copper-wire",
      "pricePerKg": 5.75,
      "minQuantity": 1,
      "maxQuantity": 100,
      "specialConditions": "Must be clean and stripped"
    }
  ]
}
```

#### POST /api/recycling-centers/[id]/buy-materials

Updates the list of materials that a recycling center buys.

**Authorization Required:** Yes (Admin or center owner)

**Request Body:**
```json
{
  "buyMaterials": [
    {
      "materialId": "copper-wire",
      "pricePerKg": 5.75,
      "minQuantity": 1,
      "maxQuantity": 100,
      "specialConditions": "Must be clean and stripped"
    }
  ]
}
```

#### DELETE /api/recycling-centers/[id]/buy-materials

Removes all materials that a recycling center buys.

**Authorization Required:** Yes (Admin or center owner)

## Migration Path

The API is currently transitioning from MongoDB to PostgreSQL. This involves:

1. Creating new endpoints based on PostgreSQL
2. Maintaining backward compatibility during transition
3. Eventually deprecating MongoDB-based endpoints

For new developments, use the PostgreSQL-based endpoints:
- `/api/recycling-centers/offers` instead of `/api/recycling-centers/[id]/buy-materials`
- `/api/materials` with its subtype support
- `/api/market/listings` for marketplace operations

## Error Handling

All API endpoints follow a consistent error response format:

```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

Common HTTP status codes:
- 200: Success
- 400: Bad Request - Invalid input parameters
- 401: Unauthorized - Authentication required
- 403: Forbidden - Insufficient permissions
- 404: Not Found - Resource doesn't exist
- 500: Server Error - Internal processing error 