/**
 * GET  /api/user/blueprint
 * POST /api/user/blueprint
 *
 * GET  — Load latest blueprint snapshot from PostgreSQL for the authenticated user.
 *         Called by the client on session mount to hydrate Zustand from DB.
 *
 * POST — Save a full Zustand state snapshot as a new blueprint version.
 *         Called by the client when important state changes occur.
 *         Append-only: never overwrites, always inserts a new versioned row.
 *
 * Auth: uses session.user.dbUserId (set in NextAuth JWT callback).
 * Falls back gracefully if not authenticated (returns 401, client stays on localStorage).
 */

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import {
  getLatestBlueprintByUserId,
  insertBlueprintVersion,
} from '@/lib/db/blueprints.js';

// ─── GET — Hydrate Zustand from DB ────────────────────────────────────────────

export async function GET() {
  try {
    const session = await getSession();
    const userId = session?.user?.dbUserId || session?.user?.id;

    if (!userId) {
      return NextResponse.json({ authenticated: false, blueprint: null }, { status: 401 });
    }

    const blueprint = await getLatestBlueprintByUserId(userId);

    if (!blueprint) {
      // Authenticated but no saved blueprint yet — that's fine
      return NextResponse.json({
        authenticated: true,
        userId,
        blueprint: null,
        version: 0,
      });
    }

    return NextResponse.json({
      authenticated: true,
      userId,
      blueprint: blueprint.blueprint_json,   // The full Zustand-compatible state snapshot
      version: blueprint.version_number,
      moduleSource: blueprint.module_source,
      domain: blueprint.domain,
      savedAt: blueprint.created_at,
    });
  } catch (error) {
    console.error('[GET /api/user/blueprint] Error:', error.message);
    return NextResponse.json(
      { error: 'Failed to load blueprint', details: error.message },
      { status: 500 }
    );
  }
}

// ─── POST — Persist Zustand snapshot to DB ────────────────────────────────────

export async function POST(req) {
  try {
    const session = await getSession();
    const userId = session?.user?.dbUserId || session?.user?.id;

    if (!userId) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const {
      snapshot,        // Full Zustand state object to persist
      moduleSource,    // Which module triggered the save
      changeSummary,   // Human-readable description
      domain,          // Groq-classified domain
      sessionId,       // Optional session tracking tag
    } = body;

    if (!snapshot || typeof snapshot !== 'object') {
      return NextResponse.json(
        { error: 'snapshot is required and must be an object' },
        { status: 400 }
      );
    }

    const saved = await insertBlueprintVersion(
      userId,
      snapshot,
      moduleSource || 'client-sync',
      changeSummary || 'Auto-saved from client',
      { sessionId, domain }
    );

    return NextResponse.json({
      success: true,
      blueprintId: saved.id,
      version: saved.version_number,
      savedAt: saved.created_at,
    });
  } catch (error) {
    console.error('[POST /api/user/blueprint] Error:', error.message);
    return NextResponse.json(
      { error: 'Failed to save blueprint', details: error.message },
      { status: 500 }
    );
  }
}
