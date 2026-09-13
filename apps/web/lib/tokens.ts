import { randomBytes } from "crypto";

export function generateToken(): string {
  return randomBytes(32).toString("hex");
}

export function tokenExpiry(hoursFromNow: number): Date {
  return new Date(Date.now() + hoursFromNow * 60 * 60 * 1000);
}
