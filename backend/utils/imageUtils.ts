/**
 * backend/utils/imageUtils.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Image resolution and cropping helper functions using sharp.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import sharp from 'sharp';
import { stitchedCache } from './cache.js';

/**
 * Safely resolve ANY absolute, relative, proxied, or cached image URL into a raw Buffer and contentType.
 * Avoids recursive/self-referential loopback HTTP issues inside containers.
 */
export async function resolveImageToBuffer(urlStr: string): Promise<{ data: Buffer; contentType: string }> {
  if (!urlStr) {
    throw new Error("Empty image URL provided");
  }

  let workingUrl = urlStr.trim();

  // 1. First check if it is a local cached memory asset
  if (workingUrl.includes("/api/stitch-images/cached/")) {
    const idMatched = workingUrl.match(/\/api\/stitch-images\/cached\/([^\/\s\?&]+)/);
    if (idMatched && idMatched[1]) {
      const cached = stitchedCache.get(idMatched[1]);
      if (cached) {
        return { data: cached.data, contentType: cached.contentType || "image/png" };
      }
    }
  }

  // 2. If it's a proxy image on our same server, unwrap the real source URL
  if (workingUrl.includes("/api/proxy-image")) {
    const matched = workingUrl.match(/[?&]url=([^&]+)/);
    if (matched && matched[1]) {
      workingUrl = decodeURIComponent(matched[1]);
    }
  }

  // 3. Normalize internal hostnames to relative paths to call localhost directly
  if (/^https?:\/\//i.test(workingUrl)) {
    try {
      const parsed = new URL(workingUrl);
      if (parsed.hostname.includes("run.app") || parsed.hostname.includes("localhost") || parsed.hostname === "127.0.0.1") {
        workingUrl = parsed.pathname + parsed.search; // Convert back to relative path
      }
    } catch (e) {
      // Fallback to absolute if URL parsing fails
    }
  }

  // 4. Resolve relative paths using internal localhost port 3000
  if (workingUrl.startsWith("/")) {
    workingUrl = `http://localhost:3000${workingUrl}`;
  }

  // 5. Fetch absolute remote resource with referrer bypass
  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Referer": "https://www.webtoons.com/",
    "Accept": "image/*,*/*;q=0.8"
  };

  const response = await fetch(workingUrl, { headers });
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
  }

  const contentType = response.headers.get("Content-Type") || "image/jpeg";
  const arrayBuffer = await response.arrayBuffer();
  return {
    data: Buffer.from(arrayBuffer),
    contentType
  };
}

/**
 * Auto crop massive white/black backgrounds using sharp library
 */
export async function cropAutoBorders(
  imageBuffer: Buffer, 
  tighter: boolean = false, 
  cropPadding?: number,
  sensitivity?: number,
  backgroundColorMode: string = "auto"
): Promise<{ data: Buffer; contentType: string }> {
  try {
    const minInstance = sharp(imageBuffer);
    const metadata = await minInstance.metadata();
    
    const width = metadata.width || 0;
    const height = metadata.height || 0;
    
    // Skip small UI assets
    if (width < 80 || height < 80) {
      return { data: imageBuffer, contentType: metadata.format ? `image/${metadata.format}` : "image/jpeg" };
    }

    let bgHex = "";
    if (backgroundColorMode === "white") {
      bgHex = "#ffffff";
    } else if (backgroundColorMode === "black") {
      bgHex = "#000000";
    }

    // Determine threshold
    const thresholdVal = typeof sensitivity === "number" && !isNaN(sensitivity) 
      ? sensitivity 
      : (tighter ? 50 : 25);
    
    let trimmedBuffer = imageBuffer;

    try {
      // Step 1: Perform the Trim
      const trimOptions: any = { threshold: thresholdVal };
      if (bgHex && backgroundColorMode !== "auto") {
         trimOptions.background = bgHex;
      }
      
      const { data, info } = await sharp(imageBuffer).trim(trimOptions).toBuffer({ resolveWithObject: true });
      
      if (info.width >= 15 && info.height >= 15) {
        trimmedBuffer = data;
      } else {
        console.warn("[Sharp Cropper] Trimming resulted in an almost empty image, bypassing trim.");
      }
    } catch (trimErr) {
      console.warn("[Sharp Cropper] Precise color background trim failed:", trimErr);
      try {
        const { data, info } = await sharp(imageBuffer).trim({ threshold: thresholdVal }).toBuffer({ resolveWithObject: true });
        if (info.width >= 15 && info.height >= 15) {
          trimmedBuffer = data;
        }
      } catch (e) {
        // Fallback to original
      }
    }
    
    // Step 2: Add custom padding around cropped bounds
    let padding = tighter ? 4 : 20;
    if (typeof cropPadding === "number" && !isNaN(cropPadding)) {
      padding = cropPadding;
    }
    
    let finalBuffer = trimmedBuffer;
    if (padding > 0) {
      // Default to white if "auto" was used so padding is consistent
      let extendBg = bgHex || "#ffffff";
      if (backgroundColorMode === "black") extendBg = "#000000";
      
      finalBuffer = await sharp(trimmedBuffer)
        .extend({
          top: padding,
          bottom: padding,
          left: padding,
          right: padding,
          background: extendBg
        })
        .toBuffer();
    }
    
    return { data: finalBuffer, contentType: "image/jpeg" };
  } catch (err: any) {
    console.error("[Auto Crop Error]", err);
    return { data: imageBuffer, contentType: "image/jpeg" };
  }
}
