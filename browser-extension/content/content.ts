/**
 * extension/content/content.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * TypeScript Unified Content Script Orchestrator.
 * Self-contained IIFE with robust message handling for all UI components.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { DomMangaScanner } from "./dom-scanner";
import { CinemaPlayer } from "./cinema-player";

(() => {
  // Prevent duplicate execution if script is re-injected
  if ((window as any).__sonikoma_content_orchestrator_loaded) {
    return;
  }
  (window as any).__sonikoma_content_orchestrator_loaded = true;

  let cinemaPlayerInstance: CinemaPlayer | null = null;

  function getCinemaPlayer(): CinemaPlayer {
    if (!cinemaPlayerInstance) {
      cinemaPlayerInstance = new CinemaPlayer(DomMangaScanner);
    }
    return cinemaPlayerInstance;
  }

  // Persistent Pill & Native Distraction Killer
  function suppressNativeDistractionPills() {
    try {
      const candidates = document.querySelectorAll(
        "div, button, a, span, aside, nav, footer, p, i, section"
      );
      candidates.forEach((node) => {
        const el = node as HTMLElement;
        if (!el || typeof el.getBoundingClientRect !== "function") return;
        if (el.closest("[id^='sonikoma-'], [class*='sonikoma']")) return;
        if (
          el.id?.startsWith("sonikoma") ||
          el.className?.toString().includes("sonikoma")
        )
          return;

        const tag = el.tagName.toUpperCase();
        if (["IMG", "CANVAS", "VIDEO", "AUDIO", "PICTURE"].includes(tag))
          return;

        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;

        // Matches bottom capsule pills (like the drawer pull bar)
        const isPillShape =
          rect.width >= 20 &&
          rect.width <= 160 &&
          rect.height >= 4 &&
          rect.height <= 50;

        const isNearBottomCenter =
          (rect.bottom >= window.innerHeight - 220 ||
            rect.top >= window.innerHeight - 220) &&
          Math.abs(rect.left + rect.width / 2 - window.innerWidth / 2) < 220;

        const text = (el.textContent || "").trim();
        const hasLittleText = text.length <= 4;

        if (isPillShape && isNearBottomCenter && hasLittleText) {
          el.classList.add("sonikoma-native-distraction-hidden");
          el.style.setProperty("display", "none", "important");
          el.style.setProperty("opacity", "0", "important");
          el.style.setProperty("visibility", "hidden", "important");
          el.style.setProperty("pointer-events", "none", "important");
          el.style.setProperty("box-shadow", "none", "important");

          const parent = el.parentElement;
          if (
            parent &&
            parent.children.length === 1 &&
            !parent.closest("[id^='sonikoma-'], [class*='sonikoma']")
          ) {
            const pRect = parent.getBoundingClientRect();
            if (pRect.height <= 70) {
              parent.classList.add("sonikoma-native-distraction-hidden");
              parent.style.setProperty("display", "none", "important");
            }
          }
        }
      });
    } catch (_) {}
  }

  // Run immediately and repeatedly on load
  suppressNativeDistractionPills();
  setTimeout(suppressNativeDistractionPills, 400);
  setTimeout(suppressNativeDistractionPills, 1200);
  setTimeout(suppressNativeDistractionPills, 2500);
  window.addEventListener("scroll", suppressNativeDistractionPills, {
    passive: true,
  });

  try {
    const observer = new MutationObserver(() => {
      suppressNativeDistractionPills();
    });
    observer.observe(document.body || document.documentElement, {
      childList: true,
      subtree: true,
    });
  } catch (_) {}

  // Auto-Scan page for reading history
  setTimeout(() => {
    try {
      const images = DomMangaScanner.scanChapterImages();
      const meta = DomMangaScanner.extractPageMetadata();

      if (images && images.length >= 2) {
        chrome.runtime.sendMessage({
          type: "TRACK_CHAPTER_READ",
          payload: {
            seriesName: meta.seriesTitle,
            chapterTitle: meta.chapterTitle,
            chapterUrl: window.location.href,
            siteDomain: window.location.hostname,
          },
        });
      }
    } catch (_) {}
  }, 1200);

  // Message listener for popup, sidepanel, and keyboard commands
  chrome.runtime.onMessage.addListener(
    (message: any, _sender: any, sendResponse: any) => {
      const { type } = message || {};

      if (type === "PING") {
        sendResponse({ status: "PONG" });
        return true;
      }

      if (
        type === "TRIGGER_CINEMA_MODE" ||
        type === "START_CINEMA" ||
        type === "TOGGLE_CINEMA"
      ) {
        try {
          const player = getCinemaPlayer();
          player.start();
          sendResponse({ success: true, isPlaying: false });
        } catch (err: any) {
          sendResponse({ success: false, error: err?.message || String(err) });
        }
        return true;
      }

      if (type === "STOP_CINEMA") {
        if (cinemaPlayerInstance) {
          cinemaPlayerInstance.stop();
        }
        sendResponse({ success: true });
        return true;
      }

      if (
        type === "GET_READER_STATS" ||
        type === "GET_CHAPTER_DATA" ||
        type === "GET_IMAGES" ||
        type === "SCAN_CHAPTER"
      ) {
        (async () => {
          try {
            const images = await DomMangaScanner.scanChapterImagesAsync();
            const meta = DomMangaScanner.extractPageMetadata();
            sendResponse({
              success: true,
              panelCount: images.length,
              seriesTitle: meta.seriesTitle,
              chapterTitle: meta.chapterTitle,
              url: window.location.href,
              domain: window.location.hostname,
              images: images.map((img, i) => ({
                index: i + 1,
                src: img.src,
                width: img.width,
                height: img.height,
                top: img.top,
              })),
              panels: images,
              meta,
            });
          } catch (err: any) {
            sendResponse({
              success: false,
              error: err?.message || String(err),
              images: [],
              panels: [],
              panelCount: 0,
            });
          }
        })();
        return true;
      }
    }
  );
})();
