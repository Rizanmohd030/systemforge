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
