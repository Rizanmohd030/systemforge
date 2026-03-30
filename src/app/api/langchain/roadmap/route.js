import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
import { PromptTemplate } from "@langchain/core/prompts"
import { StructuredOutputParser } from "@langchain/core/output_parsers"
import { z } from "zod"
import { NextResponse } from "next/server"

import { buildRoadmapPrompt } from "@/lib/prompts"

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
            apiKey: process.env.GEMINI_API_KEY,
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
        console.error("Roadmap API Error:", error)
        return NextResponse.json(
            { error: error.message || "Failed to generate roadmap" },
            { status: 500 }
        )
    }
}
