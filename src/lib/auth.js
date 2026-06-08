/**
 * NextAuth Configuration
 * Handles Google OAuth and email/password authentication
 * Sessions stored in JWT (stateless, scalable)
 */

import { getServerSession } from 'next-auth/next';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { Users } from '@/lib/db/models';

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
     * JWT callback: Add user info to JWT token
     */
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.image = user.image;
      }
      return token;
    },

    /**
     * Session callback: Add token info to session
     */
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.name = token.name;
        session.user.image = token.image;
      }
      return session;
    },

    /**
     * SignIn callback: Create/update user in database on first login
     */
    async signIn({ user, account, profile, email, credentials }) {
      try {
        if (!user.email) {
          console.error('No email in sign-in attempt');
          return false;
        }

        // Create or get user from database
        const externalId = user.id || user.email;
        const dbUser = await Users.getOrCreate(
          externalId,
          user.email,
          user.name || profile?.name
        );

        console.log(`✓ User signed in/created: ${dbUser.external_id}`);
        return true;
      } catch (error) {
        console.error('Error in signIn callback:', error);
        return false;
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
