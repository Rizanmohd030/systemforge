// ============================================================
// LANGCHAIN STEP 1: Models & Prompt Templates
// ============================================================
//
// BEFORE (raw SDK):
//   const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })
//   const result = await model.generateContent(prompt)
//   const text = result.response.text()
//
// AFTER (LangChain):
//   We use TWO key building blocks:
//
//   1. ChatGoogleGenerativeAI  — A "Model" wrapper.
//      Instead of directly using the Google SDK, LangChain wraps it
//      so that EVERY model (OpenAI, Gemini, Claude, Llama) has the
//      EXACT SAME interface. If you ever switch models, you only
//      change this ONE line.
//
//   2. PromptTemplate  — A reusable template with variables.
//      Instead of passing raw strings, you define a template like:
//        "You are a {role}. Help the user with: {task}"
//      Then LangChain fills in the blanks for you. This keeps your
//      prompts clean, reusable, and version-controllable.
//
//   3. RunnableSequence (LCEL) — The "pipe" that connects them.
//      prompt.pipe(model) creates a chain:
//        Template → fills variables → sends to Model → returns result
//      This is LangChain Expression Language (LCEL). Think of it
//      like Unix pipes:  cat file | grep "hello" | sort
//
// ============================================================

import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
import { PromptTemplate } from "@langchain/core/prompts"
import { StringOutputParser } from "@langchain/core/output_parsers"
import { NextResponse } from "next/server"

// ── STEP 1A: Create the Model ──────────────────────────────
// This replaces:  const genAI = new GoogleGenerativeAI(getGeminiKey())
//                 const model = genAI.getGenerativeModel(...)
//
// LangChain reads GOOGLE_API_KEY from env automatically, but we can
// also pass it explicitly. The `temperature` controls creativity
// (0 = deterministic, 1 = creative).
const model = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
    apiKey: getGeminiKey(),
    temperature: 0.7,
})

// ── STEP 1B: Create a Prompt Template ──────────────────────
// This is a REUSABLE template. The {userPrompt} part is a variable
// that gets filled in at runtime. You can add as many variables
// as you want — {role}, {context}, {format}, etc.
//
// WHY is this better than a raw string?
//   - You can swap system instructions WITHOUT touching API logic
//   - You can version-control your prompts separately
//   - You can reuse the same template across different routes
const systemTemplate = PromptTemplate.fromTemplate(
    `You are an expert software architect and developer assistant for SystemForge, 
a platform that helps developers plan and build software projects.

User's request: {userPrompt}`
)

// ── STEP 1C: Create an Output Parser ───────────────────────
// StringOutputParser simply extracts the text content from the
// model's response object. Later in Step 2 we'll use a
// StructuredOutputParser to get JSON instead.
const outputParser = new StringOutputParser()

// ── STEP 1D: Build the Chain (LCEL) ────────────────────────
// This connects: Template → Model → Parser
// When you call chain.invoke({ userPrompt: "..." }), it:
//   1. Fills the template variables
//   2. Sends the completed prompt to Gemini
//   3. Parses the response into a plain string
const chain = systemTemplate.pipe(model).pipe(outputParser)

export async function POST(request) {
    try {
        const { prompt } = await request.json()

        if (!prompt) {
            return NextResponse.json(
                { error: "Prompt is required" },
                { status: 400 }
            )
        }

        // ── STEP 1E: Invoke the Chain ──────────────────────
        // Instead of:  model.generateContent(prompt)
        // We call:     chain.invoke({ userPrompt: prompt })
        //
        // The key "userPrompt" matches the {userPrompt} variable
        // in our PromptTemplate above. LangChain handles the rest.
        const text = await chain.invoke({ userPrompt: prompt })

        return NextResponse.json({ text })
    } catch (error) {
        console.error("Gemini API error:", error)
        return NextResponse.json(
            { error: error.message || "Failed to call Gemini" },
            { status: error.status || 500 }
        )
    }
}
