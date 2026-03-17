import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
import { PromptTemplate } from "@langchain/core/prompts"
import { StructuredOutputParser } from "@langchain/core/output_parsers"
import { z } from "zod"
import { NextResponse } from "next/server"

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
        const { productDetails } = await request.json()

        const model = new ChatGoogleGenerativeAI({
            model: "gemini-2.5-flash",
            apiKey: process.env.GEMINI_API_KEY,
            temperature: 0,
        })

        const template = new PromptTemplate({
            template: `You are a Lead Software Architect. Generate a comprehensive System Architecture and PRD based on the product concept.

Concept:
{productDetails}

{format_instructions}

Architecture Guidelines:
- Place frontend/web nodes at the top (y: 0-100).
- Place API/Backend nodes in the middle (y: 200-300).
- Place Database/Storage nodes at the bottom (y: 400-500).
- Space nodes horizontally (x) between 50 and 550.`,
            inputVariables: ["productDetails"],
            partialVariables: { format_instructions: parser.getFormatInstructions() },
        })

        const chain = template.pipe(model).pipe(parser)

        const result = await chain.invoke({
            productDetails: JSON.stringify(productDetails),
        })

        return NextResponse.json(result)
    } catch (error) {
        console.error("Architecture API Error:", error)
        return NextResponse.json(
            { error: error.message || "Failed to generate architecture" },
            { status: 500 }
        )
    }
}
