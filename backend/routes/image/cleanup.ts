import { Router } from 'express';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { resolveImageToBuffer } from '../../utils/imageUtils.js';
import { mergedCache, editHistory } from '../../utils/cache.js';

const router = Router();

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

export default router;
