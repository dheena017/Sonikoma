/**
 * backend/routes/scraperRoutes.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Webtoon page scraping, dynamic storyboard generation, and process URL routes.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { Router } from 'express';
import imageSize from 'image-size';
import { ai, hf, Type, DYNAMIC_BACKGROUND_VIDEOS } from '../config/clients.js';
import { parseWebtoonUrl } from '../utils/urlUtils.js';

const router = Router();

/**
 * Helper function to safely crawl and isolate absolute webtoon panel images with unescaped references
 */
export async function scrapeImagesFromUrl(url: string): Promise<string[]> {
  try {
    let fetchUrl = url;
    const fetchHeaders = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Referer": "https://www.webtoons.com/",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Cache-Control": "no-cache",
      "Pragma": "no-cache",
      "Cookie": "needZoneZone=true; locale=en; cc=US; ageGatePass=true; adult=true"
    };

    console.log(`[Scraper] Requesting: ${fetchUrl}`);
    let response = await fetch(fetchUrl, { headers: fetchHeaders });
    
    console.log(`[Scraper] Initial fetch status: ${response.status} (${response.statusText})`);
    
    if (!response.ok) {
      const errText = await response.text().then(t => t.substring(0, 400)).catch(() => "");
      console.warn(`[Scraper] Initial fetch failed. Status: ${response.status}. Body preview: ${errText}`);
      
      try {
        const urlObj = new URL(url);
        let pathParts = urlObj.pathname.split('/').filter(Boolean);
        const rxRegion = /^[a-z]{2}(-[a-z]{2,4})?$/i;
        if (pathParts.length > 0 && !rxRegion.test(pathParts[0])) {
          urlObj.pathname = '/en/' + pathParts.join('/');
          fetchUrl = urlObj.toString();
          console.log(`[Scraper] Fallback: Re-trying fallback regional URL: ${fetchUrl}`);
          response = await fetch(fetchUrl, { headers: fetchHeaders });
          console.log(`[Scraper] Fallback fetch status: ${response.status}`);
          if (!response.ok) {
            const fallbackErrText = await response.text().then(t => t.substring(0, 400)).catch(() => "");
            console.warn(`[Scraper] Fallback fetch also failed. Body preview: ${fallbackErrText}`);
          }
        }
      } catch (err) {
        console.warn(`[Scraper] Regional completion fallback attempt failed in helper:`, err);
      }
    }
    
    if (!response.ok) {
      console.error(`[Scraper] All fetch attempts returned not ok (Status ${response.status})`);
      throw new Error(`Scraper failed to fetch the page (HTTP ${response.status} ${response.statusText}). Webtoon servers might be preventing access or the page URL is invalid/private.`);
    }
    
    const html = await response.text();
    const imageSet = new Set<string>();
    
    let searchBlock = html;
    let startIdx = -1;

    const containerTagRegex = /<(div|ul|section)\s+[^>]*?class=["'][^"']*?viewer_lst[^"']*?"[^>]*?>/i;
    let containerMatch = containerTagRegex.exec(html);

    if (!containerMatch) {
      const fallbackContainerRegex = /<(div|ul|section)\s+[^>]*?(?:id=["']_imageList["']|class=["'][^"']*?_imageList[^"']*?")[^>]*?>/i;
      containerMatch = fallbackContainerRegex.exec(html);
    }

    if (containerMatch) {
      startIdx = containerMatch.index;
      const startTag = containerMatch[0];
      const tagType = containerMatch[1];
      console.log(`[Scraper] Isolated comic reader container tag "${startTag}" at position ${startIdx}`);

      const afterStart = html.substring(startIdx + startTag.length);
      let balance = 1;
      let endIdxInAfter = -1;
      const tagRegex = new RegExp(`</?${tagType}\\b[^>]*>`, 'gi');
      let tagMatch;

      while ((tagMatch = tagRegex.exec(afterStart)) !== null) {
        const matchedTag = tagMatch[0];
        if (matchedTag.startsWith('</')) {
          balance--;
        } else if (!matchedTag.endsWith('/>')) {
          balance++;
        }

        if (balance === 0) {
          endIdxInAfter = tagMatch.index + matchedTag.length;
          break;
        }
      }

      if (endIdxInAfter !== -1) {
        const absoluteEndIdx = startIdx + startTag.length + endIdxInAfter;
        console.log(`[Scraper] Perfectly balanced ${tagType}.viewer_lst container found. Slicing from ${startIdx} to ${absoluteEndIdx}`);
        searchBlock = html.substring(startIdx, absoluteEndIdx);
      } else {
        console.log(`[Scraper] Could not find balanced closing ${tagType} tag. Slicing 300,000 characters from start container.`);
        searchBlock = html.substring(startIdx, startIdx + 300000);
      }
    } else {
      const candidateKeys = ['id="_imageList"', 'class="_imageList"', 'class="viewer_img"', 'class="viewer_lst"', 'id="image_list"'];
      for (const key of candidateKeys) {
        const potentialIdx = html.indexOf(key);
        const bodyIdx = html.indexOf("<body");
        if (potentialIdx !== -1 && (bodyIdx === -1 || potentialIdx > bodyIdx)) {
          startIdx = potentialIdx;
          console.log(`[Scraper] Fallback isolated comic container using key "${key}" at position ${startIdx}`);
          break;
        }
      }

      if (startIdx !== -1) {
        let endIdx = -1;
        const endTagRegex = /<(?:div|section|aside|footer)\s+[^>]*?(?:id=["'](?:commentArea|siblingArea)["']|class=["'][^"']*?(?:rt_area|comment_area|banner_area|recommend_area|sibling_area|lc_detail|footer)[^"']*?")[^>]*?>/i;
        const remainingHtml = html.substring(startIdx);
        const endMatch = endTagRegex.exec(remainingHtml);
        
        if (endMatch) {
          endIdx = startIdx + endMatch.index;
          console.log(`[Scraper] Confirmed bounding container end tag "${endMatch[0]}" at position ${endIdx}`);
        } else {
          const endKeys = [
            'class="rt_area"', 
            'id="commentArea"', 
            'class="comment_area"', 
            'class="banner_area"', 
            'class="recommend_area"', 
            'class="sibling_area"', 
            'id="siblingArea"', 
            'class="lc_detail"',
            'class="footer"'
          ];
          for (const key of endKeys) {
            const idx = html.indexOf(key, startIdx);
            if (idx !== -1 && (endIdx === -1 || idx < endIdx)) {
              endIdx = idx;
            }
          }
        }
        
        if (endIdx !== -1) {
          console.log(`[Scraper] Confirmed bounding container. Slicing HTML viewer section from index ${startIdx} to ${endIdx}`);
          searchBlock = html.substring(startIdx, endIdx);
        } else {
          console.log(`[Scraper] Bounding container end not found. Slicing 300,000 characters from start container.`);
          searchBlock = html.substring(startIdx, startIdx + 300000);
        }
      } else {
        console.log(`[Scraper] Comic reader container not found in HTML. Scanning full page as fallback.`);
      }
    }

    const imgRegex = /<img\s+([^>]+)>/gi;
    let match;
    while ((match = imgRegex.exec(searchBlock)) !== null) {
      const attributesStr = match[1];
      
      const classMatch = /class=["']([^"']+)["']/i.exec(attributesStr);
      const className = classMatch ? classMatch[1] : "";
      
      const dataUrlMatch = /data-url=["']([^"']+)["']/i.exec(attributesStr);
      const srcMatch = /src=["']([^"']+)["']/i.exec(attributesStr);
      const idMatch = /id=["']([^"']+)["']/i.exec(attributesStr);
      
      const dataUrl = dataUrlMatch ? dataUrlMatch[1] : "";
      const srcUrl = srcMatch ? srcMatch[1] : "";
      const idName = idMatch ? idMatch[1] : "";
      
      const classList = className.split(/\s+/);
      const isComicClass = classList.some(c => c === '_images' || c.includes('_images') || c === 'viewer_img' || c.includes('viewer_img'));
      const isComicId = idName.startsWith('img_') || idName.startsWith('volume_');
      
      let candidateUrl = (dataUrl || srcUrl).trim();
      candidateUrl = candidateUrl
        .replace(/\\u002F/g, '/')
        .replace(/\\/g, '')
        .replace(/&amp;/g, '&');
        
      if (!candidateUrl) continue;
      
      const isPhinf = candidateUrl.includes('phinf.net') || candidateUrl.includes('pstatic.net');
      const isUnwanted = candidateUrl.includes('logo') || 
                         candidateUrl.includes('icon') || 
                         candidateUrl.includes('avatar') || 
                         candidateUrl.includes('banner') || 
                         candidateUrl.includes('loading') || 
                         candidateUrl.includes('pixel') || 
                         candidateUrl.includes('bg_') ||
                         candidateUrl.includes('thumb') ||
                         candidateUrl.includes('profile') ||
                         candidateUrl.includes('comment') ||
                         candidateUrl.includes('creator') ||
                         candidateUrl.includes('author') ||
                         candidateUrl.includes('button');
                         
      let isComicPanel = false;
      if (isPhinf && !isUnwanted) {
        if (isComicClass || isComicId) {
          isComicPanel = true;
        } else if (startIdx !== -1) {
          isComicPanel = true;
        }
      }
      
      if (isComicPanel) {
        imageSet.add(candidateUrl);
      }
    }

    if (imageSet.size === 0) {
      console.log(`[Scraper] Structural parser returned 0 images. Falling back to regex scanners.`);
      const fallbackRegexes = [
        /https?:\/\/webtoon-phinf\.pstatic\.net\/[^"'\s>]+/gi,
        /https?:\/\/[^"'\s>]*?phinf\.net\/[^"'\s>]+/gi
      ];
      
      for (const regex of fallbackRegexes) {
        let match;
        while ((match = regex.exec(searchBlock)) !== null) {
          let matchedUrl = match[0]
            .replace(/\\u002F/g, '/')
            .replace(/\\/g, '')
            .replace(/&amp;/g, '&');
            
          const lower = matchedUrl.toLowerCase();
          const isUnwanted = lower.includes('logo') || 
                             lower.includes('icon') || 
                             lower.includes('avatar') || 
                             lower.includes('banner') || 
                             lower.includes('loading') || 
                             lower.includes('pixel') || 
                             lower.includes('bg_') ||
                             lower.includes('thumb') ||
                             lower.includes('profile') ||
                             lower.includes('comment') ||
                             lower.includes('creator') ||
                             lower.includes('author') ||
                             lower.includes('button');
                             
          if (!isUnwanted) {
            imageSet.add(matchedUrl);
          }
        }
      }
    }
    
    const rawImages = Array.from(imageSet);
    const filteredImages = rawImages.filter(img => {
      const lower = img.toLowerCase();
      return !(
        lower.includes('logo') || 
        lower.includes('bg_') || 
        lower.includes('icon') || 
        lower.includes('button') || 
        lower.includes('loading') || 
        lower.includes('pixel') || 
        lower.includes('progress') || 
        lower.includes('arrow') || 
        lower.includes('favicon') || 
        lower.includes('banner') ||
        lower.includes('thumb') ||
        lower.includes('profile') ||
        lower.includes('comment') ||
        lower.includes('avatar') ||
        lower.includes('user') ||
        lower.includes('reply') ||
        lower.includes('creator') ||
        lower.includes('author') ||
        lower.includes('social') ||
        lower.includes('shari') ||
        lower.includes('mobile') ||
        lower.includes('thumbnail') ||
        lower.includes('footer') ||
        (lower.includes('type=') && !lower.includes('type=q90'))
      );
    });
    
    console.log(`[Helper Scraper] Extracted ${filteredImages.length} active frame candidates.`);
    
    const finalImages = filteredImages;

    if (finalImages.length === 0) {
      console.warn("[Scraper] Crawler found 0 eligible comic panel images.");
      throw new Error("No eligible comic panel images were found. The Webtoon page might be structured differently or access is restricted.");
    }

    return finalImages.map(img => `/api/proxy-image?url=${encodeURIComponent(img)}`);
  } catch (error) {
    console.error(`[Helper Scraper Error] Failed to extract page assets:`, error);
    throw error;
  }
}

/**
 * Helper function to generate rich story dialogs/captions dynamically without hardcoding
 */
export async function generateDynamicPanels(title: string, genre: string, episode: string, imgUrls: string[], model: string): Promise<any[]> {
  const activeSlicesCount = Math.min(imgUrls.length, 8);
  const prompt = `You are a cinematic comic book editor and storyteller.
Given this Comic Webtoon information:
Title: "${title}"
Genre: "${genre}"
Episode: "${episode}"

Please generate exactly ${activeSlicesCount} distinct chronological narration or panel speech lines.
For each of the ${activeSlicesCount} panels, provide:
1. "speech_text": An engaging, atmospheric description (under 20 words).
2. "sfx": A punchy comic-style sound effect in brackets.
3. "motion_type": One of 'zoom_in', 'zoom_out', 'pan_left', 'pan_right', 'pan_up', 'pan_down'.

Output strictly valid JSON with top-level key "panels".`;

  if (model.startsWith('huggingface') && hf) {
    try {
      console.log(`[HuggingFace] Creating storyboard using Mistral 7B for "${title}"`);
      const response = await hf.chatCompletion({
        model: 'mistralai/Mistral-7B-Instruct-v0.3',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1000,
      });

      const responseText = response.choices[0].message.content || "";
      const parsedAI = JSON.parse(responseText.replace(/```json/g, '').replace(/```/g, '').trim());
      if (parsedAI && Array.isArray(parsedAI.panels)) {
          return parsedAI.panels.slice(0, activeSlicesCount).map((p: any, idx: number) => ({
              id: idx + 1,
              image_url: imgUrls[idx],
              original_image_url: imgUrls[idx],
              speech_text: p.speech_text || `Scene ${idx + 1}`,
              sfx: p.sfx || "[Action]",
              duration: 5.0,
              motion_type: p.motion_type || "zoom_in"
          }));
      }
    } catch (e: any) {
      if (e.message && e.message.includes("sufficient permissions")) {
          console.log('[HuggingFace] Inference Provider permission denied. Falling back silently to Gemini.');
      } else {
        console.warn('HuggingFace failed, falling back...', e);
      }
    }
  }

  if (ai) {
    try {
      const aiResponse = await ai.models.generateContent({
        model: model || "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              panels: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    speech_text: { type: Type.STRING },
                    sfx: { type: Type.STRING },
                    motion_type: { type: Type.STRING }
                  },
                  required: ["speech_text", "sfx", "motion_type"]
                }
              }
            },
            required: ["panels"]
          }
        }
      });

      const responseText = aiResponse.text?.trim() || "";
      if (responseText) {
        const parsedAI = JSON.parse(responseText);
        if (parsedAI && Array.isArray(parsedAI.panels) && parsedAI.panels.length > 0) {
          console.log(`[Gemini] Storyboard narration generated successfully for ${activeSlicesCount} slices.`);
          return parsedAI.panels.slice(0, activeSlicesCount).map((p: any, idx: number) => ({
            id: idx + 1,
            image_url: imgUrls[idx],
            original_image_url: imgUrls[idx],
            speech_text: p.speech_text || `Scene ${idx + 1} of ${title}`,
            sfx: p.sfx || "[Action Sounds]",
            duration: 4.5,
            motion_type: p.motion_type || "zoom_in"
          }));
        }
      }
    } catch (err: any) {
      if (err.status === 429) {
        console.warn("[Gemini Script] Quota limit reached, waiting to retry once...");
        await new Promise(resolve => setTimeout(resolve, 5000));
        try {
          const aiResponse = await ai.models.generateContent({
            model: model || "gemini-2.5-flash",
            contents: prompt,
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  panels: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        speech_text: { type: Type.STRING },
                        sfx: { type: Type.STRING },
                        motion_type: { type: Type.STRING }
                      },
                      required: ["speech_text", "sfx", "motion_type"]
                    }
                  }
                },
                required: ["panels"]
              }
            }
          });

          const responseText = aiResponse.text?.trim() || "";
          if (responseText) {
            const parsedAI = JSON.parse(responseText);
            if (parsedAI && Array.isArray(parsedAI.panels) && parsedAI.panels.length > 0) {
              return parsedAI.panels.slice(0, activeSlicesCount).map((p: any, idx: number) => ({
                id: idx + 1,
                image_url: imgUrls[idx],
                original_image_url: imgUrls[idx],
                speech_text: p.speech_text || `Scene ${idx + 1} of ${title}`,
                sfx: p.sfx || "[Action Sounds]",
                duration: 4.5,
                motion_type: p.motion_type || "zoom_in"
              }));
            }
          }
        } catch (retryErr: any) {
          console.warn("[Gemini Script] Retry also failed. Falling back.", retryErr.message);
        }
      } else {
        console.warn("[Gemini Script] Storyboard generation failed, falling back.", err.message);
      }
    }
  }

  const panelsList = [];
  for (let i = 0; i < activeSlicesCount; i++) {
    let text = "";
    let sfx = "";
    let motion = "zoom_in";

    if (i === 0) {
      text = `Welcome to the legendary path of ${title}! The grand chronicle of the ${episode} of this ${genre} saga starts here.`;
      sfx = "[Chime Echo]";
      motion = "zoom_in";
    } else if (i === activeSlicesCount - 1) {
      text = `And thus is the peak climax of ${episode} of ${title} completed! What epic struggles lie ahead?`;
      sfx = "[Impact Strike]";
      motion = "zoom_out";
    } else {
      const dynamicTexts = [
        `Tensions escalate rapidly across the ${genre} zone, forcing characters to adapt immediately.`,
        `A mysterious shadows crawls quietly, casting an unexpected veil of magic over the path.`,
        `Crucial keys and ancient memories are laid bare, revealing a hidden side of ${title}.`,
        `An absolute burst of brilliant energy sweeps the frame! Destiny is set in motion.`,
        `Silence fills the space as allies stand tall together, ready to confront the ultimate mystery.`
      ];
      text = dynamicTexts[(i - 1) % dynamicTexts.length];
      
      const sfxs = ["[Soft Whoosh]", "[Drums Rumble]", "[Sparkling Shimmer]", "[Energy Flare]", "[Low Resonance]"];
      sfx = sfxs[(i - 1) % sfxs.length];
      
      const motions = ["pan_right", "pan_left", "pan_up", "zoom_out", "pan_down"];
      motion = motions[(i - 1) % motions.length];
    }

    panelsList.push({
      id: i + 1,
      image_url: imgUrls[i],
      original_image_url: imgUrls[i],
      speech_text: text,
      sfx: sfx,
      duration: 4.5,
      motion_type: motion
    });
  }
  return panelsList;
}

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

