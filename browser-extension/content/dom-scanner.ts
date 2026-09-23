/**
 * extension/content/dom-scanner.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * TypeScript High-Precision Manga & Webtoon Harvester.
 * Specifically tuned for Webtoons.com, Naver, MangaDex, Asura, Reaper, ComicK,
 * Bilibili Comics, MangaReader, MangaFire, Mangakakalot, and all manga DOMs.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export interface ScannedImage {
  index: number;
  src: string;
  width: number;
  height: number;
  top: number;
}

export class DomMangaScanner {
  private static capturedNetworkImages: Set<string> = new Set();
  private static snifferInjected: boolean = false;

  public static initPageSniffer() {
    if (this.snifferInjected || typeof document === "undefined") return;
    this.snifferInjected = true;

    // Listen for custom events dispatched by the page-level interceptor
    window.addEventListener("sonikoma:network_images", (e: any) => {
      if (e && e.detail && Array.isArray(e.detail.images)) {
        for (const url of e.detail.images) {
          if (typeof url === "string" && url.startsWith("http")) {
            this.capturedNetworkImages.add(url);
          }
        }
      }
    });

    // Inject interceptor into the page context to sniff fetch/XHR & global variables
    try {
      const script = document.createElement("script");
      script.setAttribute("type", "text/javascript");
      script.textContent = `
        (function() {
          if (window.__sonikoma_sniffer_active) return;
          window.__sonikoma_sniffer_active = true;
          window.__SONIKOMA_CAPTURED_IMAGES__ = window.__SONIKOMA_CAPTURED_IMAGES__ || [];

          function pushUrls(urls) {
            if (!Array.isArray(urls) || urls.length === 0) return;
            const valid = [];
            for (const u of urls) {
              if (typeof u === 'string' && u.length > 8 && (u.startsWith('http') || u.startsWith('//') || u.startsWith('/'))) {
                let full = u;
                if (full.startsWith('//')) full = 'https:' + full;
                else if (full.startsWith('/')) full = window.location.origin + full;
                if (!window.__SONIKOMA_CAPTURED_IMAGES__.includes(full)) {
                  window.__SONIKOMA_CAPTURED_IMAGES__.push(full);
                  valid.push(full);
                }
              }
            }
            if (valid.length > 0) {
              window.dispatchEvent(new CustomEvent('sonikoma:network_images', { detail: { images: valid } }));
            }
          }

          // 1. Inspect window global variables
          function inspectGlobals() {
            try {
              if (window.__NEXT_DATA__ && window.__NEXT_DATA__.props) {
                const s = JSON.stringify(window.__NEXT_DATA__.props);
                const matches = s.match(/https?:\\/\\/[^"'\s]+\\.(?:jpg|jpeg|png|webp|avif)(?:\\?[^"'\s]*)?/gi);
                if (matches) pushUrls(matches);
              }
              if (window.chapter_data && Array.isArray(window.chapter_data.images)) {
                pushUrls(window.chapter_data.images.map(i => typeof i === 'string' ? i : i.url || i.src));
              }
              if (window.pages && Array.isArray(window.pages)) {
                pushUrls(window.pages.map(i => typeof i === 'string' ? i : i.url || i.src));
              }
              if (window.chapImages && Array.isArray(window.chapImages)) {
                pushUrls(window.chapImages);
              }
              if (window.pData && window.pData.img) {
                pushUrls(Array.isArray(window.pData.img) ? window.pData.img : [window.pData.img]);
              }
              if (window.ts_reader && window.ts_reader.params && window.ts_reader.params.sources) {
                for (const src of window.ts_reader.params.sources) {
                  if (src && Array.isArray(src.images)) pushUrls(src.images);
                }
              }
            } catch (_) {}
          }
          inspectGlobals();
          setTimeout(inspectGlobals, 1500);

          // 2. Intercept window.fetch
          const origFetch = window.fetch;
          if (origFetch) {
            window.fetch = async function(...args) {
              const res = await origFetch.apply(this, args);
              try {
                const clone = res.clone();
                const url = typeof args[0] === 'string' ? args[0] : (args[0] && args[0].url) || '';
                if (url.includes('chapter') || url.includes('api') || url.includes('at-home') || url.includes('pages')) {
                  clone.json().then(data => {
                    const str = JSON.stringify(data);
                    const matches = str.match(/https?:\\/\\/[^"'\s]+\\.(?:jpg|jpeg|png|webp|avif)(?:\\?[^"'\s]*)?/gi);
                    if (matches) pushUrls(matches);
                  }).catch(() => {});
                }
              } catch (_) {}
              return res;
            };
          }

          // 3. Intercept XMLHttpRequest
          const origOpen = XMLHttpRequest.prototype.open;
          const origSend = XMLHttpRequest.prototype.send;
          XMLHttpRequest.prototype.open = function(method, url) {
            this.__sonikoma_req_url = url;
            return origOpen.apply(this, arguments);
          };
          XMLHttpRequest.prototype.send = function() {
            this.addEventListener('load', function() {
              try {
                if (this.responseText && this.responseText.length > 50) {
                  const matches = this.responseText.match(/https?:\\/\\/[^"'\s]+\\.(?:jpg|jpeg|png|webp|avif)(?:\\?[^"'\s]*)?/gi);
                  if (matches && matches.length >= 2) pushUrls(matches);
                }
              } catch (_) {}
            });
            return origSend.apply(this, arguments);
          };
        })();
      `;
      (document.head || document.documentElement).appendChild(script);
      script.remove();
    } catch (_) {}
  }

  // Direct Site API Resolvers
  public static async fetchDirectSiteApi(): Promise<string[]> {
    const url = window.location.href;
    const hostname = window.location.hostname;

    // 1. MangaDex Direct API
    if (hostname.includes("mangadex.org")) {
      const match = url.match(/\/chapter\/([a-f0-9\-]+)/i);
      if (match && match[1]) {
        const chapterId = match[1];
        try {
          const res = await fetch(`https://api.mangadex.org/at-home/server/${chapterId}`);
          if (res.ok) {
            const data = await res.json();
            const baseUrl = data.baseUrl;
            const hash = data.chapter?.hash;
            const files = data.chapter?.data || data.chapter?.dataSaver || [];
            if (baseUrl && hash && files.length > 0) {
              return files.map((f: string) => `${baseUrl}/data/${hash}/${f}`);
            }
          }
        } catch (_) {}
      }
    }

    // 2. ComicK Direct API
    if (hostname.includes("comick.")) {
      const match = url.match(/\/comic\/[^/]+\/([^/?#]+)/i);
      if (match && match[1]) {
        const hid = match[1];
        try {
          const res = await fetch(`https://api.comick.fun/chapter/${hid}`);
          if (res.ok) {
            const data = await res.json();
            const images = data.chapter?.images || [];
            if (images.length > 0) {
              return images.map((img: any) => img.url || `https://meo.comick.pictures/${img.bkey}`);
            }
          }
        } catch (_) {}
      }
    }

    // 3. Scan Embedded Script Tags for Image Arrays (WordPress Manga, Madara, Ts Reader, etc.)
    try {
      const scripts = Array.from(document.querySelectorAll("script:not([src])"));
      for (const script of scripts) {
        const txt = script.textContent || "";
        if (txt.includes("chapter_data") || txt.includes("ts_reader") || txt.includes("pData") || txt.includes("images") || txt.includes("img_data")) {
          const matches = txt.match(/https?:\\?\/\\?\/[^"'\s\\]+\.(?:jpg|jpeg|png|webp|avif)(?:\\?[^"'\s\\]*)?/gi);
          if (matches && matches.length >= 3) {
            const cleaned = matches.map((m) => m.replace(/\\\//g, "/"));
            return Array.from(new Set(cleaned));
          }
        }
      }
    } catch (_) {}

    return [];
  }

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
      "data-img-src",
      "data-lazy",
      "data-splide-lazy",
      "data-deferred",
      "data-hi-res-src",
      "data-origin-src",
      "data-zoom-src",
      "data-cfsrc",
      "data-src-zoom",
      "data-orig-src",
      "data-img",
      "data-image",
      "data-highres",
      "data-fallback",
      "data-path",
      "data-raw",
      "srcset",
      "src",
    ];

    for (const attr of possibleAttrs) {
      const val = el.getAttribute(attr);
      if (val && typeof val === "string") {
        const trimmed = val.trim();
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
          if (firstUrl.startsWith("./") || firstUrl.startsWith("../")) {
            try {
              return new URL(firstUrl, window.location.href).href;
            } catch (_) {
              return firstUrl;
            }
          }
          return firstUrl;
        }
      }
    }

    // Check HTMLImageElement currentSrc or src
    const imgEl = el as HTMLImageElement;
    if (imgEl.currentSrc && typeof imgEl.currentSrc === "string" && imgEl.currentSrc.startsWith("http")) {
      const s = imgEl.currentSrc.toLowerCase();
      if (!s.includes("blank.gif") && !s.includes("spacer.gif") && !s.includes("placeholder")) {
        return imgEl.currentSrc;
      }
    }
    if (imgEl.src && typeof imgEl.src === "string" && imgEl.src.startsWith("http")) {
      const s = imgEl.src.toLowerCase();
      if (!s.includes("blank.gif") && !s.includes("spacer.gif") && !s.includes("placeholder")) {
        return imgEl.src;
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
          !clean.includes("blank.gif") &&
          !clean.includes("spacer.gif")
        ) {
          return clean;
        }
      }
    }

    // Check canvas element data URL fallback
    if (el.tagName === "CANVAS") {
      try {
        const canvas = el as HTMLCanvasElement;
        if (canvas.width > 200 && canvas.height > 200) {
          return canvas.toDataURL("image/png");
        }
      } catch (_) {}
    }

    return "";
  }

  static scanChapterImages(): ScannedImage[] {
    this.initPageSniffer();
    const images: ScannedImage[] = [];
    const seen = new Set<string>();

    // 1. High-priority candidate selectors across all major manga readers & webtoon sites
    const candidateSelectors = [
      // Webtoons.com (Desktop & Mobile)
      "#_imageList img",
      "#_imageList img._images",
      "img._images",
      "#_viewerBox img",
      ".viewer_lst img",
      ".viewer_img img",
      ".viewer_lst .viewer_img img",
      ".wt_viewer img",
      // Naver Webtoon & Bilibili
      "#comic_view_area img",
      ".view_area img",
      // MangaDex & Standard Scrapers
      ".reader--container img",
      ".page--container img",
      ".reader-area img",
      ".comic-page img",
      ".chapter-content img",
      ".reading-content img",
      ".reading-content picture img",
      ".entry-content img",
      ".page-break img",
      "#readerarea img",
      ".readerarea img",
      ".post-content img",
      "#chapter-video-frame img",
      ".container-chapter-reader img",
      ".panel-chapter-info img",
      ".image-horizontal img",
      ".image-vertical img",
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
      "img[data-lazy-src]",
      "article img",
      "main img",
      "canvas",
      "img",
    ];

    let foundElements: Element[] = [];
    for (const sel of candidateSelectors) {
      try {
        const nodes = Array.from(document.querySelectorAll(sel));
        if (nodes.length >= 2) {
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
        document.querySelectorAll("img, picture source, [style*='background-image'], canvas")
      );
    }

    for (const el of foundElements) {
      const src = this.getRealImageSrc(el);
      if (!src || seen.has(src)) continue;

      const rect = el.getBoundingClientRect();
      const imgEl = el as HTMLImageElement;
      const naturalWidth = imgEl.naturalWidth || rect.width || 0;
      const naturalHeight = imgEl.naturalHeight || rect.height || 0;

      const hasLazyAttr = Boolean(
        el.getAttribute("data-url") ||
        el.getAttribute("data-src") ||
        el.getAttribute("data-original") ||
        el.getAttribute("data-lazy-src") ||
        el.getAttribute("data-real-src") ||
        el.getAttribute("data-echo") ||
        el.getAttribute("data-cdn") ||
        el.getAttribute("data-full-url") ||
        el.getAttribute("data-lazy") ||
        el.getAttribute("data-img-src")
      );

      // Filter out tiny icons
      if (!hasLazyAttr) {
        if (naturalWidth > 0 && naturalWidth < 70 && naturalHeight > 0 && naturalHeight < 70) {
          continue;
        }
      }

      // Filter out system assets
      const lowerSrc = src.toLowerCase();
      const isSystemAsset =
        lowerSrc.includes("favicon") ||
        lowerSrc.includes("avatar") ||
        lowerSrc.includes("logo") ||
        lowerSrc.includes("pixel") ||
        lowerSrc.includes("advert") ||
        lowerSrc.includes("share_") ||
        lowerSrc.includes("icon_") ||
        lowerSrc.includes("btn_") ||
        lowerSrc.includes("button_") ||
        lowerSrc.includes("blank.gif") ||
        lowerSrc.includes("spacer.gif") ||
        lowerSrc.includes("tracking") ||
        lowerSrc.includes("analytics");

      if (isSystemAsset) {
        if (!hasLazyAttr || (naturalWidth > 0 && naturalWidth < 100 && naturalHeight > 0 && naturalHeight < 100)) {
          continue;
        }
      }

      seen.add(src);
      images.push({
        index: images.length + 1,
        src,
        width: naturalWidth > 100 ? naturalWidth : 800,
        height: naturalHeight > 100 ? naturalHeight : 1200,
        top: Math.round(rect.top + window.scrollY),
      });
    }

    // 2. Include any captured network/API images that haven't been added yet
    if (this.capturedNetworkImages.size > 0) {
      let extraTop = images.length > 0 ? images[images.length - 1].top + 1000 : 0;
      for (const netUrl of this.capturedNetworkImages) {
        if (!seen.has(netUrl)) {
          seen.add(netUrl);
          images.push({
            index: images.length + 1,
            src: netUrl,
            width: 800,
            height: 1200,
            top: extraTop,
          });
          extraTop += 1000;
        }
      }
    }

    images.sort((a, b) => a.top - b.top);
    images.forEach((img, i) => {
      img.index = i + 1;
    });

    return images;
  }

  public static async scanChapterImagesAsync(): Promise<ScannedImage[]> {
    this.initPageSniffer();
    // Fetch direct site API in parallel with DOM scanning
    const apiUrls = await this.fetchDirectSiteApi();
    if (apiUrls && apiUrls.length >= 2) {
      return apiUrls.map((url, i) => ({
        index: i + 1,
        src: url,
        width: 800,
        height: 1200,
        top: i * 1100,
      }));
    }

    return this.scanChapterImages();
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

    const heading = document.querySelector(
      "h1, h2, .subj, .chapter-title, .episode-title, .subj_episode, .chapter-name, .c-breadcrumb li:last-child"
    );
    if (heading && heading.textContent) {
      chapterTitle = heading.textContent.trim().split("\n")[0].substring(0, 50);
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
  DomMangaScanner.initPageSniffer();
}
