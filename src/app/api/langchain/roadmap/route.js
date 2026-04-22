import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
import { PromptTemplate } from "@langchain/core/prompts"
import { StructuredOutputParser } from "@langchain/core/output_parsers"
import { z } from "zod"
import { NextResponse } from "next/server"

import { buildRoadmapPrompt } from "@/lib/prompts"
import { getGeminiKey } from "@/lib/keyManager"

// ─── SCHEMA ──────────────────────────────────────────────────
const roadmapSchema = z.array(z.object({
    stage: z.string().describe("Name of the phase, e.g. Project Foundation"),
    description: z.string().describe("One sentence overview of this stage"),
    tasks: z.array(z.string()).describe("List of concrete action items"),
    commands: z.array(z.string()).describe("Direct terminal commands if applicable"),
    aiPrompt: z.string().describe("A professional prompt for an AI assistant to generate this stage's code")
}))

const parser = StructuredOutputParser.fromZodSchema(roadmapSchema)

export async function POST(request) {
    try {
        const { context, feedback } = await request.json()

        const model = new ChatGoogleGenerativeAI({
            model: "gemini-2.5-flash",
            apiKey: getGeminiKey(),
            temperature: 0,
        })

        const templateStr = buildRoadmapPrompt(context)
        const template = new PromptTemplate({
            template: templateStr + (feedback ? `\nUser constraints: "${feedback}"` : ""),
            inputVariables: [],
            partialVariables: { format_instructions: parser.getFormatInstructions() },
        })

        const chain = template.pipe(model).pipe(parser)

        const result = await chain.invoke({})

        return NextResponse.json(result)
    } catch (error) {
        console.error("Roadmap API Error:", error.message)
        
        let userMessage = "Unable to generate roadmap. Please try again.";
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
