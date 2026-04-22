let currentIndex = 0;
let keyStats = {}; // Track key usage and failures

// Initialize stats for tracking
function initKeyStats(keys) {
  keys.forEach(key => {
    if (!keyStats[key]) {
      keyStats[key] = { uses: 0, failures: 0, lastError: null };
    }
  });
}

export function getGeminiKey() {
  const keys = [];
  
  // Collect any numbered or plain GEMINI_API_KEY env variables
  for (const envKey of Object.keys(process.env)) {
    if (envKey.startsWith('GEMINI_API_KEY') && process.env[envKey]) {
      keys.push(process.env[envKey]);
    }
  }

  // Remove duplicates just in case
  const uniqueKeys = [...new Set(keys)].filter(Boolean);

  if (uniqueKeys.length === 0) {
    throw new Error("❌ No Gemini API keys found. Please set GEMINI_API_KEY_1, GEMINI_API_KEY_2, etc. in .env.local");
  }

  initKeyStats(uniqueKeys);

  // Round-robin selection (distributes load across keys)
  const key = uniqueKeys[currentIndex % uniqueKeys.length];
  currentIndex++;
  
  // Track usage
  keyStats[key].uses++;
  
  return key;
}

// For future enhancement: report key failure to enable smarter rotation
export function reportKeyFailure(key, error) {
  if (keyStats[key]) {
    keyStats[key].failures++;
    keyStats[key].lastError = error.message || String(error);
  }
}

// Get key statistics for monitoring
export function getKeyStats() {
  return keyStats;
}
