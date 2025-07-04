# Recycling Center Edit Functionality

This directory contains the implementation for editing recycling centers.

## Components

- **page.tsx**: The main server component that handles authentication, authorization, and rendering of the edit page.
- **RecyclingCenterEditForm.tsx**: A client component that wraps the RecyclingCenterForm and handles success/error states.

## Features

- **Authentication**: Only authenticated users can access the edit page
- **Authorization**: Only the center owner or administrators can edit a recycling center
- **Form Validation**: Client-side validation ensures required fields are filled
- **Error Handling**: Proper error handling for API requests
- **User Experience**: Loading states and toast notifications provide feedback to users

## Related Components

- **RecyclingCenterForm**: Reusable form component for editing recycling centers
- **DeleteConfirmationModal**: Modal for confirming deletion of a recycling center
- **LoadingSkeleton**: Loading skeleton for form while data is being loaded

## API Endpoints

- `PUT /api/recycling-centers/:id`: Updates a recycling center
- `DELETE /api/recycling-centers/:id`: Deletes a recycling center

## Future Improvements

- Add support for managing opening hours
- Add image upload capabilities
- Implement field-level validation
- Add support for managing accepted materials directly in the form 