import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { query } from "@/lib/db";
import { verifyClientHashedPassword } from "@/lib/utils/auth/serverPasswordUtils";

// Type declarations are in types/next-auth.d.ts

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Passwort", type: "password" }
      },
      async authorize(credentials) {
        try {
          console.log('NextAuth authorize called with:', {
            emailProvided: !!credentials?.email,
            passwordProvided: !!credentials?.password
          });
          
          if (!credentials?.email || !credentials?.password) {
            console.log('Missing credentials');
            return null;
          }
          
          console.log('Querying the Postgres database for user');
          
          // Find the user using Postgres query
          const userResult = await query(
            'SELECT * FROM users WHERE email = $1',
            [credentials.email]
          );
          
          if (userResult.rows.length === 0) {
            console.log('User not found:', credentials.email);
            throw new Error('Invalid email or password');
          }
          
          const user = userResult.rows[0];
          
          console.log('User found:', {
            id: user.id,
            email: user.email,
            role: user.role,
            roleUpperCase: user.role?.toUpperCase()
          });
          
          // The password coming from the client is already hashed using client-side hashing
          // So we need to use verifyClientHashedPassword instead of regular bcrypt compare
          const passwordMatch = await verifyClientHashedPassword(
            credentials.password, // Client-hashed password from form
            user.password, // Bcrypt-hashed password from DB
            credentials.email // Email for salt verification
          );
          
          if (!passwordMatch) {
            console.log('Password verification failed');
            throw new Error('Invalid email or password');
          }
          
          console.log('Password verified successfully');
          
          // Convert the role to uppercase for consistency
          const role = user.role?.toUpperCase() || 'USER';
          const isAdmin = role === 'ADMIN';
          
          console.log('Setting user role and admin status:', {
            role,
            isAdmin,
            originalRole: user.role
          });
          
          return {
            id: user.id.toString(),
            email: user.email,
            name: user.name,
            isAdmin: isAdmin,
            role: role,
          };
        } catch (error) {
          console.error('Authorization error:', error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        console.log('Setting JWT token with user:', {
          id: user.id,
          role: user.role,
          isAdmin: user.isAdmin
        });
        token.id = user.id;
        token.isAdmin = user.isAdmin;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        console.log('Setting session with token:', {
          id: token.id,
          role: token.role,
          isAdmin: token.isAdmin
        });
        session.user.id = token.id;
        session.user.isAdmin = token.isAdmin;
        session.user.role = token.role;
      }
      return session;
    }
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
      },
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  debug: true, // Always enable debug mode to help diagnose issues
  secret: process.env.NEXTAUTH_SECRET,
  // Prevent credentials from being exposed in URLs
  useSecureCookies: process.env.NODE_ENV === "production",
};

// For use in server components
export async function getServerAuthSession() {
  return null; // This will be replaced by the proper getServerSession function in Next.js 13+
}

// For authenticating API routes
export const isAuthenticated = async (req: Request) => {
  // This is a placeholder. In a real implementation, you would verify the JWT token from cookies
  return false;
}; 