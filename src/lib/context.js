/**
 * Context Resolver Utility
 * Manages the transition between "Raw Idea" and "Refined Concept"
 */

export const KEYS = {
    RAW: "systemforge_idea",
    REFINED: "systemforge_refined_idea",
    CACHE_STACK: "sf_cache_stack",
    CACHE_ROADMAP: "sf_cache_roadmap",
    CACHE_ARCH: "sf_cache_arch",
    CACHE_WORKFLOW: "sf_cache_workflow",
    CACHE_PROMPT: "sf_cache_prompt",
}

export const EVENTS = {
    UPDATED: "systemforge_refinement_updated",
}

/**
 * Returns the best available context for modules to use.
 */
export function getCurrentContext() {
    if (typeof window === "undefined") return { type: "raw", data: "" }

    const refined = localStorage.getItem(KEYS.REFINED)
    const raw = localStorage.getItem(KEYS.RAW)

    if (refined) {
        try {
            return { type: "refined", data: JSON.parse(refined) }
        } catch (e) {
            console.error("Failed to parse refined idea", e)
        }
    }

    return { type: "raw", data: raw || "" }
}

/**
 * Saves a refined concept and broadcasts the update.
 */
export function saveRefinedConcept(data) {
    if (typeof window === "undefined") return
    
    // Clear all module caches whenever a NEW concept is saved
    Object.values(KEYS).forEach(key => {
        if (key.startsWith("sf_cache_")) {
            localStorage.removeItem(key)
        }
    })

    localStorage.setItem(KEYS.REFINED, JSON.stringify(data))
    window.dispatchEvent(new CustomEvent(EVENTS.UPDATED))
}

/**
 * Clears the refined concept and all module caches.
 */
export function clearRefinedConcept() {
    if (typeof window === "undefined") return
    localStorage.removeItem(KEYS.REFINED)
    
    // Clear all module caches
    Object.values(KEYS).forEach(key => {
        if (key.startsWith("sf_cache_")) {
            localStorage.removeItem(key)
        }
    })

    window.dispatchEvent(new CustomEvent(EVENTS.UPDATED))
}
