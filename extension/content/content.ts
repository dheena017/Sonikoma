/**
 * extension/content/content.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * TypeScript Unified Content Script Orchestrator.
 * Self-contained IIFE with zero global variable collisions.
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

  // Message listener for popup & sidepanel
  chrome.runtime.onMessage.addListener((message: any, _sender: any, sendResponse: any) => {
    const { type } = message || {};

    if (type === "TRIGGER_CINEMA_MODE") {
      try {
        const player = getCinemaPlayer();
        player.start();
        sendResponse({ success: true });
      } catch (err: any) {
        sendResponse({ success: false, error: err?.message || String(err) });
      }
      return true;
    }

    if (type === "GET_READER_STATS") {
      try {
        const images = DomMangaScanner.scanChapterImages();
        const meta = DomMangaScanner.extractPageMetadata();
        sendResponse({
          success: true,
          panelCount: images.length,
          seriesTitle: meta.seriesTitle,
          chapterTitle: meta.chapterTitle,
          url: window.location.href,
          images: images.map((img, i) => ({
            index: i + 1,
            src: img.src,
            width: img.width,
            height: img.height,
          })),
        });
      } catch (err: any) {
        sendResponse({
          success: false,
          error: err?.message || String(err),
          images: [],
        });
      }
      return true;
    }
  });
})();
