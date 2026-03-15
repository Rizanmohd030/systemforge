// ─── CACHE (in-memory, per session) ───────────────────────────────────────────
const cache = new Map()

// ─── BASE CALLER ──────────────────────────────────────────────────────────────

export async function callGemini(prompt, bustCache = false) {
    if (!bustCache && cache.has(prompt)) return cache.get(prompt)

    const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
    })

    if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Gemini request failed")
    }

    const { text } = await res.json()
    cache.set(prompt, text)
    return text
}


// ─── IDEA REFINEMENT ──────────────────────────────────────────────────────────

export async function refineIdea(rawIdea, feedback = "", bustCache = false) {
    const prompt = `
You are a product design assistant helping developers plan software systems.

A user has described a software idea. Your job is to refine it into a clear, structured product concept.

User's raw idea:
"${rawIdea}"

${feedback ? `User's additional feedback to incorporate:\n"${feedback}"\n` : ""}

Respond ONLY in this exact format, no extra text:

PRODUCT_NAME: [name]
DESCRIPTION: [one or two sentence description]
TARGET_USERS: [comma separated list]
CORE_FEATURES: [comma separated list of 4-6 features]
`.trim()

    return await callGemini(prompt, bustCache)
}

// ─── WORKFLOW MAP ─────────────────────────────────────────────────────────────

export async function generateWorkflow(productDetails, bustCache = false) {
    const prompt = `
You are a senior product designer and user experience expert.

Your task is to design a high-level user workflow (journey) for the following product concept and return the result in a structured format for React Flow.

Product Concept:
"${JSON.stringify(productDetails)}"

Your responsibilities:
1. Identify the key stages of the user journey:
   - Onboarding / Start
   - Main Value Actions (the core steps to get value)
   - Secondary / Support Actions
   - Exit / Destination Paths
2. Each node represents a step or state in the flow.
3. Each edge represents the transition between steps.

Important rules:
- Return ONLY JSON. No explanations. No markdown.
- The JSON must follow the React Flow structure exactly (nodes and edges).
- Use "default" type for all nodes.

Positioning rules (Coordinate System):
- Onboarding starts at y: 0.
- Progress vertically downward (y increases by 150 per step).
- Branch horizontally if there are multiple choices (x: 0, 300, 600).
- Center the main flow at x: 300.

Example JSON Structure:
{
  "nodes": [
    { "id": "start", "type": "default", "data": { "label": "User Lands on Page" }, "position": { "x": 300, "y": 0 } },
    { "id": "signup", "type": "default", "data": { "label": "Sign Up / Auth" }, "position": { "x": 300, "y": 150 } }
  ],
  "edges": [
    { "id": "e1", "source": "start", "target": "signup" }
  ]
}
`.trim()

    return await callGemini(prompt, bustCache)
}

// ─── TECH STACK ANALYSIS ──────────────────────────────────────────────────────

export async function analyzeTechStack(productDetails, feedback = "", bustCache = false) {
    const prompt = `
You are a senior solution architect. 

Analyze and recommend a modern technology stack for this product:
"${JSON.stringify(productDetails)}"

${feedback ? `User feedback/constraints: "${feedback}"` : ""}

Produce an ultra-concise analysis for a visual dashboard. Each section MUST be exactly one line.

FRONTEND: [Recommendation + 1-2 words on why, e.g. Next.js (SEO & Speed)]
BACKEND: [Recommendation + 1-2 words on why, e.g. Supabase (Unified Auth/DB)]
MOTIVE: [The core reason this stack fits the product in one sentence.]
ALTERNATIVE: [1-2 words for a different path, e.g. MERN (Custom Control)]
TRADE_OFF: [The biggest downside of the main stack in one sentence.]

Use the section markers exactly as written above. No extra text.
`.trim()

    return await callGemini(prompt, bustCache)
}

// ─── SYSTEM ARCHITECTURE ──────────────────────────────────────────────────────

export async function generateSystemArchitecture(productDetails, feedback = "", bustCache = false) {
    const prompt = `
You are a senior software architect.

Generate a System Architecture and Product Requirement Document (PRD) for the following product concept:
"${JSON.stringify(productDetails)}"

${feedback ? `User feedback/constraints: "${feedback}"` : ""}

Return ONLY a JSON object with two top-level keys: "prd" and "architecture". No markdown formatting around the JSON.

"prd" should be an object with:
- "problemStatement": string
- "targetUsers": array of strings
- "coreFeatures": array of strings
- "successMetrics": array of strings

"architecture" should be an object compatible with React Flow, representing the system architecture diagram. 
It must contain "nodes" and "edges" arrays.
Layers (Frontend, Backend, Database) can be represented. Keep it high-level but specific to the product requirements.
- Nodes must have: id, type: "default", position: {x, y}, data: { label: "Layer/Service Name"}.
- Edges must have: id, source, target.

Format ONLY as JSON. Do not include \`\`\`json wrappers.
`.trim()

    return await callGemini(prompt, bustCache)
}

// ─── BUILD ROADMAP ────────────────────────────────────────────────────────────

export async function generateBuildRoadmap(productDetails, feedback = "", bustCache = false) {
    const prompt = `
You are a senior technical project manager and lead developer.

Generate a visual development roadmap that guides the developer from project setup to deployment for the following product concept:
"${JSON.stringify(productDetails)}"

${feedback ? `User feedback/constraints: "${feedback}"` : ""}

Return ONLY a JSON array of stage objects. No markdown formatting around the JSON.

Each stage object must have:
- "stage": string (e.g. "Project Initialization", "Core Development")
- "description": string (one sentence description)
- "tasks": array of strings (specific sub-tasks)
- "commands": array of strings (terminal commands to run, e.g. "npx create-next-app@latest .")
- "aiPrompt": string (An optional, highly specific AI prompt the user can copy to generate the code for this stage in an IDE like Cursor/zeal)

Format ONLY as a JSON array. Do not include \`\`\`json wrappers.
`.trim()

    return await callGemini(prompt, bustCache)
}
