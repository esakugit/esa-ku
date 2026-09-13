import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const PROTECTED_PREFIXES = [
  "/profile",
  "/timetable",
  "/resources",
  "/notifications",
  "/admin",
  "/complete-profile",
];
const SESSION_COOKIE = "esa_session";

export async function middleware(req: NextRequest) {
  const isProtected = PROTECTED_PREFIXES.some((p) => req.nextUrl.pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    const secretKey = new TextEncoder().encode(process.env.SESSION_SECRET ?? "");
    await jwtVerify(token, secretKey);
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = {
  matcher: [
    "/profile/:path*",
    "/timetable/:path*",
    "/resources/:path*",
    "/notifications/:path*",
    "/admin/:path*",
    "/complete-profile/:path*",
  ],
};
