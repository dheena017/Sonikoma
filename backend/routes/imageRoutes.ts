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
import { mergedCache, editHistory, zipCache } from '../utils/cache.js';

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
    flipHorizontal = false,
    aspectRatio = "free",
    outputFormat = "jpeg",
    cropQuality = 90
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
    mergedCache.set(uniqueId, { data: imgBuffer, contentType });
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



// Endpoint to merge/stitch multiple images
router.post(["/merge-images", "/stitch-images"], async (req, res) => {
  const { imageUrl1, imageUrl2, url1, url2, urls, layout = "vertical", spacing = 0, spacingColor = "white", scaleToFit = true, alignMode = "center", padding = 0 } = req.body;

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
    return res.status(400).json({ error: "At least 2 image URLs are required ('urls' array or 'imageUrl1'+'imageUrl2')." });
  }

  // Map color string to sharp RGBA
  let bg = { r: 255, g: 255, b: 255, alpha: 1 };
  if (spacingColor === "black") bg = { r: 0, g: 0, b: 0, alpha: 1 };
  if (spacingColor === "transparent") bg = { r: 0, g: 0, b: 0, alpha: 0 };

  const gap = Number(spacing) || 0;
  const pad = Number(padding) || 0;

  try {
    const resolved = await Promise.all(imageUrls.map((u) => resolveImageToBuffer(u)));
    const meta0 = await sharp(resolved[0].data).metadata();

    const preparedBuffers: { buf: Buffer; width: number; height: number }[] = [];
    
    // First pass: resize if scaleToFit is true, otherwise keep original
    if (layout === "horizontal") {
      const canonicalHeight = meta0.height || 800;
      for (const r of resolved) {
        if (scaleToFit) {
          const resized = await sharp(r.data).resize({ height: canonicalHeight }).png().toBuffer();
          const meta = await sharp(resized).metadata();
          preparedBuffers.push({ buf: resized, width: meta.width || 0, height: meta.height || 0 });
        } else {
          const meta = await sharp(r.data).metadata();
          preparedBuffers.push({ buf: r.data, width: meta.width || 0, height: meta.height || 0 });
        }
      }
    } else {
      // vertical
      const canonicalWidth = meta0.width || 800;
      for (const r of resolved) {
        if (scaleToFit) {
          const resized = await sharp(r.data).resize({ width: canonicalWidth }).png().toBuffer();
          const meta = await sharp(resized).metadata();
          preparedBuffers.push({ buf: resized, width: meta.width || 0, height: meta.height || 0 });
        } else {
          const meta = await sharp(r.data).metadata();
          preparedBuffers.push({ buf: r.data, width: meta.width || 0, height: meta.height || 0 });
        }
      }
    }

    let totalWidth = 0;
    let totalHeight = 0;
    const composites: sharp.OverlayOptions[] = [];

    if (layout === "horizontal") {
      const maxH = Math.max(...preparedBuffers.map(p => p.height));
      totalHeight = maxH + pad * 2;
      
      let offsetX = pad;
      for (let i = 0; i < preparedBuffers.length; i++) {
        const { buf, width, height } = preparedBuffers[i];
        let offsetY = pad;
        if (alignMode === "center") offsetY = pad + Math.floor((maxH - height) / 2);
        else if (alignMode === "end") offsetY = pad + (maxH - height);
        
        composites.push({ input: buf, top: offsetY, left: offsetX });
        offsetX += width + gap;
        totalWidth += width;
      }
      totalWidth += gap * (preparedBuffers.length - 1) + pad * 2;
    } else {
      // vertical
      const maxW = Math.max(...preparedBuffers.map(p => p.width));
      totalWidth = maxW + pad * 2;
      
      let offsetY = pad;
      for (let i = 0; i < preparedBuffers.length; i++) {
        const { buf, width, height } = preparedBuffers[i];
        let offsetX = pad;
        if (alignMode === "center") offsetX = pad + Math.floor((maxW - width) / 2);
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
    mergedCache.set(uniqueId, { data: mergedBuffer, contentType: "image/png" });
    editHistory.set(newUrl, imageUrls[0]);

    return res.json({ success: true, url: newUrl });
  } catch (err: any) {
    console.error("[Merge API] Error merging images:", err);
    return res.status(500).json({ error: `Image merging failed: ${err.message || err}` });
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
  const { 
    url, 
    method = "auto", 
    sensitivity = 50.0, 
    dilation = -1, 
    inpaint_radius = 3, 
    detection_style = "all", 
    debug_mode = false,
    ocr_lang = "en",
    gpu = false,
    fill_color = "",
    morph_kernel_size = 15,
    morph_shape = "ellipse",
    custom_color_target = "",
    custom_color_tolerance = 25.0,
    custom_mask_base64 = ""
  } = req.body;

  if (!url) {
    return res.status(400).json({ error: "Parameter 'url' is required." });
  }

  // Sanitize parameter options to prevent shell injections
  const allowedMethods = ["auto", "inpaint", "inpaint_ns", "blur", "solid_white", "solid_black", "solid_color", "transparent", "ocr"];
  const activeMethod = allowedMethods.includes(method) ? method : "auto";
  
  const allowedDetectionStyles = ["all", "white_only", "text_only"];
  const activeStyle = allowedDetectionStyles.includes(detection_style) ? detection_style : "all";

  const activeSensitivity = Math.max(0, Math.min(100, Number(sensitivity) || 50.0));
  const activeDilation = Number(dilation) || -1;
  const activeRadius = Math.max(1, Math.min(20, Number(inpaint_radius) || 3));

  // Sanitize new inputs
  const sanitizedOcrLang = /^[a-z_]{2,10}$/i.test(ocr_lang) ? ocr_lang : "en";
  const sanitizedFillColor = /^#[0-9a-fA-F]{6}$/.test(fill_color) ? fill_color : "";
  const activeMorphKernel = Math.max(3, Math.min(51, Number(morph_kernel_size) || 15));
  const allowedMorphShapes = ["rect", "ellipse", "cross"];
  const activeMorphShape = allowedMorphShapes.includes(morph_shape) ? morph_shape : "ellipse";
  const sanitizedCustomColorTarget = /^#[0-9a-fA-F]{6}$/.test(custom_color_target) ? custom_color_target : "";
  const activeTolerance = Math.max(0, Math.min(100, Number(custom_color_tolerance) || 25.0));

  let tempIn = "";
  let tempOut = "";
  let tempMask = "";

  try {
    const uniqueId = `clean_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const tempDir = os.tmpdir();

    // 1. Resolve image to buffer
    const resolved = await resolveImageToBuffer(url);
    const imgBuffer = resolved.data;
    const contentType = resolved.contentType || "image/png";

    // 2. Write buffer to temporary file
    tempIn = path.join(tempDir, `${uniqueId}_in.png`);
    tempOut = path.join(tempDir, `${uniqueId}_out.png`);

    await fs.promises.writeFile(tempIn, imgBuffer);

    // Decode manual brush mask base64 if provided
    if (custom_mask_base64) {
      try {
        const maskData = custom_mask_base64.replace(/^data:image\/\w+;base64,/, "");
        const maskBuffer = Buffer.from(maskData, 'base64');
        tempMask = path.join(tempDir, `${uniqueId}_mask.png`);
        await fs.promises.writeFile(tempMask, maskBuffer);
      } catch (maskErr) {
        console.warn("[Bubble Cleaner API Warning] Failed to write custom mask file:", maskErr);
      }
    }

    // 3. Construct python CLI command (Use python on Windows, python3 on Unix to prevent Store hangs)
    const pythonBin = process.platform === 'win32' ? 'python' : 'python3';
    let pythonCommand = `"${pythonBin}" backend/services/cleaner.py --image_path "${tempIn}" --output_path "${tempOut}" --method "${activeMethod}" --sensitivity ${activeSensitivity} --dilation ${activeDilation} --inpaint_radius ${activeRadius} --detection_style "${activeStyle}" --ocr_lang "${sanitizedOcrLang}" --morph_kernel_size ${activeMorphKernel} --morph_shape "${activeMorphShape}" --custom_color_tolerance ${activeTolerance}`;
    
    if (gpu) {
      pythonCommand += " --gpu";
    }
    if (sanitizedFillColor) {
      pythonCommand += ` --fill_color "${sanitizedFillColor}"`;
    }
    if (sanitizedCustomColorTarget) {
      pythonCommand += ` --custom_color_target "${sanitizedCustomColorTarget}"`;
    }
    if (tempMask) {
      pythonCommand += ` --custom_mask_path "${tempMask}"`;
    }
    
    if (debug_mode) {
      pythonCommand += ` --debug_path "${tempOut}"`;
    }

    console.log(`[Bubble Cleaner API] Running command: ${pythonCommand}`);

    exec(pythonCommand, async (error, stdout, stderr) => {
      // Clean up the temporary input and mask files immediately
      try {
        if (fs.existsSync(tempIn)) {
          await fs.promises.unlink(tempIn);
        }
        if (tempMask && fs.existsSync(tempMask)) {
          await fs.promises.unlink(tempMask);
        }
      } catch (unlinkErr) {
        console.warn("[Bubble Cleaner API Warning] Failed to clean up temp input files:", unlinkErr);
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

        // 5. Store in merged Cache
        const cacheId = `merged_${Date.now()}_cleaned`;
        const newUrl = `/api/merge-images/cached/${cacheId}`;
        mergedCache.set(cacheId, { data: cleanedBuffer, contentType });
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
      if (tempMask && fs.existsSync(tempMask)) await fs.promises.unlink(tempMask);
    } catch (_) {}
    return res.status(500).json({ error: `Speech bubble cleaning failed: ${err.message || err}` });
  }
});

// Cached endpoint to fetch compiled vertical panels safely with typical GET src attributes
router.get(["/merge-images/cached/:id", "/stitch-images/cached/:id"], (req, res) => {
  const cached = mergedCache.get(req.params.id);
  if (!cached) {
    return res.status(404).send("Merged visual resource is no longer in memory or has expired.");
  }

  res.setHeader("Content-Type", cached.contentType);
  res.setHeader("Cache-Control", "public, max-age=86400"); // Cache 1 day
  return res.send(cached.data);
});

// ── Transform image: rotate & flip ──────────────────────────────────────────
router.post("/transform-image", async (req, res) => {
  try {
    const { url, type, value } = req.body as { url: string; type: "rotate" | "flip"; value: string };
    if (!url || !type || value === undefined) {
      return res.status(400).json({ error: "Missing required fields: url, type, value" });
    }

    const resolved = await resolveImageToBuffer(url);
    let pipeline = sharp(resolved.data);

    if (type === "rotate") {
      const degrees = parseInt(value, 10);
      if (![90, -90, 180].includes(degrees)) {
        return res.status(400).json({ error: "Invalid rotation angle. Use 90, -90, or 180." });
      }
      pipeline = pipeline.rotate(degrees);
    } else if (type === "flip") {
      if (value === "h") {
        pipeline = pipeline.flop(); // horizontal flip
      } else if (value === "v") {
        pipeline = pipeline.flip(); // vertical flip
      } else {
        return res.status(400).json({ error: "Invalid flip axis. Use 'h' or 'v'." });
      }
    } else {
      return res.status(400).json({ error: "Unknown transform type. Use 'rotate' or 'flip'." });
    }

    const outputBuffer = await pipeline.jpeg({ quality: 92 }).toBuffer();

    const uniqueId = `transform_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
    const proxyUrl = `/api/merge-images/cached/${uniqueId}`;

    // Store in mergedCache for dynamic rendering and editHistory for undo mapping
    mergedCache.set(uniqueId, { data: outputBuffer, contentType: "image/jpeg" });
    editHistory.set(proxyUrl, url);

    return res.json({ success: true, url: proxyUrl });
  } catch (err: any) {
    console.error("[transform-image] Error:", err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;

