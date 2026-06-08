/**
 * NextAuth Route Handler
 * Handles all authentication endpoints
 * /api/auth/signin, /api/auth/callback, /api/auth/signout, etc.
 */

import NextAuth from 'next-auth/next';
import { authConfig } from '@/lib/auth';

const handler = NextAuth(authConfig);

export { handler as GET, handler as POST };
