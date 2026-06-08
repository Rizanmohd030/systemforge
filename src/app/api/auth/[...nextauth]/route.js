/**
 * NextAuth Route Handler (next-auth v4, Next.js App Router)
 * Handles all auth endpoints:
 *   GET/POST /api/auth/signin
 *   GET/POST /api/auth/callback/google
 *   GET/POST /api/auth/signout
 *   GET      /api/auth/session
 *   GET      /api/auth/csrf
 */

import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth';

const handler = NextAuth(authConfig);

export { handler as GET, handler as POST };
