import { Router } from 'express';
import { parseWebtoonUrl } from '../../utils/urlUtils.js';
import { scrapeImagesFromUrl } from '../../services/scraperService.js';

const router = Router();

// Live viewer scraper to isolate all images from a pasted Webtoons URL
router.post("/scrape-images", async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: "No URL provided" });
  }
  
  try {
    const parsed = parseWebtoonUrl(url);
    console.log(`[Scraper] Parsing page resource via helper: ${url}`);
    const proxiedUrls = await scrapeImagesFromUrl(url);
    
    return res.json({
      success: true,
      title: parsed.title,
      genre: parsed.genre,
      episode: parsed.episode,
      total_images: proxiedUrls.length,
      images: proxiedUrls,
      raw_images: proxiedUrls,
      panels: []
    });
    
  } catch (error: any) {
    console.error("[Scraper Error] Failed to extract page assets:", error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || "Failed to parse page images.",
      images: [] 
    });
  }
});

export default router;
