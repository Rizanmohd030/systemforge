/**
 * SystemForge Prompt Engineering Layer
 * Centralizes all LLM prompt templates and injects global context
 * to ensure consistency across modules.
 */

// Helper to extract a minimal, stringified version of the context for the LLM
function getContextSummary(context) {
    if (!context) return "No prior context."
    let summary = []

    // Unwrap context { type, data } if needed
    let data = context
    if (context.type && context.data !== undefined) {
        data = context.data
        // Raw context is just a string
        if (context.type === "raw" && typeof data === "string") {
            return `Raw Concept Idea: ${data}`
        }
    }

    // Handle refined/structured context
    if (data && typeof data === "object") {
        if (data.productName) {
            // This is refined product context
            summary.push(`[Product Context]`)
            summary.push(`Name: ${data.productName}`)
            summary.push(`Description: ${data.description}`)
            if (data.targetUsers?.length) summary.push(`Target Users: ${data.targetUsers.join(", ")}`)
            if (data.coreFeatures?.length) summary.push(`Core Features: ${data.coreFeatures.join(", ")}`)
        }

        // Handle tech stack context
        if (data.frontend || data.backend || data.infrastructure) {
            summary.push(`\n[Technical Stack]`)
            if (data.frontend) summary.push(`Frontend: ${data.frontend.name} - ${data.frontend.reason}`)
            if (data.backend) summary.push(`Backend: ${data.backend.name} - ${data.backend.reason}`)
            if (data.infrastructure) summary.push(`Infrastructure: ${data.infrastructure.name} - ${data.infrastructure.reason}`)
            if (data.styling) summary.push(`Styling: ${data.styling.name}`)
        }
    }

    return summary.length ? summary.join("\n") : "No prior context."
}

// ─── Refinement Prompt ───────────────────────────────────────────
export const getRefinementSystemPrompt = () => `You are a Senior Product Architect at SystemForge. 
Your goal is to refine raw ideas into professional product concepts.

When users give feedback, update the concept accordingly. 
Always provide "Architect Advice" - explain the trade-offs of their choices.
Example: "If you prioritize [A], then [B] will happen visually."

{format_instructions}`

// ─── Workflow Mapping Prompt ─────────────────────────────────────
export const buildWorkflowPrompt = (context) => `You are a Visual Systems Designer. Map the core user journey/workflow for this product.
Ensure your workflow accurately reflects the requested features.

STRICT CONTRAINTS:
- No long sentences. 
- Labels MUST be 2-3 words maximum.
- Focus on the "Path" - how a user gets value from the system.

--- PROJECT CONTEXT ---
${getContextSummary(context)}
-----------------------

{format_instructions}

Visual Layout Rules:
- Flow should generally go from top to bottom.
- Space nodes properly for a React Flow canvas (0-600 range).`

// ─── Architecture Generation Prompt ──────────────────────────────
export const buildArchitecturePrompt = (context) => `You are a Lead Software Architect. Generate a comprehensive System Architecture and Product Requirements Doc (PRD).
Ensure the architecture strictly uses the requested tech stack, and implements services for ALL core features listed in the context.

--- PROJECT CONTEXT ---
${getContextSummary(context)}
-----------------------

{format_instructions}

Architecture Node Visualization Guidelines:
- Place frontend/web nodes at the top (y: 0-100).
- Place API/Backend nodes in the middle (y: 200-300).
- Place Database/Storage nodes at the bottom (y: 400-500).
- Space nodes horizontally (x) between 50 and 550.`

// ─── Tech Stack Recommendation Prompt ────────────────────────────
export const buildTechStackPrompt = (context) => `You are a Senior Systems Architect picking the optimal technology stack for a new project.
Given the product context below, recommend the absolute best frontend, backend, database/infrastructure, and styling approach.
For each selection, provide a concise, technical reason why it fits this specific product.

--- PROJECT CONTEXT ---
${getContextSummary(context)}
-----------------------

{format_instructions}`

// ─── Build Roadmap Prompt ────────────────────────────────────────
export const buildRoadmapPrompt = (context) => `You are a Lead Engineering Manager. Create a step-by-step execution roadmap for this project.
Your roadmap must be strictly tailored to the chosen tech stack and system architecture.

A good roadmap typically covers:
1. Environment Setup & Init
2. Core Infrastructure / Database
3. Backend / API Layer
4. Frontend Foundations
5. Key Features & Integration

Include accurate terminal commands (e.g., matching the specific framework init commands) and provide one detailed AI Prompt per stage that the user can copy/paste into an AI code editor to build that step.

--- PROJECT CONTEXT ---
${getContextSummary(context)}
-----------------------

{format_instructions}`

// ─── Prompt Builder Prompt ────────────────────────────────────────
export const buildPromptBuilderPrompt = (context) => `You are a Senior System Architect. Synthesize this project blueprint into a series of master prompts for AI code editors.

--- PROJECT CONTEXT ---
${getContextSummary(context)}
-----------------------

{format_instructions}

Prompting Rules:
- Create 3-4 distinct phases.
- Be extremely technical and precise.
- Focus on the "Knowledge Path" - how to build this step-by-step.`
