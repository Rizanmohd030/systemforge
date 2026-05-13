import { loadAllTools } from '@/lib/agentic/toolLoader.js';
import { getOrCreateSession, saveSession } from '@/lib/agentic/stateManager.js';
import { extractIntent } from '@/lib/agentic/intentExtractor.js';
import { executeWorkflow } from '@/lib/agentic/executor.js';

/**
 * POST /api/agentic/workflow-step
 * 
 * Main agentic workflow endpoint
 * Handles: intent extraction → validation → execution → response formation
 */

export async function POST(request) {
  try {
    // Load tools on startup
    await loadAllTools();

    const { sessionId, module, userInput, context = {} } = await request.json();

    if (!userInput || !module) {
      return Response.json({
        success: false,
        error: 'Missing required fields: userInput, module',
      }, { status: 400 });
    }

    // Step 1: Load or create session
    const state = await getOrCreateSession(sessionId || undefined, module, context.userId || 'user');

    // Step 2: Add user message to conversation
    state.addMessage('user', userInput);

    // Step 3: Extract intent from user input
    const intentResult = await extractIntent(userInput, {
      module,
      productIdea: state.context.productIdea || 'unknown',
    });

    // Use fallback if extraction failed
    const intent = intentResult.success ? intentResult.intent : intentResult.fallback;

    if (!intent) {
      state.addMessage('system', 'Could not understand your request. Please try again.');
      await saveSession(state);

      return Response.json({
        success: false,
        sessionId: state.sessionId,
        status: 'extraction_failed',
        message: 'Could not understand your request. Please clarify.',
        conversationState: state.getConversationSummary(),
      }, { status: 400 });
    }

    // Step 4: Execute the workflow
    const executionResult = await executeWorkflow(intent, state, {
      ...context,
      sessionId: state.sessionId,
      userId: context.userId || 'user',
    });

    // Step 5: Add AI response
    if (executionResult.success) {
      state.addMessage('ai', executionResult.message, {
        actionType: intent.actionType,
        result: executionResult.result,
      });
    } else if (executionResult.status === 'pending_approval') {
      state.addMessage('system', `⚠️ Approval Required: ${executionResult.message}`);
      state.addPendingApproval({
        actionType: intent.actionType,
        parameters: intent.parameters,
        message: executionResult.message,
      });
    } else {
      state.addMessage('system', `❌ Error: ${executionResult.message}`);
    }

    // Step 6: Save session state
    await saveSession(state);

    return Response.json({
      success: executionResult.success,
      sessionId: state.sessionId,
      status: executionResult.status,
      
      // Intent extraction details
      intent: {
        actionType: intent.actionType,
        confidence: intent.confidence,
        reasoning: intent.reasoning,
      },

      // Execution result
      execution: {
        action: executionResult.action,
        result: executionResult.result,
        error: executionResult.error,
      },

      // Approval workflow
      requiresApproval: executionResult.requiresApproval || false,
      pendingApprovals: state.pendingApprovals,

      // Conversation state
      message: executionResult.message,
      conversationState: state.getConversationSummary(),
    });
  } catch (error) {
    console.error('Agentic workflow error:', error);

    return Response.json({
      success: false,
      status: 'system_error',
      error: error.message,
      message: 'An unexpected error occurred. Please try again.',
    }, { status: 500 });
  }
}
