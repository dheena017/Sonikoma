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

  // Floating 1-Click Sonikoma Logo Action Badge
  function renderFloatingBadge() {
    if (document.getElementById("sonikoma-floating-badge")) return;
    const badge = document.createElement("div");
    badge.id = "sonikoma-floating-badge";
    badge.className = "sonikoma-floating-badge";
    badge.setAttribute("title", "Click to Open / Close Sonikoma Cinema Reader");
    badge.innerHTML = `
      <div class="sonikoma-badge-logo">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="5 3 19 12 5 21 5 3"></polygon>
        </svg>
      </div>
      <span class="sonikoma-badge-text">Sonikoma Cinema</span>
    `;

    let isBadgeDragging = false;
    let dragDistance = 0;
    let bStartX = 0, bStartY = 0, bInitLeft = 0, bInitTop = 0;

    badge.addEventListener("mousedown", (e) => {
      if (e.button !== 0) return;
      isBadgeDragging = false;
      dragDistance = 0;
      bStartX = e.clientX;
      bStartY = e.clientY;
      const r = badge.getBoundingClientRect();
      bInitLeft = r.left;
      bInitTop = r.top;

      const onMove = (me: MouseEvent) => {
        const dx = me.clientX - bStartX;
        const dy = me.clientY - bStartY;
        dragDistance = Math.hypot(dx, dy);
        if (dragDistance > 4) {
          isBadgeDragging = true;
          badge.style.setProperty("right", "auto", "important");
          badge.style.setProperty("bottom", "auto", "important");
          badge.style.setProperty("left", `${Math.max(10, Math.min(window.innerWidth - badge.offsetWidth - 10, bInitLeft + dx))}px`, "important");
          badge.style.setProperty("top", `${Math.max(10, Math.min(window.innerHeight - badge.offsetHeight - 10, bInitTop + dy))}px`, "important");
        }
      };

      const onUp = () => {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };

      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    });

    badge.addEventListener("click", (e) => {
      if (dragDistance > 4) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      const player = getCinemaPlayer();
      player.toggleCinema();
    });

    (document.body || document.documentElement).appendChild(badge);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => renderFloatingBadge());
  } else {
    renderFloatingBadge();
  }

  // Message listener for popup & sidepanel
  chrome.runtime.onMessage.addListener((message: any, _sender: any, sendResponse: any) => {
    const { type } = message || {};

    if (type === "TRIGGER_CINEMA_MODE" || type === "TOGGLE_CINEMA" || type === "START_CINEMA") {
      try {
        const player = getCinemaPlayer();
        player.toggleCinema();
        sendResponse({ success: true });
      } catch (err: any) {
        sendResponse({ success: false, error: err?.message || String(err) });
      }
      return true;
    }

    if (type === "STOP_CINEMA") {
      try {
        if (cinemaPlayerInstance) {
          cinemaPlayerInstance.stop();
        }
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
