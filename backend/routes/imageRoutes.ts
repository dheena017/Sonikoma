/**
 * backend/routes/imageRoutes.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Proxying, editing, speech bubbles removing, and ZIP compilation routes for images.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { Router } from 'express';
import sharp from 'sharp';
import JSZip from 'jszip';
import os from 'os';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import { resolveImageToBuffer, cropAutoBorders } from '../utils/imageUtils.js';
import { stitchedCache, editHistory, zipCache } from '../utils/cache.js';

const router = Router();

// Endpoint to proxy external image assets (referrer bypass)
router.get("/proxy-image", async (req, res) => {
  try {
    const targetUrl = req.query.url as string;
    if (!targetUrl) {
      return res.status(400).send("Missing target URL");
    }
    
    let fetchUrl = targetUrl;
    if (fetchUrl.includes("/api/proxy-image")) {
      const matched = fetchUrl.match(/[?&]url=([^&]+)/);
      if (matched && matched[1]) {
        fetchUrl = decodeURIComponent(matched[1]);
      }
    }
    
    const headers = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Referer": "https://www.webtoons.com/",
      "Accept": "image/*,*/*;q=0.8"
    };
    
    const response = await fetch(fetchUrl, { headers });
    if (!response.ok) {
      return res.status(response.status).send(response.statusText);
    }
    
    const contentType = response.headers.get("Content-Type") || "image/jpeg";
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=31536000"); // Cache aggressively
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    res.send(buffer);
  } catch (err: any) {
    res.status(500).send(err.message);
  }
});

