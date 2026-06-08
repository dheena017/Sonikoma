import { Router } from 'express';

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

export default router;
