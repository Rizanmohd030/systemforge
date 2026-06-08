/**
 * Module Route Wrapper Utility
 * Enhances module routes with automatic database persistence
 * 
 * Usage in routes:
 * import { withBlueprintPersistence } from '@/lib/routeWrappers';
 * 
 * export const POST = withBlueprintPersistence(async (req, { userId, blueprintData }) => {
 *   // your module logic here
 *   return { moduleOutput: ... }
 * }, 'module-name', 'Change summary');
 */

import { mergeAndSaveBlueprint } from './blueprintService.js';

/**
 * Higher-order function that wraps a route handler with DB persistence
 * 
 * @param {Function} handler - async (req, context) => Promise<result>
 * @param {string} moduleSource - name of the module (e.g., 'idea-refinement', 'tech-stack')
 * @param {Function} changeSummaryFn - (result) => string describing the change
 * @returns {Function} enhanced route handler
 */
export function withBlueprintPersistence(handler, moduleSource, changeSummaryFn) {
  return async (req) => {
    try {
      // Parse request
      const body = await req.json();
      const { userId, sessionId } = body;

      // Call the original handler
      const result = await handler(req, { userId, sessionId });

      // Generate change summary
      const changeSummary = typeof changeSummaryFn === 'function'
        ? changeSummaryFn(result)
        : changeSummaryFn || `Updated via ${moduleSource}`;

      // Save to database if userId provided
      if (userId && result) {
        try {
          await mergeAndSaveBlueprint(
            userId,
            result,
            moduleSource,
            changeSummary,
            sessionId
          );
          console.log(`✓ ${moduleSource} saved to DB`);
        } catch (dbError) {
          console.warn(`Could not persist ${moduleSource} to DB:`, dbError.message);
          // Don't fail the request if DB save fails - just warn
        }
      }

      // Return result with metadata
      return Response.json({
        success: true,
        data: result,
        blueprintMetadata: {
          moduleSource,
          persistedToDb: !!userId,
        },
      });
    } catch (error) {
      console.error(`Error in ${moduleSource} handler:`, error);
      return Response.json(
        {
          success: false,
          error: error.message || `Failed to process ${moduleSource}`,
        },
        { status: 500 }
      );
    }
  };
}

/**
 * Alternative: Decorator for routes that already return NextResponse
 * For routes that already have error handling (like /refine)
 */
export async function persistBlueprintAfterResponse(
  result,
  userId,
  moduleSource,
  changeSummary,
  sessionId = null
) {
  if (!userId || !result) return;

  try {
    await mergeAndSaveBlueprint(userId, result, moduleSource, changeSummary, sessionId);
    console.log(`✓ ${moduleSource} persisted (V${result.version || 'N/A'})`);
  } catch (error) {
    console.warn(`Could not persist ${moduleSource}:`, error.message);
  }
}
