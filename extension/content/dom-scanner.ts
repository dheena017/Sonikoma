/**
 * extension/content/dom-scanner.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * TypeScript High-Precision Manga & Webtoon Harvester.
 * Specifically tuned for Webtoons.com, Naver, MangaDex, Asura, Reaper, ComicK,
 * Bilibili Comics, MangaReader, and generic webtoon DOMs.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export interface ScannedImage {
  src: string;
  width?: number;
  height?: number;
  top?: number;
}

export class DomMangaScanner {
  static getRealImageSrc(el: Element): string {
    if (!el) return "";

    const possibleAttrs = [
      "data-url",
      "data-src",
      "data-original",
      "data-lazy-src",
      "data-echo",
      "data-real-src",
      "data-cdn",
      "data-full-url",
      "data-srcset",
      "srcset",
      "src",
    ];

    for (const attr of possibleAttrs) {
      const val = el.getAttribute(attr);
      if (val && typeof val === "string") {
        const trimmed = val.trim();
        // Ignore transparent placeholder gifs and svgs
        if (
          trimmed.length > 5 &&
          !trimmed.startsWith("data:image/gif") &&
          !trimmed.startsWith("data:image/svg") &&
          !trimmed.includes("blank.gif") &&
          !trimmed.includes("spacer.gif") &&
          !trimmed.includes("placeholder")
        ) {
          const firstUrl = trimmed.split(",")[0].trim().split(" ")[0].trim();
          if (firstUrl.startsWith("//")) return `https:${firstUrl}`;
          if (firstUrl.startsWith("http://") || firstUrl.startsWith("https://")) return firstUrl;
          if (firstUrl.startsWith("/")) return `${window.location.origin}${firstUrl}`;
          return firstUrl;
        }
      }
    }

    // Check background-image in inline style or computed style
    const bg = (el as HTMLElement).style?.backgroundImage || window.getComputedStyle(el).backgroundImage;
    if (bg && bg.includes("url(")) {
      const match = bg.match(/url\(['"]?([^'"]+)['"]?\)/);
      if (match && match[1]) {
        let clean = match[1].trim();
        if (clean.startsWith("//")) clean = `https:${clean}`;
        if (clean.startsWith("/")) clean = `${window.location.origin}${clean}`;
        if (
          !clean.startsWith("data:image/gif") &&
          !clean.startsWith("data:image/svg") &&
          !clean.includes("blank.gif")
        ) {
          return clean;
        }
      }
    }

    return "";
  }

  static scanChapterImages(): ScannedImage[] {
    const images: ScannedImage[] = [];
    const seen = new Set<string>();

    // Dedicated high-priority selectors for major manga platforms
    const candidateSelectors = [
      // Webtoons.com (Desktop & Mobile)
      "#_imageList img",
      "#_imageList img._images",
      "img._images",
      "#_viewerBox img",
      ".viewer_lst img",
      ".viewer_img img",
      ".viewer_lst .viewer_img img",
      // Naver Webtoon & Bilibili
      ".wt_viewer img",
      "#comic_view_area img",
      ".view_area img",
      // MangaDex & Standard Scrapers
      ".reader-area img",
      ".comic-page img",
      ".chapter-content img",
      ".reading-content img",
      ".entry-content img",
      ".page-break img",
      ".container-chapter-reader img",
      ".v-reader img",
      "#reader img",
      "#viewer img",
      "#chapter-images img",
      "div[class*='viewer'] img",
      "div[class*='reader'] img",
      "div[id*='viewer'] img",
      "div[id*='reader'] img",
      "img[data-url]",
      "img[data-src]",
      "img[data-original]",
      "article img",
      "main img",
      "img",
    ];

    let foundElements: Element[] = [];
    for (const sel of candidateSelectors) {
      try {
        const nodes = Array.from(document.querySelectorAll(sel));
        if (nodes.length >= 2) {
          // Verify that at least one has a valid real source
          const hasValid = nodes.some((n) => Boolean(this.getRealImageSrc(n)));
          if (hasValid) {
            foundElements = nodes;
            break;
          }
        }
      } catch (_) {}
    }

    if (foundElements.length === 0) {
      foundElements = Array.from(
        document.querySelectorAll("img, picture source, [style*='background-image']")
      );
    }

    for (const el of foundElements) {
      const src = this.getRealImageSrc(el);
      if (!src || seen.has(src)) continue;

      const rect = el.getBoundingClientRect();
      const imgEl = el as HTMLImageElement;
      const naturalWidth = imgEl.naturalWidth || rect.width || 0;
      const naturalHeight = imgEl.naturalHeight || rect.height || 0;

      // If the image was harvested from data attributes (lazy loaded like on Webtoons), do NOT discard based on natural dimensions
      const hasLazyAttr = Boolean(
        el.getAttribute("data-url") ||
        el.getAttribute("data-src") ||
        el.getAttribute("data-original") ||
        el.getAttribute("data-lazy-src") ||
        el.getAttribute("data-real-src") ||
        el.getAttribute("data-echo") ||
        el.getAttribute("data-cdn") ||
        el.getAttribute("data-full-url")
      );

      // Only check natural dimensions if it wasn't lazy loaded and it has rendered dimensions
      if (!hasLazyAttr) {
        if (naturalWidth > 0 && naturalWidth < 80 && naturalHeight > 0 && naturalHeight < 80) {
          continue;
        }
      }

      // Filter out small social icons, tracking pixels, logos
      const lowerSrc = src.toLowerCase();
      const isSystemAsset =
        lowerSrc.includes("favicon") ||
        lowerSrc.includes("avatar") ||
        lowerSrc.includes("logo") ||
        lowerSrc.includes("pixel") ||
        lowerSrc.includes("advert") ||
        lowerSrc.includes("icon_") ||
        lowerSrc.includes("btn_") ||
        lowerSrc.includes("button_") ||
        lowerSrc.includes("blank.gif") ||
        lowerSrc.includes("spacer.gif");

      if (isSystemAsset) {
        // If it's a known system asset or placeholder, skip it
        if (!hasLazyAttr || (naturalWidth > 0 && naturalWidth < 120 && naturalHeight > 0 && naturalHeight < 120)) {
          continue;
        }
      }

      seen.add(src);
      images.push({
        src,
        width: naturalWidth > 100 ? naturalWidth : 800,
        height: naturalHeight > 100 ? naturalHeight : 1200,
        top: rect.top + window.scrollY,
      });
    }

    return images;
  }

  static extractPageMetadata() {
    let seriesTitle = "";
    let chapterTitle = "";

    const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute("content");
    const rawTitle = ogTitle || document.title || "";
    if (rawTitle) {
      const parts = rawTitle.split(/[-|–—»•:]/);
      if (parts.length >= 2) {
        seriesTitle = parts[0].trim();
        chapterTitle = parts.slice(1).join(" - ").trim();
      } else {
        seriesTitle = rawTitle.trim();
      }
    }

    const heading = document.querySelector("h1, h2, .subj, .chapter-title, .episode-title, .subj_episode");
    if (heading && heading.textContent) {
      chapterTitle = heading.textContent.trim();
    }

    return {
      seriesTitle: seriesTitle || document.title || window.location.hostname,
      chapterTitle: chapterTitle || "Active Chapter",
      url: window.location.href,
      domain: window.location.hostname,
    };
  }
}

if (typeof window !== "undefined") {
  (window as any).DomMangaScanner = DomMangaScanner;
}
