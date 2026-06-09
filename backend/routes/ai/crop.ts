import { Router } from 'express';
import sharp from 'sharp';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { ai, Type, callGeminiWithRetry } from '../../config/clients.js';
import { resolveImageToBuffer } from '../../utils/imageUtils.js';
import { mergedCache, editHistory } from '../../utils/cache.js';

const router = Router();

function adjustToAspectRatio(
  x: number, y: number, wBox: number, hBox: number, 
  wImg: number, hImg: number, aspectRatioStr: string
) {
  if (!aspectRatioStr || aspectRatioStr === "free") {
    return { x, y, wBox, hBox };
  }
  let targetRatio = 1.0;
  if (aspectRatioStr === "1:1") targetRatio = 1.0;
  else if (aspectRatioStr === "16:9") targetRatio = 16.0 / 9.0;
  else if (aspectRatioStr === "9:16") targetRatio = 9.0 / 16.0;
  else if (aspectRatioStr === "4:3") targetRatio = 4.0 / 3.0;
  else return { x, y, wBox, hBox };

  const currRatio = hBox > 0 ? wBox / hBox : 1.0;
  let newW = wBox;
  let newH = hBox;
  let newX = x;
  let newY = y;

  if (currRatio < targetRatio) {
    newW = Math.round(hBox * targetRatio);
    const delta = newW - wBox;
    newX = x - Math.floor(delta / 2);
    if (newX < 0) newX = 0;
    if (newX + newW > wImg) {
      newW = wImg - newX;
      newH = Math.round(newW / targetRatio);
      newY = y + Math.floor((hBox - newH) / 2);
    }
  } else if (currRatio > targetRatio) {
    newH = Math.round(wBox / targetRatio);
    const delta = newH - hBox;
    newY = y - Math.floor(delta / 2);
    if (newY < 0) newY = 0;
    if (newY + newH > hImg) {
      newH = hImg - newY;
      newW = Math.round(newH * targetRatio);
      newX = x + Math.floor((wBox - newW) / 2);
    }
  }
  return { x: newX, y: newY, wBox: newW, hBox: newH };
}

