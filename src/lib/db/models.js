/**
 * Database Models
 * Query helpers for common DB operations
 * Complements blueprintService.js with lower-level queries
 */

import { query, queryOne } from './index.js';

/**
 * User operations
 */
export const Users = {
  /**
   * Create or get user
   */
  async getOrCreate(externalId, email, name = null) {
    try {
      // Try to find existing user
      let user = await queryOne(
        `SELECT id, external_id, email, name, plan FROM users WHERE external_id = $1`,
        [externalId]
      );

      if (user) return user;

      // Create new user
      user = await queryOne(
        `INSERT INTO users (external_id, email, name, plan, created_at)
         VALUES ($1, $2, $3, 'free', CURRENT_TIMESTAMP)
         RETURNING id, external_id, email, name, plan, created_at`,
        [externalId, email, name]
      );

      console.log(`✓ User created: ${externalId}`);
      return user;
    } catch (error) {
      console.error('Error in Users.getOrCreate:', error.message);
      throw error;
    }
  },

  /**
   * Get user by external ID
   */
  async getById(externalId) {
    try {
      return await queryOne(
        `SELECT id, external_id, email, name, plan, blueprint_count FROM users WHERE external_id = $1`,
        [externalId]
      );
    } catch (error) {
      console.error('Error in Users.getById:', error.message);
      throw error;
    }
  },

  /**
   * Update blueprint count
   */
  async updateBlueprintCount(externalId, increment = 1) {
    try {
      return await queryOne(
        `UPDATE users SET blueprint_count = blueprint_count + $1 WHERE external_id = $2 RETURNING blueprint_count`,
        [increment, externalId]
      );
    } catch (error) {
      console.error('Error in Users.updateBlueprintCount:', error.message);
      throw error;
    }
  },
};

/**
 * Blueprint operations
 */
export const Blueprints = {
  /**
   * Insert blueprint
   */
  async insert(userId, sessionId, versionNumber, blueprintJson, moduleSource, changeSummary) {
    try {
      return await queryOne(
        `INSERT INTO blueprints (user_id, session_id, version_number, blueprint_json, module_source, change_summary, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
         RETURNING id, version_number, created_at`,
        [userId, sessionId, versionNumber, JSON.stringify(blueprintJson), moduleSource, changeSummary]
      );
    } catch (error) {
      console.error('Error in Blueprints.insert:', error.message);
      throw error;
    }
  },

  /**
   * Get by user ID (latest version)
   */
  async getLatestByUserId(userId) {
    try {
      return await queryOne(
        `SELECT id, version_number, blueprint_json, module_source, change_summary, created_at
         FROM blueprints WHERE user_id = $1 ORDER BY version_number DESC LIMIT 1`,
        [userId]
      );
    } catch (error) {
      console.error('Error in Blueprints.getLatestByUserId:', error.message);
      throw error;
    }
  },

  /**
   * Get by ID
   */
  async getById(blueprintId) {
    try {
      return await queryOne(
        `SELECT id, user_id, version_number, blueprint_json, module_source, change_summary, created_at
         FROM blueprints WHERE id = $1`,
        [blueprintId]
      );
    } catch (error) {
      console.error('Error in Blueprints.getById:', error.message);
      throw error;
    }
  },

  /**
   * Get history for user
   */
  async getHistoryByUserId(userId, limit = 10) {
    try {
      return await query(
        `SELECT id, version_number, module_source, change_summary, created_at
         FROM blueprints WHERE user_id = $1 ORDER BY version_number DESC LIMIT $2`,
        [userId, limit]
      );
    } catch (error) {
      console.error('Error in Blueprints.getHistoryByUserId:', error.message);
      throw error;
    }
  },

  /**
   * Count blueprints for user
   */
  async countByUserId(userId) {
    try {
      const result = await queryOne(
        `SELECT COUNT(*) as count FROM blueprints WHERE user_id = $1`,
        [userId]
      );
      return result?.count || 0;
    } catch (error) {
      console.error('Error in Blueprints.countByUserId:', error.message);
      throw error;
    }
  },
};

/**
 * Export operations
 */
export const Exports = {
  /**
   * Log export
   */
  async logExport(userId, blueprintId, exportType) {
    try {
      return await queryOne(
        `INSERT INTO blueprint_exports (user_id, blueprint_id, export_type, exported_at)
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
         RETURNING id, exported_at`,
        [userId, blueprintId, exportType]
      );
    } catch (error) {
      console.error('Error in Exports.logExport:', error.message);
      throw error;
    }
  },

  /**
   * Get export history for user
   */
  async getHistoryByUserId(userId, limit = 50) {
    try {
      return await query(
        `SELECT id, blueprint_id, export_type, exported_at
         FROM blueprint_exports WHERE user_id = $1 ORDER BY exported_at DESC LIMIT $2`,
        [userId, limit]
      );
    } catch (error) {
      console.error('Error in Exports.getHistoryByUserId:', error.message);
      throw error;
    }
  },

  /**
   * Count exports for user (24 hours)
   */
  async countRecentByUserId(userId, hoursBack = 24) {
    try {
      const result = await queryOne(
        `SELECT COUNT(*) as count FROM blueprint_exports 
         WHERE user_id = $1 AND exported_at > NOW() - INTERVAL '1 hour' * $2`,
        [userId, hoursBack]
      );
      return result?.count || 0;
    } catch (error) {
      console.error('Error in Exports.countRecentByUserId:', error.message);
      throw error;
    }
  },
};
