/**
 * Context Resolver Utility
 * Thin wrapper over project.js for backward compatibility.
 * Now integrates with blueprintService for DB-backed context.
 */

import {
  getCurrentContext,
  saveRefinement,
  clearRefinement,
  PROJECT_EVENT,
} from "./project"

import { getLatestBlueprint } from './blueprintService.js';

// Re-export for backward compat
export { getCurrentContext }

export const KEYS = {
  RAW: "systemforge_idea",
  REFINED: "systemforge_refined_idea",
}

export const EVENTS = {
  UPDATED: PROJECT_EVENT,
}

/**
 * Get context summary from database (preferred method in Phase 3+)
 * Falls back to localStorage if DB returns null
 */
export async function getContextSummaryFromDB(userId) {
  try {
    // Try to fetch latest blueprint from DB
    const blueprint = await getLatestBlueprint(userId);
    
    if (blueprint) {
      return {
        type: 'db',
        version: blueprint.version,
        data: blueprint.data,
        moduleSource: blueprint.moduleSource,
        createdAt: blueprint.createdAt,
      };
    }

    // Fallback to localStorage context
    const context = getCurrentContext();
    return {
      type: 'localStorage',
      data: context.data,
    };
  } catch (error) {
    console.error('Error getting context from DB:', error);
    // On error, fall back to localStorage
    const context = getCurrentContext();
    return {
      type: 'localStorage',
      data: context.data,
    };
  }
}

/**
 * Saves a refined concept and broadcasts the update.
 */
export function saveRefinedConcept(data) {
  saveRefinement(data)
}

/**
 * Clears the refined concept and all module caches.
 */
export function clearRefinedConcept() {
  clearRefinement()
}
