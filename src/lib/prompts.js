/**
 * SystemForge Prompt Engineering Layer
 * Centralizes all LLM prompt templates and injects global context
 * to ensure consistency across modules.
 */

import { getLatestBlueprintByUserId } from "@/lib/db/blueprints"

// Helper to extract a minimal, stringified version of the context for the LLM
export async function getContextSummary(userId) {
    if (!userId) return "No prior context."
    
    let latest = null
    try {
        latest = await getLatestBlueprintByUserId(userId)
    } catch (e) {
        console.warn("Failed to load context summary from DB:", e.message)
    }
    
    if (!latest || !latest.blueprint_json) return "No prior context."
    const data = latest.blueprint_json

    let summary = []

    // Handle raw idea
    if (data.idea && !data.refinement) {
        summary.push(`Raw Concept Idea: ${data.idea}`)
    }

    // Handle refined/structured context
    if (data.refinement) {
        summary.push(`[Product Context]`)
        summary.push(`Name: ${data.refinement.productName || 'Unknown'}`)
        summary.push(`Description: ${data.refinement.description || 'Unknown'}`)
        if (data.refinement.targetUsers?.length) summary.push(`Target Users: ${data.refinement.targetUsers.join(", ")}`)
        if (data.refinement.coreFeatures?.length) summary.push(`Core Features: ${data.refinement.coreFeatures.join(", ")}`)
    }

    // Handle tech stack context
    if (data.stack) {
        summary.push(`\n[Technical Stack]`)
        if (data.stack.frontend) summary.push(`Frontend: ${data.stack.frontend.name} - ${data.stack.frontend.reason}`)
        if (data.stack.backend) summary.push(`Backend: ${data.stack.backend.name} - ${data.stack.backend.reason}`)
        if (data.stack.infrastructure) summary.push(`Infrastructure: ${data.stack.infrastructure.name} - ${data.stack.infrastructure.reason}`)
        if (data.stack.styling) summary.push(`Styling: ${data.stack.styling.name}`)
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

// ─── System Design Prompt ────────────────────────────────────────
export const buildSystemDesignPrompt = async (userId) => {
const contextSummary = await getContextSummary(userId);
return `You are a Senior Systems Designer and Database Architect. Design the complete system internals for this product.

Your output must include:
1. **Database Schema**: Design all required database tables with columns, types, and constraints. Include foreign key relationships.
2. **API Endpoints**: Design RESTful API endpoints grouped by resource/domain. Include HTTP method, path, and a brief description.
3. **Services**: Break the system into logical services/modules with clear responsibilities and ownership of APIs and DB tables.

Design Principles:
- Follow normalized database design (3NF minimum).
- Use RESTful conventions for API paths.
- Services should follow Single Responsibility Principle.
- Include authentication-related tables/endpoints if the product requires user accounts.
- Include common fields like id, created_at, updated_at on all tables.
- Column types should be standard SQL types (VARCHAR, INTEGER, BOOLEAN, TIMESTAMP, TEXT, UUID, JSON, etc.).

--- PROJECT CONTEXT ---
${contextSummary}
-----------------------

{format_instructions}`
}

// ─── Architecture Generation Prompt ──────────────────────────────
export const buildArchitecturePrompt = async (userId) => {
const contextSummary = await getContextSummary(userId);
return `You are a Lead Software Architect. Generate a comprehensive System Architecture and Product Requirements Doc (PRD).
Ensure the architecture strictly uses the requested tech stack, and implements services for ALL core features listed in the context.

--- PROJECT CONTEXT ---
${contextSummary}
-----------------------

{format_instructions}

Architecture Node Visualization Guidelines:
- Place frontend/web nodes at the top (y: 0-100).
- Place API/Backend nodes in the middle (y: 200-300).
- Place Database/Storage nodes at the bottom (y: 400-500).
- Space nodes horizontally (x) between 50 and 550.`
}

// ─── Tech Stack Recommendation Prompt ────────────────────────────
export const buildTechStackPrompt = async (userId) => {
const contextSummary = await getContextSummary(userId);
return `You are a Senior Systems Architect picking the optimal technology stack for a new project.
Given the product context below, recommend the absolute best frontend, backend, database/infrastructure, and styling approach.
For each selection, provide a concise, technical reason why it fits this specific product.

--- PROJECT CONTEXT ---
${contextSummary}
-----------------------

{format_instructions}`
}

// ─── Build Roadmap Prompt ────────────────────────────────────────
export const buildRoadmapPrompt = async (userId) => {
const contextSummary = await getContextSummary(userId);
return `You are a Lead Engineering Manager. Create a step-by-step execution roadmap for this project.
Your roadmap must be strictly tailored to the chosen tech stack and system architecture.

A good roadmap typically covers:
1. Environment Setup & Init
2. Core Infrastructure / Database
3. Backend / API Layer
4. Frontend Foundations
5. Key Features & Integration

Include accurate terminal commands (e.g., matching the specific framework init commands) and provide one detailed AI Prompt per stage that the user can copy/paste into an AI code editor to build that step.

--- PROJECT CONTEXT ---
${contextSummary}
-----------------------

{format_instructions}`
}

// ─── Prompt Builder Prompt ────────────────────────────────────────
export const buildPromptBuilderPrompt = async (userId) => {
const contextSummary = await getContextSummary(userId);
return `You are a Senior System Architect. Synthesize this project blueprint into a series of master prompts for AI code editors.

--- PROJECT CONTEXT ---
${contextSummary}
-----------------------

{format_instructions}

Prompting Rules:
- Create 3-4 distinct phases.
- Be extremely technical and precise.
- Focus on the "Knowledge Path" - how to build this step-by-step.`
}
