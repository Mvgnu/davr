# Marketplace Frontend Documentation

This section covers the frontend components and pages related to the marketplace feature.

## Overview

The marketplace allows users to browse listings of recyclable materials offered by other users or potentially by recycling centers.
Future enhancements will include:
*   Creating new listings.
*   Viewing listing details.
*   Filtering and searching listings.
*   User-specific views (e.g., "My Listings").

## Components

*   `components/marketplace/ListingCard.tsx`: Displays a summary of a single marketplace listing.
*   `components/marketplace/CreateListingForm.tsx`: A client component form for creating new marketplace listings, using `react-hook-form` and `zod` for validation.
*   `components/marketplace/DeleteListingButton.tsx`: Client component with confirmation dialog for deleting a listing.
*   `components/marketplace/EditListingForm.tsx`: Client component form for editing an existing marketplace listing.

## Pages

*   `app/marketplace/page.tsx`: The main marketplace page.
*   `app/marketplace/new/page.tsx`: Page for creating a new listing.
*   `app/marketplace/listings/[id]/page.tsx`: Dynamic page displaying listing details.
*   `app/marketplace/listings/[id]/edit/page.tsx`: Page for editing an existing listing.

## Materials

*   `app/materials/page.tsx`: Displays a list of all recyclable materials.
*   `app/materials/[slug]/page.tsx`: Displays details for a specific material, including hierarchy and links to related centers/listings. 