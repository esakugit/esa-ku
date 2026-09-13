import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { env } from "./env";

const SESSION_COOKIE = "esa_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 30; // 30 days

const secretKey = new TextEncoder().encode(env.SESSION_SECRET);

export type SessionPayload = {
  userId: number;
  role: string;
};

/** Signs a session JWT and sets it as an httpOnly cookie. */
export async function createSession(payload: SessionPayload): Promise<void> {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(secretKey);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

/** Reads and verifies the session cookie, if any. Returns null when absent/invalid. */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secretKey);
    if (typeof payload.userId !== "number" || typeof payload.role !== "string") {
      return null;
    }
    return { userId: payload.userId, role: payload.role };
  } catch {
    // expired or tampered — treat as signed out rather than throwing
    return null;
  }
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
