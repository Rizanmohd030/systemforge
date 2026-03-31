// ============================================================
// LANGCHAIN STEP 4: Agents & Tools (Modern API)
// ============================================================
//
// NOTE: You are using LangChain 1.2.x, which uses a simplified
// "Factory" pattern. Instead of manually connecting Agents and
// Executors, we use the `createAgent` function.
//
// ============================================================

import { createAgent, tool } from "langchain"
import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
import { z } from "zod"
import { NextResponse } from "next/server"

export async function POST(request) {
    try {
        const { prompt } = await request.json()

        if (!prompt) {
            return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
        }

        const model = new ChatGoogleGenerativeAI({
            model: "gemini-2.5-flash",
            apiKey: getGeminiKey(),
            temperature: 0,
        })

        // ── STEP 4A: Define a Tool ────────────────────────────
        // Using the `tool` helper is the modern way. 
        // It uses Zod to define the input schema, which helps
        // the AI understand EXACTLY what arguments to pass.
        const statsTool = tool(
            async () => {
                return "Active Users: 1,240, Active Projects: 856, Uptime: 99.9%"
            },
            {
                name: "get_systemforge_stats",
                description: "Returns live statistics for the SystemForge platform.",
                schema: z.object({}), // No inputs needed for this specific tool
            }
        )

        // ── STEP 4B: Create the Agent ─────────────────────────
        // In LangChain 1.2.x, `createAgent` returns a production-ready
        // agent that handles the "Reasoning + Acting" loop automatically.
        const agent = createAgent({
            model: model,
            tools: [statsTool],
            // You can also add a system prompt here:
            systemPrompt: "You are a helpful SystemForge assistant. Use tools when needed.",
        })

        // ── STEP 4C: Invoke the Agent ──────────────────────────
        // Modern agents expect a `messages` array, similar to the 
        // standard Chat completion API.
        const result = await agent.invoke({
            messages: [{ role: "user", content: prompt }],
        })

        // result.messages will contain the whole conversation, 
        // including the AI's thoughts and tool calls.
        // We grab the last message which is the final answer.
        const lastMessage = result.messages[result.messages.length - 1]

        return NextResponse.json({ text: lastMessage.content })
    } catch (error) {
        console.error("Agent Route Error:", error)
        return NextResponse.json(
            { error: error.message || "Failed to run agent" },
            { status: 500 }
        )
    }
}
