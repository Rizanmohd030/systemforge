import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { z } from 'zod';

/**
 * Intent Extractor — Converts user feedback into structured backend actions
 * Simpler, more reliable approach without complex parsing
 */

const IntentSchema = z.object({
  actionType: z.string(),
  confidence: z.number().min(0).max(1),
  parameters: z.record(z.any()),
  requiresApproval: z.boolean(),
  reasoning: z.string(),
});

export async function extractIntent(userFeedback, context = {}) {
  try {
    const model = new ChatGoogleGenerativeAI({
      modelName: 'gemini-2.5-flash',
      apiKey: process.env.GEMINI_API_KEY_1,
      temperature: 0.2,
    });

    const systemPrompt = `You are extracting user intent into JSON actions.

RESPOND WITH ONLY VALID JSON, no markdown or extra text.

Available actions:
- refinement:expand_feature
- refinement:narrow_scope  
- refinement:explore_tradeoff
- refinement:update_target_users
- refinement:add_architect_advice
- stack:generate_recommendations
- stack:select_primary
- stack:compare
- stack:add_custom

User feedback: "${userFeedback}"
Module: ${context.module || 'refinement'}

Return EXACTLY this JSON structure (valid JSON only):
{
  "actionType": "string",
  "confidence": 0.9,
  "parameters": {},
  "requiresApproval": false,
  "reasoning": "string"
}`;

    const response = await model.invoke(systemPrompt);
    const content = response.content.trim();

    // Extract JSON from response (in case AI wraps it in markdown)
    let jsonStr = content;
    if (content.includes('```json')) {
      jsonStr = content.match(/```json\n([\s\S]*?)\n```/)?.[1] || content;
    } else if (content.includes('```')) {
      jsonStr = content.match(/```\n?([\s\S]*?)\n?```/)?.[1] || content;
    }

    // Parse JSON
    const parsed = JSON.parse(jsonStr.trim());
    const intent = IntentSchema.parse(parsed);

    return {
      success: true,
      intent,
    };
  } catch (error) {
    console.error('Intent extraction error:', error.message);

    // Return sensible fallback based on keywords
    const feedback = userFeedback.toLowerCase();
    let actionType = 'refinement:expand_feature';
    let parameters = { sessionId: '', featureName: 'Feature', expandedDescription: userFeedback };

    if (feedback.includes('remove') || feedback.includes('delete')) {
      actionType = 'refinement:narrow_scope';
      parameters = { sessionId: '', featuresToRemove: ['unknown'], reason: userFeedback };
    } else if (feedback.includes('compare') || feedback.includes('stack')) {
      actionType = 'stack:compare';
      parameters = { sessionId: '', stackNames: ['MERN', 'Next.js Full Stack'], compareOn: ['cost', 'performance'] };
    } else if (feedback.includes('recommend') || feedback.includes('generate')) {
      actionType = 'stack:generate_recommendations';
      parameters = { sessionId: '', optimizationGoal: 'performance', count: 3, constraints: [] };
    }

    return {
      success: false,
      error: error.message,
      fallback: {
        actionType,
        confidence: 0.5,
        parameters,
        requiresApproval: false,
        reasoning: 'Low confidence extraction - manual clarification may be needed',
      },
    };
  }
}

export async function extractIntentWithHistory(userMessage, conversationHistory, context = {}) {
  return extractIntent(userMessage, context);
}