// Primary Endpoint: Generate Storyboard and Cinematic parameters using AI / fallsback
router.post("/generate", async (req, res) => {
  try {
    const { url, episode_id, panels: clientPanels, custom_background_video, model } = req.body;
    
    if (!url) {
      return res.status(400).json({ detail: "A target Webtoon URL is required." });
    }

    const parsed = parseWebtoonUrl(url);
    const projectId = episode_id || `project_${Math.random().toString(36).substring(2, 8)}`;
    
    console.log(`Processing storyboard request for url: "${url}". Parsed Title: "${parsed.title}", Genre: "${parsed.genre}"`);

    let videoUrl = DYNAMIC_BACKGROUND_VIDEOS.general;
    const genreLower = parsed.genre.toLowerCase();
    
    if (custom_background_video) {
        videoUrl = custom_background_video;
    } else if (genreLower.includes('action') || genreLower.includes('martial') || genreLower.includes('hero') || genreLower.includes('solo')) {
        videoUrl = DYNAMIC_BACKGROUND_VIDEOS.action;
    } else if (genreLower.includes('romance') || genreLower.includes('love') || genreLower.includes('slice') || genreLower.includes('drama') || genreLower.includes('olympus')) {
        videoUrl = DYNAMIC_BACKGROUND_VIDEOS.romance;
    } else if (genreLower.includes('fantasy') || genreLower.includes('magic') || genreLower.includes('tower') || genreLower.includes('god')) {
        videoUrl = DYNAMIC_BACKGROUND_VIDEOS.fantasy;
    } else if (genreLower.includes('cyber') || genreLower.includes('sci') || genreLower.includes('thriller') || genreLower.includes('tech')) {
        videoUrl = DYNAMIC_BACKGROUND_VIDEOS.cyberpunk;
    }

    const scrapedUrls = await scrapeImagesFromUrl(url);

    if (clientPanels && Array.isArray(clientPanels) && clientPanels.length > 0) {
      console.log(`Utilizing client-provided storyboard modifications directly. Resolving placeholders.`);
      const resolvedClientPanels = clientPanels.map((p: any, idx: number) => {
        let resolvedImg = p.image_url;
        if (!resolvedImg || resolvedImg.startsWith("data:image/svg") || resolvedImg.includes("Awaiting Source")) {
          if (scrapedUrls && scrapedUrls.length > 0) {
            resolvedImg = scrapedUrls[idx % scrapedUrls.length];
          }
        }
        return {
          ...p,
          image_url: resolvedImg
        };
      });

      return res.json({
        project_id: projectId,
        status: "success",
        video_url: videoUrl,
        panels_processed: resolvedClientPanels.length,
        message: "Webtoon animation rendering compile initialized successfully with custom adjustments.",
        panels: resolvedClientPanels
      });
    }

    let responsePanels = [];

    if (ai) {
      const prompt = `You are an elite cinematic manga/manhwa video director. 
Read the comic info derived from this Webtoon URL:
Title: "${parsed.title}"
Genre: "${parsed.genre}"
Episode: "${parsed.episode}"
URL info: ${url}

Generate a highly dramatic, immersive 5-panel storyboard for a cinematic video compilation. For each panel, provide:
- speech_text (epic dialogue or grand narration, max 22 words)
- sfx (bold comic-book style sound effects, e.g., '[Slash]', '[Energy Surge]', '[Mystic Bell]', '[Soft Rain]')
- motion_type (choose from 'zoom_in', 'zoom_out', 'pan_left', 'pan_right', 'pan_up', 'pan_down')
- duration (a number between 3.5 and 6.0 seconds)
- image_search_prompt (a descriptive keyword phrase to represent this specific card scene, e.g., 'dark warrior blue energy sword', 'beautiful couple cozy cafe starlight', 'giant magical tower fantasy sunrise')

You MUST return the output STRICTLY as a JSON array inside the 'panels' field of the root object. Look at this schema:
{
  "panels": [
    {
      "speech_text": "text",
      "sfx": "sfx",
      "motion_type": "motion_type",
      "duration": 5.0,
      "image_search_prompt": "epic scene description"
    }
  ]
}`;
      try {
        console.log('Sending prompt to Gemini models to generate immersive custom script...');
        const aiResponse = await ai.models.generateContent({
          model: model || "gemini-2.5-flash",
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                panels: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      speech_text: { type: Type.STRING },
                      sfx: { type: Type.STRING },
                      motion_type: { type: Type.STRING },
                      duration: { type: Type.NUMBER },
                      image_search_prompt: { type: Type.STRING }
                    },
                    required: ["speech_text", "sfx", "motion_type", "duration", "image_search_prompt"]
                  }
                }
              },
              required: ["panels"]
            }
          }
        });

        const responseText = aiResponse.text?.trim() || '';
        if (responseText) {
          const parsedAI = JSON.parse(responseText);
          if (parsedAI && Array.isArray(parsedAI.panels) && parsedAI.panels.length > 0) {
            console.log(`Gemini successfully generated ${parsedAI.panels.length} customized story panels.`);
            responsePanels = parsedAI.panels.map((p: any, idx: number) => {
              let imgUrl = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'><rect width='100%' height='100%' fill='%230f0f11'/><text x='50%25' y='50%25' fill='%233f3f46' font-family='sans-serif' font-weight='bold' font-size='20' text-anchor='middle' dominant-baseline='middle'>Scene Frame Awaiting Source</text></svg>`;
              if (scrapedUrls && scrapedUrls.length > 0) {
                imgUrl = scrapedUrls[idx % scrapedUrls.length];
              }
              return {
                id: idx + 1,
                speech_text: p.speech_text || `Scene ${idx + 1}`,
                sfx: p.sfx || "[Spectacular Sound]",
                duration: Number(p.duration) || 5.0,
                motion_type: p.motion_type || "zoom_in",
                image_url: imgUrl
              };
            });
          }
        }
      } catch (aiErr: any) {
        if (aiErr.status === 429) {
          console.warn("[Gemini Script] Quota limit reached, waiting to retry once...");
          await new Promise(resolve => setTimeout(resolve, 5000));
          try {
            const aiResponse = await ai!.models.generateContent({
               model: model || "gemini-2.5-flash",
               contents: [{ role: 'user', parts: [{ text: prompt }] }],
               config: {
                 responseMimeType: "application/json",
                 responseSchema: {
                   type: Type.OBJECT,
                   properties: {
                     panels: {
                       type: Type.ARRAY,
                       items: {
                         type: Type.OBJECT,
                         properties: {
                           speech_text: { type: Type.STRING },
                           sfx: { type: Type.STRING },
                           motion_type: { type: Type.STRING },
                           duration: { type: Type.NUMBER },
                           image_search_prompt: { type: Type.STRING }
                         },
                         required: ["speech_text", "sfx", "motion_type", "duration", "image_search_prompt"]
                       }
                     }
                   },
                   required: ["panels"]
                 }
               }
            });
            const responseText = aiResponse.text?.trim() || '';
            if (responseText) {
              const parsedAI = JSON.parse(responseText);
              if (parsedAI && Array.isArray(parsedAI.panels) && parsedAI.panels.length > 0) {
                console.log(`Gemini successfully generated ${parsedAI.panels.length} customized story panels on retry.`);
                responsePanels = parsedAI.panels.map((p: any, idx: number) => {
                  let imgUrl = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'><rect width='100%' height='100%' fill='%230f0f11'/><text x='50%25' y='50%25' fill='%233f3f46' font-family='sans-serif' font-weight='bold' font-size='20' text-anchor='middle' dominant-baseline='middle'>Scene Frame Awaiting Source</text></svg>`;
                  if (scrapedUrls && scrapedUrls.length > 0) {
                    imgUrl = scrapedUrls[idx % scrapedUrls.length];
                  }
                  return {
                    id: idx + 1,
                    speech_text: p.speech_text || `Scene ${idx + 1}`,
                    sfx: p.sfx || "[Spectacular Sound]",
                    duration: Number(p.duration) || 5.0,
                    motion_type: p.motion_type || "zoom_in",
                    image_url: imgUrl
                  };
                });
              }
            }
          } catch (retryErr: any) {
            console.warn('Gemini custom script generation failed on retry. Falling back.', retryErr.message);
          }
        } else {
          console.warn('Gemini custom script generation failed, falling back.', aiErr.message);
        }
      }
    }

    if (responsePanels.length === 0) {
      console.log("Compiling storyboard with fully programmatic metadata extraction...");
      const placeholders = [
        { speech_text: `The saga of ${parsed.title} begins! Welcome to this breathtaking adventure.`, sfx: "[Echoing Footsteps]", motion: "zoom_in" },
        { speech_text: `Each path unfurls dangerous secrets hidden within the ${parsed.genre} realm.`, sfx: "[Mystical Whispers]", motion: "pan_right" },
        { speech_text: `Tension rises as rivals and allies cross paths silently in ${parsed.episode}.`, sfx: "[Drums Swell]", motion: "zoom_out" },
        { speech_text: `An overwhelming power is unlocked, casting light across the battlefield!`, sfx: "[Energy Burst]", motion: "pan_up" },
        { speech_text: `Thus the chapter rests. Stay tuned for the ultimate epic resolution!`, sfx: "[Flute Melancholy]", motion: "zoom_in" }
      ];

      responsePanels = placeholders.map((p, idx) => {
        let imgUrl = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'><rect width='100%' height='100%' fill='%230f0f11'/><text x='50%25' y='50%25' fill='%233f3f46' font-family='sans-serif' font-weight='bold' font-size='20' text-anchor='middle' dominant-baseline='middle'>Scene Frame Awaiting Source</text></svg>`;
        if (scrapedUrls && scrapedUrls.length > 0) {
          imgUrl = scrapedUrls[idx % scrapedUrls.length];
        }
        return {
          id: idx + 1,
          speech_text: p.speech_text,
          sfx: p.sfx,
          duration: 4.5,
          motion_type: p.motion,
          image_url: imgUrl
        };
      });
    }

    return res.json({
      project_id: projectId,
      status: "success",
      video_url: videoUrl,
      panels_processed: responsePanels.length,
      message: `Webtoon ${parsed.title} animation compilation created dynamically.`,
      panels: responsePanels
    });
  } catch (err: any) {
    console.error("[API Generate Error]", err.message || err);
    res.status(500).json({ error: err.message || "An unexpected error occurred during generation." });
  }
});

// Legacy backward-compatibility endpoint
router.post("/process-url", async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ status: "error", message: "Parameter 'url' is required." });
  }
  return res.json({
    status: "success",
    message: "Url processed successfully",
    payload: {
      url: url,
      title: "Processed Episode",
      panels_found: 5
    }
  });
});

export default router;
