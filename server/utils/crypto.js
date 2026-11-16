import crypto from 'crypto';

// Master Secret Key for reversible AES-256 vault encryption (only decryptable by the server for the coordinator)
const MASTER_SECRET = process.env.ADMIN_VAULT_SECRET || 'ccs_lead_coordinator_secure_vault_master_key_2026';
const KEY = crypto.scryptSync(MASTER_SECRET, 'ccs_society_salt', 32);

/**
 * Encrypts a plaintext password into an AES-256-CBC cipher with random IV
 * Result format: "ivHex:cipherHex"
 */
export function encryptPassword(plainText) {
  if (!plainText) return '';
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', KEY, iv);
  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

/**
 * Decrypts an AES-256-CBC cipher back to plaintext for the authorized coordinator
 */
export function decryptPassword(cipherPayload) {
  if (!cipherPayload || !cipherPayload.includes(':')) return '';
  try {
    const [ivHex, encryptedHex] = cipherPayload.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', KEY, iv);
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error.message);
    return '••••••••';
  }
}
