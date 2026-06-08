/**
 * POST /api/langchain/market-research
 *
 * Market Research module — Gemini 2.5 Flash with Google Search Grounding.
 * Uses @google/generative-ai SDK directly (NOT LangChain) because search grounding
 * requires the `tools: [{ googleSearch: {} }]` API which LangChain doesn't expose.
 *
 * WHY SEARCH GROUNDING:
 *   Competitor data, pricing, and market conditions change constantly.
 *   Hallucinated market research is worse than none. Grounding forces Gemini
 *   to cite real, current web data instead of training-cutoff snapshots.
 *
 * For creative domain: same structure, Audience Research framing.
 * Logs to action_log table. Saves to blueprints table if userId provided.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';
import { getGeminiKey } from '@/lib/keyManager';
import { query } from '@/lib/db/index.js';
import { optionalAuth } from '@/lib/authMiddleware';
import { saveBlueprintVersion } from '@/lib/blueprintService';

// ─── ZOD SCHEMA ──────────────────────────────────────────────────────────────

const CompetitorSchema = z.object({
  name:        z.string().min(1),
  description: z.string().min(5),
  pricing:     z.string().min(1),
  strengths:   z.array(z.string().min(3)).min(1).max(6),
  weaknesses:  z.array(z.string().min(3)).min(1).max(6),
});

const MarketSizeSchema = z.object({
  tam:     z.string().describe('Total Addressable Market'),
  sam:     z.string().describe('Serviceable Addressable Market'),
  som:     z.string().describe('Serviceable Obtainable Market'),
  summary: z.string().min(20),
});

const TargetCustomerSchema = z.object({
  age_range:         z.string().min(2),
  income_level:      z.string().min(3),
  location:          z.string().min(3),
  pain_point:        z.string().min(10),
  buying_behaviour:  z.string().min(10),
});

const PricingBenchmarkSchema = z.object({
  low:         z.string(),
  mid:         z.string(),
  high:        z.string(),
  recommended: z.string(),
});

const GoToMarketSchema = z.object({
  channel:  z.string().min(2),
  strategy: z.string().min(10),
  why:      z.string().min(5),
});

const RiskFlagSchema = z.object({
  risk:       z.string().min(5),
  severity:   z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  mitigation: z.string().min(10),
});

export const MarketResearchSchema = z.object({
  competitors:         z.array(CompetitorSchema).min(2).max(8),
  market_size:         MarketSizeSchema,
  target_customer:     TargetCustomerSchema,
  pricing_benchmark:   PricingBenchmarkSchema,
  go_to_market:        z.array(GoToMarketSchema).min(2).max(5),
  risk_flags:          z.array(RiskFlagSchema).min(2).max(6),
});

// ─── PROMPT BUILDER ───────────────────────────────────────────────────────────

function buildPrompt(idea, blueprintV1, domain) {
  const isCreative = domain === 'creative';

  const context = blueprintV1
    ? `
Product Summary: ${blueprintV1.product_summary || ''}
Target Users: ${(blueprintV1.target_users || []).join(', ')}
Key Features: ${(blueprintV1.implied_features || []).join(', ')}
Business Goals: ${(blueprintV1.business_goals || []).join(', ')}
Constraints: ${(blueprintV1.constraints || []).join(', ')}
`.trim()
    : `Raw idea: "${idea}"`;

  if (isCreative) {
    return `
You are a senior market analyst and audience researcher specializing in creative industries.

Use your Google Search access to find REAL, CURRENT information about:
- Existing creative works, platforms, or content in this niche
- Audience demographics, preferences, and spending behaviour
- Pricing models for comparable creative products
- Distribution channels and go-to-market strategies for creators

CREATIVE CONCEPT:
${context}

Return ONLY a valid JSON object. No markdown. No code fences. No explanation.
The JSON must match this exact schema:

{
  "competitors": [
    {
      "name": "string — name of comparable creative work/platform/creator",
      "description": "string — what they do and why they're relevant",
      "pricing": "string — how they monetize (e.g. '$9.99/mo subscription', 'one-time $29', 'free with ads')",
      "strengths": ["string", ...],
      "weaknesses": ["string", ...]
    }
  ],
  "market_size": {
    "tam": "string — total audience or market value (e.g. '$4.2B global podcast market')",
    "sam": "string — reachable segment (e.g. '$800M English-language thriller podcasts')",
    "som": "string — realistic first-year capture (e.g. '$15M with focused marketing')",
    "summary": "string — 2-3 sentence market opportunity assessment"
  },
  "target_customer": {
    "age_range": "string — e.g. '25-40'",
    "income_level": "string — e.g. 'Middle income, $40k-$80k/year'",
    "location": "string — geographic focus",
    "pain_point": "string — what frustrates them about existing options",
    "buying_behaviour": "string — how they discover and pay for content"
  },
  "pricing_benchmark": {
    "low":  "string — low-end price point in this category",
    "mid":  "string — mid-range price point",
    "high": "string — premium price point",
    "recommended": "string — recommended entry price and rationale"
  },
  "go_to_market": [
    {
      "channel": "string — e.g. 'TikTok', 'Newsletter', 'Creator Partnerships'",
      "strategy": "string — specific tactic for this channel",
      "why": "string — why this channel works for this audience"
    }
  ],
  "risk_flags": [
    {
      "risk": "string — specific risk",
      "severity": "LOW | MEDIUM | HIGH | CRITICAL",
      "mitigation": "string — concrete mitigation strategy"
    }
  ]
}
`.trim();
  }

  // Business / Technical / Mixed
  return `
You are a senior market analyst and competitive intelligence researcher.

Use your Google Search access to find REAL, CURRENT information about:
- Direct and indirect competitors (actual company names, current pricing, recent funding)
- Market size data (TAM/SAM/SOM from reputable sources like Statista, Gartner, CB Insights)
- Target customer demographics and buying behaviour
- Pricing benchmarks across the competitive landscape
- Go-to-market channels that work in this vertical

PRODUCT CONCEPT:
${context}

Return ONLY a valid JSON object. No markdown. No code fences. No explanation.
The JSON must match this exact schema:

{
  "competitors": [
    {
      "name": "string — actual company/product name",
      "description": "string — what they do, who uses them, current status",
      "pricing": "string — their actual current pricing (e.g. '$49/mo starter, $199/mo pro')",
      "strengths": ["string — specific competitive advantage", ...],
      "weaknesses": ["string — specific gap or complaint", ...]
    }
  ],
  "market_size": {
    "tam": "string — Total Addressable Market with source hint (e.g. '$12.4B global project management market - Gartner 2024')",
    "sam": "string — Serviceable Addressable Market for this specific niche",
    "som": "string — Realistic 12-18 month obtainable share for a new entrant",
    "summary": "string — 2-3 sentence market opportunity assessment with timing insight"
  },
  "target_customer": {
    "age_range": "string — e.g. '28-45'",
    "income_level": "string — e.g. 'SMB owner, $100k-$500k annual revenue'",
    "location": "string — geographic concentration",
    "pain_point": "string — the specific frustration with current solutions",
    "buying_behaviour": "string — how they evaluate, trial, and buy tools like this"
  },
  "pricing_benchmark": {
    "low":  "string — entry-level price point in this market with example",
    "mid":  "string — mid-market price point with example",
    "high": "string — enterprise or premium price point with example",
    "recommended": "string — recommended starting price and rationale based on competitive positioning"
  },
  "go_to_market": [
    {
      "channel": "string — e.g. 'Product Hunt launch', 'LinkedIn Ads', 'SEO / content marketing'",
      "strategy": "string — specific actionable tactic for this channel",
      "why": "string — why this channel works for this product and target customer"
    }
  ],
  "risk_flags": [
    {
      "risk": "string — specific named risk (e.g. 'Salesforce entering this space', 'Long sales cycles for enterprise')",
      "severity": "LOW | MEDIUM | HIGH | CRITICAL",
      "mitigation": "string — concrete mitigation with specific actions"
    }
  ]
}
`.trim();
}

// ─── ROUTE HANDLER ────────────────────────────────────────────────────────────

export async function POST(req) {
  const startedAt = Date.now();

  try {
    // Parse request body
    const body = await req.json().catch(() => ({}));
    const { idea, blueprintV1, domain = 'business', userId, sessionId } = body;

    if (!idea || typeof idea !== 'string' || idea.trim().length === 0) {
      return Response.json(
        { success: false, error: 'idea is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    // Optional auth (non-blocking)
    const auth = await optionalAuth(req);
    const effectiveUserId = userId || auth.userId || null;

    // ── GEMINI WITH SEARCH GROUNDING ──────────────────────────────────────────
    // Using @google/generative-ai directly — LangChain doesn't expose googleSearch tool
    const genAI = new GoogleGenerativeAI(getGeminiKey());
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      tools: [{ googleSearch: {} }],  // Enable Google Search Grounding
      generationConfig: {
        temperature: 0.3,             // Lower temp for factual market data
        responseMimeType: 'text/plain',
      },
    });

    const prompt = buildPrompt(idea.trim(), blueprintV1, domain);
    const result = await model.generateContent(prompt);
    const rawText = result.response.text();

    // ── PARSE JSON ────────────────────────────────────────────────────────────
    let parsed;
    try {
      // Strip markdown fences if Gemini adds them despite instructions
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON object found in Gemini response');
      parsed = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('[market-research] JSON parse error. Raw response:', rawText.slice(0, 500));
      return Response.json(
        { success: false, error: `Failed to parse market research response: ${parseError.message}` },
        { status: 422 }
      );
    }

    // ── ZOD VALIDATION ────────────────────────────────────────────────────────
    const validated = MarketResearchSchema.parse(parsed);

    // ── GROUNDING METADATA ────────────────────────────────────────────────────
    const groundingMetadata = result.response.candidates?.[0]?.groundingMetadata || null;
    const searchQueries = groundingMetadata?.webSearchQueries || [];
    const groundingChunks = groundingMetadata?.groundingChunks?.map(c => ({
      title: c.web?.title,
      uri: c.web?.uri,
    })) || [];

    // ── LOG TO action_log TABLE ───────────────────────────────────────────────
    try {
      const module = domain === 'creative' ? 'audience-research' : 'market-research';
      await query(
        `INSERT INTO action_log
           (user_id, session_id, action_type, status, input_params, output_data)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          effectiveUserId,
          sessionId || null,
          module,
          'success',
          JSON.stringify({ idea: idea.trim().substring(0, 200), domain }),
          JSON.stringify({
            competitors: validated.competitors.length,
            risk_flags: validated.risk_flags.length,
            search_queries: searchQueries.length,
            duration_ms: Date.now() - startedAt,
          }),
        ]
      );
    } catch (logErr) {
      // Non-fatal — log warning only
      console.warn('[market-research] action_log insert failed:', logErr.message);
    }

    // ── PERSIST TO blueprints TABLE ───────────────────────────────────────────
    let savedBlueprint = null;
    if (effectiveUserId) {
      try {
        savedBlueprint = await saveBlueprintVersion(
          effectiveUserId,
          { market_research: validated },
          domain === 'creative' ? 'audience-research' : 'market-research',
          `Market Research: ${validated.competitors.length} competitors mapped, market size ${validated.market_size.tam}`,
          sessionId || null
        );
        console.log(`✓ Market Research V${savedBlueprint.version_number} saved (user: ${effectiveUserId})`);
      } catch (dbErr) {
        console.warn('[market-research] blueprint save failed:', dbErr.message);
      }
    }

    // ── RESPONSE ──────────────────────────────────────────────────────────────
    return Response.json(
      {
        success:    true,
        data:       validated,
        grounding:  {
          searchQueries,
          sources: groundingChunks,
          count:   groundingChunks.length,
        },
        blueprintId: savedBlueprint?.id || null,
        version:     savedBlueprint?.version_number || null,
        persisted:   !!savedBlueprint,
        domain,
        durationMs:  Date.now() - startedAt,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('[/api/langchain/market-research] Error:', error);

    // Zod validation failure
    if (error.name === 'ZodError') {
      return Response.json(
        {
          success: false,
          error:   'Market research output failed validation',
          details: error.errors,
        },
        { status: 422 }
      );
    }

    // Gemini rate limit
    if (error.message?.includes('RESOURCE_EXHAUSTED') || error.message?.includes('429')) {
      return Response.json(
        { success: false, error: 'Gemini rate limit reached. Please wait and try again.' },
        { status: 429 }
      );
    }

    // Auth error
    if (error.message?.includes('API key') || error.message?.includes('AUTHENTICATION')) {
      return Response.json(
        { success: false, error: 'Gemini authentication error. Check GEMINI_API_KEY in .env.local.' },
        { status: 401 }
      );
    }

    return Response.json(
      { success: false, error: error.message || 'Failed to generate market research' },
      { status: 500 }
    );
  }
}
