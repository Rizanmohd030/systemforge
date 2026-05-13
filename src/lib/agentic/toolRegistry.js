import { z } from 'zod';

/**
 * Tool Registry — Central registry of all backend tools AI can invoke
 * 
 * Each tool has:
 * - name: unique identifier
 * - description: what it does
 * - inputSchema: Zod schema for validation
 * - requiresApproval: needs human sign-off?
 * - handler: async function that executes the tool
 */

const toolRegistry = {};

export function registerTool(name, config) {
  if (toolRegistry[name]) {
    throw new Error(`Tool "${name}" already registered`);
  }
  
  toolRegistry[name] = {
    name,
    description: config.description,
    module: config.module,
    inputSchema: config.inputSchema,
    requiresApproval: config.requiresApproval || false,
    enabled: config.enabled !== false,
    handler: config.handler,
  };
}

export function getTool(name) {
  const tool = toolRegistry[name];
  if (!tool) {
    throw new Error(`Tool "${name}" not found in registry`);
  }
  if (!tool.enabled) {
    throw new Error(`Tool "${name}" is disabled`);
  }
  return tool;
}

export function getAllTools() {
  return Object.values(toolRegistry);
}

export function getToolsByModule(module) {
  return Object.values(toolRegistry).filter(t => t.module === module && t.enabled);
}

export async function validateToolInput(name, input) {
  const tool = getTool(name);
  try {
    const validated = tool.inputSchema.parse(input);
    return { valid: true, data: validated };
  } catch (error) {
    return { valid: false, errors: error.errors };
  }
}

export async function executeTool(name, input, context = {}) {
  const tool = getTool(name);
  
  // Validate input against schema
  const validation = await validateToolInput(name, input);
  if (!validation.valid) {
    throw new Error(`Invalid input for tool "${name}": ${JSON.stringify(validation.errors)}`);
  }

  // Check if requires approval
  if (tool.requiresApproval && !context.approvalGiven) {
    return {
      requiresApproval: true,
      toolName: name,
      description: tool.description,
      input: validation.data,
    };
  }

  // Execute the tool
  try {
    const result = await tool.handler(validation.data, context);
    return {
      success: true,
      toolName: name,
      result,
    };
  } catch (error) {
    return {
      success: false,
      toolName: name,
      error: error.message,
    };
  }
}

export function getToolSchema(name) {
  const tool = getTool(name);
  return {
    name: tool.name,
    description: tool.description,
    module: tool.module,
    requiresApproval: tool.requiresApproval,
    inputSchema: tool.inputSchema,
  };
}
