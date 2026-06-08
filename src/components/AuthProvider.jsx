'use client';

/**
 * SessionProvider Component
 * Wraps the app with NextAuth session context
 * Required for useSession() hook in client components
 */

import { SessionProvider } from 'next-auth/react';

export function AuthProvider({ children }) {
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  );
}
