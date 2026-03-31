let currentIndex = 0;

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
    throw new Error("No Gemini API keys found. Please set GEMINI_API_KEY_1, GEMINI_API_KEY_2, etc. in .env.local");
  }

  // Round-robin selection
  const key = uniqueKeys[currentIndex % uniqueKeys.length];
  currentIndex++;
  
  return key;
}
