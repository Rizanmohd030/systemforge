import { z } from 'zod';
import { registerTool } from '../toolRegistry.js';
import { query, queryOne } from '@/lib/db/index.js';
import { logAudit } from '../audit.js';

/**
 * Tech Stack Tools — Backend operations for tech stack recommendations
 * These tools query predefined stacks, apply business logic, and store decisions
 */

// Tool 1: Generate stack recommendations
registerTool('stack:generate_recommendations', {
  description: 'Generate tech stack recommendations based on optimization goal',
  module: 'stack',
  inputSchema: z.object({
    sessionId: z.string().uuid(),
    optimizationGoal: z.enum(['cost', 'performance', 'scalability', 'speed_to_market', 'simplicity']),
    count: z.number().min(2).max(5),
    constraints: z.array(z.string()).optional(),
  }),
  requiresApproval: false,
  handler: async (input, context) => {
    const { sessionId, optimizationGoal, count, constraints = [] } = input;

    // Query predefined stacks from database
    let query_sql = 'SELECT * FROM tech_stack_templates WHERE enabled = true';
    const params = [];

    // Filter by constraints
    if (constraints.includes('no_paid_services')) {
      query_sql += ' AND cost_tier IN ($1, $2)';
      params.push('free', 'cheap');
    }

    if (constraints.includes('must_scale')) {
      query_sql += ` AND scalability_tier IN ($${params.length + 1})`;
      params.push('excellent');
    }

    query_sql += ' LIMIT 50';

    const allStacks = await query(query_sql, params);

    // Score stacks based on optimization goal
    const scoredStacks = allStacks.map(stack => {
      let score = 0;

      if (optimizationGoal === 'cost' && stack.cost_tier === 'free') score += 50;
      else if (optimizationGoal === 'cost' && stack.cost_tier === 'cheap') score += 30;

      if (optimizationGoal === 'performance' && stack.performance_tier === 'high') score += 50;
      else if (optimizationGoal === 'performance' && stack.performance_tier === 'medium') score += 30;

      if (optimizationGoal === 'scalability' && stack.scalability_tier === 'excellent') score += 50;
      else if (optimizationGoal === 'scalability' && stack.scalability_tier === 'moderate') score += 30;

      return { ...stack, score };
    });

    // Sort by score and take top N
    const topStacks = scoredStacks
      .sort((a, b) => b.score - a.score)
      .slice(0, count)
      .map(stack => ({
        stackName: stack.stack_name,
        frontend: stack.frontend,
        backend: stack.backend,
        database: stack.database,
        description: stack.description,
        whyPreferred: stack.why_preferred,
        isPrimary: stack.is_primary,
        costTier: stack.cost_tier,
        performanceTier: stack.performance_tier,
        scalabilityTier: stack.scalability_tier,
      }));

    // Log this recommendation
    await logAudit({
      entityType: 'stack_recommendation',
      entityId: sessionId,
      operation: 'create',
      oldValue: null,
      newValue: {
        optimizationGoal,
        constraints,
        recommendedCount: topStacks.length,
      },
      userId: context.userId,
    });

    return {
      optimizationGoal,
      recommendations: topStacks,
      message: `Generated ${topStacks.length} tech stack recommendations optimized for ${optimizationGoal}`,
    };
  },
});

// Tool 2: Select a stack as primary
registerTool('stack:select_primary', {
  description: 'Mark a tech stack as the primary choice for this project',
  module: 'stack',
  inputSchema: z.object({
    sessionId: z.string().uuid(),
    stackName: z.string(),
    rationale: z.string(),
  }),
  requiresApproval: true, // Important decision
  handler: async (input, context) => {
    const { sessionId, stackName, rationale } = input;

    // Verify stack exists
    const stack = await queryOne(
      'SELECT * FROM tech_stack_templates WHERE stack_name = $1',
      [stackName]
    );

    if (!stack) {
      throw new Error(`Stack "${stackName}" not found`);
    }

    // Store selection in database
    const result = await queryOne(
      `INSERT INTO action_log (session_id, action_type, status, input_params, output_data)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        sessionId,
        'stack_selection',
        'success',
        JSON.stringify({ stackName }),
        JSON.stringify({ rationale, selectedAt: new Date() }),
      ]
    );

    await logAudit({
      entityType: 'stack_selection',
      entityId: sessionId,
      operation: 'create',
      oldValue: null,
      newValue: { stackName, rationale },
      userId: context.userId,
    });

    return {
      stackName,
      rationale,
      message: `Selected "${stackName}" as primary tech stack`,
    };
  },
});

// Tool 3: Compare stacks
registerTool('stack:compare', {
  description: 'Compare two or more tech stacks side-by-side',
  module: 'stack',
  inputSchema: z.object({
    sessionId: z.string().uuid(),
    stackNames: z.array(z.string()).min(2).max(5),
    compareOn: z.array(z.enum(['cost', 'performance', 'scalability', 'learning_curve', 'community_support'])).optional(),
  }),
  requiresApproval: false,
  handler: async (input, context) => {
    const { sessionId, stackNames, compareOn = ['cost', 'performance', 'scalability'] } = input;

    // Get stacks
    const stacks = await query(
      `SELECT * FROM tech_stack_templates WHERE stack_name = ANY($1)`,
      [stackNames]
    );

    if (stacks.length !== stackNames.length) {
      throw new Error('One or more stacks not found');
    }

    // Build comparison
    const comparison = stacks.map(stack => ({
      stackName: stack.stack_name,
      frontend: stack.frontend,
      backend: stack.backend,
      database: stack.database,
      cost: stack.cost_tier,
      performance: stack.performance_tier,
      scalability: stack.scalability_tier,
      description: stack.description,
    }));

    return {
      comparison,
      compareOn,
      message: `Comparison of ${stackNames.length} tech stacks`,
    };
  },
});

// Tool 4: Add custom stack to registry
registerTool('stack:add_custom', {
  description: 'Add a custom tech stack to the project (requires admin)',
  module: 'stack',
  inputSchema: z.object({
    stackName: z.string(),
    frontend: z.string(),
    backend: z.string(),
    database: z.string(),
    description: z.string(),
    whyPreferred: z.string(),
  }),
  requiresApproval: true,
  handler: async (input, context) => {
    if (context.role !== 'admin') {
      throw new Error('Only admins can add custom stacks');
    }

    const { stackName, frontend, backend, database, description, whyPreferred } = input;

    const result = await queryOne(
      `INSERT INTO tech_stack_templates (stack_name, frontend, backend, database, description, why_preferred)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [stackName, frontend, backend, database, description, whyPreferred]
    );

    await logAudit({
      entityType: 'tech_stack_template',
      entityId: result.id,
      operation: 'create',
      oldValue: null,
      newValue: result,
      userId: context.userId,
    });

    return {
      stackName,
      message: `Custom stack "${stackName}" added to registry`,
    };
  },
});
