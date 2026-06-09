import { Router } from "express";
import { DYNAMIC_BACKGROUND_VIDEOS } from "../../config/clients.js";
import { parseWebtoonUrl } from "../../utils/urlUtils.js";
import {
  scrapeImagesFromUrl,
  generateDynamicPanels,
} from "../../services/scraperService.js";
import { generateProjectId } from "../../utils/idUtils.js";

const router = Router();

// Primary Endpoint: Generate Storyboard and Cinematic parameters using AI / fallsback
router.post("/generate", async (req, res) => {
  try {
    const {
      url,
      episode_id,
      panels: clientPanels,
      custom_background_video,
      model,
    } = req.body;

    if (!url) {
      return res
        .status(400)
        .json({ detail: "A target Webtoon URL is required." });
    }

    const parsed = parseWebtoonUrl(url);
    const projectId = episode_id || generateProjectId();

    console.log(
      `Processing storyboard request for url: "${url}". Parsed Title: "${parsed.title}", Genre: "${parsed.genre}"`
    );

    let videoUrl = DYNAMIC_BACKGROUND_VIDEOS.general;
    const genreLower = parsed.genre.toLowerCase();

    if (custom_background_video) {
      videoUrl = custom_background_video;
    } else if (
      genreLower.includes("action") ||
      genreLower.includes("martial") ||
      genreLower.includes("hero") ||
      genreLower.includes("solo")
    ) {
      videoUrl = DYNAMIC_BACKGROUND_VIDEOS.action;
    } else if (
      genreLower.includes("romance") ||
      genreLower.includes("love") ||
      genreLower.includes("slice") ||
      genreLower.includes("drama") ||
      genreLower.includes("olympus")
    ) {
      videoUrl = DYNAMIC_BACKGROUND_VIDEOS.romance;
    } else if (
      genreLower.includes("fantasy") ||
      genreLower.includes("magic") ||
      genreLower.includes("tower") ||
      genreLower.includes("god")
    ) {
      videoUrl = DYNAMIC_BACKGROUND_VIDEOS.fantasy;
    } else if (
      genreLower.includes("cyber") ||
      genreLower.includes("sci") ||
      genreLower.includes("thriller") ||
      genreLower.includes("tech")
    ) {
      videoUrl = DYNAMIC_BACKGROUND_VIDEOS.cyberpunk;
    }

    const scrapedUrls = await scrapeImagesFromUrl(url);

    if (
      clientPanels &&
      Array.isArray(clientPanels) &&
      clientPanels.length > 0
    ) {
      console.log(
        `Utilizing client-provided storyboard modifications directly. Resolving placeholders.`
      );
      const resolvedClientPanels = clientPanels.map(
        (p: unknown, idx: number) => {
          let resolvedImg = p.image_url;
          if (
            !resolvedImg ||
            resolvedImg.startsWith("data:image/svg") ||
            resolvedImg.includes("Awaiting Source")
          ) {
            if (scrapedUrls && scrapedUrls.length > 0) {
              resolvedImg = scrapedUrls[idx % scrapedUrls.length];
            }
          }
          return {
            ...p,
            image_url: resolvedImg,
          };
        }
      );

      return res.json({
        project_id: projectId,
        status: "success",
        video_url: videoUrl,
        panels_processed: resolvedClientPanels.length,
        message:
          "Webtoon animation rendering compile initialized successfully with custom adjustments.",
        panels: resolvedClientPanels,
      });
    }

    let responsePanels = [];

    // Attempt AI-assisted storyboard generation
    try {
      responsePanels = await generateDynamicPanels(
        parsed.title,
        parsed.genre,
        parsed.episode,
        scrapedUrls,
        model
      );
    } catch (err) {
      console.warn(
        "Dynamic panels generation helper failed, using fallback:",
        err
      );
    }

    if (responsePanels.length === 0) {
      console.log(
        "Compiling storyboard with fully programmatic metadata extraction..."
      );
      const numPanels = Math.min(scrapedUrls.length, 5);
      const placeholders = [
        {
          speech_text: `The saga of ${parsed.title} begins! Welcome to this breathtaking adventure.`,
          sfx: "[Echoing Footsteps]",
          motion: "zoom_in",
        },
        {
          speech_text: `Each path unfurls dangerous secrets hidden within the ${parsed.genre} realm.`,
          sfx: "[Mystical Whispers]",
          motion: "pan_right",
        },
        {
          speech_text: `Tension rises as rivals and allies cross paths silently in ${parsed.episode}.`,
          sfx: "[Drums Swell]",
          motion: "zoom_out",
        },
        {
          speech_text: `An overwhelming power is unlocked, casting light across the battlefield!`,
          sfx: "[Energy Burst]",
          motion: "pan_up",
        },
        {
          speech_text: `Thus the chapter rests. Stay tuned for the ultimate epic resolution!`,
          sfx: "[Flute Melancholy]",
          motion: "zoom_in",
        },
      ];

      responsePanels = Array.from({ length: numPanels }).map((_, idx) => {
        const p = placeholders[idx % placeholders.length];
        let imgUrl = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'><rect width='100%' height='100%' fill='%230f0f11'/><text x='50%25' y='50%25' fill='%233f3f46' font-family='sans-serif' font-weight='bold' font-size='20' text-anchor='middle' dominant-baseline='middle'>Scene Frame Awaiting Source</text></svg>`;
        if (scrapedUrls && scrapedUrls.length > 0) {
          imgUrl = scrapedUrls[idx];
        }
        return {
          id: idx + 1,
          speech_text: p.speech_text,
          sfx: p.sfx,
          duration: 4.5,
          motion_type: p.motion,
          image_url: imgUrl,
        };
      });
    }

    return res.json({
      project_id: projectId,
      status: "success",
      video_url: videoUrl,
      panels_processed: responsePanels.length,
      message: `Webtoon ${parsed.title} animation compilation created dynamically.`,
      panels: responsePanels,
    });
  } catch (err: unknown) {
    console.error("[API Generate Error]", err.message || err);
    res
      .status(500)
      .json({
        error: err.message || "An unexpected error occurred during generation.",
      });
  }
});

export default router;
