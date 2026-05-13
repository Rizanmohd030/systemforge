import { z } from 'zod';
import { registerTool } from '../toolRegistry.js';
import { query, queryOne } from '@/lib/db/index.js';
import { logAudit } from '../audit.js';

/**
 * Refinement Tools — Backend operations for refining product ideas
 * These tools update the refined_ideas table and maintain audit history
 */

// Tool 1: Expand a feature
registerTool('refinement:expand_feature', {
  description: 'Expand or add details to a core feature of the product',
  module: 'refinement',
  inputSchema: z.object({
    sessionId: z.string().uuid(),
    featureName: z.string(),
    expandedDescription: z.string(),
    relatedFeatures: z.array(z.string()).optional(),
  }),
  requiresApproval: false,
  handler: async (input, context) => {
    const { sessionId, featureName, expandedDescription, relatedFeatures } = input;
    
    // Get current refined idea
    const current = await queryOne(
      'SELECT * FROM refined_ideas WHERE session_id = $1 ORDER BY updated_at DESC LIMIT 1',
      [sessionId]
    );

    if (!current) {
      throw new Error('No refined idea found for this session');
    }

    // Update core features
    const updatedFeatures = (current.core_features || []).map(f => {
      if (f.name === featureName) {
        return { ...f, description: expandedDescription, relatedFeatures };
      }
      return f;
    });

    // Save to database
    const result = await queryOne(
      `UPDATE refined_ideas 
       SET core_features = $1, updated_at = NOW() 
       WHERE id = $2 
       RETURNING *`,
      [JSON.stringify(updatedFeatures), current.id]
    );

    // Log audit
    await logAudit({
      entityType: 'refined_idea',
      entityId: current.id,
      operation: 'update',
      oldValue: { core_features: current.core_features },
      newValue: { core_features: updatedFeatures },
      userId: context.userId,
    });

    return {
      featureName,
      expandedDescription,
      message: `Feature "${featureName}" expanded successfully`,
    };
  },
});

// Tool 2: Narrow scope
registerTool('refinement:narrow_scope', {
  description: 'Remove or deprioritize certain features to narrow scope',
  module: 'refinement',
  inputSchema: z.object({
    sessionId: z.string().uuid(),
    featuresToRemove: z.array(z.string()),
    reason: z.string(),
  }),
  requiresApproval: true, // Requires human approval
  handler: async (input, context) => {
    const { sessionId, featuresToRemove, reason } = input;

    const current = await queryOne(
      'SELECT * FROM refined_ideas WHERE session_id = $1 ORDER BY updated_at DESC LIMIT 1',
      [sessionId]
    );

    if (!current) {
      throw new Error('No refined idea found for this session');
    }

    const oldFeatures = current.core_features || [];
    const newFeatures = oldFeatures.filter(f => !featuresToRemove.includes(f.name));

    const result = await queryOne(
      `UPDATE refined_ideas 
       SET core_features = $1, updated_at = NOW() 
       WHERE id = $2 
       RETURNING *`,
      [JSON.stringify(newFeatures), current.id]
    );

    await logAudit({
      entityType: 'refined_idea',
      entityId: current.id,
      operation: 'update',
      oldValue: { core_features: oldFeatures },
      newValue: { core_features: newFeatures },
      userId: context.userId,
    });

    return {
      removedFeatures: featuresToRemove,
      reason,
      remainingFeatures: newFeatures.map(f => f.name),
      message: `Scope narrowed: removed ${featuresToRemove.length} feature(s)`,
    };
  },
});

