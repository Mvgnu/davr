# DAVR Application Restoration Plan

## Core App Structure

```
/app
  /api                     # API routes
    /auth                  # Authentication endpoints
    /recycling-centers     # Recycling center API endpoints
    /marketplace           # Marketplace API endpoints
    /admin                 # Admin-only API endpoints
  /auth                    # Authentication pages
  /recycling-centers       # Recycling center pages
  /recycling-centers/[city]       # Recycling center city pages
  /recycling-centers/[city]/[slug]       # Recycling center detail page
  /marketplace             # Marketplace pages
  /marketplace/[material]             # Selling listings and Recycling Center Offers Marketplace pages
  /marketplace/[material]/[city]             # Selling listings and Recycling Center Offers Marketplace city pages
  /admin                   # Admin dashboard - should allow with admin permission checks routes to manage, edit and delete users, recycling centers, recycling centers claims...
  /profile                 # User profile pages
  globals.css              # Global styles
  layout.tsx               # Root layout
  page.tsx                 # Home page
```

## Permission Structure

| Route Type                      | View Access       | Edit Access         | Delete Access       |
|---------------------------------|-------------------|---------------------|---------------------|
| Public pages                    | Everyone          | -                   | -                   |
| Recycling center details        | Everyone          | Owner, Admin        | Admin               |
| Recycling center buy materials  | Everyone          | Owner, Admin        | Owner, Admin        |
| Marketplace items               | Everyone          | Owner, Admin        | Owner, Admin        |
| User profiles                   | Everyone (limited) | Self               | Self, Admin         |
| Admin dashboard                 | Admin             | Admin               | Admin               |

## Phase 1: Core Structure and Authentication (Priority: HIGHEST)

- [x] Create app directory
- [ ] Recreate layout.tsx with proper navigation
- [ ] Rebuild homepage (page.tsx)
- [ ] Restore auth directory with login/register pages
- [ ] Recreate API auth routes
  - [ ] /app/api/auth/[...nextauth]/route.ts
  - [ ] /app/api/auth/register/route.ts
  - [ ] /app/api/auth/me/route.ts
- [ ] Restore middleware.ts for route protection

## Phase 2: Recycling Centers Features (Priority: HIGH)

- [x] Rebuild recycling centers listing page
  - [x] /app/recycling-centers/page.tsx
- [x] Restore recycling center detail pages
  - [x] /app/recycling-centers/[city]/[slug]/page.tsx
- [x] Implement buy materials API and components
  - [x] /app/api/recycling-centers/[id]/buy-materials/route.ts
  - [x] Verify BuyMaterialsEditor.tsx component
  - [x] Verify MaterialPriceDisplay.tsx component
  - [x] Verify RecyclingCenterBuyMaterials.tsx component

## Phase 3: Marketplace Materials Feature (Priority: HIGH)

- [x] Rebuild marketplace overview page
  - [x] /app/marketplace/page.tsx
- [x] Implement materials marketplace pages
  - [x] /app/marketplace/materials/page.tsx
  - [x] /app/marketplace/materials/[material]/page.tsx
- [ ] Restore marketplace API endpoints
  - [x] /app/api/marketplace/materials/route.ts
  - [ ] /app/api/marketplace/[id]/route.ts

## Phase 4: Admin and User Management (Priority: MEDIUM)

- [x] Recreate admin dashboard pages
  - [x] /app/admin/page.tsx
  - [x] /app/admin/recycling-centers/page.tsx
  - [x] /app/admin/marketplace/page.tsx
  - [x] /app/admin/users/page.tsx
  - [x] /app/admin/blog/page.tsx
  - [x] /app/admin/settings/page.tsx
- [ ] Rebuild user profile pages
  - [ ] /app/profile/page.tsx
  - [ ] /app/profile/edit/page.tsx
- [ ] Restore admin API routes
  - [ ] /app/api/admin/recycling-centers/route.ts
  - [ ] /app/api/admin/marketplace/route.ts
  - [ ] /app/api/admin/users/route.ts

## Phase 5: Additional Features (Priority: NORMAL)

- [ ] Rebuild forum pages
  - [ ] /app/forum/page.tsx
  - [ ] /app/forum/[id]/page.tsx
- [ ] Restore blog pages
  - [ ] /app/blog/page.tsx
  - [ ] /app/blog/[id]/page.tsx
- [ ] Recreate contact and about pages
  - [ ] /app/contact/page.tsx
  - [ ] /app/about/page.tsx

## Phase 6: Testing and Finalization (Priority: HIGH)

- [x] Fix duplicate function error in lib/utils.ts
- [ ] Resolve Next.js config warnings
- [ ] Test authentication flows
- [ ] Verify all permission checks
- [ ] Test recycling centers and materials features
- [ ] Verify admin capabilities
- [ ] Test user profile management
- [ ] Audit and resolve npm package vulnerabilities

## Phase 7: TypeScript Refactoring (Priority: MEDIUM)

- [ ] Fix TypeScript errors
  - [ ] Missing React type declarations
  - [ ] Missing Next.js type declarations
  - [ ] JSX element issues
  - [ ] Implicit any types on parameters
- [ ] Implement better TypeScript types for API routes and components

## Phase 8: UI Component Standardization (Priority: LOW)

- [x] Standardize UI components
  - [x] Create missing shadcn/ui components
  - [x] Fix component import issues
  - [x] Ensure consistent styling across pages
- [ ] Implement responsive design fixes for mobile devices

## Notes on TypeScript Errors

There are numerous TypeScript errors in the codebase. These are primarily related to:

1. Missing React type declarations (`npm i --save-dev @types/react`)
2. Missing Next.js type declarations (`npm i --save-dev @types/next`)
3. JSX element issues (likely configuration related)
4. Implicit any types on parameters

We should address these once the application structure is restored. 