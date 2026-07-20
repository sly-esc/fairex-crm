import 'server-only';
import crypto from 'node:crypto';

// Format:
// {
//   v: 1,
//   alg: 'aes-256-gcm',
//   iv: string (hex),
//   tag: string (hex),
//   ct: string (hex)
// }

function getEncryptionKey(): Buffer {
  const raw = process.env.INTEGRATIONS_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error('INTEGRATIONS_ENCRYPTION_KEY no configurada en el servidor');
  }
  const buf = Buffer.from(raw, 'hex');
  if (buf.length !== 32) {
    throw new Error('INTEGRATIONS_ENCRYPTION_KEY debe ser de 32 bytes (64 caracteres hex)');
  }
  return buf;
}

export function isEncryptedCredentialsEnvelope(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  const env = value as Record<string, unknown>;
  return (
    env.v === 1 &&
    env.alg === 'aes-256-gcm' &&
    typeof env.iv === 'string' && env.iv.length > 0 &&
    typeof env.tag === 'string' && env.tag.length > 0 &&
    typeof env.ct === 'string' && env.ct.length > 0
  );
}

export function encryptCredentials(plainObj: Record<string, string>): Record<string, unknown> {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  
  const plaintext = JSON.stringify(plainObj);
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag();

  return {
    v: 1,
    alg: 'aes-256-gcm',
    iv: iv.toString('hex'),
    tag: tag.toString('hex'),
    ct: encrypted
  };
}

export function decryptCredentials(envelope: Record<string, unknown>): Record<string, string> {
  if (!isEncryptedCredentialsEnvelope(envelope)) {
    throw new Error('Formato de credenciales cifradas inválido');
  }

  const key = getEncryptionKey();
  const iv = Buffer.from(envelope.iv as string, 'hex');
  const tag = Buffer.from(envelope.tag as string, 'hex');
  const ct = envelope.ct as string;

  try {
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    let decrypted = decipher.update(ct, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
  } catch (err) {
    // Error genérico sin exponer detalles criptográficos
    throw new Error('Fallo al descifrar credenciales');
  }
}
