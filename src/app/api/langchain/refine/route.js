import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts"
import { StructuredOutputParser } from "@langchain/core/output_parsers"
import { HumanMessage, AIMessage } from "@langchain/core/messages"
import { z } from "zod"
import { NextResponse } from "next/server"

import { getRefinementSystemPrompt } from "@/lib/prompts"

// ─── SCHEMA ──────────────────────────────────────────────────
// This schema includes "Architect Advice" - the branching logic.
const refineSchema = z.object({
    productName: z.string().describe("Sharp, professional product name"),
    description: z.string().describe("1-2 sentence core value proposition"),
    targetUsers: z.array(z.string()).describe("Primary user personas"),
    coreFeatures: z.array(z.string()).describe("MVP feature set"),
    architectAdvice: z.array(z.object({
        path: z.string().describe("A potential direction (e.g. 'Enterprise Scale', 'Speed to Market')"),
        impact: z.string().describe("The consequence of this path (e.g. 'Adds 3 weeks to dev, but handles 1M users')"),
        branchType: z.enum(["SCALE", "COST", "UX", "SPEED"]).describe("The category of this advice")
    })).describe("2-3 branching suggestions for the user to consider")
})

const parser = StructuredOutputParser.fromZodSchema(refineSchema)

export async function POST(request) {
    try {
        const { rawIdea, history = [] } = await request.json()

        const model = new ChatGoogleGenerativeAI({
            model: "gemini-2.5-flash",
            apiKey: getGeminiKey(),
            temperature: 0.3, // Slight creativity for advice, but low for structure
        })

        // ─── CONVERSATIONAL PROMPT ───────────────────────────
        const prompt = ChatPromptTemplate.fromMessages([
            ["system", getRefinementSystemPrompt()],
            new MessagesPlaceholder("history"),
            ["human", "{input}"]
        ])

        // ─── FORMAT HISTORY ──────────────────────────────────
        const chatHistory = history.map(msg => 
            msg.role === "user" ? new HumanMessage(msg.content) : new AIMessage(msg.content)
        )

        const chain = prompt.pipe(model).pipe(parser)

        const result = await chain.invoke({
            input: rawIdea,
            history: chatHistory,
            format_instructions: parser.getFormatInstructions()
        })

        return NextResponse.json(result)
    } catch (error) {
        console.error("Refinement API Error:", error)
        return NextResponse.json(
            { error: error.message || "Failed to refine idea" },
            { status: 500 }
        )
    }
}
