# Backend Authentication (NextAuth.js) Documentation

This document details the backend implementation of authentication using NextAuth.js.

## Files

*   `/app/api/auth/[...nextauth]/route.ts`: The main NextAuth.js API route handler.
*   `/lib/auth/options.ts`: Configuration options passed to NextAuth.js (providers, callbacks, database adapter).
*   `/lib/db/prisma.ts`: Prisma client instance used by the NextAuth.js Prisma adapter.
*   `prisma/schema.prisma`: Contains the necessary models (`User`, `Account`, `Session`, `VerificationToken`) required by the NextAuth.js Prisma adapter.

## Authentication Flow

[Describe the chosen authentication flow(s), e.g., Credentials (email/password), OAuth (Google, GitHub), Magic Links.]

1.  User initiates login/signup via the frontend UI.
2.  Frontend calls the appropriate NextAuth.js endpoint (e.g., `/api/auth/signin`, `/api/auth/callback`).
3.  `route.ts` handler processes the request using configured providers and callbacks defined in `options.ts`.
4.  Callbacks interact with the **PostgreSQL** database via the Prisma adapter to verify credentials, find or create users, link accounts, and manage sessions.
5.  NextAuth.js sets secure HTTP-only cookies to manage the user's session.
6.  Frontend can access session status using NextAuth.js hooks/functions.

## API Endpoints

NextAuth.js automatically creates several endpoints under `/api/auth/`:
*   `signin`: Renders sign-in pages or handles sign-in POST requests.
*   `signout`: Handles sign-out requests.
*   `callback`: Handles OAuth provider callbacks.
*   `session`: Returns the current session status.
*   `csrf`: Returns a CSRF token.

Refer to NextAuth.js documentation for details.

## Database Schema

The necessary **PostgreSQL** tables (`User`, `Account`, `Session`, `VerificationToken`) are defined in `prisma/schema.prisma` as required by the `@next-auth/prisma-adapter`.

## Configuration (`/lib/auth/options.ts`)

*   **Providers:** [List configured providers, e.g., Credentials, GoogleProvider].
*   **Adapter:** PrismaAdapter configured with the Prisma client instance.
*   **Pages:** [Custom login/error pages, if configured].
*   **Callbacks:** [Details on any custom `signIn`, `jwt`, `session` callbacks used, e.g., to add user roles to the session].
*   **Secret:** `NEXTAUTH_SECRET` environment variable is crucial. 