/**
 * Zod Schemas for Blueprint Validation
 * Ensures all AI-generated content conforms to expected structure
 */

import { z } from 'zod';

/**
 * Blueprint V1 Schema
 * Output from Groq expansion on terminal form submit.
 * Also includes domain (used by /api/groq/classify).
 */
export const BlueprintV1Schema = z.object({
  product_summary: z.string()
    .min(10, 'Product summary must be at least 10 characters')
    .max(500, 'Product summary must be under 500 characters'),
  target_users: z.array(
    z.string().min(3, 'Each target user must be at least 3 characters')
  )
    .min(1, 'Must specify at least 1 target user')
    .max(10, 'Maximum 10 target users'),
  business_goals: z.array(
    z.string().min(5, 'Each business goal must be at least 5 characters')
  )
    .min(1, 'Must specify at least 1 business goal')
    .max(10, 'Maximum 10 business goals'),
  implied_features: z.array(
    z.string().min(3, 'Each feature must be at least 3 characters')
  )
    .min(1, 'Must specify at least 1 feature')
    .max(20, 'Maximum 20 features'),
  constraints: z.array(
    z.string().min(5, 'Each constraint must be at least 5 characters')
  )
    .min(0)
    .max(10, 'Maximum 10 constraints'),
  domain: z.enum(['technical', 'business', 'creative', 'mixed'])
    .optional(), // optional for backward compat with /api/groq/expand
});

/**
 * Module entry schema — one module entry in module_config.modules
 */
const ModuleEntrySchema = z.object({
  enabled: z.boolean(),
  label: z.string().min(1),
});

/**
 * ModuleConfig Schema — full module_config shape returned by Groq classify
 * Controls which Gemini modules are shown on the blueprint hub
 */
export const ModuleConfigSchema = z.object({
  domain: z.enum(['technical', 'business', 'creative', 'mixed']),
  modules: z.object({
    idea_refinement:     ModuleEntrySchema,
    workflow_map:        ModuleEntrySchema,
    market_research:     ModuleEntrySchema,
    tech_stack:          ModuleEntrySchema,
    system_architecture: ModuleEntrySchema,
    roadmap:             ModuleEntrySchema,
    prompt_builder:      ModuleEntrySchema,
  }),
});

/**
 * ClassifyExpandSchema — full shape returned by /api/groq/classify
 * Combines Blueprint V1 fields + domain + module_config
 */
export const ClassifyExpandSchema = z.object({
  // FUTURE: add domain field back when multi-domain support is activated
  // domain: z.enum(['technical', 'business', 'creative', 'mixed']),
  domain: z.string().optional(),
  product_summary: z.string().min(10).max(500),
  target_users: z.array(z.string().min(3)).min(1).max(10),
  business_goals: z.array(z.string().min(5)).min(1).max(10),
  implied_features: z.array(z.string().min(3)).min(1).max(20),
  constraints: z.array(z.string().min(5)).min(0).max(10),
  // FUTURE: add module_config field back
  // module_config: ModuleConfigSchema,
  module_config: z.any().optional(),
});

/**
 * Full Blueprint Schema
 * Represents the complete, evolving blueprint across all phases
 */
export const FullBlueprintSchema = z.object({
  id: z.number().optional(),
  version_number: z.number().int().min(1),
  product_summary: z.string().optional(),
  target_users: z.array(z.string()).optional(),
  business_goals: z.array(z.string()).optional(),
  implied_features: z.array(z.string()).optional(),
  constraints: z.array(z.string()).optional(),
  refinement: z.object({}).optional(),
  workflow: z.object({}).optional(),
  tech_stack: z.object({}).optional(),
  architecture: z.object({}).optional(),
  roadmap: z.array(z.object({})).optional(),
  prompts: z.array(z.object({})).optional(),
  module_source: z.string().optional(),
  change_summary: z.string().optional(),
  created_at: z.string().optional(),
});

// Note: For TypeScript support, use z.infer<typeof BlueprintV1Schema> in .ts files
// Example: type BlueprintV1 = z.infer<typeof BlueprintV1Schema>;
