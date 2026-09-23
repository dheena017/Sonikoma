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
  chrome.runtime.onMessage.addListener((message: any, _sender: any, sendResponse: any) => {
    const { type } = message || {};

    if (type === "PING") {
      sendResponse({ status: "PONG" });
      return true;
    }

    if (type === "TRIGGER_CINEMA_MODE" || type === "START_CINEMA" || type === "TOGGLE_CINEMA") {
      try {
        const player = getCinemaPlayer();
        player.start();
        sendResponse({ success: true, isPlaying: true });
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

    if (type === "GET_READER_STATS" || type === "GET_CHAPTER_DATA" || type === "GET_IMAGES" || type === "SCAN_CHAPTER") {
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
  });
})();
