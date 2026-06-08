import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { runValidation } from '@/lib/validation'

const defaultContext = {
    idea: "",
    refinement: null,
    systemDesign: null,
    stack: null,
    architecture: null,
    roadmap: null,
    prompts: null,
    blueprintV1: null,       // From Groq classify — Blueprint V1 expansion
    moduleConfig: null,      // From Groq classify — controls which Gemini modules are enabled
    marketResearch: null,    // From Gemini + Search Grounding — competitor/market data
}

export const useProjectStore = create(
    persist(
        (set, get) => ({
            ...defaultContext,
            isProcessing: false,
            validationWarnings: [],
            
            // Setters
            setProcessing: (status) => set({ isProcessing: status }),
            
            setIdea: (idea) => {
                set({ idea })
                get().validate()
            },
            
            setRefinement: (refinement) => {
                // Clear dependent states when refinement changes
                set({ 
                    refinement, 
                    systemDesign: null, 
                    stack: null, 
                    architecture: null, 
                    roadmap: null, 
                    prompts: null 
                })
                get().validate()
            },

            setSystemDesign: (systemDesign) => {
                set({ systemDesign })
                get().validate()
            },

            setStack: (stack) => {
                set({ stack })
                get().validate()
            },

            setArchitecture: (architecture) => {
                set({ architecture })
                get().validate()
            },

            setRoadmap: (roadmap) => {
                set({ roadmap })
                get().validate()
            },

            setPrompts: (prompts) => {
                set({ prompts })
                get().validate()
            },

            /**
             * Store the Groq-generated Blueprint V1 payload.
             * Called after /api/groq/classify succeeds and Zod validates the shape.
             * Clears all derived Gemini module outputs so they regenerate fresh.
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
                    marketResearch: null,  // Clear market research when idea changes
                })
                get().validate()
            },

            /**
             * Store the module_config returned by Groq classify.
             * Drives which module cards are active on the blueprint hub.
             */
            setModuleConfig: (moduleConfig) => {
                set({ moduleConfig })
            },

            /**
             * Store the Market Research / Audience Research output from Gemini + Search Grounding.
             * This is consumed by later modules via getCurrentContext() for competitive awareness.
             */
            setMarketResearch: (marketResearch) => {
                set({ marketResearch })
                get().validate()
            },

            // Full Context Getter
            // Includes marketResearch so later modules (tech stack, roadmap, prompts)
            // can incorporate competitive landscape awareness into their outputs.
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

            // Global Validation Trigger
            validate: () => {
                const warnings = runValidation(get())
                set({ validationWarnings: warnings })
            },

            // Helper to clear entirely
            clearProject: () => {
                set({ ...defaultContext, validationWarnings: [] })
            }
        }),
        {
            name: 'systemforge_project_v2', // unique name
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
            }), // Only save data, not functions/processing state
        }
    )
)
