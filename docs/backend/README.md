# Backend Documentation

This document serves as the main entry point for the backend codebase documentation.

## Overview

*   **Framework:** Next.js (API Routes) / [Could be separate Node.js/Express if complex]
*   **Database:** **PostgreSQL**
*   **ORM:** Prisma
*   **Authentication:** NextAuth.js

The backend provides the API endpoints for data management, business logic, and authentication, interacting directly with the **PostgreSQL** database via Prisma.

## Directory Structure

*   `/app/api`: Location for Next.js API Route handlers.
*   `/lib/auth`: Authentication configuration and utilities (e.g., NextAuth.js options).
*   `/lib/db`: Database client instantiation (Prisma).
*   `/prisma`: Prisma schema (`schema.prisma`), migrations, and potentially seed scripts.
*   `/.env`: Environment variables (including `DATABASE_URL`, `NEXTAUTH_SECRET`).

## API Endpoints

API endpoints are implemented using Next.js API Routes within the `/app/api/` directory. Documentation for specific resource groups:

*   [Authentication API](./auth/README.md) (`/app/api/auth/...`)
*   [Users API](./users/README.md) (`/app/api/users/...` - Example)
*   [Items API](./items/README.md) (`/app/api/items/...` - Example)
*   [Recycling Centers API](./recycling-centers/README.md) (`/app/api/recycling-centers/...`)

## Database

*   **Database System:** **PostgreSQL**
*   **ORM:** Prisma
*   **Schema:** Defined in `prisma/schema.prisma`.
*   **Migrations:** Handled via `prisma migrate`. See `prisma/migrations/` for history and `docs/programming_methodology.md` for workflow.
*   **Connection:** Managed via `DATABASE_URL` environment variable.
*   **Client:** Prisma Client is used for all database interactions (`/lib/db/prisma.ts`).

## Authentication & Authorization

*   **Provider:** NextAuth.js handles authentication flows (e.g., credentials, OAuth).
*   **Strategy:** Session-based authentication managed by NextAuth.js, potentially using JWTs stored in cookies.
*   **Authorization:** Route handlers and service functions check user sessions and potentially roles/permissions before allowing access to resources or performing actions.

## Error Handling

*   API routes should use try/catch blocks for robust error handling.
*   Standardized error responses should be sent to the client (e.g., `{ error: '...' }` with appropriate HTTP status codes).
*   Logging ([To be implemented - e.g., using Pino or Winston]) should capture errors and relevant request context.

## Getting Started

1.  Ensure Node.js (v18+), npm/yarn, and **PostgreSQL** are installed.
2.  Clone the repository.
3.  Install dependencies: `npm install` or `yarn install`.
4.  Set up **PostgreSQL** database and user.
5.  Set up environment variables: Copy `.env.example` to `.env` and fill in `DATABASE_URL`, `NEXTAUTH_SECRET`, etc.
6.  Apply database migrations: `npx prisma migrate dev`.
7.  [Optional] Seed the database: `npx prisma db seed` (if a seed script exists).
8.  Run the development server: `npm run dev` or `yarn dev`. 