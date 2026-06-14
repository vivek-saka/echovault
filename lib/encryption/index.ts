/**
 * EchoVault Client-Side Encryption
 *
 * End-to-end encryption using the WebCrypto API.
 * The server NEVER sees plaintext content — only encrypted ciphertext.
 *
 * Flow:
 *  1. Derive a per-user key from their password + a salt (PBKDF2)
 *  2. Encrypt document content with AES-GCM (256-bit key)
 *  3. Store ciphertext + IV + salt as a single base64 blob
 */

const PBKDF2_ITERATIONS = 310_000; // OWASP 2023 recommendation
const KEY_LENGTH        = 256;
const ALGORITHM         = "AES-GCM";

// ─── Key Derivation ───────────────────────────────────────────────────────────

/**
 * Derives an AES-GCM CryptoKey from a user's password and a salt.
 * Used to create a stable per-user encryption key.
 */
export async function deriveKey(
  password: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const encoder  = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name:       "PBKDF2",
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash:       "SHA-256",
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ["encrypt", "decrypt"]
  );
}

// ─── Encrypt ──────────────────────────────────────────────────────────────────

/**
 * Encrypts a plaintext string and returns a base64-encoded blob
 * containing: [salt (16 bytes)] + [iv (12 bytes)] + [ciphertext]
 */
export async function encryptContent(
  plaintext: string,
  password: string
): Promise<string> {
  const encoder = new TextEncoder();
  const salt    = crypto.getRandomValues(new Uint8Array(16));
  const iv      = crypto.getRandomValues(new Uint8Array(12));
  const key     = await deriveKey(password, salt);

  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    encoder.encode(plaintext)
  );

  // Pack: salt (16) + iv (12) + ciphertext
  const combined = new Uint8Array(16 + 12 + ciphertext.byteLength);
  combined.set(salt, 0);
  combined.set(iv, 16);
  combined.set(new Uint8Array(ciphertext), 28);

  return btoa(String.fromCharCode(...combined));
}

// ─── Decrypt ──────────────────────────────────────────────────────────────────

/**
 * Decrypts a base64 blob produced by encryptContent.
 * Returns the original plaintext string.
 */
export async function decryptContent(
  ciphertextBase64: string,
  password: string
): Promise<string> {
  const combined = Uint8Array.from(atob(ciphertextBase64), (c) =>
    c.charCodeAt(0)
  );

  const salt       = combined.slice(0, 16);
  const iv         = combined.slice(16, 28);
  const ciphertext = combined.slice(28);

  const key = await deriveKey(password, salt);

  const decrypted = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    key,
    ciphertext
  );

  return new TextDecoder().decode(decrypted);
}

// ─── Key Export/Import (for sharing keys with collaborators) ─────────────────

/**
 * Exports a CryptoKey as a raw base64 string for safe storage.
 */
export async function exportKey(key: CryptoKey): Promise<string> {
  const raw = await crypto.subtle.exportKey("raw", key);
  return btoa(String.fromCharCode(...new Uint8Array(raw)));
}

/**
 * Imports a raw base64 key back into a CryptoKey for use.
 */
export async function importKey(base64Key: string): Promise<CryptoKey> {
  const raw = Uint8Array.from(atob(base64Key), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey(
    "raw",
    raw,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ["encrypt", "decrypt"]
  );
}

// ─── Utility ──────────────────────────────────────────────────────────────────

/** Generates a cryptographically random document encryption key */
export async function generateDocumentKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    { name: ALGORITHM, length: KEY_LENGTH },
    true,
    ["encrypt", "decrypt"]
  );
}

/** Checks if a string looks like it could be an encrypted blob */
export function isEncrypted(content: string): boolean {
  if (!content || content.length < 50) return false;
  try {
    const decoded = atob(content);
    return decoded.length >= 28;
  } catch {
    return false;
  }
}
