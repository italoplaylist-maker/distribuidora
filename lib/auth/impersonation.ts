import "server-only";
import { cookies } from "next/headers";
import {
  IMPERSONATION_COOKIE_NAME,
  IMPERSONATION_MAX_AGE_SECONDS,
  encryptImpersonationToken,
  decryptImpersonationToken,
  type ImpersonationPayload,
} from "@/lib/auth/impersonation-token";

/** Starts an impersonation session — only ever call this after requireSuperAdmin() has authorized the caller. */
export async function startImpersonation(params: { adminId: string; adminName: string; companyId: string; userId: string }) {
  const token = encryptImpersonationToken({ ...params, exp: Date.now() + IMPERSONATION_MAX_AGE_SECONDS * 1000 });
  const store = await cookies();
  store.set(IMPERSONATION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: IMPERSONATION_MAX_AGE_SECONDS,
  });
}

export async function getImpersonation(): Promise<ImpersonationPayload | null> {
  const store = await cookies();
  const token = store.get(IMPERSONATION_COOKIE_NAME)?.value;
  if (!token) return null;
  return decryptImpersonationToken(token);
}

export async function clearImpersonation() {
  const store = await cookies();
  store.delete(IMPERSONATION_COOKIE_NAME);
}
