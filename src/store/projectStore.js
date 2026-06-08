/**
 * projectStore.js — Zustand store with localStorage persistence + PostgreSQL sync.
 *
 * Architecture:
 *   - Zustand = fast in-session state (source of truth for the current tab)
 *   - localStorage = fallback for unauthenticated / offline users
 *   - PostgreSQL = durable source of truth, reloaded on login
 *
 * DB sync flow:
 *   1. On login → hydrateFromDB(userId) is called by the client component
 *   2. On important writes → persistToDB() sends a snapshot to /api/user/blueprint
 *   3. On logout → localStorage remains but DB is authoritative on next login
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { runValidation } from '@/lib/validation'

// ─── DEFAULT STATE ────────────────────────────────────────────────────────────

const defaultContext = {
    idea: "",
    refinement: null,
    systemDesign: null,
    stack: null,
    architecture: null,
    roadmap: null,
    prompts: null,
    blueprintV1: null,       // From Groq classify — Blueprint V1 expansion

    // FUTURE: moduleConfig will be set dynamically by Groq domain classification
    moduleConfig: {
      domain: 'technical',
      modules: {
        idea_refinement:     { enabled: true, label: "Idea Refinement" },
        workflow_map:        { enabled: true, label: "Workflow Map" },
        market_research:     { enabled: false, label: "Market Research" },
        tech_stack:          { enabled: true, label: "Tech Stack" },
        system_architecture: { enabled: true, label: "System Architecture" },
        roadmap:             { enabled: true, label: "Build Roadmap" },
        prompt_builder:      { enabled: true, label: "Prompt Builder" }
      }
    },
    
    marketResearch: null,    // From Gemini + Search Grounding — competitor/market data
}

// ─── DB SYNC HELPERS (client-side fetch to our API) ──────────────────────────

/**
 * Push a full snapshot to PostgreSQL via /api/user/blueprint.
 * Non-blocking — failures are logged but never crash the UI.
 *
 * @param {object} snapshot   The data fields to persist (partialize output)
 * @param {string} [module]   Which module triggered this save
 * @param {string} [summary]  Human-readable change description
 * @param {string} [domain]   From moduleConfig.domain
 */
async function persistToDB(snapshot, module = 'client-sync', summary = 'Auto-saved', domain = null) {
    try {
        const res = await fetch('/api/user/blueprint', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                snapshot,
                moduleSource: module,
                changeSummary: summary,
                domain,
            }),
        })
        if (res.status === 401) return // Not authenticated — silent skip
        if (!res.ok) {
            const err = await res.json().catch(() => ({}))
            console.warn('[projectStore] DB persist failed:', err.error || res.status)
        }
    } catch (e) {
        console.warn('[projectStore] DB persist network error:', e.message)
    }
}

// ─── STORE ────────────────────────────────────────────────────────────────────

