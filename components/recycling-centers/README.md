# Recycling Center Components

This directory contains reusable components for working with recycling centers.

## Form Components

### RecyclingCenterForm

A reusable form component for editing recycling centers. It includes fields for:
- Basic information (name, description)
- Location information (address, city, postal code)
- Contact information (phone, email, website)
- Coordinates (latitude, longitude)

Usage:
```tsx
<RecyclingCenterForm 
  recyclingCenter={recyclingCenterData} 
  onSuccess={handleSuccess} 
/>
```

### MaterialOfferForm

A form component for adding or editing material offers for a recycling center.

Usage:
```tsx
<MaterialOfferForm 
  centerId={recyclingCenterId}
  materialOfferId={offerId} // Optional, for editing
  isEditMode={true} // Optional, defaults to false
  onSuccess={handleSuccess}
/>
```

## UI Components

### DeleteConfirmationModal

A modal component for confirming deletion of a recycling center.

Usage:
```tsx
<DeleteConfirmationModal
  isOpen={isDeleteModalOpen}
  onClose={() => setIsDeleteModalOpen(false)}
  recyclingCenterId={recyclingCenter.id}
  recyclingCenterName={recyclingCenter.name}
  redirectUrl="/recycling-centers" // Optional
/>
```

### RecyclingCenterDetailContent

Displays detailed information about a recycling center, including:
- Basic information
- Location details
- Contact information
- Material offers
- Owner actions (edit, delete)

Usage:
```tsx
<RecyclingCenterDetailContent 
  recyclingCenter={recyclingCenterData}
  city={citySlug}
  slug={recyclingCenterSlug}
  cityName={formattedCityName} // Optional
/>
```

## Integration with API

These components integrate with the following API endpoints:
- GET /api/recycling-centers/:id - Get recycling center details
- PUT /api/recycling-centers/:id - Update recycling center
- DELETE /api/recycling-centers/:id - Delete recycling center
- GET /api/recycling-centers/:id/offers - Get material offers
- POST /api/recycling-centers/:id/offers - Create a material offer
- PUT /api/recycling-centers/:id/offers/:offerId - Update a material offer
- DELETE /api/recycling-centers/:id/offers/:offerId - Delete a material offer 