// Tool 3: Explore trade-off
registerTool('refinement:explore_tradeoff', {
  description: 'Explore a specific trade-off branch (e.g., SCALE vs SPEED)',
  module: 'refinement',
  inputSchema: z.object({
    sessionId: z.string().uuid(),
    tradeoffName: z.string(),
    selectedOption: z.enum(['option_a', 'option_b']),
    rationale: z.string(),
  }),
  requiresApproval: false,
  handler: async (input, context) => {
    const { sessionId, tradeoffName, selectedOption, rationale } = input;

    const current = await queryOne(
      'SELECT * FROM refined_ideas WHERE session_id = $1 ORDER BY updated_at DESC LIMIT 1',
      [sessionId]
    );

    if (!current) {
      throw new Error('No refined idea found for this session');
    }

    // Update architect advice with selected trade-off
    const updatedAdvice = (current.architect_advice || []).map(advice => {
      if (advice.name === tradeoffName) {
        return { ...advice, selected: selectedOption, rationale };
      }
      return advice;
    });

    const result = await queryOne(
      `UPDATE refined_ideas 
       SET architect_advice = $1, updated_at = NOW() 
       WHERE id = $2 
       RETURNING *`,
      [JSON.stringify(updatedAdvice), current.id]
    );

    await logAudit({
      entityType: 'refined_idea',
      entityId: current.id,
      operation: 'update',
      oldValue: { architect_advice: current.architect_advice },
      newValue: { architect_advice: updatedAdvice },
      userId: context.userId,
    });

    return {
      tradeoffName,
      selectedOption,
      rationale,
      message: `Trade-off "${tradeoffName}" resolved to ${selectedOption}`,
    };
  },
});

// Tool 4: Update target user segment
registerTool('refinement:update_target_users', {
  description: 'Add or modify target user segments',
  module: 'refinement',
  inputSchema: z.object({
    sessionId: z.string().uuid(),
    targetUsers: z.array(z.object({
      segment: z.string(),
      description: z.string(),
      painPoints: z.array(z.string()).optional(),
    })),
  }),
  requiresApproval: false,
  handler: async (input, context) => {
    const { sessionId, targetUsers } = input;

    const current = await queryOne(
      'SELECT * FROM refined_ideas WHERE session_id = $1 ORDER BY updated_at DESC LIMIT 1',
      [sessionId]
    );

    if (!current) {
      throw new Error('No refined idea found for this session');
    }

    const result = await queryOne(
      `UPDATE refined_ideas 
       SET target_users = $1, updated_at = NOW() 
       WHERE id = $2 
       RETURNING *`,
      [JSON.stringify(targetUsers), current.id]
    );

    await logAudit({
      entityType: 'refined_idea',
      entityId: current.id,
      operation: 'update',
      oldValue: { target_users: current.target_users },
      newValue: { target_users: targetUsers },
      userId: context.userId,
    });

    return {
      targetUsers,
      message: `Updated ${targetUsers.length} target user segment(s)`,
    };
  },
});

// Tool 5: Add architect advice
registerTool('refinement:add_architect_advice', {
  description: 'Add new architectural advice or trade-off branch',
  module: 'refinement',
  inputSchema: z.object({
    sessionId: z.string().uuid(),
    adviceName: z.string(),
    description: z.string(),
    optionA: z.object({
      name: z.string(),
      description: z.string(),
      pros: z.array(z.string()),
      cons: z.array(z.string()),
    }),
    optionB: z.object({
      name: z.string(),
      description: z.string(),
      pros: z.array(z.string()),
      cons: z.array(z.string()),
    }),
  }),
  requiresApproval: false,
  handler: async (input, context) => {
    const { sessionId, adviceName, description, optionA, optionB } = input;

    const current = await queryOne(
      'SELECT * FROM refined_ideas WHERE session_id = $1 ORDER BY updated_at DESC LIMIT 1',
      [sessionId]
    );

    if (!current) {
      throw new Error('No refined idea found for this session');
    }

    const newAdvice = {
      name: adviceName,
      description,
      optionA,
      optionB,
    };

    const updatedAdvice = [...(current.architect_advice || []), newAdvice];

    const result = await queryOne(
      `UPDATE refined_ideas 
       SET architect_advice = $1, updated_at = NOW() 
       WHERE id = $2 
       RETURNING *`,
      [JSON.stringify(updatedAdvice), current.id]
    );

    await logAudit({
      entityType: 'refined_idea',
      entityId: current.id,
      operation: 'update',
      oldValue: { architect_advice: current.architect_advice },
      newValue: { architect_advice: updatedAdvice },
      userId: context.userId,
    });

    return {
      adviceName,
      message: `Added architect advice: "${adviceName}"`,
    };
  },
});
