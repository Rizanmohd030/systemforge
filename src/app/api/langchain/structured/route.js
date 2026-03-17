// ============================================================
// LANGCHAIN STEP 2: Structured Output (JSON)
// ============================================================
//
// PROBLEM: LLMs are "chatty". If you ask for JSON, they often add
// text like "Here is your JSON:" or markdown blocks. This breaks
// your frontend code.
//
// SOLUTION: StructuredOutputParser + Zod.
// This combo does three things:
//   1. Inserts hidden instructions into the prompt telling
//      the LLM *exactly* how to format the JSON.
//   2. Validates the response against your schema.
//   3. Automatically parses the string into a JS Object.
//
// ============================================================

import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
import { PromptTemplate } from "@langchain/core/prompts"
import { StructuredOutputParser } from "@langchain/core/output_parsers"
import { z } from "zod" // The standard for JS schema validation
import { NextResponse } from "next/server"

// ── STEP 2A: Define your Schema ─────────────────────────────
// This is where you define the EXACT shape of the data you want.
// In this case, we're asking for a list of software features.
const parser = StructuredOutputParser.fromZodSchema(
    z.object({
        projectName: z.string().describe("The name of the software project"),
        features: z.array(
            z.object({
                name: z.string().describe("Name of the feature"),
                description: z.string().describe("Brief summary of what it does"),
                priority: z.enum(["High", "Medium", "Low"]).describe("Implementation priority"),
                techCategory: z.string().describe("Suggested tech category (e.g. Frontend, Backend, Database)"),
                estimatedCost: z.number().describe("Estimated relative development cost (1-10)"),
            })
        ).describe("A list of core features for the project"),
    })
)

export async function POST(request) {
    try {
        const { prompt } = await request.json()

        if (!prompt) {
            return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
        }

        const model = new ChatGoogleGenerativeAI({
            model: "gemini-2.5-flash",
            apiKey: process.env.GEMINI_API_KEY,
            temperature: 0, // Lower temperature is better for structured data!
        })

        // ── STEP 2B: Get Format Instructions ──────────────────
        // This generates the string that tells the AI how to behave.
        // It looks like: "The output should be a markdown code snippet... with these keys..."
        const formatInstructions = parser.getFormatInstructions()

        // ── STEP 2C: Create the Prompt with Instructions ──────
        // We inject the {format_instructions} variable into the template.
        const promptTemplate = new PromptTemplate({
            template: `You are a product manager. Generate a feature list for the following idea:
{idea}

{format_instructions}`,
            inputVariables: ["idea"],
            partialVariables: { format_instructions: formatInstructions },
        })

        // ── STEP 2D: Build the Chain ──────────────────────────
        // Notice we pipe it into the `parser` instead of StringOutputParser.
        const chain = promptTemplate.pipe(model).pipe(parser)

        // ── STEP 2E: Invoke ───────────────────────────────────
        // The output is now a real JavaScript Object, not a string!
        const result = await chain.invoke({ idea: prompt })

        return NextResponse.json(result)
    } catch (error) {
        console.error("Structured Output Error:", error)
        return NextResponse.json(
            { error: error.message || "Failed to generate structured data" },
            { status: 500 }
        )
    }
}
