import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth/options'; // Assuming @ alias is set up for src or lib

// NextAuth handles GET and POST requests at this route
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST }; 