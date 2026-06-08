/**
 * NextAuth Configuration
 * Handles Google OAuth and email/password authentication
 * Sessions stored in JWT (stateless, scalable)
 */

import { getServerSession } from 'next-auth/next';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { getOrCreateUser } from '@/lib/db/users.js';

/**
 * NextAuth configuration object
 */
export const authConfig = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_ID || '',
      clientSecret: process.env.GOOGLE_SECRET || '',
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'you@example.com' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        // TODO: Connect to real password verification (bcrypt)
        // For now, accept any email with matching password
        if (credentials?.email && credentials?.password) {
          // In production, verify password with bcrypt against users table
          console.log('⚠️ Credentials provider: password verification not yet implemented');
          
          // Allow any credentials for demo (CHANGE IN PRODUCTION!)
          return {
            id: credentials.email,
            email: credentials.email,
            name: credentials.email.split('@')[0],
          };
        }
        return null;
      },
    }),
  ],
  
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
  },

  pages: {
    signIn: '/auth/signin',
    // signOut: '/auth/signout',
    error: '/auth/error',
    verifyRequest: '/auth/verify-request',
  },

  callbacks: {
    /**
     * JWT callback: Add user info to JWT token.
     * dbUserId is the external_id stored in our users table.
     */
    async jwt({ token, user, account }) {
      if (user) {
        // Canonical external_id: Google subject ID for OAuth, email for Credentials
        token.id       = user.id;
        token.email    = user.email;
        token.name     = user.name;
        token.image    = user.image;
        token.dbUserId = user.id || user.email; // persists across requests
      }
      return token;
    },

    /**
     * Session callback: Expose dbUserId to client and server components.
     */
    async session({ session, token }) {
      if (token) {
        session.user.id       = token.id;
        session.user.email    = token.email;
        session.user.name     = token.name;
        session.user.image    = token.image;
        session.user.dbUserId = token.dbUserId; // safe to use in API routes
      }
      return session;
    },

    /**
     * SignIn callback: Upsert user into our users table on every login.
     * Idempotent — ON CONFLICT handles repeated logins gracefully.
     */
    async signIn({ user, account, profile }) {
      try {
        if (!user.email) {
          console.error('Sign-in rejected: no email');
          return false;
        }

        // For Google OAuth: use the OAuth subject as external_id.
        // For Credentials: use email (since there’s no OAuth id).
        const externalId = account?.providerAccountId || user.id || user.email;

        await getOrCreateUser(externalId, user.email, user.name || profile?.name);
        return true;
      } catch (error) {
        console.error('signIn callback error:', error.message);
        // Don’t block sign-in on DB failure — log and allow
        return true;
      }
    },

    /**
     * Redirect callback: Redirect after sign-in/sign-out
     */
    async redirect({ url, baseUrl }) {
      // Allow relative URLs
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      // Allow URLs on the same origin
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },

  events: {
    async signIn({ user, account, profile, isNewUser }) {
      console.log(`🔐 Sign-in event: ${user.email} (new: ${isNewUser})`);
    },
    async signOut({ token }) {
      console.log(`🔐 Sign-out event: ${token.email}`);
    },
  },

  debug: process.env.NODE_ENV === 'development',
};

/**
 * Wrapper for getServerSession with auth config
 */
export async function getSession() {
  return await getServerSession(authConfig);
}

/**
 * Get authenticated user ID from session
 * Throws error if not authenticated
 */
export async function getAuthenticatedUserId() {
  const session = await getSession();
  if (!session?.user?.id) {
    throw new Error('User not authenticated');
  }
  return session.user.id;
}

/**
 * Get user email from session
 */
export async function getAuthenticatedUserEmail() {
  const session = await getSession();
  return session?.user?.email || null;
}