// Endpoint to use AI to detect panel crops and automatically crop them! [AI Smart Crop]
router.post(["/ai-detect-panels", "/detect-panels", "/ai-smart-crop"], async (req, res) => {
  const { 
    url, 
    model, 
    strategy, 
    sensitivity = 30, 
    backgroundColorMode = "auto", 
    aspectRatio = "free", 
    minAreaPct = 0.15, 
    mergeThreshold = 20,
    cannyLow = 20,
    cannyHigh = 100,
    closeKernelSize = 15,
    minHeightPx = 60
  } = req.body;

  if (!url) {
    return res.status(400).json({ error: "Parameter 'url' is required." });
  }

  try {
    const resolved = await resolveImageToBuffer(url);
    const imageBuffer = resolved.data;
    const contentType = resolved.contentType;

    let coordPanels: Array<{
      cropTop: number;
      cropBottom: number;
      cropLeft: number;
      cropRight: number;
    }> = [];

    if (strategy === "local-cv" || model === "local-cv") {
      // Run local CV panel detection script
      const uniqueId = `detect_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      const tempDir = os.tmpdir();
      const tempIn = path.join(tempDir, `${uniqueId}_in.png`);
      await fs.promises.writeFile(tempIn, imageBuffer);

      const pythonBin = process.platform === 'win32' ? 'python' : 'python3';
      const pythonCommand = `"${pythonBin}" backend/services/detect_panels.py --image_path "${tempIn}" --sensitivity ${sensitivity} --background_mode "${backgroundColorMode}" --min_width_pct ${minAreaPct} --merge_threshold ${mergeThreshold} --aspect_ratio "${aspectRatio}" --canny_low ${cannyLow} --canny_high ${cannyHigh} --close_kernel_size ${closeKernelSize} --min_height_px ${minHeightPx}`;

      console.log(`[Local CV Detector API] Running command: ${pythonCommand}`);

      try {
        const stdout = await new Promise<string>((resolve, reject) => {
          exec(pythonCommand, (error, stdout, stderr) => {
            if (error) {
              console.error("[Local CV Detector Error] Script failed:", error, stderr);
              reject(new Error(stderr || error.message));
            } else {
              resolve(stdout);
            }
          });
        });

        const data = JSON.parse(stdout.trim());
        if (!data.success) {
          throw new Error(data.error || "Local CV detection script reported failure.");
        }
        coordPanels = data.panels || [];
      } catch (cvErr: any) {
        console.error("[Local CV Detector Error] Parse or execution error:", cvErr);
        throw cvErr;
      } finally {
        // Clean up the temporary input file
        try {
          if (fs.existsSync(tempIn)) {
            await fs.promises.unlink(tempIn);
          }
        } catch (unlinkErr) {
          console.warn("[Local CV Detector API Warning] Failed to clean up temp file:", unlinkErr);
        }
      }
    } else {
      const base64Image = imageBuffer.toString("base64");
      let aiResultText = "";
      try {
        if (!ai) {
          throw new Error("Gemini AI client is not initialized.");
        }
        const targetModel = model || "gemini-2.5-flash";
        console.log(`[AI Smart Crop API] Using model: ${targetModel}`);
        const prompt = "Analyze this comic image page. Identify the main illustrations/panels that contain scenes. Detect the outer borders and give me the precise percentage coordinates (0 to 100) for cropping each panel out properly, removing any extra whitespace or gutters. Return a JSON array of panel crops, where each object has properties: cropTop, cropBottom, cropLeft, cropRight.";

        const response = await callGeminiWithRetry(() => ai!.models.generateContent({
          model: targetModel,
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType: "image/jpeg",
                  data: base64Image,
                },
              },
              { text: prompt },
            ],
          },
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  cropTop: { type: Type.NUMBER },
                  cropBottom: { type: Type.NUMBER },
                  cropLeft: { type: Type.NUMBER },
                  cropRight: { type: Type.NUMBER },
                },
                required: ["cropTop", "cropBottom", "cropLeft", "cropRight"],
              },
            },
          },
        }), 4, 1500);
        aiResultText = response.text || "[]";
      } catch (err: any) {
        console.error("[AI Smart Crop API] All retries failed or fatal error encountered. Returning empty.", err);
        // 👇 FIX: Return empty array so the UI knows detection failed
        aiResultText = "[]";
      }

      coordPanels = JSON.parse(aiResultText.trim());
      console.log(`[AI Smart Crop] Gemini isolated ${coordPanels.length} panels.`);
    }

    const freshMeta = await sharp(imageBuffer).metadata();
    const w = freshMeta.width || 0;
    const h = freshMeta.height || 0;

    const croppedPanels = [];
    for (let i = 0; i < coordPanels.length; i++) {
      const box = coordPanels[i];
      let pTop = Math.max(0, Math.min(100, Number(box.cropTop) || 0));
      let pBottom = Math.max(0, Math.min(100, Number(box.cropBottom) || 0));
      let pLeft = Math.max(0, Math.min(100, Number(box.cropLeft) || 0));
      let pRight = Math.max(0, Math.min(100, Number(box.cropRight) || 0));

      let topPx = Math.round((pTop / 100) * h);
      let bottomPx = Math.round((pBottom / 100) * h);
      let leftPx = Math.round((pLeft / 100) * w);
      let rightPx = Math.round((pRight / 100) * w);

      let extractWidth = w - leftPx - rightPx;
      let extractHeight = h - topPx - bottomPx;

      if (aspectRatio && aspectRatio !== "free") {
        const adjusted = adjustToAspectRatio(leftPx, topPx, extractWidth, extractHeight, w, h, aspectRatio);
        leftPx = adjusted.x;
        topPx = adjusted.y;
        extractWidth = adjusted.wBox;
        extractHeight = adjusted.hBox;
        pLeft = (leftPx / w) * 100;
        pTop = (topPx / h) * 100;
        pRight = ((w - (leftPx + extractWidth)) / w) * 100;
        pBottom = ((h - (topPx + extractHeight)) / h) * 100;
      }

      let croppedBuffer = imageBuffer;
      if (extractWidth > 10 && extractHeight > 10) {
        croppedBuffer = await sharp(imageBuffer)
          .extract({
            left: leftPx,
            top: topPx,
            width: extractWidth,
            height: extractHeight
          })
          .toBuffer();
      }

      const uniqueId = `merged_${Date.now()}_smartcrop_${i}`;
      const cachedUrl = `/api/merge-images/cached/${uniqueId}`;
      mergedCache.set(uniqueId, { data: croppedBuffer, contentType });
      editHistory.set(cachedUrl, url);

      croppedPanels.push({
        cropTop: parseFloat(pTop.toFixed(2)),
        cropBottom: parseFloat(pBottom.toFixed(2)),
        cropLeft: parseFloat(pLeft.toFixed(2)),
        cropRight: parseFloat(pRight.toFixed(2)),
        croppedUrl: cachedUrl
      });
    }

    return res.json({
      success: true,
      panels: croppedPanels
    });
  } catch (err: any) {
    console.error("[AI Smart Crop API] Error:", err.message || err);
    return res.status(500).json({ error: `AI Smart Crop failed: ${err.message || err}` });
  }
});

export default router;
