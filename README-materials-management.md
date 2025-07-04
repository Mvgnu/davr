# Materials and Opening Hours Management for Recycling Centers

This document provides an overview of the materials and opening hours management implementation for recycling centers in the Aluminum Recycling Germany application.

## Components Overview

### RecyclingCenterEditForm

The main form component for editing recycling center details, including:
- Basic information (name, address, contact details)
- Opening hours with structured or text format
- Materials acceptance and buying offers

**Key Features:**
- Two opening hours input modes:
  - Simple text input
  - Structured day-by-day configuration with toggles
- Materials management with two tabs:
  - "Accepted Materials" for non-buyable materials
  - "Materials with Buying Price" for materials the center purchases

**File Path:** `components/recycling-centers/RecyclingCenterEditForm.tsx`

### MaterialOfferForm

Subcomponent for adding and editing material buying offers with details such as:
- Material selection (categorized dropdown)
- Price per kilogram
- Minimum and maximum quantities
- Optional notes
- Active status toggle

**File Path:** `components/recycling-centers/MaterialOfferForm.tsx`

### MaterialsList

Reusable component for displaying materials in a categorized list with:
- Grouping by material category
- Optional price display for buyable materials
- Empty state handling
- Scrollable area for large material lists

**File Path:** `components/recycling-centers/MaterialsList.tsx`

## API Endpoints

### GET /api/materials

Retrieves the list of available materials with optional filtering by category or search term.

**Response Format:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Aluminum Cans",
      "description": "Beverage cans made of aluminum",
      "category": "Aluminum",
      "recyclable": true
      // Other material properties
    },
    // More materials
  ],
  "meta": {
    "total": 42,
    "categories": ["Aluminum", "Copper", "Glass", "Paper"]
  }
}
```

### PATCH /api/recycling-centers/[id]

Updates a recycling center's information, including materials and opening hours.

**Request Body:**
```json
{
  "name": "Updated Center Name",
  "address": "New Address 123",
  "city": "Berlin",
  "postalCode": "10115",
  "openingHours": "Monday-Friday: 9:00-18:00",
  "materialOffers": [
    {
      "id": 1,
      "materialId": 5,
      "price": 0.85,
      "minQuantity": 1,
      "notes": "Clean cans only",
      "active": true
    }
  ],
  "acceptedMaterials": [1, 2, 3, 4]
}
```

**Response:**
```json
{
  "success": true,
  "center": {
    "id": 42,
    "name": "Updated Center Name",
    "slug": "updated-center-name",
    "location": {
      "address": "New Address 123",
      "city": "Berlin",
      "zipCode": "10115"
      // Other location details
    },
    // Other center information
  }
}
```

## Data Models

### Material

```typescript
interface Material {
  id: number;
  name: string;
  description: string | null;
  category: string;
  recyclable: boolean;
  // Other material properties
}
```

### MaterialOffer

```typescript
interface MaterialOffer {
  id?: number;
  materialId: number;
  materialName?: string;
  price: number;
  minQuantity: number;
  maxQuantity?: number;
  notes?: string;
  active: boolean;
}
```

### OpeningHours Structured Format

Opening hours can be stored in a structured JSON format:

```json
[
  {
    "day": "Montag",
    "open": true,
    "openTime": "09:00",
    "closeTime": "18:00"
  },
  {
    "day": "Dienstag",
    "open": true,
    "openTime": "09:00",
    "closeTime": "18:00"
  },
  // Other days of the week
]
```

## Implementation Notes

### Opening Hours

The system supports two formats for opening hours:
1. **Simple Text Format**: Free-form text like "Mon-Fri: 9:00-18:00, Sat: 10:00-14:00"
2. **Structured Format**: JSON array with each day's opening status and times

The form automatically detects which format is being used and displays the appropriate editor.

### Material Management

Materials are managed in two categories:
1. **Accepted Materials**: Materials the center accepts without payment (simple checkboxes)
2. **Material Offers**: Materials the center buys, including price and conditions

## Database Schema

### recycling_centers Table

Contains the basic information about recycling centers, including:
- `id`: Primary key
- `name`: Center name
- `slug`: URL-friendly identifier
- `address`, `city`, `postal_code`: Location details
- `opening_hours`: Text field for opening hours (plain text or JSON string)
- `user_id`: Owner of the center
- `claimed_by_user_id`: User who has claimed this center

### material_offers Table

Links recycling centers to materials they buy with prices:
- `id`: Primary key
- `recycling_center_id`: Foreign key to recycling_centers
- `material_id`: Foreign key to materials
- `price`: Buying price per kg
- `min_quantity`: Minimum quantity for purchase
- `max_quantity`: Maximum quantity for purchase (optional)
- `notes`: Additional information about the offer
- `active`: Whether the offer is currently active

### accepted_materials Table

Links recycling centers to materials they accept without buying:
- `id`: Primary key
- `recycling_center_id`: Foreign key to recycling_centers
- `material_id`: Foreign key to materials

### materials Table

Stores information about recyclable materials:
- `id`: Primary key
- `name`: Material name
- `category`: Material category
- `description`: Material description
- `recyclable`: Whether the material is recyclable

## Usage Example

To enable a recycling center to manage its accepted and purchased materials:

1. Navigate to `/recycling-centers/[city]/[slug]/edit`
2. Update basic information in the top sections
3. Configure opening hours using either the simple text or structured format
4. In the "Materialannahme" section:
   - Check which materials are accepted without payment
   - Add buying offers for materials with prices and conditions

## Security Considerations

Only users with appropriate permissions can edit a recycling center:
- The center owner (user_id)
- A user who has claimed the center (claimed_by_user_id)
- Administrators

The API endpoints enforce these permission checks before allowing modifications. 