# Frontend Documentation

This document serves as the main entry point for the frontend codebase documentation.

## Overview

*   **Framework:** Next.js (React)
*   **Styling:** Tailwind CSS
*   **State Management:** [To be decided - e.g., Zustand, Context API]
*   **API Client:** Fetch API / [Potentially a wrapper like SWR or React Query]

The frontend provides the user interface for the application, interacting with the backend API for data and authentication.

## Directory Structure

*   `/app`: Next.js App Router directory (pages, layouts, components).
*   `/components`: Reusable UI components (buttons, inputs, modals, etc.). See `docs/frontend/components/README.md`.
*   `/lib`: Utility functions, hooks, API client wrappers.
*   `/styles`: Global styles, Tailwind configuration.
*   `/public`: Static assets.

## Components

Detailed documentation for complex components or feature-specific UI modules resides within relevant subdirectories or the main `/components` documentation.

*   [Core Components](./components/README.md)
*   [Authentication UI](./auth/README.md) (Example - To be created)
*   [Layout & Navigation](./layout/README.md)
*   [Recycling Centers Display](./recycling-centers/README.md)
*   [Marketplace Deals UI](./marketplace-deals.md)

## State Management

[Details about the chosen state management library, patterns, and global state structure.]

## Styling

*   **Primary:** Tailwind CSS utility classes.
*   **Base Styles:** Defined in `styles/globals.css`.
*   **Configuration:** `tailwind.config.js`.

## API Interaction

*   Frontend interacts with the backend via RESTful API endpoints defined in the backend.
*   Requests are typically made using the built-in `fetch` API, potentially wrapped in custom hooks or a library like SWR/React Query for caching and state synchronization.
*   Authentication tokens (e.g., JWT from NextAuth.js) are included in requests requiring authorization.

## Getting Started

1.  Ensure Node.js (v18+) and npm/yarn are installed.
2.  Clone the repository.
3.  Install dependencies: `npm install` or `yarn install`.
4.  Set up environment variables: Copy `.env.example` to `.env` and fill in necessary values (e.g., `NEXTAUTH_URL`, `NEXTAUTH_SECRET`).
5.  Run the development server: `npm run dev` or `yarn dev`.
6.  Open [http://localhost:3000](http://localhost:3000) in your browser. 