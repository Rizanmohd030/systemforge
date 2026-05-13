import { query, queryOne } from '@/lib/db/index.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * State Manager — Maintains conversation state and session context
 * 
 * Handles:
 * - Session lifecycle (create, load, save)
 * - Conversation history
 * - Current context (product idea, refined concept, etc.)
 * - Pending approvals
 */

export class ConversationState {
  constructor(data = {}) {
    this.sessionId = data.sessionId || uuidv4();
    this.moduleName = data.moduleName || 'default';
    this.userId = data.userId || 'anonymous';
    this.messages = data.messages || [];
    this.context = data.context || {};
    this.pendingApprovals = data.pendingApprovals || [];
    this.executedActions = data.executedActions || [];
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  addMessage(role, message, metadata = {}) {
    this.messages.push({
      id: uuidv4(),
      role, // 'user' | 'ai' | 'system'
      message,
      metadata,
      timestamp: new Date(),
    });
    this.updatedAt = new Date();
  }

  addAction(action) {
    this.executedActions.push({
      id: uuidv4(),
      ...action,
      executedAt: new Date(),
    });
    this.updatedAt = new Date();
  }

  addPendingApproval(approval) {
    this.pendingApprovals.push({
      id: uuidv4(),
      ...approval,
      createdAt: new Date(),
    });
  }

  removePendingApproval(approvalId) {
    this.pendingApprovals = this.pendingApprovals.filter(a => a.id !== approvalId);
  }

  updateContext(key, value) {
    this.context[key] = value;
    this.updatedAt = new Date();
  }

  getLastMessage() {
    return this.messages[this.messages.length - 1] || null;
  }

  getLastUserMessage() {
    return [...this.messages].reverse().find(m => m.role === 'user') || null;
  }

  getConversationSummary() {
    return {
      sessionId: this.sessionId,
      moduleName: this.moduleName,
      messageCount: this.messages.length,
      actionCount: this.executedActions.length,
      pendingApprovalsCount: this.pendingApprovals.length,
      lastMessageAt: this.messages[this.messages.length - 1]?.timestamp || null,
    };
  }
}

/**
 * State Persistence — Load/save to PostgreSQL
 */
export async function createSession(moduleName, userId, context = {}) {
  const state = new ConversationState({
    moduleName,
    userId,
    context,
  });

  // Save to DB
  const result = await queryOne(
    `INSERT INTO conversational_sessions (id, module_name, user_id, metadata, status)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [state.sessionId, moduleName, userId, JSON.stringify(context), 'active']
  );

  return state;
}

export async function loadSession(sessionId) {
  // Get session metadata
  const sessionRow = await queryOne(
    'SELECT * FROM conversational_sessions WHERE id = $1',
    [sessionId]
  );

  if (!sessionRow) {
    throw new Error(`Session ${sessionId} not found`);
  }

  // Get conversation history
  const messages = await query(
    `SELECT * FROM conversation_history WHERE session_id = $1 ORDER BY timestamp ASC`,
    [sessionId]
  );

  // Get executed actions
  const actions = await query(
    `SELECT * FROM action_log WHERE session_id = $1 ORDER BY executed_at ASC`,
    [sessionId]
  );

  // Reconstruct state
  const state = new ConversationState({
    sessionId: sessionRow.id,
    moduleName: sessionRow.module_name,
    userId: sessionRow.user_id,
    context: sessionRow.metadata || {},
    createdAt: sessionRow.created_at,
    updatedAt: sessionRow.updated_at,
  });

  // Load messages
  state.messages = messages.map(m => ({
    id: m.id,
    role: m.role,
    message: m.message,
    metadata: m.intent || m.action_executed || {},
    timestamp: m.timestamp,
  }));

  // Load actions
  state.executedActions = actions.map(a => ({
    id: a.id,
    actionType: a.action_type,
    status: a.status,
    inputParams: a.input_params,
    outputData: a.output_data,
    error: a.error_message,
    executedAt: a.executed_at,
  }));

  return state;
}

export async function saveSession(state) {
  // Update session metadata
  await queryOne(
    `UPDATE conversational_sessions 
     SET updated_at = NOW(), metadata = $1 
     WHERE id = $2`,
    [JSON.stringify(state.context), state.sessionId]
  );

  // Save new messages (only unsaved ones)
  // In production, you'd track which messages are already saved
  for (const msg of state.messages) {
    const existing = await queryOne(
      'SELECT id FROM conversation_history WHERE id = $1',
      [msg.id]
    );

    if (!existing) {
      await queryOne(
        `INSERT INTO conversation_history (id, session_id, role, message, intent, timestamp)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          msg.id,
          state.sessionId,
          msg.role,
          msg.message,
          JSON.stringify(msg.metadata),
          msg.timestamp,
        ]
      );
    }
  }

  return state;
}

/**
 * Get session by ID or create new one
 */
export async function getOrCreateSession(sessionId, moduleName, userId) {
  try {
    return await loadSession(sessionId);
  } catch (error) {
    // Session doesn't exist, create new one
    return await createSession(moduleName, userId);
  }
}

/**
 * List recent sessions for a user
 */
export async function listUserSessions(userId, limit = 10) {
  const sessions = await query(
    `SELECT * FROM conversational_sessions 
     WHERE user_id = $1 
     ORDER BY updated_at DESC 
     LIMIT $2`,
    [userId, limit]
  );

  return sessions.map(s => ({
    sessionId: s.id,
    moduleName: s.module_name,
    status: s.status,
    createdAt: s.created_at,
    updatedAt: s.updated_at,
  }));
}

/**
 * Archive a session
 */
export async function archiveSession(sessionId) {
  await queryOne(
    `UPDATE conversational_sessions SET status = 'archived' WHERE id = $1`,
    [sessionId]
  );
}
