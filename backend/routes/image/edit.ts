import { Router } from "express";
import sharp from "sharp";
import {
  resolveImageToBuffer,
  cropAutoBorders,
} from "../../utils/imageUtils.js";
import { stitchedCache, editHistory } from "../../utils/cache.js";

const router = Router();

// Endpoint to edit image properties (crop top, bottom, left, right, autoTrim, rotate, flipHorizontal)
router.post("/edit-image", async (req, res) => {
  const {
    url,
    cropTop = 0,
    cropBottom = 0,
    cropLeft = 0,
    cropRight = 0,
    autoTrim = true,
    sensitivity,
    padding,
    backgroundColorMode,
    rotate = 0,
    flipHorizontal = false,
    aspectRatio = "free",
    outputFormat = "jpeg",
    cropQuality = 90,
  } = req.body;
  if (!url) {
    return res.status(400).json({ error: "Parameter 'url' is required." });
  }

  try {
    const resolved = await resolveImageToBuffer(url);
    let imgBuffer = resolved.data;
    let contentType = resolved.contentType;

    // Apply rotation if requested
    const rotateAngle = Number(rotate) || 0;
    if (rotateAngle !== 0) {
      imgBuffer = await sharp(imgBuffer).rotate(rotateAngle).toBuffer();
    }

    // Apply horizontal flip if requested
    if (flipHorizontal) {
      imgBuffer = await sharp(imgBuffer).flop().toBuffer();
    }

    const pTop = Math.max(0, Math.min(100, Number(cropTop) || 0));
    const pBottom = Math.max(0, Math.min(100, Number(cropBottom) || 0));
    const pLeft = Math.max(0, Math.min(100, Number(cropLeft) || 0));
    const pRight = Math.max(0, Math.min(100, Number(cropRight) || 0));

    if (pTop > 0 || pBottom > 0 || pLeft > 0 || pRight > 0) {
      const freshMeta = await sharp(imgBuffer).metadata();
      const w = freshMeta.width || 0;
      const h = freshMeta.height || 0;

      const topPx = Math.round((pTop / 100) * h);
      const bottomPx = Math.round((pBottom / 100) * h);
      const leftPx = Math.round((pLeft / 100) * w);
      const rightPx = Math.round((pRight / 100) * w);

      const extractWidth = w - leftPx - rightPx;
      const extractHeight = h - topPx - bottomPx;

      if (extractWidth > 10 && extractHeight > 10) {
        imgBuffer = await sharp(imgBuffer)
          .extract({
            left: leftPx,
            top: topPx,
            width: extractWidth,
            height: extractHeight,
          })
          .toBuffer();
      }
    }

    if (autoTrim) {
      const trimmed = await cropAutoBorders(
        imgBuffer,
        true,
        padding,
        sensitivity,
        backgroundColorMode,
        aspectRatio,
        outputFormat,
        cropQuality
      );
      imgBuffer = trimmed.data;
      contentType = trimmed.contentType;
    }

    const uniqueId = `merged_${Date.now()}_cropped`;
    const newUrl = `/api/merge-images/cached/${uniqueId}`;
    stitchedCache.set(uniqueId, { data: imgBuffer, contentType });
    editHistory.set(newUrl, url);

    return res.json({
      success: true,
      url: newUrl,
    });
  } catch (err: unknown) {
    console.error("[Edit API] Error editing image frame:", err);
    return res
      .status(500)
      .json({ error: `Image frame editing failed: ${err.message || err}` });
  }
});

// Endpoint to restore the previous crop state of an edited image
router.post("/undo-crop", (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: "Parameter 'url' is required." });
  }

  const previousUrl = editHistory.get(url);
  if (!previousUrl) {
    return res
      .status(404)
      .json({
        success: false,
        error: "No previous crop state found in session history.",
      });
  }

  return res.json({
    success: true,
    previous_url: previousUrl,
  });
});

// ── Transform image: rotate & flip ──────────────────────────────────────────
router.post("/transform-image", async (req, res) => {
  try {
    const { url, type, value } = req.body as {
      url: string;
      type: "rotate" | "flip";
      value: string;
    };
    if (!url || !type || value === undefined) {
      return res
        .status(400)
        .json({ error: "Missing required fields: url, type, value" });
    }

    const resolved = await resolveImageToBuffer(url);
    let pipeline = sharp(resolved.data);

    if (type === "rotate") {
      const degrees = parseInt(value, 10);
      if (![90, -90, 180].includes(degrees)) {
        return res
          .status(400)
          .json({ error: "Invalid rotation angle. Use 90, -90, or 180." });
      }
      pipeline = pipeline.rotate(degrees);
    } else if (type === "flip") {
      if (value === "h") {
        pipeline = pipeline.flop(); // horizontal flip
      } else if (value === "v") {
        pipeline = pipeline.flip(); // vertical flip
      } else {
        return res
          .status(400)
          .json({ error: "Invalid flip axis. Use 'h' or 'v'." });
      }
    } else {
      return res
        .status(400)
        .json({ error: "Unknown transform type. Use 'rotate' or 'flip'." });
    }

    const outputBuffer = await pipeline.jpeg({ quality: 92 }).toBuffer();

    const uniqueId = `transform_${Date.now()}_${Math.floor(
      Math.random() * 100000
    )}`;
    const proxyUrl = `/api/merge-images/cached/${uniqueId}`;

    // Store in stitchedCache for dynamic rendering and editHistory for undo mapping
    stitchedCache.set(uniqueId, {
      data: outputBuffer,
      contentType: "image/jpeg",
    });
    editHistory.set(proxyUrl, url);

    return res.json({ success: true, url: proxyUrl });
  } catch (err: unknown) {
    console.error("[transform-image] Error:", err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
