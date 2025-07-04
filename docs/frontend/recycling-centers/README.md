# Frontend: Recycling Centers Display

Documentation for components and pages related to displaying recycling center information.

## Page (`app/recycling-centers/page.tsx`)

*   **Purpose:** Displays a list of recycling centers.
*   **Functionality:**
    *   Server component that fetches data from the `/api/recycling-centers` endpoint during rendering.
    *   Handles potential errors during data fetching (returns empty list and logs error).
    *   Renders a grid of `RecyclingCenterCard` components based on the fetched data.
    *   Shows a message if no centers are found or if an error occurred.

## Dynamic Page (`app/recycling-centers/[slug]/page.tsx`)

*   **Purpose:** Displays detailed information for a single recycling center based on its `slug`.
*   **Functionality:**
    *   Server component receiving the `slug` via route parameters.
    *   Fetches data for the specific center from `/api/recycling-centers/${slug}`.
    *   Uses Next.js `notFound()` if the API returns 404 or an error occurs during fetch.
    *   Displays detailed information (name, address, contact info).
    *   Includes a "Back to List" link.

## Component (`components/recycling/CenterFilters.tsx`)

*   **Purpose:** Provides UI elements (search input, text inputs for city/material) to filter the recycling center list.
*   **Functionality:**
    *   Uses `useSearchParams` to read initial filter values from the URL.
    *   Uses `useState` to manage the state of the input fields.
    *   Uses `useRouter` to update the URL search parameters when filters change (debounced for search input).
    *   Includes a "Clear All" button.
*   **Integration Note:** Intended for use on `/app/recycling-centers/page.tsx`, but integration was halted due to conflicts with the existing page structure. Requires further work.

## Component (`components/recycling/RecyclingCenterCard.tsx`)

*   **Purpose:** Displays summarized information for a single recycling center in a card format.
*   **Props:**
    *   `center`: An object containing recycling center data (id, name, address_street, city, postal_code, slug, website).
*   **Functionality:**
    *   Displays the center's name and formatted address.
    *   Provides a link to the center's website (if available) using an external link icon.
    *   Includes commented-out code for a potential future link to a detailed center page (using `slug`).
    *   Styled using Tailwind CSS. 