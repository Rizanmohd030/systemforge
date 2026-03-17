import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
import { PromptTemplate } from "@langchain/core/prompts"
import { StructuredOutputParser } from "@langchain/core/output_parsers"
import { z } from "zod"
import { NextResponse } from "next/server"

// ─── SCHEMA ──────────────────────────────────────────────────
const promptSchema = z.array(z.object({
    title: z.string().describe("Stage name (e.g., Phase 1: Foundation)"),
    aiTarget: z.string().describe("Which AI this is for (e.g., Cursor, v0, Windsurf)"),
    prompt: z.string().describe("The actual master prompt"),
    instructions: z.string().describe("Short directive on how to use this prompt")
}))

const parser = StructuredOutputParser.fromZodSchema(promptSchema)

export async function POST(request) {
    try {
        const { productDetails } = await request.json()

        const model = new ChatGoogleGenerativeAI({
            model: "gemini-2.5-flash",
            apiKey: process.env.GEMINI_API_KEY,
            temperature: 0,
        })

        const template = new PromptTemplate({
            template: `You are a Senior System Architect. Synthesize this project blueprint into a series of master prompts for AI code editors.

Product Concept:
{productDetails}

{format_instructions}

Prompting Rules:
- Create 3-4 distinct phases.
- Be extremely technical and precise.
- Focus on the "Knowledge Path" - how to build this step-by-step.`,
            inputVariables: ["productDetails"],
            partialVariables: { format_instructions: parser.getFormatInstructions() },
        })

        const chain = template.pipe(model).pipe(parser)

        const result = await chain.invoke({
            productDetails: JSON.stringify(productDetails),
        })

        return NextResponse.json(result)
    } catch (error) {
        console.error("Prompt API Error:", error)
        return NextResponse.json(
            { error: error.message || "Failed to generate prompts" },
            { status: 500 }
        )
    }
}
