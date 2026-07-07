import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Loader, AlertTriangle, ArrowRight, Minimize2, Maximize2 } from 'lucide-react';
import { getProxiedImageUrl } from "@/utils/url";

import type { Episode } from "./EpisodeTypes";


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
  const [isFullscreen, setIsFullscreen] = useState(false);
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
            bypass_cache: false,
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
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const totalHeight = target.scrollHeight - target.clientHeight;
    if (totalHeight > 0) {
      setScrollProgress((target.scrollTop / totalHeight) * 100);
    }
  };

  if (!episode) return null;

  const renderInner = () => {
    return (
      <>
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-900/50">
          <div>
            <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest font-mono">
              Webtoon Quick Reader Preview
            </span>
            <h2 className="text-sm font-bold text-white mt-0.5">
              {episode.number} — {episode.title}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-red-400 hover:bg-neutral-850 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Premium Control Bar */}
        {!loading && !error && images.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-3 border-b border-neutral-800 bg-neutral-950/60 backdrop-blur-sm text-xs text-neutral-350">
            {/* Auto Scroll Speed Controls */}
            <div className="flex items-center gap-2">
              <span className="font-mono text-neutral-500 uppercase tracking-wider text-[10px]">Auto-Scroll:</span>
              <div className="flex items-center bg-neutral-900 border border-neutral-850 rounded-lg p-0.5">
                <button
                  onClick={() => setAutoScrollSpeed(0)}
                  className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors ${
                    autoScrollSpeed === 0 ? 'bg-purple-650 text-white' : 'hover:bg-neutral-800 text-neutral-450 hover:text-white'
                  }`}
                >
                  Off
                </button>
                {[1, 2, 3, 5].map((speed, i) => (
                  <button
                    key={speed}
                    onClick={() => setAutoScrollSpeed(speed)}
                    className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors ${
                      autoScrollSpeed === speed ? 'bg-purple-650 text-white' : 'hover:bg-neutral-800 text-neutral-450 hover:text-white'
                    }`}
                    title={`Speed ${speed}`}
                  >
                    S{i + 1}
                  </button>
                ))}
              </div>
            </div>

            {/* Zoom / Width Adjustments */}
            <div className="flex items-center gap-2">
              <span className="font-mono text-neutral-500 uppercase tracking-wider text-[10px]">Reader Width:</span>
              <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-850 rounded-lg p-0.5">
                <button
                  onClick={() => setZoom(Math.max(40, zoom - 10))}
                  className="px-2.5 py-1 hover:bg-neutral-800 hover:text-white text-neutral-400 rounded font-bold transition-colors"
                >
                  -
                </button>
                <span className="min-w-[40px] text-center font-mono text-white text-[11px] font-bold">{zoom}%</span>
                <button
                  onClick={() => setZoom(Math.min(150, zoom + 10))}
                  className="px-2.5 py-1 hover:bg-neutral-800 hover:text-white text-neutral-400 rounded font-bold transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            {/* Reading progress */}
            <div className="flex items-center gap-2 font-mono text-[10px] text-neutral-400 bg-neutral-900 border border-neutral-850 rounded-lg px-2.5 py-1 font-bold">
              <span>Read: {Math.round(scrollProgress)}%</span>
            </div>
          </div>
        )}

        {/* Reading Progress Line */}
        {!loading && !error && images.length > 0 && (
          <div className="w-full bg-neutral-900 h-0.5 relative z-10">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 transition-all duration-75"
              style={{ width: `${scrollProgress}%` }}
            />
          </div>
        )}

        {/* Modal Content */}
        <div 
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto bg-neutral-950 flex flex-col items-center justify-start relative scrollbar-thin scrollbar-thumb-purple-900 scrollbar-track-neutral-950 p-0"
        >
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-neutral-950/80 z-10">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-4 border-purple-900/50 border-t-purple-500 animate-spin" />
                <Loader className="w-6 h-6 text-purple-400 absolute top-3 left-3 animate-pulse" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-neutral-200">Scraping panels live...</p>
                <p className="text-xs text-neutral-500 mt-1">Connecting via secure image proxy & Playwright renderer</p>
              </div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8 text-center bg-neutral-950/90 z-10">
              <AlertTriangle className="w-12 h-12 text-red-500 animate-bounce" />
              <div className="max-w-md space-y-2">
                <h3 className="text-base font-bold text-white">Failed to Preview Panels</h3>
                <p className="text-sm text-neutral-400">{error}</p>
                <p className="text-xs text-neutral-600">The server might be rate-limited, or the Webtoon slug is private/restricted.</p>
              </div>
              <div className="flex gap-3 mt-2">
                <button
                  onClick={onClose}
                  className="px-5 py-2 bg-neutral-800 hover:bg-neutral-750 text-white rounded-xl text-sm font-medium transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => onImport(episode)}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-1.5"
                >
                  Force Open Editor <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Webtoon Panels Continuous Strip */}
          {!loading && !error && images.length > 0 && (
            <div 
              className="w-full flex flex-col items-center space-y-0 transition-all duration-300"
              style={{ maxWidth: `${zoom}%` }}
            >
              {images.map((imgUrl, idx) => (
                <img
                  key={idx}
                  src={getProxiedImageUrl(imgUrl)}
                  alt={`Panel ${idx + 1}`}
                  className="w-full h-auto select-none pointer-events-none block m-0 p-0 min-h-[400px] bg-neutral-900/20"
                  style={{ width: "100%" }}
                  loading={idx < 5 ? 'eager' : 'lazy'}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='150'%3E%3Crect fill='%231f2937' width='400' height='150'/%3E%3Ctext fill='%236b7280' font-family='sans-serif' font-size='14' x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle'%3EFailed to load panel %23" + (idx + 1) + "%3C/text%3E%3C/svg%3E";
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-neutral-800 bg-neutral-900/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-neutral-500 font-mono">
            {images.length > 0 && `Total: ${images.length} scrollable panels detected`}
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-initial px-5 py-2.5 bg-neutral-800 hover:bg-neutral-750 text-neutral-300 hover:text-white rounded-xl text-sm font-semibold transition-all"
            >
              Close
            </button>
            <button
              onClick={() => onImport(episode)}
              className="flex-1 sm:flex-initial px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-purple-900/35 transition-all flex items-center justify-center gap-2"
            >
              <Play size={15} />
              Open in Editor
            </button>
          </div>
        </div>
      </>
    );
  };

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-[100] w-full h-screen bg-black flex flex-col overflow-hidden animate-in fade-in duration-300">
        {renderInner()}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-neutral-950 border border-neutral-800 rounded-2xl flex flex-col shadow-2xl overflow-hidden w-full max-w-5xl h-[88vh]">
        {renderInner()}
      </div>
    </div>
  );
};
