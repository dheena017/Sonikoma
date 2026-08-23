import React from "react";
import { Sparkles, UploadCloud, Zap, ImagePlus, ArrowLeft } from "lucide-react";

interface ImageEditorEmptyStateProps {
  onImagesUploaded: (urls: string[]) => void;
  onLoadSample: (sampleDataUrl: string) => void;
  navigateTo?: (path: string) => void;
}

export const ImageEditorEmptyState: React.FC<ImageEditorEmptyStateProps> = ({
  onImagesUploaded,
  onLoadSample,
  navigateTo,
}) => {
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newUrls: string[] = [];
    Array.from(files).forEach((file) => {
      const url = URL.createObjectURL(file);
      newUrls.push(url);
    });

    onImagesUploaded(newUrls);
  };

  const handleLoadSamplePanel = () => {
    const sampleSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1200" viewBox="0 0 800 1200">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#090d16"/>
          <stop offset="50%" stop-color="#1e1b4b"/>
          <stop offset="100%" stop-color="#311042"/>
        </linearGradient>
        <linearGradient id="p1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#1e293b"/>
          <stop offset="100%" stop-color="#0f172a"/>
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="8" result="blur"/>
          <feComposite in="SourceGraphic" in2="blur" operator="over"/>
        </filter>
      </defs>
      <rect width="800" height="1200" fill="url(#bg)"/>
      
      <!-- Frame 1 -->
      <rect x="40" y="50" width="720" height="340" rx="16" fill="url(#p1)" stroke="#a855f7" stroke-width="3" filter="url(#glow)"/>
      <text x="400" y="190" fill="#ffffff" font-family="sans-serif" font-size="32" font-weight="900" text-anchor="middle" letter-spacing="2">DEMO WEBTOON PANEL 01</text>
      <text x="400" y="230" fill="#c084fc" font-family="monospace" font-size="16" text-anchor="middle">SONIKOMA VISION PIPELINE</text>

      <!-- Speech Bubble -->
      <ellipse cx="230" cy="130" rx="110" ry="42" fill="#ffffff" stroke="#a855f7" stroke-width="3"/>
      <polygon points="210,168 240,168 220,198" fill="#ffffff" stroke="#a855f7" stroke-width="3"/>
      <text x="230" y="135" fill="#0f172a" font-family="sans-serif" font-size="15" font-weight="800" text-anchor="middle">Ready for Editing!</text>

      <!-- Frame 2 -->
      <rect x="40" y="420" width="720" height="340" rx="16" fill="url(#p1)" stroke="#6366f1" stroke-width="3"/>
      <text x="400" y="570" fill="#ffffff" font-family="sans-serif" font-size="32" font-weight="900" text-anchor="middle" letter-spacing="2">DEMO WEBTOON PANEL 02</text>
      <text x="400" y="610" fill="#818cf8" font-family="monospace" font-size="16" text-anchor="middle">Test Auto-Crop, Slicing & Erasing</text>

      <!-- Frame 3 -->
      <rect x="40" y="790" width="720" height="360" rx="16" fill="url(#p1)" stroke="#38bdf8" stroke-width="3"/>
      <text x="400" y="960" fill="#ffffff" font-family="sans-serif" font-size="32" font-weight="900" text-anchor="middle" letter-spacing="2">DEMO WEBTOON PANEL 03</text>
      <text x="400" y="1000" fill="#38bdf8" font-family="monospace" font-size="16" text-anchor="middle">Export & Publish Video Stream</text>
    </svg>`;
    const dataUrl = `data:image/svg+xml;base64,${btoa(sampleSvg)}`;
    onLoadSample(dataUrl);
  };

  const handleNavigate = (path: string) => {
    if (navigateTo) {
      navigateTo(path);
    } else {
      window.history.pushState({}, "", path);
      window.dispatchEvent(new Event("popstate"));
    }
  };

  return (
    <div className="w-full flex-1 min-h-screen flex flex-col items-center justify-center bg-[#080B11] text-neutral-200 relative overflow-hidden p-6 select-none">
      <div className="relative z-10 max-w-md w-full bg-neutral-900/50 backdrop-blur-xl border border-neutral-800/80 rounded-2xl p-6 sm:p-8 shadow-xl flex flex-col items-center text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
          <Sparkles className="w-6 h-6" />
        </div>

        <div className="space-y-1">
          <h2 className="text-base sm:text-lg font-bold text-white font-mono uppercase tracking-wider">
            No Images in Editor
          </h2>
          <p className="text-xs text-neutral-400 font-mono leading-relaxed max-w-xs">
            Import Webtoon panels or upload image files from your computer to begin editing.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="w-full space-y-2 pt-2">
          <label className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-mono font-bold text-xs shadow-md transition-all cursor-pointer">
            <UploadCloud className="w-4 h-4 shrink-0" />
            <span>Upload Images</span>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          <div className="grid grid-cols-2 gap-2 w-full">
            <button
              onClick={handleLoadSamplePanel}
              className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 text-xs font-mono font-medium transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span>Load Sample</span>
            </button>

            <button
              onClick={() => handleNavigate("/chapter-scraper")}
              className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 text-xs font-mono font-medium transition-all cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span>Open Scraper</span>
            </button>
          </div>

          <button
            onClick={() => handleNavigate("/scraper")}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-mono text-neutral-500 hover:text-neutral-300 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Workspace</span>
          </button>
        </div>
      </div>
    </div>
  );
};
