/**
 * Context Resolver Utility
 * Thin wrapper over project.js for backward compatibility.
 */

import {
  getCurrentContext,
  saveRefinement,
  clearRefinement,
  PROJECT_EVENT,
} from "./project"

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
