/**
 * Tool Loader — Imports all tool registrations
 * Call this once on app startup to register all available tools
 */

export async function loadAllTools() {
  // Import all tool modules (they auto-register on import)
  await import('./tools/refinementTools.js');
  await import('./tools/stackTools.js');
  
  console.log('✓ All tools loaded and registered');
}
