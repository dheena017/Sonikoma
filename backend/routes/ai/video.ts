import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { resolveImageToBuffer } from '../../utils/imageUtils.js';
import { stitchedCache } from '../../utils/cache.js';
import { runPythonScript } from '../../utils/pythonHelper.js';
import { generateProjectId } from '../../utils/idUtils.js';

const router = Router();

// Endpoint to compile a list of curated scenes/images into a cinematic video wrapper! [Video Creator Compiler]
router.post("/convert-images-to-video", async (req, res) => {
  const { panels, url } = req.body;
  
  if (!panels || !Array.isArray(panels) || panels.length === 0) {
    return res.status(400).json({ error: "A non-empty 'panels' array is required to compile a video." });
  }

  const projectId = generateProjectId();
  const tempDir = path.join(os.tmpdir(), "webtoon_workspace", projectId);

  try {
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const compiledPanels = [];

    // 1. Prepare panel assets (images and TTS audio)
    for (let i = 0; i < panels.length; i++) {
      const panel = panels[i];
      const imagePath = path.join(tempDir, `panel_${i}.png`);
      const audioPath = path.join(tempDir, `panel_${i}.mp3`);

      // Resolve and save image
      const resolved = await resolveImageToBuffer(panel.image_url);
      await fs.promises.writeFile(imagePath, resolved.data);

      // Generate TTS if speech_text exists, otherwise use silence (handled by audio.py)
      const audioScript = 'backend/python/services/audio.py';
      const audioArgs = [
        '--dialogue_list', JSON.stringify([panel.speech_text || ""]),
        '--target_duration', (panel.duration || 4.5).toString(),
        '--output_path', audioPath
      ];

      console.log(`[Compile Video] Generating audio for panel ${i}: ${panel.speech_text?.substring(0, 30)}...`);

      const { code: audioCode, stderr: audioStderr } = await runPythonScript(audioScript, audioArgs);
      if (audioCode !== 0) {
        throw new Error(`Audio generation failed for panel ${i}: ${audioStderr}`);
      }

      compiledPanels.push({
        image_path: imagePath,
        audio_path: audioPath,
        duration: panel.duration || 4.5,
        caption: panel.speech_text || ""
      });
    }

    // 2. Run video compiler script
    const outputVideoPath = path.join(tempDir, `render_${projectId}.mp4`);
    const videoScript = 'backend/python/services/video.py';

    // Create a temporary JSON for the panel data to avoid shell argument length limits
    const panelDataPath = path.join(tempDir, "panels.json");
    await fs.promises.writeFile(panelDataPath, JSON.stringify(compiledPanels));

    const videoArgs = [
      '--panel_data_path', panelDataPath,
      '--output_path', outputVideoPath,
      '--target_width', '1920',
      '--target_height', '1080',
      '--fps', '24'
    ];

    console.log(`[Compile Video] Spawning video compiler: ${videoScript} ${videoArgs.join(' ')}`);

    const { code: videoCode, stderr: videoStderr } = await runPythonScript(videoScript, videoArgs);
    if (videoCode !== 0) {
      console.error(`[Compile Video Error] Video compiler exited with code ${videoCode}: ${videoStderr}`);
      throw new Error(videoStderr);
    }

    // 3. Read generated video and cache it
    const videoBuffer = await fs.promises.readFile(outputVideoPath);
    const videoCacheId = `video_${projectId}`;
    const videoUrl = `/api/video/cached/${videoCacheId}`;

    stitchedCache.set(videoCacheId, { data: videoBuffer, contentType: "video/mp4" });

    return res.json({
      success: true,
      project_id: projectId,
      video_url: videoUrl,
      panels: panels,
      message: `Successfully synthesized and bundled ${panels.length} frames into cinematic motion sequence.`
    });

  } catch (err: unknown) {
    console.error("[Convert Video API] Error compiling video:", err);
    return res.status(500).json({ error: `Video compilation failed: ${err.message || err}` });
  } finally {
    // Cleanup workspace
    // Note: We might want to keep the video cached for some time, but we can delete the temp directory after reading the buffer.
    try {
       // Only delete if it exists to avoid errors
       if (fs.existsSync(tempDir)) {
          // fs.rmSync(tempDir, { recursive: true, force: true });
       }
    } catch (cleanupErr) {
       console.warn("[Compile Video] Cleanup failed:", cleanupErr);
    }
  }
});

// Route to serve cached videos
router.get("/video/cached/:id", (req, res) => {
  const { id } = req.params;
  const cached = stitchedCache.get(id);
  if (!cached) {
    return res.status(404).json({ error: "Video not found or expired." });
  }
  res.setHeader("Content-Type", cached.contentType);
  res.send(cached.data);
});

export default router;
