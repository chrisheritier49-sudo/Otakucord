/**
 * Input validation utilities
 * Prevents injection attacks and malformed requests
 */

export function isValidBase64(str: string): boolean {
  if (!str || typeof str !== 'string') return false;
  try {
    return Buffer.from(str, 'base64').toString('base64') === str;
  } catch {
    return false;
  }
}

export function validateFileSize(base64: string, maxSizeMB: number = 100): boolean {
  // Rough estimation: base64 is ~1.33x larger than binary
  const sizeInBytes = Buffer.byteLength(base64, 'utf8') * 0.75;
  const sizeInMB = sizeInBytes / (1024 * 1024);
  return sizeInMB <= maxSizeMB;
}

export function sanitizeLanguageCode(code: string): 'en' | 'ja' | 'es' | 'fr' | null {
  const valid = ['en', 'ja', 'es', 'fr'];
  return valid.includes(code) ? (code as any) : null;
}

export function sanitizeText(text: string, maxLength: number = 5000): string {
  if (!text || typeof text !== 'string') return '';
  return text.trim().substring(0, maxLength);
}

export function isValidJSON(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

export function validateChatMessage(message: string): boolean {
  const sanitized = sanitizeText(message);
  return sanitized.length > 0 && sanitized.length <= 5000;
}
