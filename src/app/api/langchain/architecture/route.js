import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
import { PromptTemplate } from "@langchain/core/prompts"
import { StructuredOutputParser } from "@langchain/core/output_parsers"
import { z } from "zod"
import { NextResponse } from "next/server"

import { buildArchitecturePrompt } from "@/lib/prompts"
import { getGeminiKey } from "@/lib/keyManager"

// ─── SCHEMA ──────────────────────────────────────────────────
// This schema defines the structure for both the PRD and the React Flow diagram.
const architectureSchema = z.object({
    prd: z.object({
        problemStatement: z.string().describe("Clear statement of the problem being solved"),
        targetUsers: z.array(z.string()).describe("List of target user personas"),
        coreFeatures: z.array(z.string()).describe("MVP feature list"),
        successMetrics: z.array(z.string()).describe("Metrics to measure project success")
    }),
    architecture: z.object({
        nodes: z.array(z.object({
            id: z.string().describe("Unique node identifier"),
            data: z.object({ label: z.string().describe("Human readable label for the node") }),
            position: z.object({ 
                x: z.number().describe("Horizontal position (0-600)"), 
                y: z.number().describe("Vertical position (0-600)") 
            })
        })).describe("React Flow node definitions"),
        edges: z.array(z.object({
            id: z.string().describe("Unique edge identifier"),
            source: z.string().describe("Source node ID"),
            target: z.string().describe("Target node ID")
        })).describe("React Flow edge definitions connecting nodes")
    })
})

const parser = StructuredOutputParser.fromZodSchema(architectureSchema)

export async function POST(request) {
    try {
        const { context } = await request.json()

        const model = new ChatGoogleGenerativeAI({
            model: "gemini-2.5-flash",
            apiKey: getGeminiKey(),
            temperature: 0,
        })

        const templateStr = buildArchitecturePrompt(context)
        const template = new PromptTemplate({
            template: templateStr,
            inputVariables: [],
            partialVariables: { format_instructions: parser.getFormatInstructions() },
        })

        const chain = template.pipe(model).pipe(parser)

        const result = await chain.invoke({})

        return NextResponse.json(result)
    } catch (error) {
        console.error("Architecture API Error:", error.message)
        
        let userMessage = "Unable to generate architecture. Please try again.";
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
