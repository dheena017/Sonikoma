import { parseWebtoonUrl } from '../utils/urlUtils.js';

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
