import { Router } from "express";
import JSZip from "jszip";
import { resolveImageToBuffer } from "../../utils/imageUtils.js";
import { zipCache } from "../../utils/cache.js";

const router = Router();

// Endpoint to compress all selected panels into a ZIP download stream
router.post("/download-zip", async (req, res) => {
  const { urls } = req.body;
  if (!urls || !Array.isArray(urls) || urls.length === 0) {
    return res
      .status(400)
      .json({
        error: "Parameter 'urls' must be a non-empty array of image URLs.",
      });
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

        zip.file(
          `panel_${String(i + 1).padStart(3, "0")}.${ext}`,
          resolved.data
        );
      } catch (err) {
        console.warn(`[ZIP API Warning] Failed to resolve URL: ${url}`, err);
      }
    }

    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
    const zipId = `zip_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 9)}`;
    zipCache.set(zipId, zipBuffer);

    // Automatically purge the zip cache item after 10 minutes to save memory
    setTimeout(() => {
      zipCache.delete(zipId);
    }, 10 * 60 * 1000);

    return res.json({
      success: true,
      downloadUrl: `/api/download-zip/get/${zipId}`,
    });
  } catch (err: unknown) {
    console.error("[Zip Generation Error]", err);
    return res
      .status(500)
      .json({ error: `ZIP packaging failed: ${err.message || err}` });
  }
});

// GET endpoint to download the generated ZIP
router.get("/download-zip/get/:id", (req, res) => {
  const zipId = req.params.id;
  const buffer = zipCache.get(zipId);
  if (!buffer) {
    return res
      .status(404)
      .send(
        "The requested ZIP archive has expired or was not found. Please try packaging again."
      );
  }
  res.setHeader("Content-Type", "application/zip");
  res.setHeader(
    "Content-Disposition",
    "attachment; filename=comic_panels_archive.zip"
  );
  res.send(buffer);
});

export default router;
