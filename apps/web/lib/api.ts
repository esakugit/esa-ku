import "server-only";
import { NextResponse } from "next/server";
import { getCurrentUser, type CurrentUser } from "./auth";
import { isEsaAdmin } from "./roles";

/** Route-handler guard: resolves the signed-in user or returns a 401 response. */
export async function requireApiUser(): Promise<CurrentUser | NextResponse> {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });
  if (!user.emailVerifiedAt) {
    return NextResponse.json({ error: "Please verify your email first." }, { status: 403 });
  }
  return user;
}

/** Route-handler guard: resolves the signed-in user, requiring ESA admin access. */
export async function requireApiEsaAdmin(): Promise<CurrentUser | NextResponse> {
  const result = await requireApiUser();
  if (result instanceof NextResponse) return result;
  if (!isEsaAdmin(result)) {
    return NextResponse.json({ error: "ESA admin access required." }, { status: 403 });
  }
  return result;
}

export function isResponse(x: unknown): x is NextResponse {
  return x instanceof NextResponse;
}
