// Script to encode a password for use in auth.ts
// Usage: node scripts/encode-password.js "your-password"

const OBFUSCATION_KEY = 'rocscience-reviews-2025';

function xorWithKey(str, key) {
  let result = '';
  for (let i = 0; i < str.length; i++) {
    result += String.fromCharCode(str.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return result;
}

function encodePassword(password) {
  const xored = xorWithKey(password, OBFUSCATION_KEY);
  return Buffer.from(xored).toString('base64');
}

const password = process.argv[2];
if (!password) {
  console.log('Usage: node scripts/encode-password.js "your-password"');
  process.exit(1);
}

const encoded = encodePassword(password);
console.log('\nEncoded password:');
console.log(encoded);
console.log('\nAdd this to lib/auth.ts as OBFUSCATED_DEFAULT_PASSWORD');

