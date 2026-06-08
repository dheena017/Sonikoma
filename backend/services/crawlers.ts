import { extractWebtoonUrl } from '../utils/urlUtils.js';
import { col } from '../utils/colors.js';

async function fetchWithTimeout(url: string, headers: Record<string, string>, timeoutMs = 30000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      headers,
      signal: controller.signal,
      redirect: 'follow',
      cache: 'no-store',
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function tryFetchUrl(url: string, headers: Record<string, string>, timeoutMs = 30000, retries = 2) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetchWithTimeout(url, headers, timeoutMs);
      return response;
    } catch (error) {
      console.warn(`${col.warn('[Scraper]')} Fetch error for ${col.dim(url)} (attempt ${attempt}/${retries}):`, error);
      if (attempt < retries) {
        console.log(`${col.info('[Scraper]')} Retrying fetch for ${col.dim(url)}...`);
        await new Promise((resolve) => setTimeout(resolve, 600));
      }
    }
  }

  return null;
}

function decodeEscapedJsString(value: string): string {
  return value
    .replace(/\\u([0-9A-Fa-f]{4})/g, (_match, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/\\n/g, '')
    .replace(/\\r/g, '')
    .replace(/\\t/g, '')
    .replace(/\\'/g, "'")
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\');
}

function extractImagesFromNuxtPayload(html: string): string[] {
  const pageImages: string[] = [];
  const nuxtIndex = html.indexOf('window.__NUXT__=');
  if (nuxtIndex === -1) {
    return pageImages;
  }

  const endScriptIndex = html.indexOf('</script>', nuxtIndex);
  const scriptBlock = endScriptIndex === -1 ? html.slice(nuxtIndex) : html.slice(nuxtIndex, endScriptIndex);
  const pagesMatch = /pages:\s*\[([\s\S]*?)\]/.exec(scriptBlock);
  if (!pagesMatch) {
    return pageImages;
  }

  const pagesContent = pagesMatch[1];
  const srcRegex = /src:\s*"((?:\\.|[^"\\])*)"/g;
  let match;
  while ((match = srcRegex.exec(pagesContent)) !== null) {
    const decoded = decodeEscapedJsString(match[1]);
    if (decoded.startsWith('http://') || decoded.startsWith('https://')) {
      pageImages.push(decoded);
    }
  }

  return pageImages;
}

/**
 * Helper function to safely crawl and isolate absolute webtoon panel images with unescaped references
 */
