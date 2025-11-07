// Simple obfuscation utility for ratings
// Note: This is obfuscation, not encryption. It prevents casual viewing in the repo.

const OBFUSCATION_KEY = 'rocscience-reviews-2025';

/**
 * Encodes ratings object to an obfuscated string
 */
export function encodeRatings(ratings: Record<string, any>): string {
  const json = JSON.stringify(ratings);
  const encoded = Buffer.from(json).toString('base64');
  
  // XOR with key for additional obfuscation
  const xored = xorWithKey(encoded, OBFUSCATION_KEY);
  return Buffer.from(xored).toString('base64');
}

/**
 * Decodes an obfuscated string back to ratings object
 */
export function decodeRatings(obfuscated: string): Record<string, any> {
  try {
    const decoded = Buffer.from(obfuscated, 'base64').toString();
    const unxored = xorWithKey(decoded, OBFUSCATION_KEY);
    const json = Buffer.from(unxored, 'base64').toString();
    return JSON.parse(json);
  } catch (error) {
    console.error('Failed to decode ratings:', error);
    // Return empty object if decoding fails
    return {};
  }
}

/**
 * XOR string with key for simple encryption
 */
function xorWithKey(str: string, key: string): string {
  let result = '';
  for (let i = 0; i < str.length; i++) {
    result += String.fromCharCode(str.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return result;
}

/**
 * Check if a value is an obfuscated string (base64) or a plain ratings object
 */
export function isObfuscated(value: any): boolean {
  return typeof value === 'string';
}

