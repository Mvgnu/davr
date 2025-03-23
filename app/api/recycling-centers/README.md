# Recycling Centers API

## Overview

This directory contains the API endpoints for recycling centers and their offers/materials. The implementation now uses PostgreSQL as the primary database.

## API Structure

```
/api/recycling-centers/
├── route.ts                     # Main endpoints for listing and creating centers
├── [id]/                        
│   └── route.ts                 # Endpoints for individual centers (GET, PATCH, DELETE)
├── offers/
│   ├── route.ts                 # Endpoints for all material offers (GET, POST)
│   └── [id]/
│       └── route.ts             # Endpoints for individual offers (GET, PATCH, DELETE)
└── README.md                    # This file
```

## Migration Status

✅ **Complete**: The API now uses PostgreSQL for all endpoints.

Key features:
- Comprehensive recycling center management
- Material offers with pricing
- User authentication for center management
- Role-based permissions (admin, center owner)

## API Endpoints

### Recycling Centers

- `GET /api/recycling-centers`: List all recycling centers with filtering options
  - Query params: `page`, `limit`, `city`, `material`, `search`, `sortBy`, `sortOrder`
  
- `POST /api/recycling-centers`: Create a new recycling center (authenticated)

- `GET /api/recycling-centers/[id]`: Get a specific recycling center
  - Works with both numeric IDs and slug names

- `PATCH /api/recycling-centers/[id]`: Update a recycling center (owner or admin only)

- `DELETE /api/recycling-centers/[id]`: Delete a recycling center (owner or admin only)

### Material Offers

- `GET /api/recycling-centers/offers`: List all material offers with filtering
  - Query params: `centerId`, `materialId`, `limit`
  
- `POST /api/recycling-centers/offers`: Create a new material offer (center owner or admin only)

- `GET /api/recycling-centers/offers/[id]`: Get a specific offer

- `PATCH /api/recycling-centers/offers/[id]`: Update an offer (center owner or admin only)

- `DELETE /api/recycling-centers/offers/[id]`: Delete an offer (center owner or admin only)

## Error Handling

All endpoints follow a consistent error format:

```json
{
  "error": "Error message here"
}
```

With appropriate HTTP status codes (400, 401, 403, 404, 500, etc.) 