export async function scrapeImagesFromUrl(url: string, source?: string): Promise<string[]> {
  try {
    let fetchUrl = extractWebtoonUrl(url);
    const fetchHeaders = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Referer": source === 'webcomicsapp' ? "https://www.webcomicsapp.com/" : "https://www.webtoons.com/",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Cache-Control": "no-cache",
      "Pragma": "no-cache",
      "Cookie": "needZoneZone=true; locale=en; cc=US; ageGatePass=true; adult=true"
    };

    console.log(`${col.info('[Scraper]')} Requesting: ${col.dim(fetchUrl)}`);
    let response = await tryFetchUrl(fetchUrl, fetchHeaders, 45000);
    
    if (response) {
      const statusCol = response.status === 200 ? col.success : col.warn;
      console.log(`${col.info('[Scraper]')} Initial fetch status: ${statusCol(`${response.status} (${response.statusText})`)}`);
    } else {
      console.warn(`${col.warn('[Scraper]')} Initial fetch failed before receiving a response.`);
    }

    if (!response || !response.ok) {
      if (response) {
        const errText = await response.text().then(t => t.substring(0, 400)).catch(() => "");
        console.warn(`${col.warn('[Scraper]')} Initial fetch failed. Status: ${col.error(String(response.status))}. Body preview: ${col.dim(errText)}`);
      } else {
        console.warn(`${col.warn('[Scraper]')} Initial fetch failed without a response object.`);
      }
      
      try {
        const urlObj = new URL(url);
        let pathParts = urlObj.pathname.split('/').filter(Boolean);
        const rxRegion = /^[a-z]{2}(-[a-z]{2,4})?$/i;
        if (pathParts.length > 0 && !rxRegion.test(pathParts[0])) {
          urlObj.pathname = '/en/' + pathParts.join('/');
          fetchUrl = urlObj.toString();
          console.log(`${col.info('[Scraper]')} Fallback: Re-trying fallback regional URL: ${col.dim(fetchUrl)}`);
          response = await tryFetchUrl(fetchUrl, fetchHeaders, 45000);
          if (response) {
            console.log(`${col.info('[Scraper]')} Fallback fetch status: ${response.status === 200 ? col.success(String(response.status)) : col.warn(String(response.status))}`);
            if (!response.ok) {
              const fallbackErrText = await response.text().then(t => t.substring(0, 400)).catch(() => "");
              console.warn(`${col.warn('[Scraper]')} Fallback fetch also failed. Body preview: ${col.dim(fallbackErrText)}`);
            }
          } else {
            console.warn(`${col.warn('[Scraper]')} Fallback fetch failed before receiving a response.`);
          }
        }
      } catch (err) {
        console.warn(`${col.warn('[Scraper]')} Regional completion fallback attempt failed in helper:`, err);
      }
    }
    
    if (!response || !response.ok) {
      const statusMessage = response ? `Status ${response.status}` : 'No response';
      console.error(`${col.error('[Scraper]')} All fetch attempts failed (${statusMessage}).`);

      // Attempt Playwright headless browser fallback when direct fetch fails
      try {
        console.log(`${col.info('[Scraper]')} Attempting Playwright headless-browser fallback to render page.`);
        const { chromium } = await import('playwright');
        const browser = await chromium.launch({ headless: true });
        const page = await browser.newPage({
          userAgent: fetchHeaders['User-Agent'],
          extraHTTPHeaders: {
            Referer: fetchHeaders['Referer'],
          },
        });

        await page.goto(fetchUrl, { waitUntil: 'networkidle', timeout: 45000 });
        const pwHtml = await page.content();
        await browser.close();

        // Use the rendered HTML from Playwright going forward
        response = {
          ok: true,
          status: 200,
          statusText: 'OK',
          text: async () => pwHtml,
        } as any;
        console.log(`${col.info('[Scraper]')} Playwright fallback succeeded.`);
      } catch (pwErr) {
        console.warn(`${col.warn('[Scraper]')} Playwright fallback failed:`, pwErr);
      }
    }
    
    if (!response || !response.ok) {
      const statusDetails = response ? `Status ${response.status}` : 'No response';
      console.error(`${col.error('[Scraper]')} Final response was not OK (${statusDetails}). Cannot read text.`);
      throw new Error(`Failed to retrieve page content. ${statusDetails}`);
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
      console.log(`${col.info('[Scraper]')} Isolated comic reader container tag ${col.brightGreen(startTag)} at position ${col.brightYellow(String(startIdx))}`);

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
        console.log(`${col.info('[Scraper]')} Perfectly balanced ${col.brightGreen(tagType + '.viewer_lst')} container found. Slicing from ${col.brightYellow(String(startIdx))} to ${col.brightYellow(String(absoluteEndIdx))}`);
        searchBlock = html.substring(startIdx, absoluteEndIdx);
      } else {
        console.log(`${col.info('[Scraper]')} ${col.warn('Could not find balanced closing')} ${col.brightGreen(tagType)} tag. Slicing 300,000 characters from start container.`);
        searchBlock = html.substring(startIdx, startIdx + 300000);
      }
    } else {
      const candidateKeys = ['id="_imageList"', 'class="_imageList"', 'class="viewer_img"', 'class="viewer_lst"', 'id="image_list"'];
      for (const key of candidateKeys) {
        const potentialIdx = html.indexOf(key);
        const bodyIdx = html.indexOf("<body");
        if (potentialIdx !== -1 && (bodyIdx === -1 || potentialIdx > bodyIdx)) {
          startIdx = potentialIdx;
          console.log(`${col.info('[Scraper]')} Fallback isolated comic container using key ${col.brightGreen(key)} at position ${col.brightYellow(String(startIdx))}`);
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
          console.log(`${col.info('[Scraper]')} Confirmed bounding container end tag ${col.brightGreen(endMatch[0])} at position ${col.brightYellow(String(endIdx))}`);
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
          console.log(`${col.info('[Scraper]')} Confirmed bounding container. Slicing HTML viewer section from index ${col.brightYellow(String(startIdx))} to ${col.brightYellow(String(endIdx))}`);
          searchBlock = html.substring(startIdx, endIdx);
        } else {
          console.log(`${col.info('[Scraper]')} ${col.warn('Bounding container end not found')}. Slicing 300,000 characters from start container.`);
          searchBlock = html.substring(startIdx, startIdx + 300000);
        }
      } else {
        console.log(`${col.info('[Scraper]')} ${col.warn('Comic reader container not found in HTML')}. Scanning full page as fallback.`);
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

    const nuxtPageImages = extractImagesFromNuxtPayload(html);
    if (nuxtPageImages.length > 0) {
      console.log(`${col.info('[Scraper]')} Extracted ${col.success(String(nuxtPageImages.length))} image URLs from Nuxt payload.`);
      nuxtPageImages.forEach((img) => imageSet.add(img));
    }

    if (imageSet.size === 0) {
      console.log(`${col.info('[Scraper]')} Structural parser returned 0 images. Falling back to regex scanners.`);
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
    
    console.log(`${col.label('[Helper Scraper]')} Extracted ${col.success(String(filteredImages.length))} active frame candidates.`);
    
    const finalImages = filteredImages;

    if (finalImages.length === 0) {
      console.warn(`${col.warn('[Scraper]')} ${col.error('Crawler found 0 eligible comic panel images.')}`);
      throw new Error("No eligible comic panel images were found. The Webtoon page might be structured differently or access is restricted.");
    }

    return finalImages.map(img => `/api/proxy-image?url=${encodeURIComponent(img)}`);
  } catch (error) {
    console.error(`${col.error('[Helper Scraper Error]')} Failed to extract page assets:`, error);
    throw error;
  }
}
