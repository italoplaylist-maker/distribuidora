import crypto from "node:crypto";

// Pure crypto helpers with no next/headers dependency, so they can be used
// both from Server Components/Actions (via impersonation.ts) and from
// proxy.ts, which reads/writes cookies through NextRequest/NextResponse
// instead of the next/headers cookie store.

export const IMPERSONATION_COOKIE_NAME = "impersonation";
export const IMPERSONATION_MAX_AGE_SECONDS = 4 * 60 * 60;

export interface ImpersonationPayload {
  adminId: string;
  adminName: string;
  companyId: string;
  userId: string;
  exp: number;
}

function getKey() {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET não configurado");
  return crypto.scryptSync(secret, "impersonation-cookie", 32);
}

export function encryptImpersonationToken(payload: ImpersonationPayload): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getKey(), iv);
  const json = Buffer.from(JSON.stringify(payload), "utf8");
  const ciphertext = Buffer.concat([cipher.update(json), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, ciphertext]).toString("base64url");
}

export function decryptImpersonationToken(token: string): ImpersonationPayload | null {
  try {
    const raw = Buffer.from(token, "base64url");
    const iv = raw.subarray(0, 12);
    const authTag = raw.subarray(12, 28);
    const ciphertext = raw.subarray(28);
    const decipher = crypto.createDecipheriv("aes-256-gcm", getKey(), iv);
    decipher.setAuthTag(authTag);
    const json = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
    const payload = JSON.parse(json) as ImpersonationPayload;
    if (typeof payload.exp !== "number" || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}
