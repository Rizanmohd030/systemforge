import { query } from './src/lib/db/index.js';

async function run() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS blueprint_exports (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        blueprint_id INTEGER,
        format VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("Table blueprint_exports created successfully.");
  } catch (err) {
    console.error("Error creating table:", err);
  }
  process.exit(0);
}

run();
