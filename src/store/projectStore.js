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

            // Full Context Getter
            getCurrentContext: () => {
                const state = get()
                return {
                    type: state.refinement ? "refined" : "raw",
                    idea: state.idea,
                    refinement: state.refinement,
                    stack: state.stack,
                    architecture: state.architecture
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
                prompts: state.prompts 
            }), // Only save data, not functions/processing state
        }
    )
)
