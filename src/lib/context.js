/**
 * Context Resolver Utility
 * Manages the transition between "Raw Idea" and "Refined Concept"
 */

export const KEYS = {
    RAW: "systemforge_idea",
    REFINED: "systemforge_refined_idea",
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
    localStorage.setItem(KEYS.REFINED, JSON.stringify(data))
    window.dispatchEvent(new CustomEvent(EVENTS.UPDATED))
}

/**
 * Clears the refined concept (reset to raw).
 */
export function clearRefinedConcept() {
    if (typeof window === "undefined") return
    localStorage.removeItem(KEYS.REFINED)
    window.dispatchEvent(new CustomEvent(EVENTS.UPDATED))
}
