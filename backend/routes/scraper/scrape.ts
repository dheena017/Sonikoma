import { Router } from 'express';
import { extractWebtoonUrl, parseWebtoonUrl } from '../../utils/urlUtils.js';
import { scrapeImagesFromUrl } from '../../services/scraperService.js';
import { col } from '../../utils/colors.js';

const router = Router();

// Live viewer scraper to isolate all images from a pasted Webtoons URL
router.post("/scrape-images", async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: "No URL provided" });
  }
  
  try {
    const normalizedUrl = extractWebtoonUrl(url);
    const parsed = parseWebtoonUrl(normalizedUrl);
    console.log(`${col.info('[Scraper]')} Parsing page resource via helper: ${col.brightCyan(normalizedUrl)}`);
    const proxiedUrls = await scrapeImagesFromUrl(normalizedUrl);
    
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
    console.error(`${col.error('[Scraper Error]')} Failed to extract page assets:`, error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || "Failed to parse page images.",
      images: [] 
    });
  }
});

export default router;
