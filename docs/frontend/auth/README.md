# Frontend Authentication UI Documentation

This document covers the frontend components related to user authentication (login, registration).

## Components

*   **`components/auth/RegisterForm.tsx`**
    *   **Purpose:** Provides a form for users to register with their email, password, and optional name.
    *   **Usage:** Intended to be used on a dedicated registration page (e.g., `/register`).
    *   **Functionality:**
        *   Uses React Hook Form and Zod for client-side validation (email format, password length).
        *   Submits registration data to the `/api/auth/register` backend endpoint.
        *   Displays specific error messages from the API or network issues.
        *   Redirects to the login page (`/login?registered=true`) upon successful registration.
    *   **Props:** None.

*   **`components/auth/LoginForm.tsx`**
    *   **Purpose:** Provides a form for users to log in using their email and password.
    *   **Usage:** Intended to be used on a dedicated login page (e.g., `/login`).
    *   **Functionality:**
        *   Uses React Hook Form and Zod for basic client-side validation.
        *   Calls `signIn('credentials', ...)` from `next-auth/react` to handle the login flow.
        *   Handles potential errors returned by NextAuth (via URL query parameters) and displays user-friendly messages.
        *   Displays a success message if redirected from the registration page.
        *   Redirects to the `callbackUrl` (or `/`) upon successful login.
    *   **Props:** None.

## Pages

*   `app/dashboard/page.tsx`: Protected page displaying user-specific information, currently showing the user's marketplace listings.
*   `app/register/page.tsx`: User registration page.
*   `app/login/page.tsx`: User login page.

## Related Files

*   `/app/layout.tsx`: Needs to include the `SessionProvider` from `next-auth/react`. 