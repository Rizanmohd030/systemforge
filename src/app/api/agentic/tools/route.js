import { loadAllTools } from '@/lib/agentic/toolLoader.js';
import { getAllTools, getToolsByModule } from '@/lib/agentic/toolRegistry.js';

/**
 * GET /api/agentic/tools
 * Lists all registered tools and their schemas
 */
export async function GET(request) {
  try {
    // Load all tools on first request
    await loadAllTools();

    const url = new URL(request.url);
    const module = url.searchParams.get('module');

    let tools;
    if (module) {
      tools = getToolsByModule(module);
    } else {
      tools = getAllTools();
    }

    const toolSchemas = tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      module: tool.module,
      requiresApproval: tool.requiresApproval,
    }));

    return Response.json({
      status: 'success',
      toolCount: toolSchemas.length,
      tools: toolSchemas,
    });
  } catch (error) {
    return Response.json({
      status: 'error',
      message: error.message,
    }, { status: 500 });
  }
}
