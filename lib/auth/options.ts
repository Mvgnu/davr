import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/db/prisma'; // Assuming @ alias is set up for src or lib
import * as bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email", placeholder: "jsmith@example.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          console.error('Missing credentials');
          return null;
        }

        // Find user in PostgreSQL database via Prisma
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          console.error('No user found with email:', credentials.email);
          return null; // User not found
        }

        // Check if user registered with credentials (has a password)
        if (!user.password) {
          console.error('User found but no password set (maybe OAuth user?)');
          // Optionally, handle this case differently (e.g., prompt to link account)
          return null;
        }

        // Validate password using bcryptjs
        const isValidPassword = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isValidPassword) {
          console.error('Invalid password for user:', credentials.email);
          return null; // Password invalid
        }

        console.log('Credentials validated successfully for:', user.email);
        // Return user object if credentials are valid
        // Exclude password from the returned user object
        const { password, ...userFromDb } = user;

        // Ensure the returned object matches the NextAuth User type precisely
        // Map null values from Prisma to undefined for name, email, image
        return {
          id: userFromDb.id,
          name: userFromDb.name ?? undefined,
          email: userFromDb.email ?? undefined,
          image: userFromDb.image ?? undefined,
          emailVerified: userFromDb.emailVerified, // Keep as Date | null
          isAdmin: userFromDb.isAdmin, // Include isAdmin status
        };
      }
    })
    // Add other providers like Google, GitHub here if needed
  ],
  session: {
    strategy: 'jwt', // Use JWT for session strategy (can also be 'database')
  },
  callbacks: {
    // Include user id AND isAdmin flag in the JWT and session
    async jwt({ token, user }) {
      // On initial sign in, user object is available
      if (user) {
        token.id = user.id;
        // Add isAdmin from the user object fetched by authorize
        // Need to cast user to include isAdmin as it's not standard NextAuth type
        token.isAdmin = (user as any).isAdmin; 
      }
      // Subsequent calls will have the token populated from previous calls
      return token;
    },
    async session({ session, token }) {
      // Add id and isAdmin to the session object from the token
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.isAdmin = token.isAdmin as boolean; // Add isAdmin to session
      }
      return session;
    },
  },
  // Specify custom pages if needed
  // pages: {
  //   signIn: '/login',
  //   // error: '/auth/error', // Error code passed in query string as ?error=
  // },
  // Debugging
  // debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET, // Ensure NEXTAUTH_SECRET is set in .env
}; 