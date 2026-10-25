import { NextResponse } from "next/server";
import { z } from "zod";
import { db, platformSettings } from "@esa/db";
import { eq } from "drizzle-orm";
import { requireApiEsaAdmin, isResponse } from "@/lib/api";

import {
  DEFAULT_HERO,
  DEFAULT_FOOTER,
  DEFAULT_GOVERNANCE,
  DEFAULT_GALLERY,
} from "@/lib/settings-defaults";


export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");

  // Fetch all platform settings rows
  const rows = await db.query.platformSettings.findMany();
  const settingsMap: Record<string, any> = {};
  for (const r of rows) {
    try {
      settingsMap[r.key] = JSON.parse(r.value);
    } catch {
      settingsMap[r.key] = r.value;
    }
  }

  const hero = { ...DEFAULT_HERO, ...(settingsMap["hero"] || {}) };
  const footer = { ...DEFAULT_FOOTER, ...(settingsMap["footer"] || {}) };
  const governance = { ...DEFAULT_GOVERNANCE, ...(settingsMap["governance"] || {}) };
  const gallery = Array.isArray(settingsMap["gallery"]) ? settingsMap["gallery"] : DEFAULT_GALLERY;

  if (key === "hero") return NextResponse.json(hero);
  if (key === "footer") return NextResponse.json(footer);
  if (key === "governance") return NextResponse.json(governance);
  if (key === "gallery") return NextResponse.json(gallery);

  // Return full dictionary
  return NextResponse.json({
    hero,
    footer,
    governance,
    gallery,
    // Legacy top-level hero properties for backward compatibility
    ...hero,
  });
}

export async function POST(req: Request) {
  const admin = await requireApiEsaAdmin();
  if (isResponse(admin)) return admin;

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON input" }, { status: 400 });

  let targetKey = "hero";
  let targetValue: any = null;

  if (body.key && body.value !== undefined) {
    targetKey = String(body.key);
    targetValue = body.value;
  } else if (body.heroTitle) {
    targetKey = "hero";
    targetValue = body;
  } else {
    return NextResponse.json({ error: "Missing setting key or value" }, { status: 400 });
  }

  const valueStr = typeof targetValue === "string" ? targetValue : JSON.stringify(targetValue);

  const existing = await db.query.platformSettings.findFirst({
    where: eq(platformSettings.key, targetKey),
  });

  if (existing) {
    await db
      .update(platformSettings)
      .set({
        value: valueStr,
        updatedBy: admin.id,
        updatedAt: new Date(),
      })
      .where(eq(platformSettings.key, targetKey));
  } else {
    await db.insert(platformSettings).values({
      key: targetKey,
      value: valueStr,
      updatedBy: admin.id,
      updatedAt: new Date(),
    });
  }

  return NextResponse.json({ ok: true, key: targetKey, settings: targetValue });
}
