/**
 * generate-vapid-keys.mjs
 * Generates a VAPID key pair (P-256) using Node.js built-in WebCrypto.
 *
 * Usage:
 *   node scripts/generate-vapid-keys.mjs
 *
 * Copy the output into:
 *   .env                    → VITE_VAPID_PUBLIC_KEY=<publicKey>
 *   Supabase edge secrets   → VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT
 */

import { webcrypto } from 'node:crypto';

const { subtle } = webcrypto;

function toBase64Url(buffer) {
  return Buffer.from(buffer)
    .toString('base64')
    .replace(/=/g,  '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

const keyPair = await subtle.generateKey(
  { name: 'ECDH', namedCurve: 'P-256' },
  true,
  ['deriveKey', 'deriveBits'],
);

const [publicKeyRaw, privateKeyPkcs8] = await Promise.all([
  subtle.exportKey('raw',   keyPair.publicKey),
  subtle.exportKey('pkcs8', keyPair.privateKey),
]);

// Extract the raw 32-byte private key from PKCS8 (bytes 36–68)
const pkcs8Bytes  = new Uint8Array(privateKeyPkcs8);
const privateRaw  = pkcs8Bytes.slice(36, 68);

const publicB64   = toBase64Url(publicKeyRaw);
const privateB64  = toBase64Url(privateRaw);

console.log('\n── VAPID Keys ──────────────────────────────────────────────────────────\n');
console.log('Add to  .env :');
console.log(`  VITE_VAPID_PUBLIC_KEY=${publicB64}\n`);
console.log('Add to  Supabase Edge Functions secrets (dashboard → Settings → Edge Functions):');
console.log(`  VAPID_PUBLIC_KEY=${publicB64}`);
console.log(`  VAPID_PRIVATE_KEY=${privateB64}`);
console.log('  VAPID_SUBJECT=mailto:your@email.com\n');
console.log('────────────────────────────────────────────────────────────────────────\n');
