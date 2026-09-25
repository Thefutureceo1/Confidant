/**
 * Zero-Knowledge Client-Side Encryption
 * Using Web Crypto API (AES-256-GCM + PBKDF2)
 * Plaintext secrets are NEVER transmitted to the server or database.
 */

// Helper to convert Uint8Array / ArrayBuffer to Base64
export function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Helper to convert Base64 string to Uint8Array with ArrayBuffer backing
export function base64ToBuffer(base64: string): Uint8Array {
  const binary = window.atob(base64);
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Generate a random cryptographic salt for workspace key derivation (16 bytes, hex encoded)
 */
export function generateSalt(): string {
  const saltBytes = new Uint8Array(16);
  window.crypto.getRandomValues(saltBytes);
  return Array.from(saltBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Derives an AES-256-GCM CryptoKey from a user passphrase and workspace salt using PBKDF2.
 */
export async function deriveKey(password: string, salt: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  
  // Import the password as raw key material
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  // Derive AES-GCM 256-bit key
  const saltBuffer = enc.encode(salt);
  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    {
      name: 'AES-GCM',
      length: 256,
    },
    false, // extractable: false for security
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Generates a fresh 12-byte initialization vector (IV) for each encryption operation.
 * Returns Base64 ciphertext and Base64 IV.
 */
export async function encrypt(
  plaintext: string,
  key: CryptoKey
): Promise<{ ciphertext: string; iv: string }> {
  const enc = new TextEncoder();
  const encodedPlaintext = enc.encode(plaintext);

  // Standard 96-bit (12-byte) IV for AES-GCM
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    encodedPlaintext
  );

  return {
    ciphertext: bufferToBase64(encryptedBuffer),
    iv: bufferToBase64(iv),
  };
}

/**
 * Decrypts a Base64 ciphertext and Base64 IV using AES-256-GCM.
 * Returns the original UTF-8 plaintext.
 */
export async function decrypt(
  ciphertext: string,
  iv: string,
  key: CryptoKey
): Promise<string> {
  const ciphertextBuffer = base64ToBuffer(ciphertext);
  const ivBuffer = base64ToBuffer(iv);

  try {
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: ivBuffer as unknown as BufferSource,
      },
      key,
      ciphertextBuffer as unknown as BufferSource
    );

    const dec = new TextDecoder();
    return dec.decode(decryptedBuffer);
  } catch (err) {
    throw new Error('Decryption failed. Invalid passphrase or corrupted secret payload.');
  }
}

/**
 * Verify whether a derived key is valid against a test canary block
 */
export async function createKeyCanary(key: CryptoKey): Promise<{ ciphertext: string; iv: string }> {
  return encrypt('__CONFIDANT_VALID_SESSION__', key);
}

export async function verifyKeyCanary(
  canaryCiphertext: string,
  canaryIv: string,
  key: CryptoKey
): Promise<boolean> {
  try {
    const text = await decrypt(canaryCiphertext, canaryIv, key);
    return text === '__CONFIDANT_VALID_SESSION__' || text === '__ENVAULT_VALID_SESSION__';
  } catch {
    return false;
  }
}
