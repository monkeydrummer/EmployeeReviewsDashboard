// Authentication utilities
// Obfuscated password authentication for admin
// Email-based authentication for employees and managers

const OBFUSCATION_KEY = 'rocscience-reviews-2025';

// This is the obfuscated version of the default password: "reviews2025"
// To change the password, run: node scripts/encode-password.js "your-new-password"
const OBFUSCATED_DEFAULT_PASSWORD = 'GgUHEggcBhBaXFdQ';

/**
 * Decode an obfuscated password string
 */
function decodePassword(obfuscated: string): string {
  try {
    const decoded = Buffer.from(obfuscated, 'base64').toString();
    return xorWithKey(decoded, OBFUSCATION_KEY);
  } catch (error) {
    console.error('Failed to decode password');
    return '';
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
 * Encode a password (for generating obfuscated passwords)
 */
export function encodePassword(password: string): string {
  const xored = xorWithKey(password, OBFUSCATION_KEY);
  return Buffer.from(xored).toString('base64');
}

/**
 * Verify if a password matches the default or environment password (Admin)
 */
export function verifyAdminPassword(inputPassword: string): boolean {
  // Check against obfuscated default password
  const defaultPassword = decodePassword(OBFUSCATED_DEFAULT_PASSWORD);
  if (inputPassword === defaultPassword) {
    return true;
  }
  
  // Check against environment variable (if set)
  const envPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;
  if (envPassword && inputPassword === envPassword) {
    return true;
  }
  
  return false;
}

/**
 * Simple email validation
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

