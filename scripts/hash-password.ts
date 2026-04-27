/**
 * Helper script to generate a bcrypt hash from a plaintext password.
 * Usage: npx tsx scripts/hash-password.ts <password>
 */

import bcrypt from 'bcrypt';

const password = process.argv[2];

if (!password) {
  console.error('Usage: npx tsx scripts/hash-password.ts <your-password>');
  process.exit(1);
}

const hash = await bcrypt.hash(password, 12);
console.log('\nGenerated bcrypt hash:\n');
console.log(hash);
console.log('\nAdd this to your .env file as:');
console.log(`AUTH_PASSWORD_HASH=${hash}\n`);
