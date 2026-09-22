/**
 * Renders high-resolution 300 DPI membership cards to HTML5 Canvas
 * and generates downloadable PNG blobs for offline saving, sharing,
 * or printing.
 */

export type CardCanvasOptions = {
  fullName: string;
  badgeNumber: string | null;
  hasActiveBadge: boolean;
  regNo?: string | null;
  style?: "signature" | "executive";
};

function formatSpaced(badgeNumber: string | null): string {
  if (!badgeNumber) return "E S A - 0 0 0 0";
  const upper = badgeNumber.trim().toUpperCase();
  return upper
    .split("")
    .join(" ")
    .replace(/\s+-\s+/g, " - ")
    .replace(/\s+\/\s+/g, " / ");
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

export async function generateCardCanvas(options: CardCanvasOptions): Promise<HTMLCanvasElement> {
  const width = 1040;
  const height = 656;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get 2D canvas context");

  // 1. Base card rounded clip
  ctx.save();
  ctx.beginPath();
  if (typeof (ctx as unknown as { roundRect?: unknown }).roundRect === "function") {
    (ctx as unknown as { roundRect: (x: number, y: number, w: number, h: number, r: number) => void }).roundRect(0, 0, width, height, 36);
  } else {
    ctx.rect(0, 0, width, height);
  }
  ctx.clip();

  // 2. Background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, "#080c14");
  bgGrad.addColorStop(0.5, "#0c111c");
  bgGrad.addColorStop(1, "#0f172a");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Subtle carbon dot pattern
  ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
  for (let x = 8; x < width; x += 20) {
    for (let y = 8; y < height; y += 20) {
      ctx.beginPath();
      ctx.arc(x, y, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 3. Cybernetic glow ribbons
  const ribbonGrad = ctx.createLinearGradient(0, 440, width, height);
  ribbonGrad.addColorStop(0, "rgba(2, 132, 199, 0.45)");
  ribbonGrad.addColorStop(0.6, "rgba(15, 118, 110, 0.3)");
  ribbonGrad.addColorStop(1, "rgba(12, 16, 23, 0)");

  ctx.fillStyle = ribbonGrad;
  ctx.beginPath();
  ctx.moveTo(0, height);
  ctx.quadraticCurveTo(240, 440, 520, 530);
  ctx.quadraticCurveTo(800, 620, width, 460);
  ctx.lineTo(width, height);
  ctx.closePath();
  ctx.fill();

  // Glowing cyan curves
  ctx.strokeStyle = "rgba(56, 189, 248, 0.75)";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(0, height - 40);
  ctx.quadraticCurveTo(300, 460, 560, 550);
  ctx.quadraticCurveTo(820, 640, width, 480);
  ctx.stroke();

  // Dashed accent line
  ctx.strokeStyle = "rgba(0, 210, 255, 0.5)";
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 8]);
  ctx.beginPath();
  ctx.moveTo(0, height - 70);
  ctx.quadraticCurveTo(280, 430, 540, 520);
  ctx.quadraticCurveTo(800, 610, width, 450);
  ctx.stroke();
  ctx.setLineDash([]);

  // Top right curves
  ctx.strokeStyle = "rgba(56, 189, 248, 0.6)";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(620, 0);
  ctx.quadraticCurveTo(780, 110, width, 70);
  ctx.stroke();

  ctx.strokeStyle = "rgba(0, 210, 255, 0.4)";
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(700, 0);
  ctx.quadraticCurveTo(840, 90, width, 44);
  ctx.stroke();

  // 4. Large Wireframe Watermark (Center-Right)
  try {
    const watermarkImg = await loadImage("/brand/esa-wireframe-badge.svg");
    ctx.save();
    ctx.globalAlpha = 0.28;
    ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
    ctx.shadowBlur = 24;
    const wmSize = 460;
    ctx.drawImage(watermarkImg, width - wmSize + 30, (height - wmSize) / 2 + 10, wmSize, wmSize);
    ctx.restore();
  } catch (err) {
    console.warn("Watermark load fallback:", err);
  }

  // 5. Header: ENGINEERING STUDENTS' ASSOCIATION
  ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
  ctx.font = "900 17px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText("ENGINEERING STUDENTS'", 48, 56);
  ctx.fillText("ASSOCIATION", 48, 78);

  // Center: ESA Logo Crest
  try {
    const logoImg = await loadImage("/brand/logo.png");
    const logoW = 90;
    const logoH = 52;
    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
    ctx.shadowBlur = 8;
    ctx.drawImage(logoImg, (width - logoW) / 2, 38, logoW, logoH);
    ctx.restore();
  } catch (err) {
    console.warn("Logo load fallback:", err);
  }

  // Right: Status Chip
  const statusX = width - 150;
  const statusY = 42;
  const statusW = 102;
  const statusH = 30;
  ctx.beginPath();
  if (typeof (ctx as unknown as { roundRect?: unknown }).roundRect === "function") {
    (ctx as unknown as { roundRect: (x: number, y: number, w: number, h: number, r: number) => void }).roundRect(statusX, statusY, statusW, statusH, 15);
  } else {
    ctx.rect(statusX, statusY, statusW, statusH);
  }
  ctx.fillStyle = options.hasActiveBadge ? "rgba(16, 185, 129, 0.2)" : "rgba(245, 158, 11, 0.2)";
  ctx.fill();
  ctx.strokeStyle = options.hasActiveBadge ? "rgba(52, 211, 153, 0.4)" : "rgba(251, 191, 36, 0.4)";
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Status dot & text
  ctx.beginPath();
  ctx.arc(statusX + 18, statusY + 15, 3.5, 0, Math.PI * 2);
  ctx.fillStyle = options.hasActiveBadge ? "#34d399" : "#fbbf24";
  ctx.fill();

  ctx.fillStyle = options.hasActiveBadge ? "#6ee7b7" : "#fcd34d";
  ctx.font = "bold 13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText(options.hasActiveBadge ? "Verified" : "Inactive", statusX + 28, statusY + 20);

  // 6. Title: MEMBERSHIP CARD
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 38px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.7)";
  ctx.shadowBlur = 10;
  ctx.fillText("MEMBERSHIP CARD", 48, 175);
  ctx.restore();

  // 7. MEMBER NAME
  ctx.fillStyle = "rgba(203, 213, 225, 0.9)";
  ctx.font = "800 13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText("MEMBER NAME", 52, 228);

  const totalRowW = width - 96;
  const numPillGap = 16;
  // Left column width matches col-span-7 of a 12-col grid (7/12)
  const leftColW = (totalRowW - numPillGap) * (7 / 12);
  const rightColW = (totalRowW - numPillGap) * (5 / 12);
  const numPillRightX = 48 + leftColW + numPillGap;

  // White pill container for Member Name (matches left column width, ~58% of row)
  const namePillY = 242;
  const namePillH = 68;
  const namePillW = leftColW;
  ctx.save();
  ctx.beginPath();
  if (typeof (ctx as unknown as { roundRect?: unknown }).roundRect === "function") {
    (ctx as unknown as { roundRect: (x: number, y: number, w: number, h: number, r: number) => void }).roundRect(48, namePillY, namePillW, namePillH, 34);
  } else {
    ctx.rect(48, namePillY, namePillW, namePillH);
  }
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = 4;
  ctx.fill();
  ctx.restore();

  // Text inside Member Name pill - centered
  ctx.fillStyle = "#0f172a";
  ctx.font = "900 22px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.textAlign = "center";
  const nameDisplay = (options.fullName || "STUDENT MEMBER").toUpperCase();
  ctx.fillText(nameDisplay, 48 + namePillW / 2, namePillY + 42);
  ctx.textAlign = "left";

  // 8. MEMBER NUMBER
  ctx.fillStyle = "rgba(203, 213, 225, 0.9)";
  ctx.font = "800 13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText("MEMBER NUMBER", 52, 350);

  // Dual pills for Member Number and ESA-KU
  const numPillY = 364;
  const numPillH = 68;
  const numPillLeftW = leftColW;
  const numPillRightW = rightColW;

  // Left Member Number Pill
  ctx.save();
  ctx.beginPath();
  if (typeof (ctx as unknown as { roundRect?: unknown }).roundRect === "function") {
    (ctx as unknown as { roundRect: (x: number, y: number, w: number, h: number, r: number) => void }).roundRect(48, numPillY, numPillLeftW, numPillH, 34);
  } else {
    ctx.rect(48, numPillY, numPillLeftW, numPillH);
  }
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = 4;
  ctx.fill();
  ctx.restore();

  // Spaced member number
  const spacedNumber = formatSpaced(options.badgeNumber);
  ctx.fillStyle = "#0f172a";
  ctx.font = "900 22px 'Courier New', Courier, monospace";
  ctx.textAlign = "center";
  ctx.fillText(spacedNumber, 48 + numPillLeftW / 2, numPillY + 42);

  // Right ESA-KU Pill
  ctx.save();
  ctx.beginPath();
  if (typeof (ctx as unknown as { roundRect?: unknown }).roundRect === "function") {
    (ctx as unknown as { roundRect: (x: number, y: number, w: number, h: number, r: number) => void }).roundRect(numPillRightX, numPillY, numPillRightW, numPillH, 34);
  } else {
    ctx.rect(numPillRightX, numPillY, numPillRightW, numPillH);
  }
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = 4;
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = "#0f172a";
  ctx.font = "900 22px 'Courier New', Courier, monospace";
  ctx.textAlign = "center";
  ctx.fillText("E S A - K U", numPillRightX + numPillRightW / 2, numPillY + 42);
  ctx.textAlign = "left";

  // 9. Bottom Seal: I'M A PROUD MEMBER
  const sealW = 260;
  const sealH = 42;
  const sealX = (width - sealW) / 2;
  const sealY = 560;

  ctx.save();
  ctx.beginPath();
  if (typeof (ctx as unknown as { roundRect?: unknown }).roundRect === "function") {
    (ctx as unknown as { roundRect: (x: number, y: number, w: number, h: number, r: number) => void }).roundRect(sealX, sealY, sealW, sealH, 21);
  } else {
    ctx.rect(sealX, sealY, sealW, sealH);
  }
  ctx.fillStyle = "rgba(0, 0, 0, 0.95)";
  ctx.fill();
  ctx.strokeStyle = "rgba(100, 116, 139, 0.8)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = "#ffffff";
  ctx.font = "900 14px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("I'M A PROUD MEMBER", width / 2, sealY + 26);
  ctx.textAlign = "left";

  // 10. Outer card hairline border
  ctx.beginPath();
  if (typeof (ctx as unknown as { roundRect?: unknown }).roundRect === "function") {
    (ctx as unknown as { roundRect: (x: number, y: number, w: number, h: number, r: number) => void }).roundRect(1, 1, width - 2, height - 2, 35);
  } else {
    ctx.rect(1, 1, width - 2, height - 2);
  }
  ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.restore();
  return canvas;
}

export async function downloadCardImage(options: CardCanvasOptions): Promise<void> {
  const canvas = await generateCardCanvas(options);
  const safeName = (options.fullName || "Student").replace(/[^a-zA-Z0-9]/g, "-");
  const fileName = `ESA-Membership-Card-${safeName}.png`;

  return new Promise((resolve) => {
    canvas.toBlob(async (blob) => {
      if (!blob) return;

      const file = new File([blob], fileName, { type: "image/png" });
      if (
        typeof navigator !== "undefined" &&
        navigator.canShare &&
        navigator.canShare({ files: [file] })
      ) {
        try {
          await navigator.share({
            files: [file],
            title: `ESA Membership Card — ${options.fullName}`,
            text: `Official Kenyatta University ESA Membership Card for ${options.fullName}`,
          });
          resolve();
          return;
        } catch (e: unknown) {
          const err = e as { name?: string };
          if (err && err.name === "AbortError") {
            resolve();
            return;
          }
        }
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      resolve();
    }, "image/png");
  });
}
