import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
import { PromptTemplate } from "@langchain/core/prompts"
import { StructuredOutputParser } from "@langchain/core/output_parsers"
import { z } from "zod"
import { NextResponse } from "next/server"

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
        const { productDetails, feedback } = await request.json()

        const model = new ChatGoogleGenerativeAI({
            model: "gemini-2.5-flash",
            apiKey: process.env.GEMINI_API_KEY,
            temperature: 0,
        })

        const template = new PromptTemplate({
            template: `You are a senior technical project manager. Generate a professional development roadmap for this product.

Product Details:
{productDetails}

{feedbackSection}

{format_instructions}`,
            inputVariables: ["productDetails", "feedbackSection"],
            partialVariables: { format_instructions: parser.getFormatInstructions() },
        })

        const chain = template.pipe(model).pipe(parser)

        const result = await chain.invoke({
            productDetails: JSON.stringify(productDetails),
            feedbackSection: feedback ? `User constraints: "${feedback}"` : "",
        })

        return NextResponse.json(result)
    } catch (error) {
        console.error("Roadmap API Error:", error)
        return NextResponse.json(
            { error: error.message || "Failed to generate roadmap" },
            { status: 500 }
        )
    }
}
