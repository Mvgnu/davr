import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth/options';

// Create and export the NextAuth handlers
// Note: Rate limiting is temporarily disabled to ensure auth works properly
// It can be re-added once the basic auth flow is working
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
