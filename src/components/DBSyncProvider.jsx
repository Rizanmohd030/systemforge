'use client'

/**
 * DBSyncProvider
 * Watches the NextAuth session and triggers Zustand DB hydration
 * exactly once when a user logs in.
 *
 * Renders nothing — pure side-effect component.
 * Place inside AuthProvider in layout.js.
 */

import { useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useProjectStore } from '@/store/projectStore'

export function DBSyncProvider({ children }) {
    const { data: session, status } = useSession()
    const hydrateFromDB = useProjectStore(s => s.hydrateFromDB)
    const hasHydrated = useRef(false)

    useEffect(() => {
        // Only fire once per session load, when auth is confirmed
        if (status === 'authenticated' && session?.user && !hasHydrated.current) {
            hasHydrated.current = true
            hydrateFromDB()
        }

        // Reset flag on sign-out so next login re-hydrates
        if (status === 'unauthenticated') {
            hasHydrated.current = false
        }
    }, [status, session, hydrateFromDB])

    return children
}
