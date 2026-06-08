/**
 * src/lib/db/users.js
 * User DB helpers — thin wrappers over pg.Pool via query/queryOne.
 * Database-first. Raw SQL only. No ORM.
 *
 * Table: users
 *   id SERIAL PRIMARY KEY
 *   external_id VARCHAR(255) UNIQUE NOT NULL   -- OAuth subject or email
 *   email VARCHAR(255) UNIQUE NOT NULL
 *   name VARCHAR(255)
 *   plan VARCHAR(50) DEFAULT 'free'
 *   blueprint_count INTEGER DEFAULT 0
 *   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
 */

import { queryOne, query } from './index.js';

// ─── UPSERT ───────────────────────────────────────────────────────────────────

/**
 * Get existing user or create new one on first login.
 * Called from NextAuth signIn callback — must be idempotent.
 *
 * @param {string} externalId  OAuth subject id or email for credentials provider
 * @param {string} email
 * @param {string|null} name
 * @returns {Promise<{ id, external_id, email, name, plan, blueprint_count }>}
 */
export async function getOrCreateUser(externalId, email, name = null) {
  // 1. Try fetch
  const existing = await queryOne(
    `SELECT id, external_id, email, name, plan, blueprint_count
     FROM users WHERE external_id = $1`,
    [externalId]
  );
  if (existing) return existing;

  // 2. Create (handle race condition with ON CONFLICT)
  const created = await queryOne(
    `INSERT INTO users (external_id, email, name, plan, blueprint_count, created_at)
     VALUES ($1, $2, $3, 'free', 0, CURRENT_TIMESTAMP)
     ON CONFLICT (external_id) DO UPDATE
       SET email = EXCLUDED.email,
           name  = COALESCE(users.name, EXCLUDED.name)
     RETURNING id, external_id, email, name, plan, blueprint_count`,
    [externalId, email, name]
  );

  console.log(`✓ User upserted: ${created.external_id} (${created.email})`);
  return created;
}

// ─── READ ─────────────────────────────────────────────────────────────────────

/**
 * Fetch user by external_id.
 * @param {string} externalId
 */
export async function getUserByExternalId(externalId) {
  return await queryOne(
    `SELECT id, external_id, email, name, plan, blueprint_count, created_at
     FROM users WHERE external_id = $1`,
    [externalId]
  );
}

/**
 * Fetch user by email.
 * @param {string} email
 */
export async function getUserByEmail(email) {
  return await queryOne(
    `SELECT id, external_id, email, name, plan, blueprint_count, created_at
     FROM users WHERE email = $1`,
    [email]
  );
}

// ─── UPDATE ───────────────────────────────────────────────────────────────────

/**
 * Increment the blueprint_count counter for a user.
 * Called each time a new blueprint version is inserted.
 * @param {string} externalId
 */
export async function incrementBlueprintCount(externalId) {
  return await queryOne(
    `UPDATE users
     SET blueprint_count = blueprint_count + 1
     WHERE external_id = $1
     RETURNING blueprint_count`,
    [externalId]
  );
}

/**
 * Update user's plan (e.g. 'free' -> 'pro').
 * @param {string} externalId
 * @param {'free'|'pro'|'team'} plan
 */
export async function updateUserPlan(externalId, plan) {
  return await queryOne(
    `UPDATE users SET plan = $1 WHERE external_id = $2
     RETURNING id, external_id, plan`,
    [plan, externalId]
  );
}
