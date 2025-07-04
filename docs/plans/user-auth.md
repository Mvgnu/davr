# Plan: User Authentication

**Status:** Planning

**Goal:** Implement a robust user authentication system allowing users to register, log in, and log out.

**Tech Stack:**
*   **Frontend:** Next.js, React, Tailwind CSS
*   **Backend:** Next.js API Routes, NextAuth.js
*   **Database:** **PostgreSQL**
*   **ORM:** Prisma

## Feature Overview

*   Users can register with an email and password.
*   Users can log in using their registered email and password.
*   Users can log out.
*   Passwords must be securely hashed.
*   Authenticated users will have sessions managed by NextAuth.js.
*   Provide basic UI for registration and login forms.
*   Protect certain routes/pages, making them accessible only to logged-in users.

## Database Schema (**PostgreSQL** via Prisma)

Modify `prisma/schema.prisma` to include/update the necessary models for NextAuth.js with the Prisma adapter:

```prisma
// Add/Ensure these models exist and are correctly configured for PrismaAdapter

model Account {
  id                 String  @id @default(cuid())
  userId             String
  type               String
  provider           String
  providerAccountId  String
  refresh_token      String? @db.Text
  access_token       String? @db.Text
  expires_at         Int?
  token_type         String?
  scope              String?
  id_token           String? @db.Text
  session_state      String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime?
  password      String? // Add this field for Credentials provider
  image         String?
  accounts      Account[]
  sessions      Session[]
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

// Add any additional user-specific fields to the User model as needed (e.g., role)
```
**Migration:** Generate using `npx prisma migrate dev --name add_nextauth_models_and_password`.

## Backend Implementation (Next.js API Routes / NextAuth.js)

1.  **Install Dependencies:**
    *   `npm install next-auth @next-auth/prisma-adapter @prisma/client`
    *   `npm install bcrypt`
    *   `npm install -D @types/bcrypt`
2.  **Configure Prisma Adapter:** Set up the Prisma client (`/lib/db/prisma.ts`).
3.  **Configure NextAuth.js Options (`/lib/auth/options.ts`):**
    *   Import `PrismaAdapter` and Prisma client.
    *   Set `adapter: PrismaAdapter(prisma)`.
    *   Configure `CredentialsProvider`:
        *   Define `name`, `credentials` (email, password).
        *   Implement the `authorize` function:
            *   Find user by email in **PostgreSQL** using Prisma.
            *   If user exists and password field is present, compare hashed password using `bcrypt.compare`.
            *   Return user object if valid, otherwise return `null` or throw error.
    *   Configure `session` strategy (e.g., `strategy: "jwt"` or `"database"`).
    *   Configure callbacks if needed (e.g., `jwt`, `session` to include user ID/role).
    *   Set `NEXTAUTH_SECRET` and `NEXTAUTH_URL` environment variables.
4.  **Implement API Route (`/app/api/auth/[...nextauth]/route.ts`):**
    *   Import `NextAuth` and the configured options.
    *   Export `GET` and `POST` handlers calling `NextAuth(authOptions)`.
5.  **Implement Registration Endpoint (`/app/api/auth/register/route.ts` - Custom):**
    *   Accept `POST` requests with `email` and `password`.
    *   Validate input.
    *   Check if user already exists in **PostgreSQL** via Prisma.
    *   Hash the password using `bcrypt.hash`.
    *   Create the new user in **PostgreSQL** using Prisma.
    *   Return success or error response.

## Frontend Implementation (React Components / Pages)

1.  **Create UI Components:**
    *   `RegisterForm.tsx` (in `/components/auth/` or similar)
    *   `LoginForm.tsx` (in `/components/auth/` or similar)
2.  **Create Pages:**
    *   `/app/register/page.tsx`: Page displaying the `RegisterForm`.
        *   Handles form submission, calls the `/api/auth/register` endpoint.
    *   `/app/login/page.tsx`: Page displaying the `LoginForm`.
        *   Uses `signIn` function from `next-auth/react` with `"credentials"` provider.
    *   `/app/dashboard/page.tsx` (Example protected page).
3.  **Implement Session Handling:**
    *   Wrap the application layout (`/app/layout.tsx`) with `<SessionProvider>` from `next-auth/react`.
    *   Use `useSession` hook or `getServerSession` function to access session data and authentication status.
4.  **Protect Routes:**
    *   Use `useSession({ required: true })` in client components.
    *   Check session status in server components/layouts or use Next.js Middleware to redirect unauthenticated users.
5.  **Add Logout Button:**
    *   Implement a button that calls `signOut` function from `next-auth/react`.

## Testing Plan

*   **Unit Tests:**
    *   Test password hashing/comparison logic.
    *   Test input validation logic.
*   **Integration Tests (API):**
    *   Use `curl` or a testing library (e.g., Jest with Supertest) to test:
        *   `/api/auth/register` (success, user exists, invalid input).
        *   `/api/auth/signin` via NextAuth (valid credentials, invalid credentials).
        *   `/api/auth/session` (authenticated, unauthenticated).
        *   `/api/auth/signout`.
*   **Integration Tests (Database):**
    *   Verify user creation in **PostgreSQL** after registration.
    *   Verify session creation/deletion in **PostgreSQL** (if using database sessions).
*   **End-to-End Tests (e.g., using Playwright/Cypress):**
    *   Simulate user registration flow.
    *   Simulate user login flow.
    *   Simulate user logout flow.
    *   Verify access to protected routes before/after login.

## Security Considerations

*   Use `bcrypt` for password hashing with a sufficient salt round count.
*   Protect against CSRF attacks (NextAuth.js helps with this).
*   Validate and sanitize all user inputs.
*   Ensure secure cookie settings (HttpOnly, Secure in production).
*   Rate limit login and registration attempts (Requires additional setup).

## Open Questions / Future Enhancements

*   Add email verification flow?
*   Implement password reset functionality?
*   Add OAuth providers (Google, GitHub, etc.)?
*   Define specific user roles/permissions? 