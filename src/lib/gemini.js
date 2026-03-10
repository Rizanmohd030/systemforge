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
