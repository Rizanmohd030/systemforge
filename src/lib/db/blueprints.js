/**
 * src/lib/db/blueprints.js
 * Blueprint versioning helpers — raw SQL via pg.Pool.
 * Database-first. No ORM. Append-only versioned rows.
 *
 * Table: blueprints
 *   id SERIAL PRIMARY KEY
 *   user_id VARCHAR(255) NOT NULL         -- matches users.external_id
 *   session_id VARCHAR(255)               -- optional Groq/Gemini session tag
 *   version_number INTEGER NOT NULL       -- auto-incremented per user
 *   blueprint_json JSONB NOT NULL         -- full merged state snapshot
 *   module_source VARCHAR(100)            -- which module last wrote ('market-research', etc.)
 *   domain VARCHAR(50)                    -- 'technical'|'business'|'creative'|'mixed'
 *   change_summary TEXT                   -- human-readable description
 *   created_at TIMESTAMP
 */

import { queryOne, query } from './index.js';

// ─── WRITE ────────────────────────────────────────────────────────────────────

/**
 * Insert a new blueprint version for a user.
 * Version number auto-increments: MAX(version_number) + 1 per user.
 * This is an append-only operation — we never UPDATE blueprint rows.
 *
 * @param {string} userId        users.external_id
 * @param {object} blueprintJson Full state snapshot to persist
 * @param {string} moduleSource  Which module triggered the save
 * @param {string} changeSummary Human-readable description of the change
 * @param {object} [opts]        { sessionId, domain }
 * @returns {Promise<{ id, version_number, created_at }>}
 */
export async function insertBlueprintVersion(
  userId,
  blueprintJson,
  moduleSource,
  changeSummary,
  { sessionId = null, domain = null } = {}
) {
  // Get next version number for this user atomically
  const versionResult = await queryOne(
    `SELECT COALESCE(MAX(version_number), 0) + 1 AS next_version
     FROM blueprints WHERE user_id = $1`,
    [userId]
  );
  const nextVersion = versionResult?.next_version ?? 1;

  const row = await queryOne(
    `INSERT INTO blueprints
       (user_id, session_id, version_number, blueprint_json, module_source, domain, change_summary, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
     RETURNING id, version_number, created_at`,
    [
      userId,
      sessionId,
      nextVersion,
      JSON.stringify(blueprintJson),
      moduleSource,
      domain,
      changeSummary,
    ]
  );

  console.log(
    `✓ Blueprint V${row.version_number} saved — user:${userId} module:${moduleSource}`
  );
  return row;
}

// ─── READ ─────────────────────────────────────────────────────────────────────

/**
 * Fetch the latest blueprint snapshot for a user.
 * Used at login to hydrate Zustand from PostgreSQL.
 *
 * @param {string} userId  users.external_id
 * @returns {Promise<{ id, version_number, blueprint_json, module_source, domain, created_at }|null>}
 */
export async function getLatestBlueprintByUserId(userId) {
  const row = await queryOne(
    `SELECT id, version_number, blueprint_json, module_source, domain, change_summary, created_at
     FROM blueprints
     WHERE user_id = $1
     ORDER BY version_number DESC
     LIMIT 1`,
    [userId]
  );

  if (!row) return null;

  return {
    ...row,
    // pg returns JSONB as an already-parsed object; guard for string fallback
    blueprint_json:
      typeof row.blueprint_json === 'string'
        ? JSON.parse(row.blueprint_json)
        : row.blueprint_json,
  };
}

/**
 * Fetch all blueprint versions for a user (metadata only, no JSONB payload).
 * Useful for history / version picker UI.
 *
 * @param {string} userId
 * @param {number} [limit=20]
 */
export async function getBlueprintHistoryByUserId(userId, limit = 20) {
  return await query(
    `SELECT id, version_number, module_source, domain, change_summary, created_at
     FROM blueprints
     WHERE user_id = $1
     ORDER BY version_number DESC
     LIMIT $2`,
    [userId, limit]
  );
}

/**
 * Fetch a specific blueprint version by ID.
 * @param {number} blueprintId
 */
export async function getBlueprintById(blueprintId) {
  const row = await queryOne(
    `SELECT id, user_id, version_number, blueprint_json, module_source, domain, change_summary, created_at
     FROM blueprints WHERE id = $1`,
    [blueprintId]
  );

  if (!row) return null;

  return {
    ...row,
    blueprint_json:
      typeof row.blueprint_json === 'string'
        ? JSON.parse(row.blueprint_json)
        : row.blueprint_json,
  };
}

/**
 * Count how many blueprint versions a user has saved.
 * Used for plan limits.
 * @param {string} userId
 */
export async function countBlueprintsByUserId(userId) {
  const result = await queryOne(
    `SELECT COUNT(*)::int AS count FROM blueprints WHERE user_id = $1`,
    [userId]
  );
  return result?.count ?? 0;
}

// ─── MERGE + SAVE (convenience) ───────────────────────────────────────────────

/**
 * Load latest snapshot, shallow-merge new partial data, save as new version.
 * This is the standard "module completed" write path.
 *
 * @param {string} userId
 * @param {object} partialData    Fields to merge into the latest snapshot
 * @param {string} moduleSource
 * @param {string} changeSummary
 * @param {object} [opts]         { sessionId, domain }
 */
export async function mergeAndInsertBlueprint(
  userId,
  partialData,
  moduleSource,
  changeSummary,
  opts = {}
) {
  const latest = await getLatestBlueprintByUserId(userId);
  const current = latest?.blueprint_json ?? {};

  const merged = { ...current, ...partialData };

  return await insertBlueprintVersion(userId, merged, moduleSource, changeSummary, opts);
}
