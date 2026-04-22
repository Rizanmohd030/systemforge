import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
import { PromptTemplate } from "@langchain/core/prompts"
import { StructuredOutputParser } from "@langchain/core/output_parsers"
import { z } from "zod"
import { NextResponse } from "next/server"

import { buildTechStackPrompt } from "@/lib/prompts"
import { getGeminiKey } from "@/lib/keyManager"

// ─── STEP 1: Define the Schema (Zod) ─────────────────────────
// This schema matches the requirements of the TechStack component.
// By defining it here, we ensure the AI ALWAYS returns these keys.
const techStackSchema = z.object({
    recommendations: z.array(z.object({
        stackName: z.string().describe("The recognizable name of the stack (e.g. T3 Stack, MERN)"),
        frontend: z.string().describe("Frontend framework (e.g. Next.js, React + Vite)"),
        backend: z.string().describe("Backend runtime/framework (e.g. Node.js/Express, Python/FastAPI, Serverless)"),
        database: z.string().describe("Database solution (e.g. PostgreSQL, MongoDB, Redis)"),
        whyPreferred: z.string().describe("One short sentence comparing this to other options for this specific use case."),
        isPrimary: z.boolean().describe("Whether this is the recommended first choice")
    })).min(2).max(4),
    summaryMotive: z.string().describe("A high-level sentence on the overall architecture strategy.")
})

const parser = StructuredOutputParser.fromZodSchema(techStackSchema)

export async function POST(request) {
    try {
        const { context, feedback } = await request.json()

        const model = new ChatGoogleGenerativeAI({
            model: "gemini-2.5-flash",
            apiKey: getGeminiKey(),
            temperature: 0, // 0 = Most reliable for structured data
        })

        const templateStr = buildTechStackPrompt(context)
        const template = new PromptTemplate({
            template: templateStr + (feedback ? `\nUser constraints/feedback: "${feedback}"` : ""),
            inputVariables: [],
            partialVariables: { format_instructions: parser.getFormatInstructions() },
        })

        const chain = template.pipe(model).pipe(parser)

        const result = await chain.invoke({})

        return NextResponse.json(result)
    } catch (error) {
        console.error("Tech Stack API Error:", error.message)
        
        let userMessage = "Unable to analyze tech stack. Please try again.";
        let statusCode = 500;

        if (error.message?.includes("RESOURCE_EXHAUSTED")) {
            userMessage = "API rate limit reached. Please wait a moment and try again.";
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
