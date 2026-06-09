import { Router } from "express";
import fs from "fs";
import path from "path";
import os from "os";
import { resolveImageToBuffer } from "../../utils/imageUtils.js";
import { stitchedCache, editHistory } from "../../utils/cache.js";
import { runPythonScript } from "../../utils/pythonHelper.js";

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
    custom_mask_base64 = "",
  } = req.body;

  if (!url) {
    return res.status(400).json({ error: "Parameter 'url' is required." });
  }

  // Sanitize parameter options to prevent shell injections
  const allowedMethods = [
    "auto",
    "inpaint",
    "inpaint_ns",
    "blur",
    "solid_white",
    "solid_black",
    "solid_color",
    "transparent",
    "ocr",
  ];
  const activeMethod = allowedMethods.includes(method) ? method : "auto";

  const allowedDetectionStyles = ["all", "white_only", "text_only"];
  const activeStyle = allowedDetectionStyles.includes(detection_style)
    ? detection_style
    : "all";

  const activeSensitivity = Math.max(
    0,
    Math.min(100, Number(sensitivity) || 50.0)
  );
  const activeDilation = Number(dilation) || -1;
  const activeRadius = Math.max(1, Math.min(20, Number(inpaint_radius) || 3));

  // Sanitize new inputs
  const sanitizedOcrLang = /^[a-z_]{2,10}$/i.test(ocr_lang) ? ocr_lang : "en";
  const sanitizedFillColor = /^#[0-9a-fA-F]{6}$/.test(fill_color)
    ? fill_color
    : "";
  const activeMorphKernel = Math.max(
    3,
    Math.min(51, Number(morph_kernel_size) || 15)
  );
  const allowedMorphShapes = ["rect", "ellipse", "cross"];
  const activeMorphShape = allowedMorphShapes.includes(morph_shape)
    ? morph_shape
    : "ellipse";
  const sanitizedCustomColorTarget = /^#[0-9a-fA-F]{6}$/.test(
    custom_color_target
  )
    ? custom_color_target
    : "";
  const activeTolerance = Math.max(
    0,
    Math.min(100, Number(custom_color_tolerance) || 25.0)
  );

  let tempIn = "";
  let tempOut = "";
  let tempMask = "";

  try {
    const uniqueId = `clean_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 9)}`;
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
        const maskData = custom_mask_base64.replace(
          /^data:image\/\w+;base64,/,
          ""
        );
        const maskBuffer = Buffer.from(maskData, "base64");
        tempMask = path.join(tempDir, `${uniqueId}_mask.png`);
        await fs.promises.writeFile(tempMask, maskBuffer);
      } catch (maskErr) {
        console.warn(
          "[Bubble Cleaner API Warning] Failed to write custom mask file:",
          maskErr
        );
      }
    }

    // 3. Construct python CLI arguments
    const pythonScript = "backend/python/services/cleaner.py";

    const args = [
      "--image_path",
      tempIn,
      "--output_path",
      tempOut,
      "--method",
      activeMethod,
      "--sensitivity",
      activeSensitivity.toString(),
      "--dilation",
      activeDilation.toString(),
      "--inpaint_radius",
      activeRadius.toString(),
      "--detection_style",
      activeStyle,
      "--ocr_lang",
      sanitizedOcrLang,
      "--morph_kernel_size",
      activeMorphKernel.toString(),
      "--morph_shape",
      activeMorphShape,
      "--custom_color_tolerance",
      activeTolerance.toString(),
    ];

    if (gpu) args.push("--gpu");
    if (sanitizedFillColor) {
      args.push("--fill_color", sanitizedFillColor);
    }
    if (sanitizedCustomColorTarget) {
      args.push("--custom_color_target", sanitizedCustomColorTarget);
    }
    if (tempMask) {
      args.push("--custom_mask_path", tempMask);
    }
    if (debug_mode) {
      args.push("--debug_path", tempOut);
    }

    console.log(
      `[Bubble Cleaner API] Spawning ${pythonScript} with args: ${args.join(
        " "
      )}`
    );

    const { code, stdout, stderr } = await runPythonScript(pythonScript, args);

    // Clean up the temporary input and mask files immediately
    try {
      if (fs.existsSync(tempIn)) {
        await fs.promises.unlink(tempIn);
      }
      if (tempMask && fs.existsSync(tempMask)) {
        await fs.promises.unlink(tempMask);
      }
    } catch (unlinkErr) {
      console.warn(
        "[Bubble Cleaner API Warning] Failed to clean up temp input files:",
        unlinkErr
      );
    }

    if (code !== 0) {
      console.error(
        `[Bubble Cleaner API Error] Cleaner script exited with code ${code}`
      );
      console.error("[Bubble Cleaner API Error] stderr:", stderr);
      return res
        .status(500)
        .json({ error: `Speech bubble cleaning failed: ${stderr}` });
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
        console.warn(
          "[Bubble Cleaner API Warning] Failed to clean up temp output file:",
          unlinkErr
        );
      }

      // 5. Store in stitched Cache
      const cacheId = `merged_${Date.now()}_cleaned`;
      const newUrl = `/api/merge-images/cached/${cacheId}`;
      stitchedCache.set(cacheId, { data: cleanedBuffer, contentType });
      editHistory.set(newUrl, url);

      return res.json({
        success: true,
        url: newUrl,
      });
    } catch (fileErr: any) {
      console.error(
        "[Bubble Cleaner API Error] File operations failed:",
        fileErr
      );
      return res
        .status(500)
        .json({
          error: `Failed to process cleaned output image: ${fileErr.message}`,
        });
    }
  } catch (err: any) {
    console.error("[Bubble Cleaner API Error] Route exception:", err);
    // Clean up temp files if they still exist
    try {
      if (tempIn && fs.existsSync(tempIn)) await fs.promises.unlink(tempIn);
      if (tempOut && fs.existsSync(tempOut)) await fs.promises.unlink(tempOut);
      if (tempMask && fs.existsSync(tempMask))
        await fs.promises.unlink(tempMask);
    } catch (_) {}
    return res
      .status(500)
      .json({ error: `Speech bubble cleaning failed: ${err.message || err}` });
  }
});

export default router;
