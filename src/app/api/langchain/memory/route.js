// ============================================================
// LANGCHAIN STEP 3: Memory & State
// ============================================================
//
// PROBLEM: LLMs are stateless. Each request is a "blank slate".
// If you say "My name is Rizan" in message 1, and "What is my name?"
// in message 2, the AI will say "I don't know."
//
// SOLUTION: Chat Memory.
// LangChain handles this by injecting the conversation history
// into the prompt automatically using a "Placeholder".
//
// ============================================================

import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts"
import { StringOutputParser } from "@langchain/core/output_parsers"
import { HumanMessage, AIMessage } from "@langchain/core/messages"
import { NextResponse } from "next/server"

// ── STEP 3A: Message Types ──────────────────────────────────
// LangChain uses specific classes for different "roles":
//   - HumanMessage: What the user said.
//   - AIMessage: What the AI responded.
//   - SystemMessage: Background instructions (optional).

export async function POST(request) {
    try {
        const { prompt, history = [] } = await request.json()

        if (!prompt) {
            return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
        }

        const model = new ChatGoogleGenerativeAI({
            model: "gemini-2.5-flash",
            apiKey: process.env.GEMINI_API_KEY,
            temperature: 0.7,
        })

        // ── STEP 3B: Create a Chat Prompt Template ────────────
        // Instead of a single string, we define a list of messages.
        // `MessagesPlaceholder("chat_history")` is the magic spot
        // where LangChain will inject the previous messages.
        const chatPrompt = ChatPromptTemplate.fromMessages([
            ["system", "You are a helpful coding assistant. Use the chat history to provide context."],
            new MessagesPlaceholder("chat_history"),
            ["human", "{input}"],
        ])

        const chain = chatPrompt.pipe(model).pipe(new StringOutputParser())

        // ── STEP 3C: Format the History ───────────────────────
        // In a real app, you might get this from a database.
        // We convert the JSON history from the frontend into 
        // LangChain message objects.
        const chatHistory = history.map((msg) => {
            return msg.role === "user" 
                ? new HumanMessage(msg.text) 
                : new AIMessage(msg.text)
        })

        // ── STEP 3D: Invoke with History ──────────────────────
        // We pass the history to the placeholder we defined above.
        const response = await chain.invoke({
            input: prompt,
            chat_history: chatHistory,
        })

        return NextResponse.json({ text: response })
    } catch (error) {
        console.error("Memory Route Error:", error)
        return NextResponse.json(
            { error: error.message || "Failed to handle conversation" },
            { status: 500 }
        )
    }
}
