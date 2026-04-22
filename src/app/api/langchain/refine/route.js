import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts"
import { StructuredOutputParser } from "@langchain/core/output_parsers"
import { HumanMessage, AIMessage } from "@langchain/core/messages"
import { z } from "zod"
import { NextResponse } from "next/server"

import { getRefinementSystemPrompt } from "@/lib/prompts"
import { getGeminiKey } from "@/lib/keyManager"

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
        console.log("🔧 [API /refine] Received request - rawIdea:", rawIdea?.substring(0, 50), "history length:", history.length)

        const model = new ChatGoogleGenerativeAI({
            model: "gemini-2.5-flash",
            apiKey: getGeminiKey(),
            temperature: 0.3,
        })
        console.log("🔌 [API /refine] Model initialized")

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
        console.log("⛓️  [API /refine] Chain created")

        const result = await chain.invoke({
            input: rawIdea,
            history: chatHistory,
            format_instructions: parser.getFormatInstructions()
        })
        
        console.log("✅ [API /refine] Response generated:", result.productName)
        return NextResponse.json(result)
    } catch (error) {
        console.error("❌ [API /refine] Error:", error.message)
        
        // Provide helpful user-facing error messages
        let userMessage = "Unable to refine your idea right now. Please try again.";
        let statusCode = 500;

        if (error.message?.includes("RESOURCE_EXHAUSTED")) {
            console.log("⚠️  [API /refine] Rate limit exceeded")
            userMessage = "API rate limit reached. Please wait a moment and try again.";
            statusCode = 429;
        } else if (error.message?.includes("AUTHENTICATION_ERROR") || error.message?.includes("API key")) {
            console.log("🔐 [API /refine] Auth error")
            userMessage = "Authentication error. Please contact support.";
            statusCode = 401;
        } else if (error.message?.includes("timeout") || error.message?.includes("DEADLINE_EXCEEDED")) {
            console.log("⏱️  [API /refine] Timeout")
            userMessage = "Request timed out. This might be a temporary issue. Please try again.";
            statusCode = 504;
        }

        return NextResponse.json(
            { error: userMessage, code: error.message },
            { status: statusCode }
        )
    }
}
