import { Router } from 'express';
import { extractWebtoonUrl, parseWebtoonUrl } from '../../utils/urlUtils.js';
import { scrapeImagesFromUrl } from '../../services/scraperService.js';
import { col } from '../../utils/colors.js';

const router = Router();

// Live viewer scraper to isolate all image URLs from a pasted comic viewer URL
router.post("/scrape-images", async (req, res) => {
  const { url, source } = req.body;
  if (!url) {
    return res.status(400).json({ error: "No URL provided" });
  }

  try {
    const normalizedUrl = extractWebtoonUrl(url);
    const parsed = parseWebtoonUrl(normalizedUrl);
    console.log(
      `${col.info('[Scraper]')} Scrape request received - source: ${col.brightCyan(source || 'unknown')}, url: ${col.brightCyan(normalizedUrl)}`
    );

    const proxiedUrls = await scrapeImagesFromUrl(normalizedUrl, source);

    return res.json({
      success: true,
      title: parsed.title,
      genre: parsed.genre,
      episode: parsed.episode,
      total_images: proxiedUrls.length,
      images: proxiedUrls,
      raw_images: proxiedUrls,
      panels: [],
      debug: {
        normalized_url: normalizedUrl,
        source: source || null,
      }
    });

  } catch (error: any) {
    console.error(`${col.error('[Scraper Error]')} Failed to extract page assets:`, error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to parse page images.",
      error: error.message || null,
      source: source || null,
      request_url: url,
      images: []
    });
  }
});

export default router;
