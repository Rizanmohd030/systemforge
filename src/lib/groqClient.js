/**
 * Groq Client Wrapper (HTTP API)
 * Fast first-pass AI layer for Blueprint V1 expansion + domain classification.
 * Uses direct OpenAI-compatible API calls (no SDK required).
 * Single Groq call: classifies domain + expands idea into Blueprint V1 + module_config.
 */

// In-memory cache per session
const cache = new Map();

/**
 * Call Groq Llama 3.3 70B with caching via HTTP API
 * Fast, low-latency responses for initial blueprint expansion
 */
export async function callGroq(prompt, bustCache = false) {
  // Check cache first
  if (!bustCache && cache.has(prompt)) {
    console.log('✓ Cache hit for Groq prompt');
    return cache.get(prompt);
  }

  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY not set in environment variables');
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 2000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Groq API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';

    if (!text) {
      throw new Error('No content in Groq response');
    }

    // Cache result
    cache.set(prompt, text);

    return text;
  } catch (error) {
    console.error('Groq API error:', error.message);
    throw new Error(`Groq expansion failed: ${error.message}`);
  }
}

/**
 * Expand raw idea into Blueprint V1 structure (legacy — no domain/module_config)
 * Input: raw product idea (1-3 sentences)
 * Output: { product_summary, target_users, business_goals, implied_features, constraints }
 */
export async function expandIdea(rawIdea, bustCache = false) {
  const prompt = `You are a product strategist specializing in rapid ideation.

A user has submitted a raw product idea. Your job is to expand it into a structured Blueprint V1 with:
1. A clear product summary (2-3 sentences)
2. Target users (3-5 personas)
3. Business goals (2-4 goals)
4. Implied features (5-8 features extracted from the idea)
5. Constraints (2-3 technical or business constraints to consider)

Raw idea from user:
"${rawIdea}"

Respond ONLY as a valid JSON object, no markdown, no code fences:
{
  "product_summary": "string",
  "target_users": ["user1", "user2", ...],
  "business_goals": ["goal1", "goal2", ...],
  "implied_features": ["feature1", "feature2", ...],
  "constraints": ["constraint1", "constraint2", ...]
}`;

  const response = await callGroq(prompt, bustCache);
  
  // Parse JSON response
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found in response');
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Failed to parse Groq response:', response);
    throw new Error(`Failed to parse Blueprint V1 structure: ${error.message}`);
  }
}

/**
 * CLASSIFY + EXPAND in one Groq call (used by /api/groq/classify)
 * Input: raw product idea
 * Output: full Blueprint V1 including domain + module_config
 *
 * module_config controls which Gemini modules are enabled on the blueprint hub.
 * Domain rules:
 *   - technical  → enable: idea_refinement, workflow_map, tech_stack, system_architecture, roadmap, prompt_builder
 *   - business   → enable: idea_refinement, workflow_map, market_research, roadmap, prompt_builder  |  disable: tech_stack, system_architecture
 *   - creative   → enable: idea_refinement, workflow_map, roadmap, prompt_builder  |  disable: tech_stack, system_architecture, market_research
 *   - mixed      → enable all
 */
export async function classifyAndExpand(rawIdea, bustCache = false) {
  const prompt = `You are a senior product strategist and domain classifier.

A user has submitted a raw product idea. You must do two things in ONE response:

1. CLASSIFY the domain: technical | business | creative | mixed
   - technical: software systems, APIs, developer tools, infrastructure
   - business: SaaS products, marketplaces, operations, finance, HR tools
   - creative: media, content, art, design, entertainment
   - mixed: combines multiple domains significantly

2. EXPAND into Blueprint V1:
   - product_summary: 2-3 sentence product description
   - target_users: 3-5 user personas
   - business_goals: 2-4 concrete business goals
   - implied_features: 5-8 features inferred from the idea
   - constraints: 2-3 technical or business constraints

3. BUILD module_config based on the domain:
   - technical  → tech_stack: enabled, system_architecture: enabled, market_research: disabled
   - business   → tech_stack: disabled, system_architecture: disabled, market_research: enabled
   - creative   → tech_stack: disabled, system_architecture: disabled, market_research: disabled
   - mixed      → all modules enabled
   Always enable: idea_refinement, workflow_map, roadmap, prompt_builder

Raw idea from user:
"${rawIdea}"

Respond ONLY as a single valid JSON object. No markdown, no code fences, no explanation:
{
  "domain": "technical",
  "product_summary": "string",
  "target_users": ["string"],
  "business_goals": ["string"],
  "implied_features": ["string"],
  "constraints": ["string"],
  "module_config": {
    "domain": "technical",
    "modules": {
      "idea_refinement":     { "enabled": true,  "label": "Idea Refinement" },
      "workflow_map":        { "enabled": true,  "label": "Customer Journey" },
      "market_research":     { "enabled": false, "label": "Market Research" },
      "tech_stack":          { "enabled": true,  "label": "Tech Stack" },
      "system_architecture": { "enabled": true,  "label": "System Architecture" },
      "roadmap":             { "enabled": true,  "label": "Launch Roadmap" },
      "prompt_builder":      { "enabled": true,  "label": "Pitch Builder" }
    }
  }
}`;

  const response = await callGroq(prompt, bustCache);

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found in Groq response');
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Failed to parse classifyAndExpand response:', response);
    throw new Error(`Failed to parse Blueprint V1 + module_config: ${error.message}`);
  }
}

/**
 * Clear cache (useful for testing or forcing refresh)
 */
export function clearGroqCache() {
  cache.clear();
  console.log('Groq cache cleared');
}

/**
 * Get cache size (for monitoring)
 */
export function getGroqCacheSize() {
  return cache.size;
}
