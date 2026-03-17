import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
import { PromptTemplate } from "@langchain/core/prompts"
import { StructuredOutputParser } from "@langchain/core/output_parsers"
import { z } from "zod"
import { NextResponse } from "next/server"

// ─── SCHEMA ──────────────────────────────────────────────────
const workflowSchema = z.object({
    nodes: z.array(z.object({
        id: z.string().describe("Unique node identifier (1, 2, 3...)"),
        data: z.object({ 
            label: z.string().describe("STRICT: 2-3 word max label (e.g., 'User Login', 'Data Processed')") 
        }),
        position: z.object({ 
            x: z.number().describe("Horizontal (0-600)"), 
            y: z.number().describe("Vertical (0-600)") 
        })
    })).describe("Visual journey nodes"),
    edges: z.array(z.object({
        id: z.string().describe("Unique edge ID"),
        source: z.string().describe("Source node ID"),
        target: z.string().describe("Target node ID")
    })).describe("Connectors for the path")
})

const parser = StructuredOutputParser.fromZodSchema(workflowSchema)

export async function POST(request) {
    try {
        const { productDetails } = await request.json()

        const model = new ChatGoogleGenerativeAI({
            model: "gemini-2.5-flash",
            apiKey: process.env.GEMINI_API_KEY,
            temperature: 0,
        })

        const template = new PromptTemplate({
            template: `You are a Visual Systems Designer. Map the core user journey/workflow for this product.

STRICT CONTRAINTS:
- No long sentences. 
- Labels MUST be 2-3 words maximum.
- Focus on the "Path" - how a user gets value from the system.

Product Concept:
{productDetails}

{format_instructions}

Visual Layout Rules:
- Flow should generally go from top to bottom.
- Space nodes properly for a React Flow canvas (0-600 range).`,
            inputVariables: ["productDetails"],
            partialVariables: { format_instructions: parser.getFormatInstructions() },
        })

        const chain = template.pipe(model).pipe(parser)

        const result = await chain.invoke({
            productDetails: JSON.stringify(productDetails),
        })

        return NextResponse.json(result)
    } catch (error) {
        console.error("Workflow API Error:", error)
        return NextResponse.json(
            { error: error.message || "Failed to generate workflow" },
            { status: 500 }
        )
    }
}
