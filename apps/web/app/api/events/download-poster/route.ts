import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const imageUrl = searchParams.get("url");
  const title = searchParams.get("title") || "ESA-Event";

  if (!imageUrl) {
    return NextResponse.json({ error: "Image URL is required" }, { status: 400 });
  }

  try {
    // Resolve absolute URL whether imageUrl is relative or already absolute
    const targetUrl = imageUrl.startsWith("http")
      ? imageUrl
      : new URL(imageUrl, req.url).toString();

    const response = await fetch(targetUrl);
    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch image: status ${response.status}` },
        { status: 404 }
      );
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    const rawBuffer = await response.arrayBuffer();

    // Determine clean file extension
    let ext = "jpg";
    if (contentType.includes("png")) ext = "png";
    else if (contentType.includes("webp")) ext = "webp";
    else if (contentType.includes("svg")) ext = "svg";
    else if (contentType.includes("jpeg") || contentType.includes("jpg")) ext = "jpg";

    // Clean filename for students sharing across WhatsApp, Telegram, etc.
    const sanitizedTitle = title
      .trim()
      .replace(/[^a-zA-Z0-9_\s-]/g, "")
      .replace(/\s+/g, "_")
      .slice(0, 60);

    const filename = `ESA_KU_${sanitizedTitle || "Event"}_Poster.${ext}`;

    return new NextResponse(new Uint8Array(rawBuffer), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    });
  } catch (error) {
    console.error("[DownloadPoster] Failed to stream image:", error);
    return NextResponse.json(
      { error: "Could not download image. Please try again." },
      { status: 500 }
    );
  }
}
