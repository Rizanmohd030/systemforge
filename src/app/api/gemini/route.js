import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextResponse } from "next/server"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

export async function POST(request) {
    try {
        const { prompt } = await request.json()

        if (!prompt) {
            return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
        }

        // route.js - change this one line
       const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })
        const result = await model.generateContent(prompt)
        const text = result.response.text()

        return NextResponse.json({ text })
    } catch (error) {
        console.error("Gemini API error:", error)
        return NextResponse.json(
            { error: error.message || "Failed to call Gemini" },
            { status: error.status || 500 }
        )
    }
}
