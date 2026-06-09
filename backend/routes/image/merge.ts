import { Router } from "express";
import sharp from "sharp";
import { resolveImageToBuffer } from "../../utils/imageUtils.js";
import { stitchedCache, editHistory } from "../../utils/cache.js";

const router = Router();

// Endpoint to merge/stitch multiple images
router.post(["/merge-images", "/stitch-images"], async (req, res) => {
  const {
    imageUrl1,
    imageUrl2,
    url1,
    url2,
    urls,
    layout = "vertical",
    spacing = 0,
    spacingColor = "white",
    scaleToFit = true,
    alignMode = "center",
    padding = 0,
  } = req.body;

  // Build the image URL list
  let imageUrls: string[] = [];
  if (Array.isArray(urls) && urls.length >= 2) {
    imageUrls = urls;
  } else {
    const img1 = imageUrl1 || url1;
    const img2 = imageUrl2 || url2;
    if (img1 && img2) imageUrls = [img1, img2];
  }

  if (imageUrls.length < 2) {
    return res
      .status(400)
      .json({
        error:
          "At least 2 image URLs are required ('urls' array or 'imageUrl1'+'imageUrl2').",
      });
  }

  // Map color string to sharp RGBA
  let bg = { r: 255, g: 255, b: 255, alpha: 1 };
  if (spacingColor === "black") bg = { r: 0, g: 0, b: 0, alpha: 1 };
  if (spacingColor === "transparent") bg = { r: 0, g: 0, b: 0, alpha: 0 };

  const gap = Number(spacing) || 0;
  const pad = Number(padding) || 0;

  try {
    const resolved = await Promise.all(
      imageUrls.map((u) => resolveImageToBuffer(u))
    );
    const meta0 = await sharp(resolved[0].data).metadata();

    const preparedBuffers: { buf: Buffer; width: number; height: number }[] =
      [];

    // First pass: resize if scaleToFit is true, otherwise keep original
    if (layout === "horizontal") {
      const canonicalHeight = meta0.height || 800;
      for (const r of resolved) {
        if (scaleToFit) {
          const resized = await sharp(r.data)
            .resize({ height: canonicalHeight })
            .png()
            .toBuffer();
          const meta = await sharp(resized).metadata();
          preparedBuffers.push({
            buf: resized,
            width: meta.width || 0,
            height: meta.height || 0,
          });
        } else {
          const meta = await sharp(r.data).metadata();
          preparedBuffers.push({
            buf: r.data,
            width: meta.width || 0,
            height: meta.height || 0,
          });
        }
      }
    } else {
      // vertical
      const canonicalWidth = meta0.width || 800;
      for (const r of resolved) {
        if (scaleToFit) {
          const resized = await sharp(r.data)
            .resize({ width: canonicalWidth })
            .png()
            .toBuffer();
          const meta = await sharp(resized).metadata();
          preparedBuffers.push({
            buf: resized,
            width: meta.width || 0,
            height: meta.height || 0,
          });
        } else {
          const meta = await sharp(r.data).metadata();
          preparedBuffers.push({
            buf: r.data,
            width: meta.width || 0,
            height: meta.height || 0,
          });
        }
      }
    }

    let totalWidth = 0;
    let totalHeight = 0;
    const composites: sharp.OverlayOptions[] = [];

    if (layout === "horizontal") {
      const maxH = Math.max(...preparedBuffers.map((p) => p.height));
      totalHeight = maxH + pad * 2;

      let offsetX = pad;
      for (let i = 0; i < preparedBuffers.length; i++) {
        const { buf, width, height } = preparedBuffers[i];
        let offsetY = pad;
        if (alignMode === "center")
          offsetY = pad + Math.floor((maxH - height) / 2);
        else if (alignMode === "end") offsetY = pad + (maxH - height);

        composites.push({ input: buf, top: offsetY, left: offsetX });
        offsetX += width + gap;
        totalWidth += width;
      }
      totalWidth += gap * (preparedBuffers.length - 1) + pad * 2;
    } else {
      // vertical
      const maxW = Math.max(...preparedBuffers.map((p) => p.width));
      totalWidth = maxW + pad * 2;

      let offsetY = pad;
      for (let i = 0; i < preparedBuffers.length; i++) {
        const { buf, width, height } = preparedBuffers[i];
        let offsetX = pad;
        if (alignMode === "center")
          offsetX = pad + Math.floor((maxW - width) / 2);
        else if (alignMode === "end") offsetX = pad + (maxW - width);

        composites.push({ input: buf, top: offsetY, left: offsetX });
        offsetY += height + gap;
        totalHeight += height;
      }
      totalHeight += gap * (preparedBuffers.length - 1) + pad * 2;
    }

    const mergedBuffer = await sharp({
      create: {
        width: totalWidth,
        height: totalHeight,
        channels: 4,
        background: bg,
      },
    })
      .composite(composites)
      .png()
      .toBuffer();

    const uniqueId = `merged_${Date.now()}_merged`;
    const newUrl = `/api/merge-images/cached/${uniqueId}`;
    stitchedCache.set(uniqueId, {
      data: mergedBuffer,
      contentType: "image/png",
    });
    editHistory.set(newUrl, imageUrls[0]);

    return res.json({ success: true, url: newUrl });
  } catch (err: unknown) {
    console.error("[Merge API] Error merging images:", err);
    return res
      .status(500)
      .json({ error: `Image merging failed: ${err.message || err}` });
  }
});

// Cached endpoint to fetch compiled vertical panels safely with typical GET src attributes
router.get(
  ["/merge-images/cached/:id", "/stitch-images/cached/:id"],
  (req, res) => {
    const cached = stitchedCache.get(req.params.id);
    if (!cached) {
      return res
        .status(404)
        .send("Merged visual resource is no longer in memory or has expired.");
    }

    res.setHeader("Content-Type", cached.contentType);
    res.setHeader("Cache-Control", "public, max-age=86400"); // Cache 1 day
    return res.send(cached.data);
  }
);

export default router;
