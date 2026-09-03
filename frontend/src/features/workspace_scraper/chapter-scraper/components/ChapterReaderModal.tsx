import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  X,
  Play,
  Loader,
  AlertTriangle,
  ArrowRight,
  RotateCw,
} from "lucide-react";
import { getProxiedImageUrl } from "@/shared/utils/imageProxy";
import { scrapeChapter } from "@/api";
import { getChapterReaderPanels } from "@/api/endpoints/scraper";

import type { Chapter } from "../types/ChapterTypes";

interface ChapterPreviewModalProps {
  chapter: Chapter | null;
  onClose: () => void;
  onImport: (chapter: Chapter) => void;
  fetchWithInterceptor: typeof fetch;
}

export const ChapterReaderModal: React.FC<ChapterPreviewModalProps> = ({
  chapter,
  onClose,
  onImport,
  fetchWithInterceptor,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [zoom, setZoom] = useState(100);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [autoScrollSpeed, setAutoScrollSpeed] = useState(0);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    const mainScrollContainer = document.getElementById(
      "main-scroll-container"
    );
    const previousRootOverflow = root.style.overflow;
    const previousOverflow = document.body.style.overflow;
    const previousMainOverflow = mainScrollContainer?.style.overflow;

    root.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    if (mainScrollContainer) mainScrollContainer.style.overflow = "hidden";

    return () => {
      root.style.overflow = previousRootOverflow;
      document.body.style.overflow = previousOverflow;
      if (mainScrollContainer && previousMainOverflow !== undefined) {
        mainScrollContainer.style.overflow = previousMainOverflow;
      }
    };
  }, []);

  const fetchPanels = useCallback(
    async (forceRefresh = false) => {
      if (!chapter) return;
      setLoading(true);
      setError(null);
      setImages([]);

      try {
        const data = await getChapterReaderPanels(fetchWithInterceptor, {
          url: chapter.url,
          force_refresh: forceRefresh,
        });

        if (data && data.success && data.panels && data.panels.length > 0) {
          const list = data.panels.map((p) => p.proxied_url || p.url);
          setImages(list);
        } else if (data && data.images && data.images.length > 0) {
          setImages(data.images);
        } else {
          // Fallback to scrapeChapter
          const fallback = await scrapeChapter(fetchWithInterceptor, {
            url: chapter.url,
            force_refresh: true,
            proxy_images: true,
          });
          if (fallback && fallback.success && fallback.images && fallback.images.length > 0) {
            setImages(
              fallback.images.map((img: any) =>
                typeof img === "string" ? img : img.url
              )
            );
          } else {
            throw new Error("No images found on this comic chapter page.");
          }
        }
      } catch (err: any) {
        console.error("[Preview Scraper Error] ", err);
        const errorMsg =
          err?.message ||
          (err?.detail ? (typeof err.detail === "string" ? err.detail : JSON.stringify(err.detail)) : null) ||
          (typeof err === "string" ? err : "Failed to fetch chapter panels.");
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    },
    [chapter, fetchWithInterceptor]
  );

  useEffect(() => {
    fetchPanels(false);
  }, [fetchPanels]);

  useEffect(() => {
    if (autoScrollSpeed === 0) return;
    const interval = setInterval(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop += autoScrollSpeed;
      }
    }, 20);
    return () => clearInterval(interval);
  }, [autoScrollSpeed]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (!scrollContainerRef.current) return;
      const scrollStep = 80;
      if (e.key === "ArrowDown") {
        scrollContainerRef.current.scrollTop += scrollStep;
      } else if (e.key === "ArrowUp") {
        scrollContainerRef.current.scrollTop -= scrollStep;
      } else if (e.key === "Space" || e.key === "PageDown") {
        scrollContainerRef.current.scrollTop += window.innerHeight * 0.6;
        e.preventDefault();
      } else if (e.key === "PageUp") {
        scrollContainerRef.current.scrollTop -= window.innerHeight * 0.6;
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const totalHeight = target.scrollHeight - target.clientHeight;
    if (totalHeight > 0) {
      setScrollProgress((target.scrollTop / totalHeight) * 100);
    }
  };

  if (!chapter) return null;

  const renderInner = () => {
    const stripWidthPx = Math.round(800 * (zoom / 100));

    return (
      <div className="w-full h-full flex flex-col bg-neutral-950 text-white overflow-hidden font-sans">
        {/* Fullscreen Header Bar */}
        <div className="flex items-center justify-between px-4 sm:px-8 py-3 border-b border-neutral-800/80 bg-neutral-900/90 backdrop-blur-md shrink-0 z-30 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-[#2A2A2A] border border-[#3B82F6]/30 flex items-center justify-center">
              <span className="text-[#3B82F6] font-bold text-xs">CR</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-[#3B82F6] uppercase tracking-widest font-mono">
                  Full Page Chapter Reader
                </span>
                <span className="text-[10px] bg-[#2A2A2A] text-[#60A5FA] border border-[#3B82F6]/30 px-2 py-0.5 rounded-full font-mono">
                  Live Stream
                </span>
              </div>
              <h2 className="text-sm font-bold text-white tracking-tight truncate max-w-xs sm:max-w-md">
                {chapter.number} — {chapter.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => onImport(chapter)}
              className="px-4 py-2 bg-gradient-to-r from-[#2A2A2A] to-[#2A2A2A] hover:border-[#3B82F6] hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-black/50 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Play size={14} />
              <span className="hidden sm:inline">Open in Editor</span>
              <span className="sm:hidden">Editor</span>
            </button>
            <button
              onClick={onClose}
              className="px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 border border-neutral-700"
              title="Close Full Page Reader (Esc)"
            >
              <X size={16} />
              <span className="hidden sm:inline">Close</span>
            </button>
          </div>
        </div>

        {/* Control Toolbar */}
        {!loading && !error && images.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-8 py-2.5 border-b border-neutral-800/60 bg-neutral-900/40 backdrop-blur-md text-xs text-neutral-300 shrink-0 z-20">
            {/* Auto Scroll Speed Controls */}
            <div className="flex items-center gap-2">
              <span className="font-mono text-neutral-400 uppercase tracking-wider text-[10px] font-bold">
                Auto-Scroll:
              </span>
              <div className="flex items-center bg-neutral-950 border border-neutral-800 rounded-xl p-0.5">
                <button
                  onClick={() => setAutoScrollSpeed(0)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    autoScrollSpeed === 0
                      ? "bg-[#2A2A2A] text-white shadow-sm"
                      : "hover:bg-neutral-800 text-neutral-400 hover:text-white"
                  }`}
                >
                  Off
                </button>
                {[1, 2, 3, 5].map((speed, i) => (
                  <button
                    key={speed}
                    onClick={() => setAutoScrollSpeed(speed)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      autoScrollSpeed === speed
                        ? "bg-[#2A2A2A] text-white shadow-sm"
                        : "hover:bg-neutral-800 text-neutral-400 hover:text-white"
                    }`}
                    title={`Auto Scroll Speed ${speed}px`}
                  >
                    S{i + 1}
                  </button>
                ))}
              </div>
            </div>

            {/* Zoom / Width Adjustments */}
            <div className="flex items-center gap-2">
              <span className="font-mono text-neutral-400 uppercase tracking-wider text-[10px] font-bold">
                Reader Width:
              </span>
              <div className="flex items-center gap-2 bg-neutral-950 border border-neutral-800 rounded-xl p-0.5">
                <button
                  onClick={() => setZoom(Math.max(50, zoom - 10))}
                  className="px-2.5 py-1 hover:bg-neutral-800 hover:text-white text-neutral-400 rounded-lg font-bold transition-colors cursor-pointer"
                  title="Narrower Width"
                >
                  -
                </button>
                <span className="min-w-[50px] text-center font-mono text-[#60A5FA] text-[11px] font-bold">
                  {stripWidthPx}px
                </span>
                <button
                  onClick={() => setZoom(Math.min(180, zoom + 10))}
                  className="px-2.5 py-1 hover:bg-neutral-800 hover:text-white text-neutral-400 rounded-lg font-bold transition-colors cursor-pointer"
                  title="Wider Width"
                >
                  +
                </button>
              </div>
            </div>

            {/* Reading progress badge */}
            <div className="flex items-center gap-2 font-mono text-[10px] text-[#60A5FA] bg-[#2A2A2A] border border-[#3B82F6]/20 rounded-xl px-3 py-1 font-bold">
              <span>Read: {Math.round(scrollProgress)}%</span>
            </div>
          </div>
        )}

        {/* Reading Progress Top Bar Indicator */}
        {!loading && !error && images.length > 0 && (
          <div className="w-full bg-neutral-900 h-1 relative z-20 shrink-0">
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-pink-500 to-indigo-500 transition-all duration-75 "
              style={{ width: `${scrollProgress}%` }}
            />
          </div>
        )}

        {/* Main Full Page Scrollable Reader Container */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="min-h-0 flex-1 overflow-y-scroll overflow-x-hidden overscroll-contain bg-neutral-950 flex flex-col items-center justify-start relative scrollbar-thin scrollbar-thumb-purple-900 scrollbar-track-neutral-950 p-0"
        >
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-neutral-950 z-10">
              <div className="relative">
                <div className="w-14 h-14 rounded-full border-4 border-[#2F2F2F] border-t-purple-500 animate-spin" />
                <Loader className="w-7 h-7 text-[#3B82F6] absolute top-3.5 left-3.5 animate-pulse" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-base font-bold text-white">
                  Scraping panels live...
                </p>
                <p className="text-xs text-neutral-400">
                  Connecting via secure image proxy & Playwright renderer
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8 text-center bg-neutral-950 z-10">
              <AlertTriangle className="w-14 h-14 text-rose-500 animate-bounce" />
              <div className="max-w-md space-y-2">
                <h3 className="text-lg font-bold text-white">
                  Failed to Preview Panels
                </h3>
                <p className="text-sm text-neutral-400">{error}</p>
                <p className="text-xs text-neutral-500">
                  The server might be rate-limited, or the chapter is
                  private/restricted.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
                <button
                  onClick={() => fetchPanels(true)}
                  className="px-5 py-2.5 bg-gradient-to-r from-[#2A2A2A] to-[#2A2A2A] hover:border-[#3B82F6] hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-black/50 cursor-pointer active:scale-95 border border-[#60A5FA]/30"
                >
                  <RotateCw size={14} className={loading ? "animate-spin" : ""} />
                  Retry Scraping
                </button>
                <button
                  onClick={() => onImport(chapter)}
                  className="px-5 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-[#60A5FA] hover:text-white border border-[#3B82F6]/20 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  Force Open Editor <ArrowRight size={14} />
                </button>
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {/* Chapters Continuous Strip */}
          {!loading && !error && images.length > 0 && (
            <div
              className="w-full flex flex-col items-center space-y-0 transition-all duration-300 py-4"
              style={{ maxWidth: `${stripWidthPx}px` }}
            >
              {images.map((imgUrl, idx) => {
                const resolvedSrc = imgUrl.startsWith("/api/proxy-image")
                  ? imgUrl
                  : getProxiedImageUrl(imgUrl, chapter?.url);

                return (
                  <img
                    key={idx}
                    src={resolvedSrc}
                    alt={`Panel ${idx + 1}`}
                    className="w-full h-auto select-none block m-0 p-0 min-h-[300px] bg-neutral-900/40 shadow-2xl transition-opacity duration-300"
                    style={{ width: "100%" }}
                    loading={idx < 4 ? "eager" : "lazy"}
                    onError={(e) => {
                      const el = e.target as HTMLImageElement;
                      if (el.src.includes("/api/proxy-image") && !el.dataset.retried) {
                        el.dataset.retried = "1";
                        el.src = imgUrl; // Try raw direct URL
                      } else {
                        el.src =
                          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='150'%3E%3Crect fill='%23171717' width='400' height='150'/%3E%3Ctext fill='%23a855f7' font-family='sans-serif' font-size='14' font-weight='bold' x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle'%3EPanel %23" +
                          (idx + 1) +
                          "%3C/text%3E%3C/svg%3E";
                      }
                    }}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom Status Bar */}
        <div className="px-6 py-3 border-t border-neutral-800/80 bg-neutral-900/80 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 z-30">
          <div className="text-xs text-neutral-400 font-mono flex items-center gap-2">
            {images.length > 0 && (
              <>
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Total: {images.length} scrollable panels loaded</span>
              </>
            )}
          </div>
          <div className="flex gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Close Reader
            </button>
            <button
              onClick={() => onImport(chapter)}
              className="px-6 py-2 bg-gradient-to-r from-[#2A2A2A] to-[#2A2A2A] hover:border-[#3B82F6] hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-black/50 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Play size={14} />
              Open in Editor
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[9999] w-screen h-screen bg-black flex flex-col overflow-hidden animate-in fade-in duration-300">
      {renderInner()}
    </div>
  );
};

export const EpisodeReaderModal = ChapterReaderModal;
