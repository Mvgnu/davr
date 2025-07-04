import { withAuth } from "next-auth/middleware";

// Apply withAuth to the entire application or specific routes
export default withAuth(
  // `withAuth` redirects to login page if user is not authenticated
  {
    callbacks: {
      // Optional: Check for specific roles or permissions
      authorized: ({ token, req }) => {
        // Example: Allow access if user has a token (is logged in)
        // Add role checks here if needed, e.g., token?.isAdmin
        // Check if trying to access an admin route
        const isAdminRoute = req.nextUrl.pathname.startsWith('/admin');
        
        if (isAdminRoute) {
          // Only allow access to /admin if user is an admin
          return token?.isAdmin === true; // Assuming isAdmin is added to the token in authOptions callbacks
        }
        
        // Allow access to other protected routes if just logged in (token exists)
        return !!token; 
      },
    },
  }
);

// Specify which paths the middleware should apply to
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - / (the root path - assuming public homepage)
     * - /auth/ (authentication pages themselves)
     * - /recycling-centers (assuming public listing)
     * - /marketplace (assuming public marketplace view)
     * - /images/ (public images)
     * - /icons/ (public icons)
     */
    // "/((?!api|_next/static|_next/image|favicon.ico|auth/|images/|icons/).*)",
    // Specific routes to protect:
    '/profile/:path*', // Protect all profile sub-pages
    '/admin/:path*',   // Protect all admin sub-pages
    // Add other routes needing protection, e.g.:
    // '/marketplace/sell',
    // '/settings',
  ],
}; 