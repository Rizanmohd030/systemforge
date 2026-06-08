

import { expandIdea } from '@/lib/groqClient';
import { BlueprintV1Schema } from '@/lib/blueprintSchemas';
import { saveBlueprintVersion } from '@/lib/blueprintService';
import { optionalAuth } from '@/lib/authMiddleware';

export async function POST(req) {
  try {
    // Check if GROQ_API_KEY is configured
    if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'your_groq_api_key_here') {
      return Response.json(
        { 
          success: false, 
          error: 'Groq API key not configured. Please set GROQ_API_KEY in .env.local'
        },
        { status: 500 }
      );
    }

    // Parse request
    const { rawIdea } = await req.json();

    if (!rawIdea || typeof rawIdea !== 'string' || rawIdea.trim().length === 0) {
      return Response.json(
        { success: false, error: 'rawIdea is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    // Get optional auth (non-blocking)
    const auth = await optionalAuth(req);

    // Call Groq to expand idea into Blueprint V1
    const blueprintV1 = await expandIdea(rawIdea);

    // Validate structure with Zod
    const validated = BlueprintV1Schema.parse(blueprintV1);

    // Save to database if user is authenticated
    let savedBlueprint = null;
    if (auth.isAuthenticated) {
      try {
        savedBlueprint = await saveBlueprintVersion(
          auth.userId,
          validated,
          'groq-expand',
          `Blueprint V1: ${validated.product_summary?.substring(0, 50)}...`
        );
        console.log(`✓ Blueprint V${savedBlueprint.version_number} saved (user: ${auth.userId})`);
      } catch (dbError) {
        console.warn('Could not save to DB:', dbError.message);
      }
    }

    // Return success response
    return Response.json(
      {
        success: true,
        blueprint_v1: validated,
        blueprintId: savedBlueprint?.id || null,
        version: savedBlueprint?.version_number || 1,
        persisted: !!savedBlueprint,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Groq expand error:', error);

    // Handle Zod validation errors
    if (error.name === 'ZodError') {
      return Response.json(
        {
          success: false,
          error: 'Blueprint V1 validation failed',
          details: error.errors,
        },
        { status: 422 }
      );
    }

    // Handle other errors
    return Response.json(
      {
        success: false,
        error: error.message || 'Failed to expand idea with Groq',
      },
      { status: 500 }
    );
  }
}