export const useProjectStore = create(
    persist(
        (set, get) => ({
            ...defaultContext,
            isProcessing: false,
            validationWarnings: [],

            // ── AUTH / DB HYDRATION ─────────────────────────────────────────────

            /**
             * Called by the auth-aware client component after session is confirmed.
             * Fetches the latest blueprint from PostgreSQL and merges it into Zustand.
             * localStorage values are REPLACED if the DB has newer data.
             */
            hydrateFromDB: async () => {
                try {
                    const res = await fetch('/api/user/blueprint')
                    if (!res.ok) return // 401 or network error — stay on localStorage

                    const { authenticated, blueprint, version } = await res.json()
                    if (!authenticated || !blueprint) return

                    // Merge DB snapshot into store (DB wins over stale localStorage)
                    set({
                        idea:           blueprint.idea          ?? get().idea,
                        refinement:     blueprint.refinement    ?? get().refinement,
                        systemDesign:   blueprint.systemDesign  ?? get().systemDesign,
                        stack:          blueprint.stack         ?? get().stack,
                        architecture:   blueprint.architecture  ?? get().architecture,
                        roadmap:        blueprint.roadmap       ?? get().roadmap,
                        prompts:        blueprint.prompts       ?? get().prompts,
                        blueprintV1:    blueprint.blueprintV1   ?? get().blueprintV1,
                        moduleConfig:   blueprint.moduleConfig  ?? get().moduleConfig,
                        marketResearch: blueprint.marketResearch ?? get().marketResearch,
                        _dbVersion:     version,
                        _syncedAt:      new Date().toISOString(),
                    })

                    console.log(`✓ Zustand hydrated from DB (blueprint V${version})`)
                } catch (e) {
                    console.warn('[projectStore] hydrateFromDB error:', e.message)
                }
            },

            // ── SETTERS ─────────────────────────────────────────────────────────

            setProcessing: (status) => set({ isProcessing: status }),

            setIdea: (idea) => {
                set({ idea })
                get().validate()
            },

            setRefinement: (refinement) => {
                set({
                    refinement,
                    systemDesign: null,
                    stack: null,
                    architecture: null,
                    roadmap: null,
                    prompts: null,
                })
                get().validate()
            },

            setSystemDesign: (systemDesign) => {
                set({ systemDesign })
                get().validate()
                // Persist to DB after system design is generated
                const s = get()
                persistToDB(
                    { ...getSnapshot(s) },
                    'system-design',
                    'System design generated',
                    s.moduleConfig?.domain
                )
            },

            setStack: (stack) => {
                set({ stack })
                get().validate()
                const s = get()
                persistToDB(getSnapshot(s), 'tech-stack', 'Tech stack generated', s.moduleConfig?.domain)
            },

            setArchitecture: (architecture) => {
                set({ architecture })
                get().validate()
                const s = get()
                persistToDB(getSnapshot(s), 'system-architecture', 'Architecture generated', s.moduleConfig?.domain)
            },

            setRoadmap: (roadmap) => {
                set({ roadmap })
                get().validate()
                const s = get()
                persistToDB(getSnapshot(s), 'build-roadmap', 'Roadmap generated', s.moduleConfig?.domain)
            },

            setPrompts: (prompts) => {
                set({ prompts })
                get().validate()
                const s = get()
                persistToDB(getSnapshot(s), 'prompt-builder', 'Prompt builder output saved', s.moduleConfig?.domain)
            },

            /**
             * Store the Groq-generated Blueprint V1 payload.
             * This is the most important write — triggers a DB persist immediately.
             */
            setBlueprintV1: (blueprintV1) => {
                set({
                    blueprintV1,
                    // Clear derived Gemini outputs — they depend on the new blueprint
                    refinement: null,
                    systemDesign: null,
                    stack: null,
                    architecture: null,
                    roadmap: null,
                    prompts: null,
                    marketResearch: null,
                })
                get().validate()
                // Persist the new V1 immediately — it's the most authoritative state
                const s = get()
                persistToDB(
                    getSnapshot(s),
                    'groq-classify',
                    `Blueprint V1: ${blueprintV1?.product_summary?.substring(0, 80) ?? 'new idea'}`,
                    s.moduleConfig?.domain
                )
            },

            /**
             * Store module_config from Groq classify.
             * Co-persists with blueprintV1 — no extra DB write here.
             */
            setModuleConfig: (moduleConfig) => {
                set({ moduleConfig })
            },

            /**
             * Store Market Research / Audience Research output.
             * Persists to DB with grounded-data tag.
             */
            setMarketResearch: (marketResearch) => {
                set({ marketResearch })
                get().validate()
                const s = get()
                persistToDB(
                    getSnapshot(s),
                    'market-research',
                    `Market research: ${marketResearch?.competitors?.length ?? 0} competitors`,
                    s.moduleConfig?.domain
                )
            },

            // ── CONTEXT + VALIDATION ────────────────────────────────────────────

            /**
             * Full context getter used by module API calls to add competitive awareness.
             */
            getCurrentContext: () => {
                const state = get()
                return {
                    type: state.refinement ? "refined" : "raw",
                    idea: state.idea,
                    refinement: state.refinement,
                    stack: state.stack,
                    architecture: state.architecture,
                    marketResearch: state.marketResearch,
                }
            },

            validate: () => {
                const warnings = runValidation(get())
                set({ validationWarnings: warnings })
            },

            clearProject: () => {
                set({ ...defaultContext, validationWarnings: [] })
            },
        }),
        {
            name: 'systemforge_project_v2',
            partialize: (state) => ({
                idea: state.idea,
                refinement: state.refinement,
                systemDesign: state.systemDesign,
                stack: state.stack,
                architecture: state.architecture,
                roadmap: state.roadmap,
                prompts: state.prompts,
                blueprintV1: state.blueprintV1,
                moduleConfig: state.moduleConfig,
                marketResearch: state.marketResearch,
            }),
        }
    )
)

// ─── SNAPSHOT HELPER ──────────────────────────────────────────────────────────

/**
 * Extract the persistable data fields from a full store state.
 * Used internally when building payloads for /api/user/blueprint.
 */
function getSnapshot(state) {
    return {
        idea:           state.idea,
        refinement:     state.refinement,
        systemDesign:   state.systemDesign,
        stack:          state.stack,
        architecture:   state.architecture,
        roadmap:        state.roadmap,
        prompts:        state.prompts,
        blueprintV1:    state.blueprintV1,
        moduleConfig:   state.moduleConfig,
        marketResearch: state.marketResearch,
    }
}
