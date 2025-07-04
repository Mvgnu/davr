# Frontend Layout Documentation

This document describes the main application layout and navigation components.

## Root Layout (`app/layout.tsx`)

*   **Purpose:** Defines the root HTML structure for all pages.
*   **Functionality:**
    *   Sets up global styles (`globals.css`) and fonts (Inter).
    *   Includes metadata (title, description).
    *   Wraps the application content (`{children}`) with necessary context providers:
        *   `NextAuthProvider` (from `@/lib/providers`): Provides the NextAuth.js session context via `SessionProvider`.
        *   `AuthProvider` (from `@/context/AuthContext`): [Describe purpose - Note: This might be redundant now that Navbar uses `useSession` directly].
    *   Renders the main application structure (`<div className="flex flex-col min-h-screen">`).
    *   Includes the primary `Navbar` (`@/components/Navbar`) at the top.
    *   Includes a `Footer` (`@/components/Footer`) at the bottom.

## Navbar (`components/Navbar.tsx`)

*   **Purpose:** Provides the main navigation bar displayed at the top of the application.
*   **Functionality:**
    *   Displays the application title/logo linking to the homepage (`/`).
    *   Shows primary navigation links (Recyclinghöfe, Materialien, Marktplatz, Dashboard) with active state highlighting.
        *   The Dashboard link is only shown to authenticated users.
    *   Integrates the `AuthStatus` component (`@/components/auth/AuthStatus`) to display:
        *   User email/name and a "Sign Out" button if authenticated.
        *   A "Sign In" link if unauthenticated.
    *   Uses `useSession` from `next-auth/react` to determine authentication status.
    *   Includes a placeholder Search button.
    *   Provides a mobile-responsive menu with navigation links and the `AuthStatus` component.

## AuthStatus (`components/auth/AuthStatus.tsx`)

*   **Purpose:** A client component responsible for displaying the current user authentication status and providing relevant actions (Sign In/Sign Out).
*   **Functionality:**
    *   Uses the `useSession` hook from `next-auth/react`.
    *   Shows a loading state while the session is being fetched.
    *   If authenticated, displays the user's email or name and a Sign Out button (which calls `signOut`).
    *   If unauthenticated, displays a Sign In link pointing to `/login`. 