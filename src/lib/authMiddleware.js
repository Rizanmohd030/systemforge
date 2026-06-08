/**
 * Authentication Middleware
 * Protects API routes and enforces session requirements
 * 
 * Usage in API route:
 * import { authMiddleware } from '@/lib/authMiddleware';
 * 
 * export async function POST(req) {
 *   const { userId, session } = await authMiddleware(req);
 *   // Now you have authenticated userId
 * }
 */

import { getSession } from './auth';

/**
 * Protect an API route - extract user from session
 * Throws 401 if not authenticated
 */
export async function authMiddleware(req, options = {}) {
  const session = await getSession();

  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  return {
    userId: session.user.id,
    userEmail: session.user.email,
    userName: session.user.name,
    session,
  };
}

/**
 * Wrapper for API routes that require authentication
 * Usage: export const POST = withAuth(myHandler);
 */
export function withAuth(handler) {
  return async (req, context) => {
    try {
      const auth = await authMiddleware(req);
      return await handler(req, { ...context, auth });
    } catch (error) {
      console.error('Auth middleware error:', error.message);
      return Response.json(
        { error: 'Unauthorized', message: error.message },
        { status: 401 }
      );
    }
  };
}

/**
 * Optional auth - get session if available, don't error if not
 */
export async function optionalAuth(req) {
  try {
    const session = await getSession();
    return {
      userId: session?.user?.id || null,
      userEmail: session?.user?.email || null,
      session,
      isAuthenticated: !!session?.user?.id,
    };
  } catch (error) {
    return {
      userId: null,
      userEmail: null,
      session: null,
      isAuthenticated: false,
    };
  }
}
