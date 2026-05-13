import { queryOne } from '@/lib/db/index.js';

/**
 * Audit Logging — Track all changes for compliance and debugging
 */

export async function logAudit({
  entityType,
  entityId,
  operation, // 'create' | 'update' | 'delete'
  oldValue,
  newValue,
  userId,
}) {
  try {
    await queryOne(
      `INSERT INTO audit_log (entity_type, entity_id, operation, old_value, new_value, user_id, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [
        entityType,
        entityId,
        operation,
        oldValue ? JSON.stringify(oldValue) : null,
        newValue ? JSON.stringify(newValue) : null,
        userId || 'system',
      ]
    );
  } catch (error) {
    console.error('Failed to log audit:', error);
    // Don't throw — auditing should not break main flow
  }
}

export async function getAuditTrail(entityType, entityId) {
  const { query } = await import('@/lib/db/index.js');
  const trail = await query(
    `SELECT * FROM audit_log 
     WHERE entity_type = $1 AND entity_id = $2 
     ORDER BY timestamp DESC`,
    [entityType, entityId]
  );
  return trail;
}
