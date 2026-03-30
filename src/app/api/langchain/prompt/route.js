import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
import { PromptTemplate } from "@langchain/core/prompts"
import { StructuredOutputParser } from "@langchain/core/output_parsers"
import { z } from "zod"
import { NextResponse } from "next/server"
import { buildPromptBuilderPrompt } from "@/lib/prompts"

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
        const { context } = await request.json()

        const model = new ChatGoogleGenerativeAI({
            model: "gemini-2.5-flash",
            apiKey: process.env.GEMINI_API_KEY,
            temperature: 0,
        })

        const templateStr = buildPromptBuilderPrompt(context)
        const template = new PromptTemplate({
            template: templateStr,
            inputVariables: [],
            partialVariables: { format_instructions: parser.getFormatInstructions() },
        })

        const chain = template.pipe(model).pipe(parser)

        const result = await chain.invoke({})

        return NextResponse.json(result)
    } catch (error) {
        console.error("Prompt API Error:", error)
        return NextResponse.json(
            { error: error.message || "Failed to generate prompts" },
            { status: 500 }
        )
    }
}
