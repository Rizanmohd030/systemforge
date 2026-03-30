/**
 * SystemForge Prompt Engineering Layer
 * Centralizes all LLM prompt templates and injects global context
 * to ensure consistency across modules.
 */

// Helper to extract a minimal, stringified version of the context for the LLM
function getContextSummary(context) {
    if (!context) return "No prior context."
    let summary = []

    if (context.idea && !context.refinement) {
        summary.push(`Raw Concept Idea: ${context.idea}`)
    }

    if (context.refinement) {
        const r = context.refinement
        summary.push(`[Product Context]`)
        summary.push(`Name: ${r.productName}`)
        summary.push(`Description: ${r.description}`)
        if (r.targetUsers?.length) summary.push(`Target Users: ${r.targetUsers.join(", ")}`)
        if (r.coreFeatures?.length) summary.push(`Core Features: ${r.coreFeatures.join(", ")}`)
    }

    if (context.stack) {
        const s = context.stack
        summary.push(`\n[Technical Stack]`)
        if (s.frontend) summary.push(`Frontend: ${s.frontend.name} - ${s.frontend.reason}`)
        if (s.backend) summary.push(`Backend: ${s.backend.name} - ${s.backend.reason}`)
        if (s.infrastructure) summary.push(`Infrastructure: ${s.infrastructure.name} - ${s.infrastructure.reason}`)
        if (s.styling) summary.push(`Styling: ${s.styling.name}`)
    }

    return summary.join("\n")
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
