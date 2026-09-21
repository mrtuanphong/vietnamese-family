import crypto from "crypto";

export type UserRole = "member" | "admin" | "super_admin";

/**
 * Normalizes Vietnamese phone number variations:
 * - 0982997991
 * - +84982997991
 * - 84982997991
 * Also removes spaces, dashes, dots, parentheses.
 * Returns standard 10-digit Vietnamese format (e.g. 0982997991).
 */
export function normalizePhone(raw: string): string {
  if (!raw) return "";
  let cleaned = raw.replace(/[\s.\-()]/g, "").trim();

  if (cleaned.startsWith("+84")) {
    cleaned = "0" + cleaned.slice(3);
  } else if (cleaned.startsWith("84") && cleaned.length >= 11) {
    cleaned = "0" + cleaned.slice(2);
  }

  return cleaned;
}

/**
 * Securely hashes a password using Node.js crypto.scryptSync with a random 16-byte salt.
 * Formatted as "salt:hash"
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

/**
 * Verifies a plain text password against a stored "salt:hash" string using timingSafeEqual.
 */
export function verifyPassword(password: string, combined: string | null | undefined): boolean {
  if (!combined || !combined.includes(":")) return false;
  const [salt, storedHash] = combined.split(":");
  if (!salt || !storedHash) return false;
  try {
    const testHash = crypto.scryptSync(password, salt, 64).toString("hex");
    return crypto.timingSafeEqual(Buffer.from(storedHash, "hex"), Buffer.from(testHash, "hex"));
  } catch {
    return false;
  }
}

export interface AuthSessionData {
  granted: boolean;
  role?: UserRole;
  name?: string;
  personId?: string;
  phone?: string;
  editablePersonIds?: string[];
  canEditClan?: boolean;
  canEditTree?: boolean;
  error?: string;
}
