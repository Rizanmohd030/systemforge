/**
 * Centralized Project State Manager
 * Single source of truth for all SystemForge data.
 * Replaces fragmented localStorage keys with one unified object.
 */

const STORAGE_KEY = "systemforge_project"
const EVENT_NAME = "systemforge_updated"

// ─── Hash Function (djb2) ─────────────────────────────────────────────────────
export function generateHash(input) {
  const str = typeof input === "string" ? input : JSON.stringify(input)
  let hash = 5381
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i)
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36)
}

// ─── Default State ────────────────────────────────────────────────────────────
function defaultProject() {
  return {
    idea: "",
    refinement: null,
    stack: null,
    workflow: null,
    architecture: null,
    roadmap: null,
    prompts: null,
    metadata: {
      version: 1,
      lastUpdated: new Date().toISOString(),
    },
  }
}

// ─── Migration from old keys ──────────────────────────────────────────────────
function migrateOldKeys() {
  if (typeof window === "undefined") return null

  const OLD_KEYS = {
    idea: "systemforge_idea",
    refinement: "systemforge_refined_idea",
    stack: "sf_cache_stack",
    roadmap: "sf_cache_roadmap",
    architecture: "sf_cache_arch",
    workflow: "sf_cache_workflow",
    prompts: "sf_cache_prompt",
  }

  // Only migrate if new key doesn't exist AND old keys do
  if (localStorage.getItem(STORAGE_KEY)) return null

  const hasOldData = Object.values(OLD_KEYS).some(k => localStorage.getItem(k))
  if (!hasOldData) return null

  const project = defaultProject()

  // Migrate idea (plain string)
  const rawIdea = localStorage.getItem(OLD_KEYS.idea)
  if (rawIdea) project.idea = rawIdea

  // Migrate refinement (JSON object)
  const rawRefined = localStorage.getItem(OLD_KEYS.refinement)
  if (rawRefined) {
    try { project.refinement = JSON.parse(rawRefined) } catch (e) { /* skip */ }
  }

  // Migrate cached modules (store with hash)
  const moduleKeys = ["stack", "roadmap", "architecture", "workflow", "prompts"]
  moduleKeys.forEach(mod => {
    const raw = localStorage.getItem(OLD_KEYS[mod])
    if (raw) {
      try {
        const data = JSON.parse(raw)
        const inputHash = project.refinement
          ? generateHash(project.refinement)
          : generateHash(project.idea)
        project[mod] = { hash: inputHash, data }
      } catch (e) { /* skip */ }
    }
  })

  // Save migrated state
  localStorage.setItem(STORAGE_KEY, JSON.stringify(project))

  // Remove old keys
  Object.values(OLD_KEYS).forEach(k => localStorage.removeItem(k))

  return project
}

// ─── Core CRUD ────────────────────────────────────────────────────────────────

export function getProject() {
  if (typeof window === "undefined") return defaultProject()

  // Try migration first
  migrateOldKeys()

  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return defaultProject()

  try {
    return { ...defaultProject(), ...JSON.parse(raw) }
  } catch (e) {
    console.error("Failed to parse project state, resetting.", e)
    localStorage.removeItem(STORAGE_KEY)
    return defaultProject()
  }
}

export function setProject(updates) {
  if (typeof window === "undefined") return

  const current = getProject()
  const next = {
    ...current,
    ...updates,
    metadata: {
      ...current.metadata,
      ...(updates.metadata || {}),
      lastUpdated: new Date().toISOString(),
    },
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  return next
}

// ─── Module-level helpers ─────────────────────────────────────────────────────

export function getModule(moduleName) {
  const project = getProject()
  return project[moduleName] || null
}

export function updateModule(moduleName, data, inputHash) {
  setProject({
    [moduleName]: { hash: inputHash, data },
  })
}

export function shouldFetch(moduleName, inputHash) {
  const cached = getModule(moduleName)
  if (!cached || !cached.hash || !cached.data) return true
  return cached.hash !== inputHash
}

// ─── Idea & Refinement convenience ────────────────────────────────────────────

export function getIdea() {
  return getProject().idea || ""
}

export function saveIdea(text) {
  if (typeof window === "undefined") return
  setProject({ idea: text })
}

export function getRefinement() {
  return getProject().refinement || null
}

export function saveRefinement(data) {
  if (typeof window === "undefined") return

  // Clear all module caches when refinement changes (input changed)
  setProject({
    refinement: data,
    stack: null,
    workflow: null,
    architecture: null,
    roadmap: null,
    prompts: null,
  })

  window.dispatchEvent(new Event(EVENT_NAME))
}

export function clearRefinement() {
  if (typeof window === "undefined") return

  setProject({
    refinement: null,
    stack: null,
    workflow: null,
    architecture: null,
    roadmap: null,
    prompts: null,
  })

  window.dispatchEvent(new Event(EVENT_NAME))
}

export function clearProject() {
  if (typeof window === "undefined") return
  localStorage.removeItem(STORAGE_KEY)
  window.dispatchEvent(new Event(EVENT_NAME))
}

// ─── Context resolver (backward compat) ───────────────────────────────────────

export function getCurrentContext() {
  const project = getProject()

  if (project.refinement) {
    return { type: "refined", data: project.refinement }
  }

  return { type: "raw", data: project.idea || "" }
}

// ─── Event name export ────────────────────────────────────────────────────────
export const PROJECT_EVENT = EVENT_NAME
