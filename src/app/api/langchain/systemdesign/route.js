import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
import { PromptTemplate } from "@langchain/core/prompts"
import { StructuredOutputParser } from "@langchain/core/output_parsers"
import { z } from "zod"
import { NextResponse } from "next/server"

import { buildSystemDesignPrompt } from "@/lib/prompts"
import { getGeminiKey } from "@/lib/keyManager"

// ─── SCHEMA ──────────────────────────────────────────────────
const systemDesignSchema = z.object({
    databaseSchema: z.array(z.object({
        tableName: z.string().describe("Name of the database table (snake_case)"),
        description: z.string().describe("Brief purpose of this table"),
        columns: z.array(z.object({
            name: z.string().describe("Column name (snake_case)"),
            type: z.string().describe("SQL data type (e.g. UUID, VARCHAR, INTEGER, TIMESTAMP, BOOLEAN, TEXT, JSON)"),
            constraints: z.string().describe("Constraints like PRIMARY KEY, NOT NULL, UNIQUE, FOREIGN KEY, DEFAULT, etc.")
        })).describe("List of columns in the table"),
        relationships: z.array(z.string()).describe("Foreign key relationships described as 'tableName.column' references")
    })).describe("Complete database schema with all required tables"),

    apiEndpoints: z.array(z.object({
        resource: z.string().describe("Resource/domain group name (e.g. 'Users', 'Projects', 'Auth')"),
        endpoints: z.array(z.object({
            method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]).describe("HTTP method"),
            path: z.string().describe("API path (e.g. /api/users/:id)"),
            description: z.string().describe("Brief description of what this endpoint does"),
            authRequired: z.boolean().describe("Whether authentication is required")
        })).describe("List of endpoints for this resource")
    })).describe("RESTful API endpoints grouped by resource"),

    services: z.array(z.object({
        name: z.string().describe("Service/module name"),
        responsibility: z.string().describe("Core responsibility of this service"),
        ownsAPIs: z.array(z.string()).describe("API resource groups this service owns"),
        ownsTables: z.array(z.string()).describe("Database tables this service manages"),
        dependsOn: z.array(z.string()).describe("Other services this depends on")
    })).describe("Logical service/module breakdown")
})

const parser = StructuredOutputParser.fromZodSchema(systemDesignSchema)

export async function POST(request) {
    try {
        const { context, feedback } = await request.json()

        const model = new ChatGoogleGenerativeAI({
            model: "gemini-2.5-flash",
            apiKey: getGeminiKey(),
            temperature: 0,
        })

        let templateStr = buildSystemDesignPrompt(context)
        
        // Append feedback to prompt if provided
        if (feedback && feedback.trim()) {
            templateStr += `\n\nUser Feedback: ${feedback}\n\nIncorporate this feedback into your system design. Adjust tables, endpoints, and services accordingly.`
        }

        const template = new PromptTemplate({
            template: templateStr,
            inputVariables: [],
            partialVariables: { format_instructions: parser.getFormatInstructions() },
        })

        const chain = template.pipe(model).pipe(parser)

        const result = await chain.invoke({})

        return NextResponse.json(result)
    } catch (error) {
        console.error("System Design API Error:", error.message)
        
        let userMessage = "Unable to generate system design. Please try again.";
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
