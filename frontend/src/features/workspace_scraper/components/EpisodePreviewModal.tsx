import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Loader, AlertTriangle, ArrowRight, Minimize2, Maximize2 } from 'lucide-react';
import { getProxiedImageUrl } from "@/shared/utils/url";

import type { Episode } from "@/features/workspace_scraper/components/EpisodeTypes";


interface EpisodePreviewModalProps {
  episode: Episode | null;
  onClose: () => void;
  onImport: (episode: Episode) => void;
  fetchWithInterceptor: typeof fetch;
}


export const EpisodePreviewModal: React.FC<EpisodePreviewModalProps> = ({
  episode,
  onClose,
  onImport,
  fetchWithInterceptor,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(true);
  const [zoom, setZoom] = useState(100); // 40% to 150%
  const [scrollProgress, setScrollProgress] = useState(0);
  const [autoScrollSpeed, setAutoScrollSpeed] = useState(0); // 0 = off, 1, 2, 3, 5 = pixels per interval

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!episode) return;

    const fetchPanels = async () => {
      setLoading(true);
      setError(null);
      setImages([]);

      try {
        const res = await fetchWithInterceptor('/api/scrape-images', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: episode.url,
            scrape_only: true,
            bypass_cache: true,
          }),
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch: ${res.statusText}`);
        }

        const data = await res.json();
        if (data.success && data.images && data.images.length > 0) {
          setImages(data.images);
        } else {
          throw new Error(data.error || 'No images found on this Webtoon page.');
        }
      } catch (err) {
        console.error('[Preview Scraper Error] ', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch episode panels.');
      } finally {
        setLoading(false);
      }
    };

    fetchPanels();
  }, [episode, fetchWithInterceptor]);

  // Handle auto scrolling
  useEffect(() => {
    if (autoScrollSpeed === 0) return;
    const interval = setInterval(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop += autoScrollSpeed;
      }
    }, 20);
    return () => clearInterval(interval);
  }, [autoScrollSpeed]);

  // Handle keyboard navigation
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

  if (!episode) return null;

  const renderInner = () => {
    // Calculate strip width based on zoom level (default 100% = 800px optimal webtoon width)
    const stripWidthPx = Math.round(800 * (zoom / 100));

    return (
      <div className="w-full h-full flex flex-col bg-neutral-950 text-white overflow-hidden font-sans">
        {/* Fullscreen Header Bar */}
        <div className="flex items-center justify-between px-4 sm:px-8 py-3 border-b border-neutral-800/80 bg-neutral-900/90 backdrop-blur-md shrink-0 z-30 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center">
              <span className="text-purple-400 font-bold text-xs">WP</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest font-mono">
                  Full Page Webtoon Reader
                </span>
                <span className="text-[10px] bg-purple-900/40 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full font-mono">
                  Live Stream
                </span>
              </div>
              <h2 className="text-sm font-bold text-white tracking-tight truncate max-w-xs sm:max-w-md">
                {episode.number} — {episode.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => onImport(episode)}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-900/30 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
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

        {/* Premium Control Toolbar */}
        {!loading && !error && images.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-8 py-2.5 border-b border-neutral-800/60 bg-neutral-900/40 backdrop-blur-md text-xs text-neutral-300 shrink-0 z-20">
            {/* Auto Scroll Speed Controls */}
            <div className="flex items-center gap-2">
              <span className="font-mono text-neutral-400 uppercase tracking-wider text-[10px] font-bold">Auto-Scroll:</span>
              <div className="flex items-center bg-neutral-950 border border-neutral-800 rounded-xl p-0.5">
                <button
                  onClick={() => setAutoScrollSpeed(0)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    autoScrollSpeed === 0 ? 'bg-purple-600 text-white shadow-sm' : 'hover:bg-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  Off
                </button>
                {[1, 2, 3, 5].map((speed, i) => (
                  <button
                    key={speed}
                    onClick={() => setAutoScrollSpeed(speed)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      autoScrollSpeed === speed ? 'bg-purple-600 text-white shadow-sm' : 'hover:bg-neutral-800 text-neutral-400 hover:text-white'
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
              <span className="font-mono text-neutral-400 uppercase tracking-wider text-[10px] font-bold">Reader Width:</span>
              <div className="flex items-center gap-2 bg-neutral-950 border border-neutral-800 rounded-xl p-0.5">
                <button
                  onClick={() => setZoom(Math.max(50, zoom - 10))}
                  className="px-2.5 py-1 hover:bg-neutral-800 hover:text-white text-neutral-400 rounded-lg font-bold transition-colors cursor-pointer"
                  title="Narrower Width"
                >
                  -
                </button>
                <span className="min-w-[50px] text-center font-mono text-purple-300 text-[11px] font-bold">{stripWidthPx}px</span>
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
            <div className="flex items-center gap-2 font-mono text-[10px] text-purple-300 bg-purple-950/40 border border-purple-500/20 rounded-xl px-3 py-1 font-bold">
              <span>Read: {Math.round(scrollProgress)}%</span>
            </div>
          </div>
        )}

        {/* Reading Progress Top Bar Indicator */}
        {!loading && !error && images.length > 0 && (
          <div className="w-full bg-neutral-900 h-1 relative z-20 shrink-0">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 transition-all duration-75 shadow-[0_0_8px_rgba(168,85,247,0.8)]"
              style={{ width: `${scrollProgress}%` }}
            />
          </div>
        )}

        {/* Main Full Page Scrollable Reader Container */}
        <div 
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto bg-neutral-950 flex flex-col items-center justify-start relative scrollbar-thin scrollbar-thumb-purple-900 scrollbar-track-neutral-950 p-0"
        >
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-neutral-950 z-10">
              <div className="relative">
                <div className="w-14 h-14 rounded-full border-4 border-purple-900/40 border-t-purple-500 animate-spin" />
                <Loader className="w-7 h-7 text-purple-400 absolute top-3.5 left-3.5 animate-pulse" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-base font-bold text-white">Scraping panels live...</p>
                <p className="text-xs text-neutral-400">Connecting via secure image proxy & Playwright renderer</p>
              </div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8 text-center bg-neutral-950 z-10">
              <AlertTriangle className="w-14 h-14 text-rose-500 animate-bounce" />
              <div className="max-w-md space-y-2">
                <h3 className="text-lg font-bold text-white">Failed to Preview Panels</h3>
                <p className="text-sm text-neutral-400">{error}</p>
                <p className="text-xs text-neutral-500">The server might be rate-limited, or the Webtoon slug is private/restricted.</p>
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={() => onImport(episode)}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  Force Open Editor <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Webtoon Panels Continuous Strip */}
          {!loading && !error && images.length > 0 && (
            <div 
              className="w-full flex flex-col items-center space-y-0 transition-all duration-300 py-4"
              style={{ maxWidth: `${stripWidthPx}px` }}
            >
              {images.map((imgUrl, idx) => (
                <img
                  key={idx}
                  src={getProxiedImageUrl(imgUrl, episode?.url)}
                  alt={`Panel ${idx + 1}`}
                  className="w-full h-auto select-none pointer-events-none block m-0 p-0 min-h-[300px] bg-neutral-900/20 shadow-2xl"
                  style={{ width: "100%" }}
                  loading={idx < 5 ? 'eager' : 'lazy'}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='150'%3E%3Crect fill='%23171717' width='400' height='150'/%3E%3Ctext fill='%236b7280' font-family='sans-serif' font-size='14' x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle'%3EFailed to load panel %23" + (idx + 1) + "%3C/text%3E%3C/svg%3E";
                  }}
                />
              ))}
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
              onClick={() => onImport(episode)}
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-950/40 transition-all flex items-center gap-2 cursor-pointer"
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
