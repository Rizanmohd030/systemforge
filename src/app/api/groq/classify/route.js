/**
 * POST /api/groq/classify
 *
 * Fast first-pass layer. Single Groq call that does:
 *   1. Classifies idea domain (technical / business / creative / mixed)
 *   2. Expands raw idea into Blueprint V1
 *   3. Returns module_config JSON controlling which Gemini modules are enabled
 *
 * Called from the terminal on form submit (page.js) BEFORE routing to /blueprint.
 * Response is validated with Zod (ClassifyExpandSchema) and saved to Zustand client-side.
 */

import { classifyAndExpand } from '@/lib/groqClient';
import { ClassifyExpandSchema } from '@/lib/blueprintSchemas';
import { saveBlueprintVersion } from '@/lib/blueprintService';
import { optionalAuth } from '@/lib/authMiddleware';

export async function POST(req) {
  try {
    // Guard: GROQ_API_KEY must be set (server-side only, no NEXT_PUBLIC_ prefix)
    if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'your_groq_api_key_here') {
      return Response.json(
        {
          success: false,
          error: 'Groq API key not configured. Please set GROQ_API_KEY in .env.local',
        },
        { status: 500 }
      );
    }

    // Parse + validate request body
    const body = await req.json().catch(() => ({}));
    const { rawIdea } = body;

    if (!rawIdea || typeof rawIdea !== 'string' || rawIdea.trim().length === 0) {
      return Response.json(
        { success: false, error: 'rawIdea is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    // Optional auth — non-blocking
    const auth = await optionalAuth(req);

    // Single Groq call: classify domain + expand Blueprint V1 + build module_config
    const raw = await classifyAndExpand(rawIdea.trim());

    // Validate full response shape with Zod
    const validated = ClassifyExpandSchema.parse(raw);

    // Persist to DB if user is authenticated
    let savedBlueprint = null;
    if (auth.isAuthenticated) {
      try {
        savedBlueprint = await saveBlueprintVersion(
          auth.userId,
          {
            product_summary:  validated.product_summary,
            target_users:     validated.target_users,
            business_goals:   validated.business_goals,
            implied_features: validated.implied_features,
            constraints:      validated.constraints,
          },
          'groq-classify',
          `Blueprint V1 [${validated.domain}]: ${validated.product_summary?.substring(0, 50)}...`
        );
        console.log(`✓ Blueprint V${savedBlueprint.version_number} saved (user: ${auth.userId}, domain: ${validated.domain})`);
      } catch (dbError) {
        // Non-fatal — Zustand is the client-side source of truth
        console.warn('Could not persist blueprint to DB:', dbError.message);
      }
    }

    // Return the full classified + expanded payload
    return Response.json(
      {
        success:      true,
        domain:       validated.domain,
        blueprint_v1: {
          product_summary:  validated.product_summary,
          target_users:     validated.target_users,
          business_goals:   validated.business_goals,
          implied_features: validated.implied_features,
          constraints:      validated.constraints,
          domain:           validated.domain,
        },
        module_config: validated.module_config,
        blueprintId:   savedBlueprint?.id || null,
        version:       savedBlueprint?.version_number || 1,
        persisted:     !!savedBlueprint,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[/api/groq/classify] Error:', error);

    // Zod validation failure
    if (error.name === 'ZodError') {
      return Response.json(
        {
          success: false,
          error:   'Blueprint V1 + module_config validation failed',
          details: error.errors,
        },
        { status: 422 }
      );
    }

    // All other errors
    return Response.json(
      {
        success: false,
        error:   error.message || 'Failed to classify and expand idea with Groq',
      },
      { status: 500 }
    );
  }
}
