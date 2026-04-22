import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
import { PromptTemplate } from "@langchain/core/prompts"
import { StructuredOutputParser } from "@langchain/core/output_parsers"
import { z } from "zod"
import { NextResponse } from "next/server"
import { buildPromptBuilderPrompt } from "@/lib/prompts"
import { getGeminiKey } from "@/lib/keyManager"

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
            apiKey: getGeminiKey(),
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
        console.error("Prompt Builder API Error:", error.message)
        
        let userMessage = "Unable to generate prompts. Please try again.";
        let statusCode = 500;

        if (error.message?.includes("RESOURCE_EXHAUSTED")) {
            userMessage = "API rate limit reached. Please wait and try again.";
            statusCode = 429;
        } else if (error.message?.includes("AUTHENTICATION_ERROR") || error.message?.includes("API key")) {
            userMessage = "Authentication error. Please contact support.";
            statusCode = 401;
        } else if (error.message?.includes("timeout")) {
            userMessage = "Request timed out. Please try again.";
            statusCode = 504;
        }

        return NextResponse.json(
            { error: userMessage, code: error.message },
            { status: statusCode }
        )
    }
}
