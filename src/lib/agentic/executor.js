import { executeTool, getTool } from './toolRegistry.js';
import { queryOne } from '@/lib/db/index.js';
import { logAudit } from './audit.js';

/**
 * Workflow Executor — Orchestrates intent → validation → execution → response
 * 
 * Handles:
 * - Capability validation
 * - Approval workflows
 * - Tool execution
 * - Error handling and fallbacks
 */

export async function executeWorkflow(intent, state, context = {}) {
  const { actionType, parameters, requiresApproval } = intent;

  try {
    // Inject sessionId into parameters if missing
    const params = {
      ...parameters,
      sessionId: state.sessionId,
    };

    // Step 1: Validate action is registered
    let tool;
    try {
      tool = getTool(actionType);
    } catch (error) {
      return {
        success: false,
        status: 'invalid_action',
        error: `Action "${actionType}" is not available`,
        message: 'The requested action is not recognized. Please try a different action.',
      };
    }

    // Step 2: Check permissions
    const hasPermission = await checkPermissions(actionType, context);
    if (!hasPermission) {
      return {
        success: false,
        status: 'permission_denied',
        error: `User does not have permission for "${actionType}"`,
        message: 'You do not have permission to execute this action.',
      };
    }

    // Step 3: Handle approval requirement
    if (tool.requiresApproval && !context.approvalGiven) {
      return {
        success: false,
        status: 'pending_approval',
        requiresApproval: true,
        action: {
          actionType,
          parameters: params,
        },
        message: `This action requires approval. ${tool.description}`,
      };
    }

    // Step 4: Log the action start
    const actionLogId = await logActionStart(state.sessionId, actionType, params, context.userId);

    // Step 5: Execute the tool
    const executionContext = {
      ...context,
      sessionId: state.sessionId,
    };

    const toolResult = await executeTool(actionType, params, executionContext);

    // Step 6: Log the result
    if (toolResult.success) {
      await logActionSuccess(actionLogId, toolResult.result);

      // Add to state
      state.addAction({
        actionType,
        status: 'success',
        parameters,
        result: toolResult.result,
      });

      return {
        success: true,
        status: 'completed',
        action: actionType,
        result: toolResult.result,
        message: toolResult.result.message || `${actionType} executed successfully`,
      };
    } else {
      await logActionFailure(actionLogId, toolResult.error);

      return {
        success: false,
        status: 'execution_failed',
        action: actionType,
        error: toolResult.error,
        message: `Failed to execute ${actionType}: ${toolResult.error}`,
      };
    }
  } catch (error) {
    console.error('Workflow execution error:', error);

    return {
      success: false,
      status: 'system_error',
      error: error.message,
      message: 'An unexpected error occurred. Please try again.',
    };
  }
}

/**
 * Permission checking
 */
async function checkPermissions(actionType, context) {
  // In production, integrate with your auth system
  const userId = context.userId || 'anonymous';
  
  // Admins can do everything
  if (context.role === 'admin') return true;

  // Regular users can do most things except admin operations
  if (actionType.includes(':add_custom')) {
    return context.role === 'admin';
  }

  // Users can do their own sessions
  if (context.sessionId) {
    return true; // Assume session ownership verified elsewhere
  }

  return true; // Default: allow
}

/**
 * Action logging helpers
 */
async function logActionStart(sessionId, actionType, parameters, userId) {
  const result = await queryOne(
    `INSERT INTO action_log (session_id, action_type, status, input_params, user_id)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [sessionId, actionType, 'executing', JSON.stringify(parameters), userId || 'system']
  );

  return result.id;
}

async function logActionSuccess(actionLogId, output) {
  await queryOne(
    `UPDATE action_log SET status = $1, output_data = $2, executed_at = NOW() WHERE id = $3`,
    ['success', JSON.stringify(output), actionLogId]
  );
}

async function logActionFailure(actionLogId, errorMessage) {
  await queryOne(
    `UPDATE action_log SET status = $1, error_message = $2, executed_at = NOW() WHERE id = $3`,
    ['failed', errorMessage, actionLogId]
  );
}

/**
 * Approve a pending action
 */
export async function approveAction(actionType, parameters, state, context = {}) {
  return executeWorkflow(
    { actionType, parameters, requiresApproval: true },
    state,
    { ...context, approvalGiven: true }
  );
}

/**
 * Get pending approvals for a session
 */
export async function getPendingApprovals(sessionId) {
  const pending = await queryOne(
    `SELECT * FROM action_log WHERE session_id = $1 AND status = 'pending' ORDER BY executed_at DESC`,
    [sessionId]
  );

  return pending || [];
}
