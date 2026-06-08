/**
 * Blueprint Service
 * Core business logic for blueprint CRUD, versioning, and context management.
 * Treats PostgreSQL as source of truth; Zustand is session-level cache.
 */

import { query, queryOne } from './db/index.js';

/**
 * Save a new blueprint version to database
 * Auto-increments version_number for given user
 */
export async function saveBlueprintVersion(
  userId,
  blueprintJson,
  moduleSource,
  changeSummary,
  sessionId = null
) {
  try {
    // Get the current max version for this user
    const lastVersion = await queryOne(
      `SELECT version_number FROM blueprints 
       WHERE user_id = $1 
       ORDER BY version_number DESC LIMIT 1`,
      [userId]
    );

    const nextVersion = (lastVersion?.version_number || 0) + 1;

    // Insert new blueprint version
    const result = await queryOne(
      `INSERT INTO blueprints 
       (user_id, session_id, version_number, blueprint_json, module_source, change_summary, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
       RETURNING id, version_number, created_at`,
      [userId, sessionId, nextVersion, JSON.stringify(blueprintJson), moduleSource, changeSummary]
    );

    console.log(`✓ Blueprint V${result.version_number} saved (id: ${result.id}, module: ${moduleSource})`);
    return result;
  } catch (error) {
    console.error('Error saving blueprint version:', error.message);
    throw new Error(`Failed to save blueprint: ${error.message}`);
  }
}

/**
 * Get latest blueprint for user
 * Returns full JSON and metadata
 */
export async function getLatestBlueprint(userId) {
  try {
    const blueprint = await queryOne(
      `SELECT id, version_number, blueprint_json, module_source, change_summary, created_at
       FROM blueprints 
       WHERE user_id = $1
       ORDER BY version_number DESC
       LIMIT 1`,
      [userId]
    );

    if (!blueprint) return null;

    return {
      id: blueprint.id,
      version: blueprint.version_number,
      data: typeof blueprint.blueprint_json === 'string' 
        ? JSON.parse(blueprint.blueprint_json)
        : blueprint.blueprint_json,
      moduleSource: blueprint.module_source,
      changeSummary: blueprint.change_summary,
      createdAt: blueprint.created_at,
    };
  } catch (error) {
    console.error('Error fetching latest blueprint:', error.message);
    throw new Error(`Failed to fetch blueprint: ${error.message}`);
  }
}

/**
 * Get blueprint history for user (last N versions)
 */
export async function getBlueprintHistory(userId, limit = 10) {
  try {
    const blueprints = await query(
      `SELECT id, version_number, module_source, change_summary, created_at
       FROM blueprints 
       WHERE user_id = $1
       ORDER BY version_number DESC
       LIMIT $2`,
      [userId, limit]
    );

    return blueprints.map(b => ({
      id: b.id,
      version: b.version_number,
      moduleSource: b.module_source,
      changeSummary: b.change_summary,
      createdAt: b.created_at,
    }));
  } catch (error) {
    console.error('Error fetching blueprint history:', error.message);
    throw new Error(`Failed to fetch history: ${error.message}`);
  }
}

/**
 * Get blueprint by ID (specific version)
 */
export async function getBlueprintById(blueprintId) {
  try {
    const blueprint = await queryOne(
      `SELECT id, user_id, version_number, blueprint_json, module_source, change_summary, created_at
       FROM blueprints 
       WHERE id = $1`,
      [blueprintId]
    );

    if (!blueprint) return null;

    return {
      id: blueprint.id,
      userId: blueprint.user_id,
      version: blueprint.version_number,
      data: typeof blueprint.blueprint_json === 'string'
        ? JSON.parse(blueprint.blueprint_json)
        : blueprint.blueprint_json,
      moduleSource: blueprint.module_source,
      changeSummary: blueprint.change_summary,
      createdAt: blueprint.created_at,
    };
  } catch (error) {
    console.error('Error fetching blueprint by ID:', error.message);
    throw new Error(`Failed to fetch blueprint: ${error.message}`);
  }
}

/**
 * Merge new data into latest blueprint and save new version
 * Used when updating specific modules (e.g., after Idea Refinement)
 */
export async function mergeAndSaveBlueprint(
  userId,
  partialData,
  moduleSource,
  changeSummary,
  sessionId = null
) {
  try {
    // Fetch latest blueprint
    const latest = await getLatestBlueprint(userId);
    const currentData = latest?.data || {};

    // Merge new data with existing
    const merged = {
      ...currentData,
      ...partialData,
    };

    // Save as new version
    return await saveBlueprintVersion(userId, merged, moduleSource, changeSummary, sessionId);
  } catch (error) {
    console.error('Error merging and saving blueprint:', error.message);
    throw new Error(`Failed to merge and save: ${error.message}`);
  }
}

/**
 * Clear all blueprints for a user (dangerous - use carefully)
 */
export async function clearUserBlueprints(userId) {
  try {
    const result = await query(
      `DELETE FROM blueprints WHERE user_id = $1`,
      [userId]
    );
    console.log(`Cleared ${result.length || 0} blueprints for user ${userId}`);
    return result;
  } catch (error) {
    console.error('Error clearing blueprints:', error.message);
    throw new Error(`Failed to clear blueprints: ${error.message}`);
  }
}
