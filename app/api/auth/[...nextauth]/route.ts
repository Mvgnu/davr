import NextAuth, { NextAuthOptions, AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcrypt';
import { query } from '@/lib/db';

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const result = await query(
            'SELECT id, name, email, password_hash, role, profile_image FROM users WHERE email = $1',
            [credentials.email]
          );

          const user = result.rows[0];
          
          if (!user) {
            return null;
          }
          
          const isPasswordValid = await compare(credentials.password, user.password_hash);
          
          if (!isPasswordValid) {
            return null;
          }
          
          return {
            id: user.id.toString(),
            email: user.email,
            name: user.name,
            role: user.role || 'user',
            image: user.profile_image || null,
          };
        } catch (error) {
          console.error('Database error during authentication:', error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    }
  },
  pages: {
    signIn: '/auth/login',
    signOut: '/',
    error: '/auth/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET || 'DAVR_APP_SECRET_KEY',
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST }; 