// Endpoint to compress all selected panels into a ZIP download stream
router.post("/download-zip", async (req, res) => {
  const { urls } = req.body;
  if (!urls || !Array.isArray(urls) || urls.length === 0) {
    return res.status(400).json({ error: "Parameter 'urls' must be a non-empty array of image URLs." });
  }

  try {
    const zip = new JSZip();

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      try {
        const resolved = await resolveImageToBuffer(url);
        let ext = "png";
        const ct = resolved.contentType || "";
        if (ct.includes("png")) ext = "png";
        else if (ct.includes("jpeg") || ct.includes("jpg")) ext = "jpg";
        else if (ct.includes("webp")) ext = "webp";
        else if (ct.includes("gif")) ext = "gif";

        zip.file(`panel_${String(i + 1).padStart(3, "0")}.${ext}`, resolved.data);
      } catch (err) {
        console.warn(`[ZIP API Warning] Failed to resolve URL: ${url}`, err);
      }
    }

    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
    const zipId = `zip_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    zipCache.set(zipId, zipBuffer);

    // Automatically purge the zip cache item after 10 minutes to save memory
    setTimeout(() => {
      zipCache.delete(zipId);
    }, 10 * 60 * 1000);

    return res.json({
      success: true,
      downloadUrl: `/api/download-zip/get/${zipId}`
    });
  } catch (err: any) {
    console.error("[Zip Generation Error]", err);
    return res.status(500).json({ error: `ZIP packaging failed: ${err.message || err}` });
  }
});

// GET endpoint to download the generated ZIP
router.get("/download-zip/get/:id", (req, res) => {
  const zipId = req.params.id;
  const buffer = zipCache.get(zipId);
  if (!buffer) {
    return res.status(404).send("The requested ZIP archive has expired or was not found. Please try packaging again.");
  }
  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Disposition", "attachment; filename=comic_panels_archive.zip");
  res.send(buffer);
});

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
    flipHorizontal = false
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
            height: extractHeight
          })
          .toBuffer();
      }
    }

    if (autoTrim) {
      const trimmed = await cropAutoBorders(imgBuffer, true, padding, sensitivity, backgroundColorMode); 
      imgBuffer = trimmed.data;
    }

    const uniqueId = `stitched_${Date.now()}_cropped`;
    const newUrl = `/api/stitch-images/cached/${uniqueId}`;
    stitchedCache.set(uniqueId, { data: imgBuffer, contentType });
    editHistory.set(newUrl, url);

    return res.json({
      success: true,
      url: newUrl
    });
  } catch (err: any) {
    console.error("[Edit API] Error editing image frame:", err);
    return res.status(500).json({ error: `Image frame editing failed: ${err.message || err}` });
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
    return res.status(404).json({ success: false, error: "No previous crop state found in session history." });
  }

  return res.json({
    success: true,
    previous_url: previousUrl
  });
});

// Endpoint to run speech bubble removal (OpenCV + Gemini)
router.post("/remove-speech-bubbles", async (req, res) => {
  const { url, method = "auto", sensitivity = 50.0, dilation = -1, inpaint_radius = 3, detection_style = "all" } = req.body;
  if (!url) {
    return res.status(400).json({ error: "Parameter 'url' is required." });
  }

  // Sanitize parameter options to prevent shell injections
  const allowedMethods = ["auto", "inpaint", "inpaint_ns", "blur", "solid_white", "solid_black", "transparent", "ocr"];
  const activeMethod = allowedMethods.includes(method) ? method : "auto";
  
  const allowedDetectionStyles = ["all", "white_only", "text_only"];
  const activeStyle = allowedDetectionStyles.includes(detection_style) ? detection_style : "all";

  const activeSensitivity = Math.max(0, Math.min(100, Number(sensitivity) || 50.0));
  const activeDilation = Number(dilation) || -1;
  const activeRadius = Math.max(1, Math.min(20, Number(inpaint_radius) || 3));

  let tempIn = "";
  let tempOut = "";

  try {
    // 1. Resolve image to buffer
    const resolved = await resolveImageToBuffer(url);
    const imgBuffer = resolved.data;
    const contentType = resolved.contentType || "image/png";

    // 2. Write buffer to temporary file
    const uniqueId = `clean_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const tempDir = os.tmpdir();
    tempIn = path.join(tempDir, `${uniqueId}_in.png`);
    tempOut = path.join(tempDir, `${uniqueId}_out.png`);

    await fs.promises.writeFile(tempIn, imgBuffer);

    // 3. Construct python CLI command (Always use python3 as mandated by backend rules)
    const pythonCommand = `python3 backend/services/cleaner.py --image_path "${tempIn}" --output_path "${tempOut}" --method "${activeMethod}" --sensitivity ${activeSensitivity} --dilation ${activeDilation} --inpaint_radius ${activeRadius} --detection_style "${activeStyle}"`;
    
    console.log(`[Bubble Cleaner API] Running command: ${pythonCommand}`);

    exec(pythonCommand, async (error, stdout, stderr) => {
      // Clean up the temporary input file immediately
      try {
        if (fs.existsSync(tempIn)) {
          await fs.promises.unlink(tempIn);
        }
      } catch (unlinkErr) {
        console.warn("[Bubble Cleaner API Warning] Failed to clean up temp input file:", unlinkErr);
      }

      if (error) {
        console.error("[Bubble Cleaner API Error] Cleaner script execution failed:", error);
        console.error("[Bubble Cleaner API Error] stderr:", stderr);
        return res.status(500).json({ error: `Speech bubble cleaning failed: ${stderr || error.message}` });
      }

      console.log("[Bubble Cleaner API stdout]:", stdout);

      try {
        if (!fs.existsSync(tempOut)) {
          throw new Error("Cleaner script did not output any file.");
        }

        // 4. Read cleaned image buffer
        const cleanedBuffer = await fs.promises.readFile(tempOut);
        
        // Clean up temporary output file
        try {
          await fs.promises.unlink(tempOut);
        } catch (unlinkErr) {
          console.warn("[Bubble Cleaner API Warning] Failed to clean up temp output file:", unlinkErr);
        }

        // 5. Store in stitched Cache
        const cacheId = `stitched_${Date.now()}_cleaned`;
        const newUrl = `/api/stitch-images/cached/${cacheId}`;
        stitchedCache.set(cacheId, { data: cleanedBuffer, contentType });
        editHistory.set(newUrl, url);

        return res.json({
          success: true,
          url: newUrl
        });

      } catch (fileErr: any) {
        console.error("[Bubble Cleaner API Error] File operations failed:", fileErr);
        return res.status(500).json({ error: `Failed to process cleaned output image: ${fileErr.message}` });
      }
    });

  } catch (err: any) {
    console.error("[Bubble Cleaner API Error] Route exception:", err);
    // Clean up temp files if they still exist
    try {
      if (tempIn && fs.existsSync(tempIn)) await fs.promises.unlink(tempIn);
      if (tempOut && fs.existsSync(tempOut)) await fs.promises.unlink(tempOut);
    } catch (_) {}
    return res.status(500).json({ error: `Speech bubble cleaning failed: ${err.message || err}` });
  }
});

// Cached endpoint to fetch compiled vertical panels safely with typical GET src attributes
router.get("/stitch-images/cached/:id", (req, res) => {
  const cached = stitchedCache.get(req.params.id);
  if (!cached) {
    return res.status(404).send("Stitched visual resource is no longer in memory or has expired.");
  }

  res.setHeader("Content-Type", cached.contentType);
  res.setHeader("Cache-Control", "public, max-age=86400"); // Cache 1 day
  return res.send(cached.data);
});

export default router;
